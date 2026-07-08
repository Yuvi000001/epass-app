const asyncHandler = require('../utils/asyncHandler');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const { notifyUser } = require('../services/notificationService');
const { recordAudit } = require('../services/auditService');

function toFacultyJson(leave) {
  const json = leave.toJSON();
  if (leave.student && leave.student.name) {
    json.studentName = leave.student.name;
    json.rollNumber = leave.student.rollNumber;
  }
  return json;
}

// GET /api/v1/faculty/requests?status=Pending
const getRequests = asyncHandler(async (req, res) => {
  const status = req.query.status || 'Pending';
  const query = { faculty: req.user._id };
  if (status !== 'All') query.facultyStatus = status;

  const requests = await LeaveRequest.find(query).sort({ appliedOn: -1 }).populate('student', 'name rollNumber department');
  res.json({ success: true, data: requests.map(toFacultyJson) });
});

// GET /api/v1/faculty/requests/:id
const getRequestById = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id)
    .populate('student', 'name rollNumber branch semester department phone profileImageUrl');
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
  res.json({ success: true, data: toFacultyJson(leave) });
});

// PUT /api/v1/faculty/requests/:id/approve  (also doubles as "Forward to HOD")
const approveRequest = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  const leave = await LeaveRequest.findById(req.params.id).populate('student', 'name rollNumber department');
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

  const hod = await User.findOne({ role: 'HOD', department: leave.student.department });

  leave.facultyStatus = 'Approved';
  leave.facultyRemark = remark || undefined;
  leave.facultyReviewedAt = new Date();
  if (hod) leave.hod = hod._id;
  await leave.save();

  await recordAudit(req, { action: 'FACULTY_APPROVED', entityType: 'LeaveRequest', entityId: leave._id, details: { remark } });

  await notifyUser({
    userId: leave.student._id,
    leaveRequestId: leave._id,
    title: 'Leave Approved by Faculty',
    message: 'Your faculty advisor approved your leave. Forwarded to HOD for final approval.',
    type: 'FACULTY_APPROVED',
  });

  if (hod) {
    await notifyUser({
      userId: hod._id,
      leaveRequestId: leave._id,
      title: 'Leave Pending Your Approval',
      message: `${leave.student.name} (${leave.student.rollNumber}) needs final approval for ${leave.leaveType} leave.`,
      type: 'GENERAL',
    });
  }

  res.json({ success: true, data: toFacultyJson(leave) });
});

// PUT /api/v1/faculty/requests/:id/reject
const rejectRequest = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  const leave = await LeaveRequest.findById(req.params.id).populate('student', 'name rollNumber department');
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

  leave.facultyStatus = 'Rejected';
  leave.facultyRemark = remark || undefined;
  leave.facultyReviewedAt = new Date();
  leave.overallStatus = 'Rejected';
  await leave.save();

  await recordAudit(req, { action: 'FACULTY_REJECTED', entityType: 'LeaveRequest', entityId: leave._id, details: { remark } });

  await notifyUser({
    userId: leave.student._id,
    leaveRequestId: leave._id,
    title: 'Leave Rejected',
    message: remark ? `Your faculty advisor rejected your leave: ${remark}` : 'Your faculty advisor rejected your leave.',
    type: 'FACULTY_REJECTED',
  });

  res.json({ success: true, data: toFacultyJson(leave) });
});

// PUT /api/v1/faculty/requests/:id/forward — explicit "Forward to HOD" UI action, same as approve
const forwardToHod = approveRequest;

module.exports = { getRequests, getRequestById, approveRequest, rejectRequest, forwardToHod };
