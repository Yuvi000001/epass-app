const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['LEAVE_SUBMITTED', 'FACULTY_APPROVED', 'FACULTY_REJECTED', 'HOD_APPROVED', 'HOD_REJECTED', 'GENERAL'],
      default: 'GENERAL',
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });

notificationSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
