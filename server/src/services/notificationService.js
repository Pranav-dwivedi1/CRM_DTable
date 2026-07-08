const Notification = require('../models/Notification');
const { getIO } = require('../socket');

const createNotification = async ({ companyId, userId, title, message, type }) => {
  try {
    // 1. Create in database
    const notification = await Notification.create({
      companyId,
      userId,
      title,
      message,
      type,
      isRead: false
    });

    // 2. Emit in real-time via Socket.io if initialized
    try {
      const io = getIO();
      io.to(`user:${userId.toString()}`).emit('notification:new', notification);
    } catch (socketError) {
      // Socket.io might not be initialized (e.g. during testing or seeding), ignore gracefully
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification
};
