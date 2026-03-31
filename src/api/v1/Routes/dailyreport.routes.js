import express from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { submitDailyReport, getManagerReports } from '../Controllers/dailyreport.controller.js';

const router = express.Router();

router.post('/submit', authenticate, submitDailyReport);

// 👇 ADD THIS LINE HERE
router.get('/manager/reports', authenticate, getManagerReports);

export default router;