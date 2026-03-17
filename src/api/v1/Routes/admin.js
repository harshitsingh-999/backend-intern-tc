import express from 'express';
import adminController from '../Controllers/adminController.js';

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

// Roles (for dropdowns in frontend)
router.get('/roles', authenticate, requireAdmin, adminController.getRoles);

export default router;