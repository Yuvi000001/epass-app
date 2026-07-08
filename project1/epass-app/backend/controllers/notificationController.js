const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');

// GET /api/v1/notifications?unreadOnly=true
const getNotifications = asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unreadOnly === 'true';
  const query = { user: req.user._id };
  if (unreadOnly) query.isRead = false;

  const notifications = await Notification.find(query).sort({ createdAt: -1 });
  res.json({ success: true, data: notifications.map((n) => n.toJSON()) });
});

// PUT /api/v1/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { isRead: true });
  res.json({ success: true, message: 'Notification marked as read' });
});

// GET /api/v1/notifications/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, data: { count } });
});

module.exports = { getNotifications, markAsRead, getUnreadCount };
