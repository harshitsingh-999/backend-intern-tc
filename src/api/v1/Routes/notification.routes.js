import express from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { getMyNotifications, markAsRead, markAllAsRead } from '../Controllers/notification.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);


export default router;