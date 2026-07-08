// =====================================================================
// backend/controllers/hodRegisterController.js
// HOD Registration Controller - Complete
// =====================================================================

const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendOtpEmail } = require('../services/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// =====================================================================
// SEND HOD REGISTER OTP
// =====================================================================
exports.sendHodRegisterOtp = async (req, res) => {
  try {
    const { name, email, employeeId, department, college, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const existingHod = await User.findOne({ 
      role: 'HOD', 
      department: department 
    });
    if (existingHod) {
      return res.status(400).json({
        success: false,
        message: `HOD already exists for ${department} department`
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (!global.hodRegistrations) {
      global.hodRegistrations = {};
    }
    
    const now = Date.now();
    Object.keys(global.hodRegistrations).forEach(key => {
      if (global.hodRegistrations[key].expiry < now) {
        delete global.hodRegistrations[key];
      }
    });

    global.hodRegistrations[email] = {
      name,
      employeeId,
      department,
      college,
      phone,
      email,
      otp,
      otpExpiry: otpExpiry.getTime(),
      expiry: Date.now() + 10 * 60 * 1000
    };

    const emailSent = await sendOtpEmail({ toEmail: email, toName: name, otp, expiryMinutes: 10 });
    console.log(`HOD Registration OTP for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: { emailSent },
    });

  } catch (error) {
    console.error('Send HOD Register OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
};
// =====================================================================
// RESEND DIRECTOR REGISTER OTP
// =====================================================================
exports.resendDirectorRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const registration = global.directorRegistrations?.[email];
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'No registration session found. Please start again.'
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    registration.otp = otp;
    registration.otpExpiry = otpExpiry.getTime();
    registration.expiry = Date.now() + 10 * 60 * 1000;

    const emailSent = await sendOtpEmail({ toEmail: email, toName: registration.name, otp, expiryMinutes: 10 });
    console.log(`Director Registration OTP resent for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: emailSent ? 'OTP resent successfully' : 'OTP delivery failed. Please contact your administrator.',
      data: { emailSent },
    });

  } catch (error) {
    console.error('Resend Director Register OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to resend OTP'
    });
  }
};
// =====================================================================
// VERIFY HOD REGISTER OTP
// =====================================================================
exports.verifyHodRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const registration = global.hodRegistrations?.[email];
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'Registration session expired. Please start again.'
      });
    }

    if (Date.now() > registration.otpExpiry) {
      delete global.hodRegistrations[email];
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (registration.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    const tempToken = jwt.sign(
      { email, purpose: 'hod-register' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token: tempToken
    });

  } catch (error) {
    console.error('Verify HOD Register OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP'
    });
  }
};

// =====================================================================
// COMPLETE HOD REGISTRATION — SAVE AS PENDING FOR ADMIN APPROVAL
// =====================================================================
exports.completeHodRegistration = async (req, res) => {
  try {
    const { email, password, token } = req.body;

    if (!email || !password || !token) {
      return res.status(400).json({
        success: false,
        message: 'Email, password and token are required'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token. Please start registration again.'
      });
    }

    if (decoded.purpose !== 'hod-register' || decoded.email !== email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const registration = global.hodRegistrations?.[email];
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'Registration session expired. Please start again.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      delete global.hodRegistrations[email];
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if already pending
    const existingPending = await PendingRegistration.findOne({ email });
    if (existingPending) {
      delete global.hodRegistrations[email];
      return res.status(400).json({
        success: false,
        message: 'Registration request already pending admin approval'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Save as pending registration instead of creating user directly
    const pendingReg = await PendingRegistration.create({
      name: registration.name,
      email: registration.email,
      passwordHash: hashedPassword,
      role: 'HOD',
      campus: registration.college,
      department: registration.department,
      phone: registration.phone,
      employeeId: registration.employeeId,
      otp: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    delete global.hodRegistrations[email];

    // Notify admins
    const admins = await User.find({ role: 'ADMIN' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: 'New HOD Registration Pending',
        message: `${registration.name} has registered as HOD for ${registration.department} department. Please review and approve.`,
        type: 'HOD_PENDING',
        isRead: false
      });
    }

    return res.status(201).json({
      success: true,
      message: 'HOD registration submitted. Awaiting admin approval.',
      data: {
        email: pendingReg.email,
        name: pendingReg.name,
        status: 'PENDING_APPROVAL'
      }
    });
  } catch (error) {
    console.error('Complete HOD Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete HOD registration'
    });
  }
};

// =====================================================================
// SEND DIRECTOR REGISTER OTP
// =====================================================================
exports.sendDirectorRegisterOtp = async (req, res) => {
  try {
    const { name, employeeId, college, phone, email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (!global.directorRegistrations) {
      global.directorRegistrations = {};
    }

    const now = Date.now();
    Object.keys(global.directorRegistrations).forEach(key => {
      if (global.directorRegistrations[key].expiry < now) {
        delete global.directorRegistrations[key];
      }
    });

    global.directorRegistrations[email] = {
      name,
      employeeId,
      college,
      phone,
      email,
      otp,
      otpExpiry: otpExpiry.getTime(),
      expiry: Date.now() + 10 * 60 * 1000
    };

    const emailSent = await sendOtpEmail({ toEmail: email, toName: name, otp, expiryMinutes: 10 });
    console.log(`Director Registration OTP for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: { emailSent },
    });
  } catch (error) {
    console.error('Send Director Register OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
};

// =====================================================================
// VERIFY DIRECTOR REGISTER OTP
// =====================================================================
exports.verifyDirectorRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const registration = global.directorRegistrations?.[email];
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'Registration session expired. Please start again.'
      });
    }

    if (Date.now() > registration.otpExpiry) {
      delete global.directorRegistrations[email];
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (registration.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    const tempToken = jwt.sign(
      { email, purpose: 'director-register' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token: tempToken
    });
  } catch (error) {
    console.error('Verify Director Register OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP'
    });
  }
};

// =====================================================================
// COMPLETE DIRECTOR REGISTRATION
// =====================================================================
// =====================================================================
// COMPLETE DIRECTOR REGISTRATION — SAVE AS PENDING FOR ADMIN APPROVAL
// =====================================================================
exports.completeDirectorRegistration = async (req, res) => {
  try {
    const { email, password, token } = req.body;

    if (!email || !password || !token) {
      return res.status(400).json({
        success: false,
        message: 'Email, password and token are required'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token. Please start registration again.'
      });
    }

    if (decoded.purpose !== 'director-register' || decoded.email !== email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const registration = global.directorRegistrations?.[email];
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'Registration session expired. Please start again.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      delete global.directorRegistrations[email];
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if already pending
    const existingPending = await PendingRegistration.findOne({ email });
    if (existingPending) {
      delete global.directorRegistrations[email];
      return res.status(400).json({
        success: false,
        message: 'Registration request already pending admin approval'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Save as pending registration instead of creating user directly
    const pendingReg = await PendingRegistration.create({
      name: registration.name,
      email: registration.email,
      passwordHash: hashedPassword,
      role: 'DIRECTOR',
      campus: registration.college,
      phone: registration.phone,
      employeeId: registration.employeeId,
      otp: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    delete global.directorRegistrations[email];

    // Notify admins
    const admins = await User.find({ role: 'ADMIN' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: 'New Director Registration Pending',
        message: `${registration.name} has registered as Director. Please review and approve.`,
        type: 'DIRECTOR_PENDING',
        isRead: false
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Director registration submitted. Awaiting admin approval.',
      data: {
        email: pendingReg.email,
        name: pendingReg.name,
        status: 'PENDING_APPROVAL'
      }
    });
  } catch (error) {
    console.error('Complete Director Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete Director registration'
    });
  }
};

// =====================================================================
// RESEND HOD REGISTER OTP - FIXED
// =====================================================================
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const registration = global.hodRegistrations?.[email];
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'No registration session found. Please start again.'
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    registration.otp = otp;
    registration.otpExpiry = otpExpiry.getTime();
    registration.expiry = Date.now() + 10 * 60 * 1000;

    const emailSent = await sendOtpEmail({ toEmail: email, toName: registration.name, otp, expiryMinutes: 10 });
    console.log(`HOD Registration OTP resent for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: emailSent ? 'OTP resent successfully' : 'OTP delivery failed. Please contact your administrator.',
      data: { emailSent },
    });

  } catch (error) {
    console.error('Resend HOD Register OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to resend OTP'
    });
  }
};