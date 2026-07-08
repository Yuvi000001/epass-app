const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { login, getMe, updateFcmToken, updateProfilePhoto, changePassword, forgotPassword } = require('../controllers/authController');
const { sendOtp, verifyOtp, resendOtp, sendAdminOtp, sendFacultyOtp, sendGuardOtp } = require('../controllers/registerController');
const { sendHodOtp, verifyHodOtp } = require('../controllers/hodAuthController');
const { sendHodRegisterOtp, verifyHodRegisterOtp, completeHodRegistration, sendDirectorRegisterOtp, verifyDirectorRegisterOtp, completeDirectorRegistration, resendDirectorRegisterOtp } = require('../controllers/hodRegisterController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadPhoto } = require('../middleware/upload');

// ---- Normal login ----
router.post('/login', [body('email').isEmail(), body('password').notEmpty()], validate, login);

// ---- HOD Login (OTP based) ----
router.post('/hod/send-otp', [body('email').isEmail()], validate, sendHodOtp);
router.post('/hod/verify-otp', [body('email').isEmail(), body('otp').notEmpty()], validate, verifyHodOtp);

// ---- HOD Self-Registration (pending admin approval) ----
router.post('/hod/register/send-otp', [body('email').isEmail(), body('name').notEmpty()], validate, sendHodRegisterOtp);
router.post('/hod/register/verify-otp', [body('email').isEmail(), body('otp').notEmpty()], validate, verifyHodRegisterOtp);
router.post('/hod/register/complete', [body('email').isEmail(), body('password').isLength({ min: 6 })], validate, completeHodRegistration);
router.post('/hod/register/create', [body('email').isEmail(), body('password').isLength({ min: 6 })], validate, completeHodRegistration);
router.post('/hod/register/resend-otp', [body('email').isEmail()], validate, resendOtp);

// ---- Director Self-Registration ----
router.post('/director/register/send-otp', [
  body('email').isEmail(),
  body('name').notEmpty().withMessage('name is required'),
  body('employeeId').notEmpty().withMessage('employeeId is required'),
  body('college').notEmpty().withMessage('college is required'),
  body('phone').isLength({ min: 10, max: 10 }).withMessage('Valid 10-digit phone is required'),
], validate, sendDirectorRegisterOtp);
router.post('/director/register/verify-otp', [body('email').isEmail(), body('otp').notEmpty()], validate, verifyDirectorRegisterOtp);
router.post('/director/register/complete', [body('email').isEmail(), body('password').isLength({ min: 6 })], validate, completeDirectorRegistration);
router.post('/director/register/resend-otp', [body('email').isEmail()], validate, resendDirectorRegisterOtp);

// ---- Auth / Profile ----
router.get('/me', protect, getMe);
router.put('/fcm-token', protect, updateFcmToken);
router.put('/profile-photo', protect, uploadPhoto.single('photo'), updateProfilePhoto);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', [body('email').isEmail()], validate, forgotPassword);

// ---- Student Self-Registration ----
router.post('/register/send-otp', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().withMessage('name is required'),
  body('campus').notEmpty().withMessage('campus is required'),
  body('rollNumber').notEmpty().withMessage('rollNumber is required'),
  body('branch').notEmpty().withMessage('branch is required'),
  body('department').notEmpty().withMessage('department is required'),
  body('college').notEmpty().withMessage('college is required'),
  body('phone').isLength({ min: 10, max: 10 }).withMessage('Valid 10-digit phone is required'),
], validate, sendOtp);
router.post('/register/verify-otp', [body('email').isEmail(), body('otp').notEmpty()], validate, verifyOtp);
router.post('/register/resend-otp', [body('email').isEmail()], validate, resendOtp);

// ---- Faculty Self-Registration ----
router.post('/faculty/register/send-otp', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().withMessage('name is required'),
  body('department').notEmpty().withMessage('department is required'),
  body('designation').notEmpty().withMessage('designation is required'),
  body('college').notEmpty().withMessage('college is required'),
  body('phone').isLength({ min: 10, max: 10 }).withMessage('Valid 10-digit phone is required'),
  body('campus').notEmpty().withMessage('campus is required'),
  body('employeeId').notEmpty().withMessage('employeeId is required'),
], validate, sendFacultyOtp);
router.post('/faculty/register/verify-otp', [body('email').isEmail(), body('otp').notEmpty()], validate, verifyOtp);
router.post('/faculty/register/resend-otp', [body('email').isEmail()], validate, resendOtp);

// ---- Guard Self-Registration ----
router.post('/guard/register/send-otp', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().withMessage('name is required'),
  body('employeeId').notEmpty().withMessage('employeeId is required'),
  body('gate').notEmpty().withMessage('gate is required'),
  body('college').notEmpty().withMessage('college is required'),
  body('phone').isLength({ min: 10, max: 10 }).withMessage('Valid 10-digit phone is required'),
  body('campus').notEmpty().withMessage('campus is required'),
], validate, sendGuardOtp);
router.post('/guard/register/verify-otp', [body('email').isEmail(), body('otp').notEmpty()], validate, verifyOtp);
router.post('/guard/register/resend-otp', [body('email').isEmail()], validate, resendOtp);

// ---- Admin Self-Registration ----
router.post('/admin/register/send-otp', [body('email').isEmail(), body('password').isLength({ min: 6 }), body('name').notEmpty().withMessage('name is required'), body('campusCode').notEmpty().withMessage('campusCode is required')], validate, sendAdminOtp);
router.post('/admin/register/verify-otp', [body('email').isEmail(), body('otp').notEmpty()], validate, verifyOtp);
router.post('/admin/register/resend-otp', [body('email').isEmail()], validate, resendOtp);

module.exports = router;