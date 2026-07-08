const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotification } = require('../config/firebase');

/**
 * Creates an in-app notification document AND fires an FCM push (if the user has a token).
 * type ∈ LEAVE_SUBMITTED | FACULTY_APPROVED | FACULTY_REJECTED | HOD_APPROVED | HOD_REJECTED | GENERAL
 */
async function notifyUser({ userId, leaveRequestId, title, message, type }) {
  await Notification.create({
    user: userId,
    leaveRequest: leaveRequestId || undefined,
    title,
    message,
    type,
  });

  const user = await User.findById(userId);
  if (user && user.fcmToken) {
    await sendPushNotification(user.fcmToken, title, message, {
      type,
      leaveRequestId: String(leaveRequestId || ''),
    });
  }
}

module.exports = { notifyUser };
