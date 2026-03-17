import express from 'express';
import adminUserController from '../Controllers/admin.user.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../../middlewares/role.middleware.js';

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET    /api/v1/admin/users           → get all users
// POST   /api/v1/admin/users           → create user
// GET    /api/v1/admin/users/:id       → get single user
// PUT    /api/v1/admin/users/:id       → update user
// DELETE /api/v1/admin/users/:id       → delete user
// PATCH  /api/v1/admin/users/:id/toggle-status → activate/deactivate

router.get('/',                    adminUserController.getAllUsers);
router.post('/',                   adminUserController.createUser);
router.get('/:id',                 adminUserController.getUserById);
router.put('/:id',                 adminUserController.updateUser);
router.delete('/:id',              adminUserController.deleteUser);
router.patch('/:id/toggle-status', adminUserController.toggleUserStatus);

export default router;