const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  campus: { type: String, enum: ['BIST', 'BIRT', 'BIRTS'], required: true },
  role: { type: String, enum: ['STUDENT', 'ADMIN', 'HOD', 'FACULTY', 'GUARD', 'DIRECTOR'], default: 'STUDENT' },
  employeeId: { type: String },
  rollNumber: { type: String, trim: true, default: '' },
  branch: { type: String, trim: true, default: '' },
  college: { type: String, trim: true, default: '' },
  designation: { type: String, trim: true, default: '' },
  assignedGate: { type: String, trim: true, default: '' },
  idCardPhotoUrl: { type: String },
  otp: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  // ✅ HOD extra fields
  phone: { type: String, default: '' },
  department: { type: String, default: '' },
});

pendingRegistrationSchema.index({ email: 1 });
pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);