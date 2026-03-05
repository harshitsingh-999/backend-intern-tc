import express from 'express';
import adminController from '../Controllers/adminController.js';

// ─────────────────────────────────────────────────────
// 🔧 DEVELOPMENT: using mock auth (no login needed)
// 🔀 MERGE DAY: swap the import below:
//   FROM: import adminAuth from '../../../middlewares/mockAdminAuth.js';
//   TO:   import adminAuth from '../../../middlewares/adminAuth.js';
// ─────────────────────────────────────────────────────
import adminAuth from '../../../middlewares/mockAdminAuth.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', adminAuth, adminController.dashboard);

// User Management
router.get('/users', adminAuth, adminController.getUsers);
router.get('/users/:id', adminAuth, adminController.getUserById);
router.post('/users', adminAuth, adminController.createUser);
router.put('/users/:id', adminAuth, adminController.updateUser);
router.patch('/users/:id/deactivate', adminAuth, adminController.deactivateUser);
router.patch('/users/:id/reactivate', adminAuth, adminController.reactivateUser);
router.patch('/users/:id/role', adminAuth, adminController.assignRole);

// Trainees
router.get('/trainees', adminAuth, adminController.getTrainees);

// Roles (for dropdowns in frontend)
router.get('/roles', adminAuth, adminController.getRoles);

export default router;