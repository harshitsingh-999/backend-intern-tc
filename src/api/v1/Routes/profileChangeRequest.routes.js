import express from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { requireRole, requireAdmin } from '../../../middlewares/role.middleware.js';
import {
  requestProfileChange,
  getMyProfileChangeRequests,
  getAllProfileChangeRequests,
  approveProfileChange,
  rejectProfileChange
} from '../Controllers/profileChangeRequest.controller.js';

const router = express.Router();

// Intern routes
router.post('/', authenticate, requireRole(4), requestProfileChange);
router.get('/my', authenticate, requireRole(4), getMyProfileChangeRequests);

// Admin routes
router.get('/all', authenticate, requireAdmin, getAllProfileChangeRequests);
router.patch('/:id/approve', authenticate, requireAdmin, approveProfileChange);
router.patch('/:id/reject', authenticate, requireAdmin, rejectProfileChange);

export default router;
