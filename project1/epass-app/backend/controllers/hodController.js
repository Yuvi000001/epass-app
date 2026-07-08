const asyncHandler = require('../utils/asyncHandler');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const { notifyUser } = require('../services/notificationService');
const { recordAudit } = require('../services/auditService');
const { issueEpass } = require('./epassController');

function toHodJson(leave) {
  const json = leave.toJSON();
  if (leave.student && leave.student.name) {
    json.studentName = leave.student.name;
    json.rollNumber = leave.student.rollNumber;
  }
  return json;
}

// GET /api/v1/hod/requests?status=Pending
const getRequests = asyncHandler(async (req, res) => {
  const status = req.query.status || 'Pending';
  const query = { hod: req.user._id, facultyStatus: 'Approved' };
  if (status !== 'All') query.hodStatus = status;

  const requests = await LeaveRequest.find(query).sort({ appliedOn: -1 }).populate('student', 'name rollNumber department');
  res.json({ success: true, data: requests.map(toHodJson) });
});

// GET /api/v1/hod/requests/:id
const getRequestById = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id)
    .populate('student', 'name rollNumber branch semester department phone profileImageUrl');
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
  res.json({ success: true, data: toHodJson(leave) });
});

// GET /api/v1/hod/members?role=&search=&department=&college=&page=&limit=
const getMembers = asyncHandler(async (req, res) => {
  const role = (req.query.role || 'STUDENT').toUpperCase();
  const allowedRoles = ['STUDENT', 'FACULTY', 'GUARD'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid member role' });
  }

  const { search, department, college, page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(200, Number(limit) || 50);
  const skip = (pageNum - 1) * limitNum;

  const query = { role, campus: req.user.campus };
  if (department) query.department = department;
  if (college) query.college = college;
  if (search) {
    const re = new RegExp(search.trim(), 'i');
    query.$or = [{ name: re }, { email: re }, { rollNumber: re }];
  }

  const [members, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: members.map((m) => m.toJSON()),
    meta: { total, page: pageNum, limit: limitNum },
  });
});

// GET /api/v1/hod/faculty/pending — pending self-registered faculty accounts for HOD approval
const getPendingFaculty = asyncHandler(async (req, res) => {
  const pendingFaculty = await User.find({ role: 'FACULTY', isActive: false, addedBy: { $exists: false }, campus: req.user.campus })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: pendingFaculty || [] });
});

// PUT /api/v1/hod/faculty/:id/approve — approve pending faculty
const approveFaculty = asyncHandler(async (req, res) => {
  const faculty = await User.findById(req.params.id);
  if (!faculty || faculty.role !== 'FACULTY' || faculty.isActive || faculty.addedBy || faculty.campus !== req.user.campus) {
    return res.status(404).json({ success: false, message: 'Pending Faculty not found' });
  }

  faculty.isActive = true;
  await faculty.save();
  await recordAudit(req, { action: 'FACULTY_APPROVED_BY_HOD', entityType: 'User', entityId: faculty._id, details: { email: faculty.email, campus: faculty.campus } });

  res.json({ success: true, message: 'Faculty approved', data: faculty.toJSON() });
});

// PUT /api/v1/hod/faculty/:id/reject — reject pending faculty
const rejectFaculty = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  const faculty = await User.findById(req.params.id);
  if (!faculty || faculty.role !== 'FACULTY' || faculty.isActive || faculty.addedBy || faculty.campus !== req.user.campus) {
    return res.status(404).json({ success: false, message: 'Pending Faculty not found' });
  }

  await recordAudit(req, { action: 'FACULTY_REJECTED_BY_HOD', entityType: 'User', entityId: faculty._id, details: { email: faculty.email, remark } });
  await faculty.deleteOne();

  res.json({ success: true, message: 'Faculty request rejected and removed' });
});

// GET /api/v1/hod/guards/pending — pending self-registered guard accounts for HOD approval
const getPendingGuards = asyncHandler(async (req, res) => {
  const pendingGuards = await User.find({ role: 'GUARD', isActive: false, addedBy: { $exists: false }, campus: req.user.campus })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: pendingGuards || [] });
});

// PUT /api/v1/hod/guards/:id/approve — approve pending guard
const approveGuard = asyncHandler(async (req, res) => {
  const guard = await User.findById(req.params.id);
  if (!guard || guard.role !== 'GUARD' || guard.isActive || guard.addedBy || guard.campus !== req.user.campus) {
    return res.status(404).json({ success: false, message: 'Pending Guard not found' });
  }

  guard.isActive = true;
  await guard.save();
  await recordAudit(req, { action: 'GUARD_APPROVED_BY_HOD', entityType: 'User', entityId: guard._id, details: { email: guard.email, campus: guard.campus } });

  res.json({ success: true, message: 'Guard approved', data: guard.toJSON() });
});

// PUT /api/v1/hod/guards/:id/reject — reject pending guard
const rejectGuard = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  const guard = await User.findById(req.params.id);
  if (!guard || guard.role !== 'GUARD' || guard.isActive || guard.addedBy || guard.campus !== req.user.campus) {
    return res.status(404).json({ success: false, message: 'Pending Guard not found' });
  }

  await recordAudit(req, { action: 'GUARD_REJECTED_BY_HOD', entityType: 'User', entityId: guard._id, details: { email: guard.email, remark } });
  await guard.deleteOne();

  res.json({ success: true, message: 'Guard request rejected and removed' });
});

// PUT /api/v1/hod/requests/:id/approve  → triggers E-Pass generation
const approveRequest = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  const leave = await LeaveRequest.findById(req.params.id).populate('student', 'name rollNumber branch department campus');
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

  leave.hodStatus = 'Approved';
  leave.hodRemark = remark || undefined;
  leave.hodReviewedAt = new Date();
  leave.overallStatus = 'Approved';
  await leave.save();

  await recordAudit(req, { action: 'HOD_APPROVED', entityType: 'LeaveRequest', entityId: leave._id, details: { remark } });

  const epass = await issueEpass(leave);

  await notifyUser({
    userId: leave.student._id,
    leaveRequestId: leave._id,
    title: 'Leave Approved — E-Pass Ready',
    message: 'Your HOD approved your leave. Your E-Pass is ready to download.',
    type: 'HOD_APPROVED',
  });

  const managerCampus = leave.student?.campus || req.user.campus;
  const managers = await User.find({ role: { $in: ['DIRECTOR', 'ADMIN'] }, campus: managerCampus }).lean();
  await Promise.all(managers.map((manager) => notifyUser({
    userId: manager._id,
    leaveRequestId: leave._id,
    title: 'HOD Approved Leave Request',
    message: `${leave.student?.name || 'A student'} has an HOD-approved leave request.`,
    type: 'HOD_APPROVED',
  })));

  res.json({ success: true, data: { ...toHodJson(leave), epass: epass.toJSON() } });
});

// PUT /api/v1/hod/requests/:id/reject
const rejectRequest = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  const leave = await LeaveRequest.findById(req.params.id).populate('student', 'name rollNumber department campus');
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

  leave.hodStatus = 'Rejected';
  leave.hodRemark = remark || undefined;
  leave.hodReviewedAt = new Date();
  leave.overallStatus = 'Rejected';
  await leave.save();

  await recordAudit(req, { action: 'HOD_REJECTED', entityType: 'LeaveRequest', entityId: leave._id, details: { remark } });

  await notifyUser({
    userId: leave.student._id,
    leaveRequestId: leave._id,
    title: 'Leave Rejected by HOD',
    message: remark ? `Your HOD rejected your leave: ${remark}` : 'Your HOD rejected your leave.',
    type: 'HOD_REJECTED',
  });

  const managerCampus = leave.student?.campus || req.user.campus;
  const managers = await User.find({ role: { $in: ['DIRECTOR', 'ADMIN'] }, campus: managerCampus }).lean();
  await Promise.all(managers.map((manager) => notifyUser({
    userId: manager._id,
    leaveRequestId: leave._id,
    title: 'HOD Rejected Leave Request',
    message: `${leave.student?.name || 'A student'} has an HOD-rejected leave request.${remark ? ` Remark: ${remark}` : ''}`,
    type: 'HOD_REJECTED',
  })));

  res.json({ success: true, data: toHodJson(leave) });
});

// GET /api/v1/hod/stats
const getStats = asyncHandler(async (req, res) => {
  const department = req.user.department;
  const agg = await LeaveRequest.aggregate([
    { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentDoc' } },
    { $unwind: '$studentDoc' },
    { $match: { 'studentDoc.department': department } },
    { $group: { _id: '$overallStatus', count: { $sum: 1 } } },
  ]);

  const counts = { Pending: 0, Approved: 0, Rejected: 0 };
  agg.forEach((g) => { counts[g._id] = g.count; });
  const totalRequests = counts.Pending + counts.Approved + counts.Rejected;

  res.json({
    success: true,
    data: { totalRequests, pending: counts.Pending, approved: counts.Approved, rejected: counts.Rejected },
  });
});

// GET /api/v1/hod/reports?from=&to=&format=
const getReports = asyncHandler(async (req, res) => {
  const requests = await LeaveRequest.find({ hod: req.user._id }).populate('student', 'name rollNumber department');
  res.json({
    success: true,
    data: requests.map(toHodJson),
    message: 'Use ?format=csv|pdf in production to export a file',
  });
});

module.exports = {
  getRequests,
  getRequestById,
  getMembers,
  getPendingFaculty,
  approveFaculty,
  rejectFaculty,
  getPendingGuards,
  approveGuard,
  rejectGuard,
  approveRequest,
  rejectRequest,
  getStats,
  getReports,
};
