const mongoose = require('mongoose');

const epassSchema = new mongoose.Schema({
  leaveRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest', required: true, unique: true },
  passId: { type: String, required: true, unique: true },
  qrCodeUrl: { type: String },
  pdfUrl: { type: String },
  issuedAt: { type: Date, default: Date.now },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
});

epassSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Epass', epassSchema);
