import express from 'express';
import authController from '../Controllers/auth.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.get('/me', authenticate, authController.me);
router.post('/logout', authController.logout);

export default router;
