const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: {
      type: String,
      enum: ['Medical', 'Personal', 'Family Function', 'Emergency', 'Other'],
      required: true,
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    attachmentUrl: { type: String },
    emergencyContact: { type: String, required: true },

    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hod: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    facultyStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    hodStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    overallStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },

    facultyRemark: { type: String },
    hodRemark: { type: String },

    appliedOn: { type: Date, default: Date.now },
    facultyReviewedAt: { type: Date },
    hodReviewedAt: { type: Date },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ student: 1, overallStatus: 1 });
leaveRequestSchema.index({ faculty: 1, facultyStatus: 1 });
leaveRequestSchema.index({ hod: 1, hodStatus: 1 });
leaveRequestSchema.index({ fromDate: 1, toDate: 1 });

leaveRequestSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
