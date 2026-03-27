import Notification from '../Models/notification.js';
import responseEmmiter from '../../../helper/response.js';
import logger from '../../../helper/logger.js';

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 30,
    });
    return responseEmmiter(res, { status: 200, data: notifications });
  } catch (error) {
    logger.error(error);
    return responseEmmiter(res, { status: 500, message: 'Internal Server Error' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    await Notification.update({ is_read: true }, { where: { id: req.params.id, user_id: req.user.id } });
    return responseEmmiter(res, { status: 200, message: 'Marked as read.' });
  } catch (error) {
    logger.error(error);
    return responseEmmiter(res, { status: 500, message: 'Internal Server Error' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id } });
    return responseEmmiter(res, { status: 200, message: 'All marked as read.' });
  } catch (error) {
    logger.error(error);
    return responseEmmiter(res, { status: 500, message: 'Internal Server Error' });
  }
};

// Helper — call this from other controllers to push notifications
export const createNotification = async ({ user_id, title, message, type = 'general', link = null }) => {
  try {
    await Notification.create({ user_id, title, message, type, link });
  } catch (error) {
    logger.error('Failed to create notification:', error);
  }
};