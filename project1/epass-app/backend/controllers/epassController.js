const asyncHandler = require('../utils/asyncHandler');
const Epass = require('../models/Epass');
const LeaveRequest = require('../models/LeaveRequest');
const generatePassId = require('../utils/generatePassId');
const { generateQrCode } = require('../services/qrService');
const { generateEpassPdf } = require('../services/pdfService');

/**
 * Core e-pass issuance logic — called internally by hodController.approveRequest.
 * `leave.student` must already be populated with at least name/rollNumber/branch.
 */
async function issueEpass(leave) {
  const existing = await Epass.findOne({ leaveRequest: leave._id });
  if (existing) return existing;

  const passId = generatePassId();
  const qrCodeUrl = await generateQrCode(passId);

  const pdfUrl = await generateEpassPdf({
    passId,
    studentName: leave.student?.name || '',
    rollNumber: leave.student?.rollNumber || '',
    branch: leave.student?.branch || '',
    leaveType: leave.leaveType,
    fromDate: leave.fromDate.toISOString().slice(0, 10),
    toDate: leave.toDate.toISOString().slice(0, 10),
    approvedOn: new Date().toISOString().slice(0, 10),
    qrCodeUrl,
  });

  return Epass.create({
    leaveRequest: leave._id,
    passId,
    qrCodeUrl,
    pdfUrl,
    validFrom: leave.fromDate,
    validTo: leave.toDate,
  });
}

// GET /api/v1/epass/:leaveRequestId
const getEpass = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.leaveRequestId);
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

  if (leave.overallStatus !== 'Approved') {
    return res.status(404).json({ success: false, message: 'E-Pass not available — leave not yet fully approved' });
  }

  const epass = await Epass.findOne({ leaveRequest: leave._id });
  if (!epass) return res.status(404).json({ success: false, message: 'E-Pass not found' });

  res.json({ success: true, data: epass.toJSON() });
});

// GET /api/v1/epass/:leaveRequestId/download
const downloadEpass = asyncHandler(async (req, res) => {
  const epass = await Epass.findOne({ leaveRequest: req.params.leaveRequestId });
  if (!epass) return res.status(404).json({ success: false, message: 'E-Pass not found' });
  res.redirect(epass.pdfUrl);
});

function isWithinValidity(epass) {
  const now = new Date();
  const endOfDay = new Date(epass.validTo);
  endOfDay.setHours(23, 59, 59, 999);
  return now >= epass.validFrom && now <= endOfDay;
}

// GET /api/v1/epass/verify/:passId — public, no auth — used by the QR code itself
const verifyEpass = asyncHandler(async (req, res) => {
  const epass = await Epass.findOne({ passId: req.params.passId });
  if (!epass) return res.status(404).json({ success: false, message: 'Invalid or unknown pass' });

  const leave = await LeaveRequest.findById(epass.leaveRequest).populate('student', 'name rollNumber branch profileImageUrl');

  res.json({
    success: true,
    data: {
      passId: epass.passId,
      isCurrentlyValid: isWithinValidity(epass),
      studentName: leave?.student?.name,
      rollNumber: leave?.student?.rollNumber,
      branch: leave?.student?.branch,
      studentPhoto: leave?.student?.profileImageUrl,
      leaveType: leave?.leaveType,
      validFrom: epass.validFrom,
      validTo: epass.validTo,
    },
  });
});

module.exports = { issueEpass, getEpass, downloadEpass, verifyEpass, isWithinValidity };
