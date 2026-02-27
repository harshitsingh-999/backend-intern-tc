import express from 'express';
import authController from '../Controllers/auth.controller.js';

const router = express.Router();

// ---------------- Authentication Routes ----------------

router.post('/login', authController.login);   

export default router;
