const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const { recordAudit } = require('../services/auditService');
const { uploadBufferToFirebase } = require('../services/fileUploadService');

// POST /api/v1/auth/login
// No public self-registration — every account is created by Admin via /admin/members.
const login = asyncHandler(async (req, res) => {
  const { email, password, role, campus } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  if (role && user.role !== role) {
    return res.status(401).json({ success: false, message: `No ${role} account found for this email` });
  }
  if (campus && user.campus !== campus) {
    return res.status(401).json({ success: false, message: `This account is not registered under the ${campus} campus` });
  }
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account is inactive. Contact admin.' });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = generateToken({ id: user._id.toString(), role: user.role });
  await recordAudit(req, { action: 'USER_LOGIN', entityType: 'User', entityId: user._id });

  res.json({ success: true, data: { token, user: user.toJSON() } });
});

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toJSON() });
});

// PUT /api/v1/auth/fcm-token
const updateFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ success: false, message: 'fcmToken is required' });

  req.user.fcmToken = fcmToken;
  await req.user.save();
  res.json({ success: true, message: 'FCM token updated' });
});

// PUT /api/v1/auth/profile-photo  (multipart, field "photo")
const updateProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'photo file is required' });

  const destPath = `epass/profiles/user_${req.user._id}_${Date.now()}.jpg`;
  const url = await uploadBufferToFirebase(req.file.buffer, destPath, req.file.mimetype);

  req.user.profileImageUrl = url;
  await req.user.save();
  await recordAudit(req, { action: 'PROFILE_PHOTO_UPDATED', entityType: 'User', entityId: req.user._id });

  res.json({ success: true, data: { profileImageUrl: url } });
});

// PUT /api/v1/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
  }

  const match = await req.user.comparePassword(currentPassword);
  if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

  req.user.password = newPassword; // pre('save') hook re-hashes it
  await req.user.save();
  await recordAudit(req, { action: 'PASSWORD_CHANGED', entityType: 'User', entityId: req.user._id });

  res.json({ success: true, message: 'Password updated successfully' });
});

// POST /api/v1/auth/forgot-password (stub — no public registration/reset flow; Admin resets manually)
const forgotPassword = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Please contact your Admin to reset your password.' });
});

module.exports = { login, getMe, updateFcmToken, updateProfilePhoto, changePassword, forgotPassword };
