import express from 'express';
import adminController from '../Controllers/adminController.js';
import { getAllDocuments, reviewDocument } from '../Controllers/internDocument.controller.js';
import { getAllProfileChangeRequests, approveProfileChange, rejectProfileChange } from '../Controllers/profileChangeRequest.controller.js';

// ─────────────────────────────────────────────────────
// 🔧 DEVELOPMENT: using mock auth (no login needed)
// 🔀 MERGE DAY: swap the import below:
//   FROM: import adminAuth from '../../../middlewares/mockAdminAuth.js';
//   TO:   import adminAuth from '../../../middlewares/adminAuth.js';
// ─────────────────────────────────────────────────────
// import adminAuth from '../../../middlewares/mockAdminAuth.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../../middlewares/role.middleware.js';

const router = express.Router();

// Dashboard
router.get('/dashboard',authenticate, requireAdmin, adminController.dashboard);

// User Management
router.get('/users', authenticate, requireAdmin, adminController.getUsers);
router.get('/users/:id', authenticate, requireAdmin,adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', authenticate, requireAdmin, adminController.updateUser);
router.patch('/users/:id/deactivate', authenticate, requireAdmin, adminController.deactivateUser);
router.patch('/users/:id/reactivate', authenticate, requireAdmin, adminController.reactivateUser);
router.patch('/users/:id/role', authenticate, requireAdmin, adminController.assignRole);

// Trainees
router.get('/trainees', authenticate, requireAdmin, adminController.getTrainees);
router.patch('/trainees/:id/assign-manager', authenticate, requireAdmin, adminController.assignManager);
router.put('/trainees/:id/assign-manager', authenticate, requireAdmin, adminController.assignManager);
router.patch('/interns/:id/assign-manager', authenticate, requireAdmin, adminController.assignManager);
router.put('/interns/:id/assign-manager', authenticate, requireAdmin, adminController.assignManager);
router.patch('/trainees/:id/extend', authenticate, requireAdmin, adminController.extendTrainee);

// Document Verification
router.get('/documents', authenticate, requireAdmin, getAllDocuments);
router.patch('/documents/:id/review', authenticate, requireAdmin, reviewDocument);

// Profile Change Requests
router.get('/profile-changes', authenticate, requireAdmin, getAllProfileChangeRequests);
router.patch('/profile-changes/:id/approve', authenticate, requireAdmin, approveProfileChange);
router.patch('/profile-changes/:id/reject', authenticate, requireAdmin, rejectProfileChange);

// Roles (for dropdowns in frontend)
router.get('/roles', authenticate, requireAdmin, adminController.getRoles);

export default router;
