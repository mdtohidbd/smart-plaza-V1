const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');
const {
  buildNotificationQuery,
  getMergedNotificationFeed
} = require('../utils/notificationFeed');

function findAccessibleNotification(req, id) {
  const q = buildNotificationQuery(req);
  return Notification.findOne({ $and: [{ _id: id }, q] });
}

// @desc    Get user notifications (stored + live shop alerts when a shop is selected)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {

  const data = await getMergedNotificationFeed(req, { limit: 50 });
  

  const unreadCount = data.filter((n) => !n.isRead).length;

  res.status(200).json({
    success: true,
    count: data.length,
    unreadCount,
    data
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await findAccessibleNotification(req, req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const match = {
    ...buildNotificationQuery(req),
    isRead: false
  };

  await Notification.updateMany(match, { isRead: true });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await findAccessibleNotification(req, req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Notification removed'
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};