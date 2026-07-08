// =====================================================================
// backend/controllers/hodAuthController.js
// HOD Authentication Controller - Complete
// =====================================================================

const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
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
// HOD REGISTER - SEND OTP
// =====================================================================
exports.sendHodRegisterOtp = async (req, res) => {
  try {
    const { name, employeeId, department, college, phone, email } = req.body;

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
      message: emailSent ? 'OTP sent successfully' : 'OTP delivery failed. Please contact your administrator.',
      emailSent,
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
// HOD REGISTER - VERIFY OTP
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
// HOD REGISTER - CREATE ACCOUNT
// =====================================================================
exports.createHodAccount = async (req, res) => {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: registration.name,
      email: registration.email,
      password: hashedPassword,
      role: 'HOD',
      department: registration.department,
      phone: registration.phone,
      employeeId: registration.employeeId,
      college: registration.college,
      isActive: true,
      isEmailVerified: true
    });

    delete global.hodRegistrations[email];

    const jwtToken = generateToken(user._id);

    await Notification.create({
      userId: user._id,
      title: 'Welcome HOD! 🎉',
      message: `Welcome ${user.name}! You have been successfully registered as Head of Department for ${user.department} department.`,
      type: 'ACCOUNT_CREATED',
      isRead: false
    });

    return res.status(201).json({
      success: true,
      message: 'HOD account created successfully',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });

  } catch (error) {
    console.error('Create HOD Account Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create HOD account'
    });
  }
};

// =====================================================================
// HOD LOGIN - SEND OTP
// =====================================================================
exports.sendHodLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email, role: 'HOD' });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No HOD account found with this email'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact admin.'
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (!global.hodLoginOtps) {
      global.hodLoginOtps = {};
    }

    const now = Date.now();
    Object.keys(global.hodLoginOtps).forEach(key => {
      if (global.hodLoginOtps[key].expiry < now) {
        delete global.hodLoginOtps[key];
      }
    });

    global.hodLoginOtps[email] = {
      otp,
      otpExpiry: otpExpiry.getTime(),
      expiry: Date.now() + 10 * 60 * 1000
    };

    const emailSent = await sendOtpEmail({ toEmail: email, toName: email, otp, expiryMinutes: 10 });
    console.log(`HOD Login OTP for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: emailSent ? 'OTP sent successfully' : 'OTP delivery failed. Please contact your administrator.',
      emailSent,
    });

  } catch (error) {
    console.error('Send HOD Login OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
};

// =====================================================================
// HOD LOGIN - VERIFY OTP
// =====================================================================
exports.verifyHodLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const otpData = global.hodLoginOtps?.[email];
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'OTP session expired. Please request a new OTP.'
      });
    }

    if (Date.now() > otpData.otpExpiry) {
      delete global.hodLoginOtps[email];
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    const user = await User.findOne({ email, role: 'HOD' });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'HOD account not found'
      });
    }

    delete global.hodLoginOtps[email];

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });

  } catch (error) {
    console.error('Verify HOD Login OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP'
    });
  }
};

// =====================================================================
// HOD PASSWORD LOGIN
// =====================================================================
exports.hodPasswordLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email, role: 'HOD' });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact admin.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });

  } catch (error) {
    console.error('HOD Password Login Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

// =====================================================================
// HOD - GET DEPARTMENT LEAVES
// =====================================================================
exports.getDepartmentLeaves = async (req, res) => {
  try {
    const hodId = req.user.id;
    const hod = await User.findById(hodId);
    
    if (!hod) {
      return res.status(404).json({
        success: false,
        message: 'HOD not found'
      });
    }

    const students = await User.find({
      role: 'STUDENT',
      department: hod.department,
      isActive: true
    }).select('_id');

    const studentIds = students.map(s => s._id);

    const leaves = await LeaveRequest.find({
      studentId: { $in: studentIds }
    })
    .populate('studentId', 'name email phone profile')
    .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });

  } catch (error) {
    console.error('Get Department Leaves Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch department leaves'
    });
  }
};

// =====================================================================
// HOD - APPROVE LEAVE
// =====================================================================
exports.approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const hodId = req.user.id;

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    const hod = await User.findById(hodId);
    if (!hod || hod.department !== leave.department) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this leave'
      });
    }

    if (leave.hodApproval) {
      return res.status(400).json({
        success: false,
        message: 'Leave already approved by HOD'
      });
    }

    leave.hodApproval = true;
    leave.hodApprovalDate = new Date();
    leave.hodApprovedBy = hodId;

    if (leave.parentApproval && leave.facultyApproval && leave.hodApproval) {
      leave.status = 'approved';
      leave.overall_status = 'Approved';
    } else {
      leave.status = 'pending';
      leave.overall_status = 'Pending';
    }

    await leave.save();

    await Notification.create({
      userId: leave.studentId,
      title: 'Leave Approved by HOD',
      message: `Your leave request has been approved by HOD.`,
      type: 'APPROVED',
      isRead: false,
      referenceId: leave._id,
      referenceType: 'LeaveRequest'
    });

    return res.status(200).json({
      success: true,
      message: 'Leave approved successfully',
      data: leave
    });

  } catch (error) {
    console.error('HOD Approve Leave Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve leave'
    });
  }
};

// =====================================================================
// HOD - REJECT LEAVE
// =====================================================================
exports.rejectLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { remark } = req.body;
    const hodId = req.user.id;

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    const hod = await User.findById(hodId);
    if (!hod || hod.department !== leave.department) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this leave'
      });
    }

    leave.hodApproval = false;
    leave.status = 'rejected';
    leave.overall_status = 'Rejected';
    leave.hodRejectionReason = remark || 'Rejected by HOD';
    leave.hodRejectedBy = hodId;
    leave.hodRejectionDate = new Date();

    await leave.save();

    await Notification.create({
      userId: leave.studentId,
      title: 'Leave Rejected by HOD',
      message: `Your leave request has been rejected by HOD. ${remark ? 'Reason: ' + remark : ''}`,
      type: 'REJECTED',
      isRead: false,
      referenceId: leave._id,
      referenceType: 'LeaveRequest'
    });

    return res.status(200).json({
      success: true,
      message: 'Leave rejected successfully',
      data: leave
    });

  } catch (error) {
    console.error('HOD Reject Leave Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject leave'
    });
  }
};

// =====================================================================
// HOD - GET DASHBOARD STATS
// =====================================================================
exports.getDashboardStats = async (req, res) => {
  try {
    const hodId = req.user.id;
    const hod = await User.findById(hodId);
    
    if (!hod) {
      return res.status(404).json({
        success: false,
        message: 'HOD not found'
      });
    }

    const students = await User.find({
      role: 'STUDENT',
      department: hod.department,
      isActive: true
    }).select('_id');

    const studentIds = students.map(s => s._id);

    const totalLeaves = await LeaveRequest.countDocuments({
      studentId: { $in: studentIds }
    });

    const pendingLeaves = await LeaveRequest.countDocuments({
      studentId: { $in: studentIds },
      status: 'pending'
    });

    const approvedLeaves = await LeaveRequest.countDocuments({
      studentId: { $in: studentIds },
      status: 'approved'
    });

    const rejectedLeaves = await LeaveRequest.countDocuments({
      studentId: { $in: studentIds },
      status: 'rejected'
    });

    return res.status(200).json({
      success: true,
      data: {
        totalStudents: students.length,
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        department: hod.department
      }
    });

  } catch (error) {
    console.error('HOD Dashboard Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard stats'
    });
  }
};

// =====================================================================
// ALIASES FOR AUTH ROUTES (IMPORTANT - Fixes the error)
// =====================================================================

// These are used in authRoutes.js for HOD login
exports.sendHodOtp = exports.sendHodLoginOtp;
exports.verifyHodOtp = exports.verifyHodLoginOtp;