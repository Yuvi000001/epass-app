const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const { resolveCampusFromCode, VALID_CAMPUSES } = require('../config/campusCodes');
const { recordAudit } = require('../services/auditService');
const { sendOtpEmail } = require('../services/emailService');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP
}

// =====================================================================
// POST /api/v1/auth/register/send-otp
// Body: { name, email, password, campusCode }
// Validates the campus code + email availability, generates a 6-digit OTP,
// and sends it to the user's email. OTP is not exposed to the client.
// =====================================================================
const sendOtp = asyncHandler(async (req, res) => {
  const { name, email, password, campus, rollNumber, branch, department, college, phone } = req.body;

  if (!name || !email || !password || !campus || !rollNumber || !branch || !department || !college || !phone) {
    return res.status(400).json({ success: false, message: 'All student registration fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  // Accept `campus` directly (e.g. 'BIST') from the frontend select
  // `campus` was destructured from req.body above
  if (!campus || !VALID_CAMPUSES.includes(campus)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing campus' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists. Please login instead.' });
  }

  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(password, 10);
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Replace any previous pending registration for this email
  await PendingRegistration.deleteMany({ email: normalizedEmail });
  await PendingRegistration.create({
    name,
    email: normalizedEmail,
    passwordHash,
    campus,
    role: 'STUDENT',
    otp,
    expiresAt,
    rollNumber,
    branch,
    department,
    college,
    phone,
  });

  const emailSent = await sendOtpEmail({ toEmail: normalizedEmail, toName: name, otp, expiryMinutes });

  res.json({
    success: true,
    message: emailSent ? 'A new OTP has been sent to your email.' : 'OTP generation succeeded; please use the OTP shown in the server console if email delivery is delayed.',
    data: {
      email: normalizedEmail,
      expiresInMinutes: expiryMinutes,
      emailSent,
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    },
  });
});

// =====================================================================
// POST /api/v1/auth/faculty/register/send-otp
// Body: { name, email, password, department, designation, college, phone, campus, employeeId }
// Creates a pending FACULTY registration entry and sends an OTP.
// =====================================================================
const sendFacultyOtp = asyncHandler(async (req, res) => {
  const { name, email, password, department, designation, college, phone, campus, employeeId } = req.body;

  if (!name || !email || !password || !department || !designation || !college || !phone || !campus) {
    return res.status(400).json({ success: false, message: 'All faculty registration fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists. Please login instead.' });
  }

  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(password, 10);
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await PendingRegistration.deleteMany({ email: normalizedEmail });
  await PendingRegistration.create({
    name,
    email: normalizedEmail,
    passwordHash,
    campus,
    role: 'FACULTY',
    otp,
    expiresAt,
    department,
    designation,
    college,
    phone,
    employeeId,
  });

  const emailSent = await sendOtpEmail({ toEmail: normalizedEmail, toName: name, otp, expiryMinutes });
  if (!emailSent) {
    return res.status(500).json({
      success: false,
      message: 'OTP delivery failed. Please contact your administrator.',
      data: { email: normalizedEmail, expiresInMinutes: expiryMinutes, emailSent },
    });
  }

  res.json({
    success: true,
    message: 'A new OTP has been sent to your email.',
    data: { email: normalizedEmail, expiresInMinutes: expiryMinutes, emailSent },
  });
});

// =====================================================================
// POST /api/v1/auth/guard/register/send-otp
// Body: { name, email, password, employeeId, gate, college, phone, campus }
// Creates a pending GUARD registration entry and sends an OTP.
// =====================================================================
const sendGuardOtp = asyncHandler(async (req, res) => {
  const { name, email, password, employeeId, gate, college, phone, campus } = req.body;

  if (!name || !email || !password || !employeeId || !gate || !college || !phone || !campus) {
    return res.status(400).json({ success: false, message: 'All guard registration fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists. Please login instead.' });
  }

  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(password, 10);
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await PendingRegistration.deleteMany({ email: normalizedEmail });
  await PendingRegistration.create({
    name,
    email: normalizedEmail,
    passwordHash,
    campus,
    role: 'GUARD',
    otp,
    expiresAt,
    employeeId,
    assignedGate: gate,
    college,
    phone,
  });

  const emailSent = await sendOtpEmail({ toEmail: normalizedEmail, toName: name, otp, expiryMinutes });
  if (!emailSent) {
    return res.status(500).json({
      success: false,
      message: 'OTP delivery failed. Please contact your administrator.',
      data: { email: normalizedEmail, expiresInMinutes: expiryMinutes, emailSent },
    });
  }

  res.json({
    success: true,
    message: 'A new OTP has been sent to your email.',
    data: { email: normalizedEmail, expiresInMinutes: expiryMinutes, emailSent },
  });
});

// =====================================================================
// POST /api/v1/auth/admin/register/send-otp
// Body: { name, email, password, campusCode }
// Creates a pending ADMIN registration entry and sends/verifies an OTP.
// =====================================================================
const sendAdminOtp = asyncHandler(async (req, res) => {
  const { name, email, password, campusCode } = req.body;

  if (!name || !email || !password || !campusCode) {
    return res.status(400).json({ success: false, message: 'name, email, password and campusCode are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const campus = resolveCampusFromCode(campusCode.trim());
  if (!campus) {
    return res.status(400).json({ success: false, message: 'Invalid campus code' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists. Please login instead.' });
  }

  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(password, 10);
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await PendingRegistration.deleteMany({ email: normalizedEmail });
  await PendingRegistration.create({ name, email: normalizedEmail, passwordHash, campus, role: 'ADMIN', otp, expiresAt });

  const emailSent = await sendOtpEmail({ toEmail: normalizedEmail, toName: name, otp, expiryMinutes });

  if (!emailSent) {
    return res.status(500).json({
      success: false,
      message: 'OTP delivery failed. Please contact your administrator.',
      data: { email: normalizedEmail, campus, expiresInMinutes: expiryMinutes, emailSent },
    });
  }

  res.json({
    success: true,
    message: 'OTP sent to your email.',
    data: { email: normalizedEmail, campus, expiresInMinutes: expiryMinutes, emailSent },
  });
});

// =====================================================================
// POST /api/v1/auth/register/verify-otp
// Body: { email, otp }
// Creates the real User account (role STUDENT) once the OTP matches, then
// logs them straight in (returns a token) and deletes the pending record.
// =====================================================================
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'email and otp are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const pending = await PendingRegistration.findOne({ email: normalizedEmail });
  if (!pending) {
    return res.status(400).json({ success: false, message: 'No pending registration found, or it expired. Please register again.' });
  }

  if (pending.otp !== String(otp).trim()) {
    pending.attempts += 1;
    await pending.save();
    if (pending.attempts >= 5) {
      await pending.deleteOne();
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please register again.' });
    }
    return res.status(400).json({ success: false, message: 'Incorrect OTP' });
  }

  const userData = {
    name: pending.name,
    email: pending.email,
    password: pending.passwordHash, // already hashed — User's pre-save hook detects this and skips re-hashing
    role: pending.role || 'STUDENT',
    campus: pending.campus,
    rollNumber: pending.rollNumber,
    branch: pending.branch,
    department: pending.department,
    college: pending.college,
    phone: pending.phone,
    designation: pending.designation,
    assignedGate: pending.assignedGate,
    isEmailVerified: true,
  };

  const requiresApproval = ['FACULTY', 'GUARD'].includes(userData.role);
  if (requiresApproval) {
    userData.isActive = false;
  }

  const user = await User.create(userData);
  await pending.deleteOne();
  await recordAudit(req, {
    action: pending.role === 'ADMIN' ? 'ADMIN_SELF_REGISTERED' : 'SELF_REGISTERED',
    entityType: 'User',
    entityId: user._id,
    details: { campus: user.campus }
  });

  if (requiresApproval) {
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending approval and cannot login until approved by your campus admin.',
    });
  }

  const token = generateToken({ id: user._id.toString(), role: user.role });
  res.status(201).json({ success: true, data: { token, user: user.toJSON() } });
});

// =====================================================================
// POST /api/v1/auth/register/resend-otp
// Body: { email }
// =====================================================================
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'email is required' });

  const normalizedEmail = email.toLowerCase().trim();
  const pending = await PendingRegistration.findOne({ email: normalizedEmail });
  if (!pending) {
    return res.status(400).json({ success: false, message: 'No pending registration found. Please start registration again.' });
  }

  const otp = generateOtp();
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  pending.otp = otp;
  pending.attempts = 0;
  pending.expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  await pending.save();

  const emailSent = await sendOtpEmail({ toEmail: normalizedEmail, toName: pending.name, otp, expiryMinutes });

  if (!emailSent) {
    return res.status(500).json({
      success: false,
      message: 'OTP delivery failed. Please contact your administrator.',
      data: { email: normalizedEmail, expiresInMinutes: expiryMinutes, emailSent },
    });
  }

  res.json({
    success: true,
    message: 'A new OTP has been sent to your email.',
    data: { email: normalizedEmail, expiresInMinutes: expiryMinutes, emailSent },
  });
});

module.exports = { sendOtp, verifyOtp, resendOtp, sendAdminOtp, sendFacultyOtp, sendGuardOtp };