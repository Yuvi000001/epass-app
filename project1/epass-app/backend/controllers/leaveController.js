const asyncHandler = require('../utils/asyncHandler');
const LeaveRequest = require('../models/LeaveRequest');
const Epass = require('../models/Epass');
const { notifyUser } = require('../services/notificationService');
const { recordAudit } = require('../services/auditService');
const { uploadBufferToFirebase } = require('../services/fileUploadService');

// POST /api/v1/leave/apply  (STUDENT)
const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType, fromDate, toDate, reason, emergencyContact } = req.body;

  if (!leaveType || !fromDate || !toDate || !reason || !emergencyContact) {
    return res.status(400).json({ success: false, message: 'All fields except attachment are required' });
  }
  if (new Date(fromDate) > new Date(toDate)) {
    return res.status(400).json({ success: false, message: 'fromDate cannot be after toDate' });
  }

  let attachmentUrl = null;
  if (req.file) {
    const destPath = `epass/attachments/leave_${req.user._id}_${Date.now()}_${req.file.originalname}`;
    attachmentUrl = await uploadBufferToFirebase(req.file.buffer, destPath, req.file.mimetype);
  }

  const leave = await LeaveRequest.create({
    student: req.user._id,
    leaveType,
    fromDate,
    toDate,
    reason,
    attachmentUrl,
    emergencyContact,
    faculty: req.user.facultyAdvisorId || undefined,
  });

  await recordAudit(req, { action: 'LEAVE_APPLIED', entityType: 'LeaveRequest', entityId: leave._id });

  if (req.user.facultyAdvisorId) {
    await notifyUser({
      userId: req.user.facultyAdvisorId,
      leaveRequestId: leave._id,
      title: 'New Leave Request',
      message: `${req.user.name} applied for ${leaveType} leave (${fromDate} to ${toDate}).`,
      type: 'LEAVE_SUBMITTED',
    });
  }
  await notifyUser({
    userId: req.user._id,
    leaveRequestId: leave._id,
    title: 'Leave Request Submitted',
    message: 'Your leave request has been submitted and is awaiting faculty review.',
    type: 'LEAVE_SUBMITTED',
  });

  res.status(201).json({ success: true, data: leave.toJSON() });
});

// GET /api/v1/leave/my-requests?status=
const getMyRequests = asyncHandler(async (req, res) => {
  const status = req.query.status || 'All';
  const query = { student: req.user._id };
  if (status !== 'All') query.overallStatus = status;

  const requests = await LeaveRequest.find(query).sort({ createdAt: -1 });
  res.json({ success: true, data: requests.map((r) => r.toJSON()) });
});

// GET /api/v1/leave/history
const getHistory = asyncHandler(async (req, res) => {
  const requests = await LeaveRequest.find({ student: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: requests.map((r) => r.toJSON()) });
});

// GET /api/v1/leave/:id
const getLeaveById = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id)
    .populate('student', 'name rollNumber branch semester department phone profileImageUrl');
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

  const epass = await Epass.findOne({ leaveRequest: leave._id });

  const leaveJson = leave.toJSON();
  if (leave.student) {
    leaveJson.studentName = leave.student.name;
    leaveJson.rollNumber = leave.student.rollNumber;
  }

  res.json({ success: true, data: { ...leaveJson, epass: epass ? epass.toJSON() : null } });
});

module.exports = { applyLeave, getMyRequests, getHistory, getLeaveById };
