import express from 'express';
import { authenticate, checkInternExpiry } from '../../../middlewares/auth.middleware.js';
import { requireRole, requireManager, requireAdmin } from '../../../middlewares/role.middleware.js';
import {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getLeaveBalance,
  getPendingLeaveRequests,
  approveLeave,
  rejectLeave,
  getAllLeaveRequests
} from '../Controllers/leave.controller.js';

const router = express.Router();

// Specific GET routes (must come before generic :id routes)
router.get('/my', authenticate, requireRole(4), checkInternExpiry, getMyLeaves);
router.get('/balance', authenticate, requireRole(4), checkInternExpiry, getLeaveBalance);
router.get('/pending-requests', authenticate, requireManager, getPendingLeaveRequests);
router.get('/all', authenticate, requireAdmin, getAllLeaveRequests);

// Generic ID routes (must come after specific routes)
router.post('/', authenticate, requireRole(4), checkInternExpiry, applyLeave);
router.delete('/:id', authenticate, requireRole(4), checkInternExpiry, cancelLeave);
router.patch('/:id/approve', authenticate, requireManager, approveLeave);
router.patch('/:id/reject', authenticate, requireManager, rejectLeave);

export default router;
