import express from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { getMyNotifications, markAsRead, markAllAsRead, getNotificationDetail } from '../Controllers/notification.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.get('/:id', getNotificationDetail);
router.patch('/:id/read', markAsRead);


export default router;