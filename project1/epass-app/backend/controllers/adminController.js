const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const AuditLog = require('../models/AuditLog');
const { recordAudit } = require('../services/auditService');

const VALID_ROLES = ['STUDENT', 'FACULTY', 'HOD', 'GUARD', 'DIRECTOR', 'ADMIN'];

// =====================================================================
// POST /api/v1/admin/members — Add a new member (HOD / Faculty / Student / Guard)
// Always created on the SAME campus as the logged-in Admin — an admin can
// only ever populate their own campus, never another one.
// =====================================================================
const addMember = asyncHandler(async (req, res) => {
  const {
    name, email, password, role, department, phone,
    rollNumber, branch, semester, facultyAdvisorId, // STUDENT
    designation, // FACULTY
    assignedGate, // GUARD
  } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'name, email, password and role are required' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  if (role === 'STUDENT' && !rollNumber) {
    return res.status(400).json({ success: false, message: 'rollNumber is required for students' });
  }
  if (role !== 'ADMIN' && !department) {
    return res.status(400).json({ success: false, message: 'department is required for this role' });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'A member with this email already exists' });
  }

  const userData = {
    name, email, password, role, department, phone,
    campus: req.user.campus, // inherited from the admin adding them — not client-supplied
    isEmailVerified: true, // admin-added accounts skip OTP verification
    addedBy: req.user._id,
  };
  if (role === 'STUDENT') Object.assign(userData, { rollNumber, branch, semester, facultyAdvisorId: facultyAdvisorId || undefined });
  if (role === 'FACULTY') Object.assign(userData, { designation });
  if (role === 'GUARD') Object.assign(userData, { assignedGate });

  const member = await User.create(userData);
  await recordAudit(req, { action: 'MEMBER_ADDED', entityType: 'User', entityId: member._id, details: { role, email, department, campus: req.user.campus } });

  res.status(201).json({ success: true, data: member.toJSON() });
});

// =====================================================================
// GET /api/v1/admin/students | /faculty | /hod | /guards | /directors | /admins
// ?department=&campus=&search=&page=&limit=
// — Scoped to requesting user's campus, or all campuses if ADMIN with no campus specified
// =====================================================================
function buildListQuery(role, userRole, userCampus, { department, search, campus }) {
  const query = { role };
  
  // Determine campus filter
  if (userRole === 'ADMIN' || userRole === 'DIRECTOR') {
    // Admin and Director can see all campuses or filter to specific one
    if (campus) {
      query.campus = campus;
    } else {
      query.campus = { $in: ['BIST', 'BIRT', 'BIRTS'] };
    }
  } else {
    // Other users see only their campus
    query.campus = userCampus;
  }
  
  if (department) query.department = department;
  if (search) {
    const re = new RegExp(search.trim(), 'i');
    query.$or = [{ name: re }, { email: re }, { rollNumber: re }];
  }
  return query;
}

async function listByRole(role, req, res) {
  const { department, search, campus, page = 1, limit = 50 } = req.query;
  const query = buildListQuery(role, req.user.role, req.user.campus, { department, search, campus });
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(200, Number(limit) || 50);
  const skip = (pageNum - 1) * limitNum;

  const [members, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: members.map((m) => m.toJSON()),
    meta: { total, page: pageNum, limit: limitNum },
  });
}

const listStudents = asyncHandler((req, res) => listByRole('STUDENT', req, res));
const listFaculty = asyncHandler((req, res) => listByRole('FACULTY', req, res));
const listHod = asyncHandler((req, res) => listByRole('HOD', req, res));
const listGuards = asyncHandler((req, res) => listByRole('GUARD', req, res));
const listDirectors = asyncHandler((req, res) => listByRole('DIRECTOR', req, res));
const listAdmins = asyncHandler((req, res) => listByRole('ADMIN', req, res));

// Helper — fetch a member only if it belongs to the requesting admin's campus.
// Returns: null = not found at all, undefined = exists but different campus, object = found & same campus
async function findMemberInOwnCampus(req) {
  const member = await User.findById(req.params.id);
  if (!member) return null;
  if (member.campus !== req.user.campus) return undefined;
  return member;
}

// =====================================================================
// GET /api/v1/admin/members/:id — full detail of any single member (same campus only)
// =====================================================================
const getMember = asyncHandler(async (req, res) => {
  const member = await findMemberInOwnCampus(req);
  if (member === null) return res.status(404).json({ success: false, message: 'Member not found' });
  if (member === undefined) return res.status(403).json({ success: false, message: 'This member belongs to a different campus' });
  res.json({ success: true, data: member.toJSON() });
});

// =====================================================================
// PUT /api/v1/admin/members/:id — update any editable field (same campus only)
// =====================================================================
const updateMember = asyncHandler(async (req, res) => {
  const member = await findMemberInOwnCampus(req);
  if (member === null) return res.status(404).json({ success: false, message: 'Member not found' });
  if (member === undefined) return res.status(403).json({ success: false, message: 'This member belongs to a different campus' });

  const editableFields = [
    'name', 'department', 'phone', 'isActive',
    'rollNumber', 'branch', 'semester', 'facultyAdvisorId', // STUDENT
    'designation', // FACULTY
    'assignedGate', // GUARD
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) member[field] = req.body[field];
  });
  if (req.body.password) member.password = req.body.password; // admin-initiated reset

  await member.save();
  await recordAudit(req, { action: 'MEMBER_UPDATED', entityType: 'User', entityId: member._id, details: req.body });

  res.json({ success: true, data: member.toJSON() });
});

// =====================================================================
// PUT /api/v1/admin/members/:id/toggle-active — activate/deactivate login (same campus only)
// =====================================================================
const toggleActive = asyncHandler(async (req, res) => {
  const member = await findMemberInOwnCampus(req);
  if (member === null) return res.status(404).json({ success: false, message: 'Member not found' });
  if (member === undefined) return res.status(403).json({ success: false, message: 'This member belongs to a different campus' });

  member.isActive = !member.isActive;
  await member.save();
  await recordAudit(req, {
    action: member.isActive ? 'MEMBER_ACTIVATED' : 'MEMBER_DEACTIVATED',
    entityType: 'User',
    entityId: member._id,
  });

  res.json({ success: true, data: member.toJSON() });
});

// =====================================================================
// DELETE /api/v1/admin/members/:id — permanently remove a member (same campus only)
// =====================================================================
const deleteMember = asyncHandler(async (req, res) => {
  const member = await findMemberInOwnCampus(req);
  if (member === null) return res.status(404).json({ success: false, message: 'Member not found' });
  if (member === undefined) return res.status(403).json({ success: false, message: 'This member belongs to a different campus' });
  if (member.role === 'ADMIN') {
    return res.status(400).json({ success: false, message: 'Cannot delete an Admin account' });
  }

  await member.deleteOne();
  await recordAudit(req, {
    action: 'MEMBER_DELETED',
    entityType: 'User',
    entityId: req.params.id,
    details: { email: member.email, role: member.role },
  });

  res.json({ success: true, message: 'Member deleted' });
});

// =====================================================================
// GET /api/v1/admin/departments — distinct department list for this campus
// =====================================================================
const listDepartments = asyncHandler(async (req, res) => {
  const departments = await User.distinct('department', {
    campus: req.user.campus,
    department: { $nin: [null, ''] },
  });
  res.json({ success: true, data: departments.sort() });
});

// =====================================================================
// GET /api/v1/admin/stats — dashboard overview numbers (this campus only)
// =====================================================================
const getStats = asyncHandler(async (req, res) => {
  // Admin sees all campuses; other roles see only their campus
  const campusFilter = req.user.role === 'ADMIN' ? { $in: ['BIST', 'BIRT', 'BIRTS'] } : req.user.campus;
  const [totalStudents, totalFaculty, totalHod, totalGuards, leaveAgg] = await Promise.all([
    User.countDocuments({ role: 'STUDENT', campus: campusFilter }),
    User.countDocuments({ role: 'FACULTY', campus: campusFilter }),
    User.countDocuments({ role: 'HOD', campus: campusFilter }),
    User.countDocuments({ role: 'GUARD', campus: campusFilter }),
    LeaveRequest.aggregate([
      { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentDoc' } },
      { $unwind: '$studentDoc' },
      { $match: req.user.role === 'ADMIN' ? { 'studentDoc.campus': { $in: ['BIST', 'BIRT', 'BIRTS'] } } : { 'studentDoc.campus': req.user.campus } },
      { $group: { _id: '$overallStatus', count: { $sum: 1 } } },
    ]),
  ]);

  const counts = { Pending: 0, Approved: 0, Rejected: 0 };
  leaveAgg.forEach((g) => { counts[g._id] = g.count; });
  const totalRequests = counts.Pending + counts.Approved + counts.Rejected;

  res.json({
    success: true,
    data: {
      campus: req.user.role === 'ADMIN' ? 'All Campuses' : req.user.campus,
      totalStudents,
      totalFaculty,
      totalHod,
      totalGuards,
      totalRequests,
      pending: counts.Pending,
      approved: counts.Approved,
      rejected: counts.Rejected,
    },
  });
});

// =====================================================================
// GET /api/v1/admin/charts/department-wise (admin sees all campuses)
// =====================================================================
const getDepartmentWiseChart = asyncHandler(async (req, res) => {
  const campusMatch = req.user.role === 'ADMIN' ? { 'studentDoc.campus': { $in: ['BIST', 'BIRT', 'BIRTS'] } } : { 'studentDoc.campus': req.user.campus };
  const data = await LeaveRequest.aggregate([
    { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentDoc' } },
    { $unwind: '$studentDoc' },
    { $match: campusMatch },
    { $group: { _id: '$studentDoc.department', total: { $sum: 1 } } },
    { $project: { department: '$_id', total: 1, _id: 0 } },
    { $sort: { department: 1 } },
  ]);
  res.json({ success: true, data });
});

// =====================================================================
// GET /api/v1/admin/charts/monthly-trend (admin sees all campuses)
// =====================================================================
const getMonthlyTrendChart = asyncHandler(async (req, res) => {
  const campusMatch = req.user.role === 'ADMIN' ? { 'studentDoc.campus': { $in: ['BIST', 'BIRT', 'BIRTS'] } } : { 'studentDoc.campus': req.user.campus };
  const data = await LeaveRequest.aggregate([
    { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentDoc' } },
    { $unwind: '$studentDoc' },
    { $match: campusMatch },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$appliedOn' } }, total: { $sum: 1 } } },
    { $project: { month: '$_id', total: 1, _id: 0 } },
    { $sort: { month: 1 } },
  ]);
  res.json({ success: true, data });
});

// =====================================================================
// GET /api/v1/admin/audit-logs?userId=&entityType=&page=
// =====================================================================
const getAuditLogs = asyncHandler(async (req, res) => {
  const { userId, entityType, page = 1, limit = 30 } = req.query;
  const query = {};
  if (userId) query.user = userId;
  if (entityType) query.entityType = entityType;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Number(limit) || 30);
  const skip = (pageNum - 1) * limitNum;

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('user', 'name email role campus');

  res.json({ success: true, data: logs.map((l) => l.toJSON()) });
});

// =====================================================================
// HOD & DIRECTOR REGISTRATION APPROVALS
// =====================================================================
const PendingRegistration = require('../models/PendingRegistration');
const bcrypt = require('bcryptjs');

// GET /api/v1/admin/hod/pending — Get pending HOD registrations
const getPendingHod = asyncHandler(async (req, res) => {
  const PendingReg = PendingRegistration;
  const campusFilter = req.user.role === 'ADMIN' ? { $in: ['BIST', 'BIRT', 'BIRTS'] } : req.user.campus;
  const pendings = await PendingReg.find({ role: 'HOD', campus: campusFilter })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: pendings || [] });
});

// PUT /api/v1/admin/hod/:id/approve — Approve pending HOD registration
const approveHod = asyncHandler(async (req, res) => {
  const PendingReg = PendingRegistration;
  const pending = await PendingReg.findById(req.params.id);
  if (!pending || pending.role !== 'HOD') {
    return res.status(404).json({ success: false, message: 'Pending HOD not found' });
  }

  // Check campus access
  if (req.user.role !== 'ADMIN' && pending.campus !== req.user.campus) {
    return res.status(403).json({ success: false, message: 'No access to this request' });
  }

  // Prevent approval if that email already belongs to an active user
  const existingUser = await User.findOne({ email: pending.email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'A user with this email already exists. Approval cannot be completed.'
    });
  }

  // Create actual HOD user
  const user = new User({
    name: pending.name,
    email: pending.email,
    password: pending.passwordHash || pending.password,
    role: 'HOD',
    campus: pending.campus || pending.college,
    department: pending.department,
    phone: pending.phone,
    employeeId: pending.employeeId,
    isActive: true,
    isEmailVerified: true,
    addedBy: req.user._id,
  });
  await user.save();
  await recordAudit(req, { action: 'HOD_APPROVED', entityType: 'User', entityId: user._id, details: { email: pending.email, campus: user.campus } });

  // Delete pending registration
  await PendingReg.deleteOne({ _id: req.params.id });

  res.json({ success: true, message: 'HOD approved', data: user.toJSON() });
});

// PUT /api/v1/admin/hod/:id/reject — Reject pending HOD registration
const rejectHod = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  const PendingReg = PendingRegistration;
  const pending = await PendingReg.findById(req.params.id);
  if (!pending || pending.role !== 'HOD') {
    return res.status(404).json({ success: false, message: 'Pending HOD not found' });
  }

  // Check campus access
  if (req.user.role !== 'ADMIN' && pending.campus !== req.user.campus) {
    return res.status(403).json({ success: false, message: 'No access to this request' });
  }

  await recordAudit(req, { action: 'HOD_REJECTED', entityType: 'PendingRegistration', entityId: pending._id, details: { email: pending.email, remark } });
  await PendingReg.deleteOne({ _id: req.params.id });

  res.json({ success: true, message: 'HOD request rejected and deleted' });
});

// GET /api/v1/admin/directors/pending — Get pending Director registrations
const getPendingDirectors = asyncHandler(async (req, res) => {
  const PendingReg = PendingRegistration;
  const campusFilter = req.user.role === 'ADMIN' ? { $in: ['BIST', 'BIRT', 'BIRTS'] } : req.user.campus;
  const pendings = await PendingReg.find({ role: 'DIRECTOR', campus: campusFilter })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: pendings || [] });
});

// PUT /api/v1/admin/directors/:id/approve — Approve pending Director registration
const approveDirector = asyncHandler(async (req, res) => {
  const PendingReg = PendingRegistration;
  const pending = await PendingReg.findById(req.params.id);
  if (!pending || pending.role !== 'DIRECTOR') {
    return res.status(404).json({ success: false, message: 'Pending Director not found' });
  }

  // Check campus access
  if (req.user.role !== 'ADMIN' && pending.campus !== req.user.campus) {
    return res.status(403).json({ success: false, message: 'No access to this request' });
  }

  // Prevent approval if that email already belongs to an active user
  const existingUser = await User.findOne({ email: pending.email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'A user with this email already exists. Approval cannot be completed.'
    });
  }

  // Create actual Director user
  const user = new User({
    name: pending.name,
    email: pending.email,
    password: pending.passwordHash || pending.password,
    role: 'DIRECTOR',
    campus: pending.campus || pending.college,
    employeeId: pending.employeeId,
    phone: pending.phone,
    isActive: true,
    isEmailVerified: true,
    addedBy: req.user._id,
  });
  await user.save();
  await recordAudit(req, { action: 'DIRECTOR_APPROVED', entityType: 'User', entityId: user._id, details: { email: pending.email, campus: user.campus } });

  // Delete pending registration
  await PendingReg.deleteOne({ _id: req.params.id });

  res.json({ success: true, message: 'Director approved', data: user.toJSON() });
});

// PUT /api/v1/admin/directors/:id/reject — Reject pending Director registration
const rejectDirector = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  const PendingReg = PendingRegistration;
  const pending = await PendingReg.findById(req.params.id);
  if (!pending || pending.role !== 'DIRECTOR') {
    return res.status(404).json({ success: false, message: 'Pending Director not found' });
  }

  // Check campus access
  if (req.user.role !== 'ADMIN' && pending.campus !== req.user.campus) {
    return res.status(403).json({ success: false, message: 'No access to this request' });
  }

  await recordAudit(req, { action: 'DIRECTOR_REJECTED', entityType: 'PendingRegistration', entityId: pending._id, details: { email: pending.email, remark } });
  await PendingReg.deleteOne({ _id: req.params.id });

  res.json({ success: true, message: 'Director request rejected and deleted' });
});

// GET /api/v1/admin/faculty/pending — Get pending Faculty registrations that have already verified OTP but await admin approval
const getPendingFaculty = asyncHandler(async (req, res) => {
  const campusFilter = req.user.role === 'ADMIN' ? { $in: ['BIST', 'BIRT', 'BIRTS'] } : req.user.campus;
  const pendingFaculty = await User.find({ role: 'FACULTY', isActive: false, addedBy: { $exists: false }, campus: campusFilter })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: pendingFaculty || [] });
});

// PUT /api/v1/admin/faculty/:id/approve — Approve pending Faculty account
const approveFaculty = asyncHandler(async (req, res) => {
  const faculty = await User.findById(req.params.id);
  if (!faculty || faculty.role !== 'FACULTY' || faculty.isActive || faculty.addedBy) {
    return res.status(404).json({ success: false, message: 'Pending Faculty not found' });
  }

  if (req.user.role !== 'ADMIN' && faculty.campus !== req.user.campus) {
    return res.status(403).json({ success: false, message: 'No access to this request' });
  }

  faculty.isActive = true;
  await faculty.save();
  await recordAudit(req, { action: 'FACULTY_APPROVED', entityType: 'User', entityId: faculty._id, details: { email: faculty.email, campus: faculty.campus } });

  res.json({ success: true, message: 'Faculty approved', data: faculty.toJSON() });
});

// PUT /api/v1/admin/faculty/:id/reject — Reject pending Faculty account
const rejectFaculty = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  const faculty = await User.findById(req.params.id);
  if (!faculty || faculty.role !== 'FACULTY' || faculty.isActive) {
    return res.status(404).json({ success: false, message: 'Pending Faculty not found' });
  }

  if (req.user.role !== 'ADMIN' && faculty.campus !== req.user.campus) {
    return res.status(403).json({ success: false, message: 'No access to this request' });
  }

  await recordAudit(req, { action: 'FACULTY_REJECTED', entityType: 'User', entityId: faculty._id, details: { email: faculty.email, remark } });
  await faculty.deleteOne();

  res.json({ success: true, message: 'Faculty request rejected and removed' });
});

// GET /api/v1/admin/guards/pending — Get pending Guard registrations that have already verified OTP but await admin approval
const getPendingGuards = asyncHandler(async (req, res) => {
  const campusFilter = req.user.role === 'ADMIN' ? { $in: ['BIST', 'BIRT', 'BIRTS'] } : req.user.campus;
  const pendingGuards = await User.find({ role: 'GUARD', isActive: false, addedBy: { $exists: false }, campus: campusFilter })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: pendingGuards || [] });
});

// PUT /api/v1/admin/guards/:id/approve — Approve pending Guard account
const approveGuard = asyncHandler(async (req, res) => {
  const guard = await User.findById(req.params.id);
  if (!guard || guard.role !== 'GUARD' || guard.isActive || guard.addedBy) {
    return res.status(404).json({ success: false, message: 'Pending Guard not found' });
  }

  if (req.user.role !== 'ADMIN' && guard.campus !== req.user.campus) {
    return res.status(403).json({ success: false, message: 'No access to this request' });
  }

  guard.isActive = true;
  await guard.save();
  await recordAudit(req, { action: 'GUARD_APPROVED', entityType: 'User', entityId: guard._id, details: { email: guard.email, campus: guard.campus } });

  res.json({ success: true, message: 'Guard approved', data: guard.toJSON() });
});

// PUT /api/v1/admin/guards/:id/reject — Reject pending Guard account
const rejectGuard = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  const guard = await User.findById(req.params.id);
  if (!guard || guard.role !== 'GUARD' || guard.isActive || guard.addedBy) {
    return res.status(404).json({ success: false, message: 'Pending Guard not found' });
  }

  if (req.user.role !== 'ADMIN' && guard.campus !== req.user.campus) {
    return res.status(403).json({ success: false, message: 'No access to this request' });
  }

  await recordAudit(req, { action: 'GUARD_REJECTED', entityType: 'User', entityId: guard._id, details: { email: guard.email, remark } });
  await guard.deleteOne();

  res.json({ success: true, message: 'Guard request rejected and removed' });
});

module.exports = {
  addMember,
  listStudents,
  listFaculty,
  listHod,
  listGuards,
  listDirectors,
  listAdmins,
  getMember,
  updateMember,
  toggleActive,
  deleteMember,
  listDepartments,
  getStats,
  getDepartmentWiseChart,
  getMonthlyTrendChart,
  getAuditLogs,
  getPendingHod,
  approveHod,
  rejectHod,
  getPendingDirectors,
  approveDirector,
  rejectDirector,
  getPendingFaculty,
  approveFaculty,
  rejectFaculty,
  getPendingGuards,
  approveGuard,
  rejectGuard,
};
