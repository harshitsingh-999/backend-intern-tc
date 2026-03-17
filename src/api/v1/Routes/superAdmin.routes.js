import express from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';

import { getAllAdmins,
  createAdmin,
  getDepartments,
  assignAdminDepartment,
  dashboard,
  getAllTrainees } from '../Controllers/superAdmin.controller.js';

const router = express.Router();
router.use(authenticate, requireRole(5));

router.get('/admins', getAllAdmins);
router.post("/create-admin", createAdmin);

router.get("/departments", getDepartments);

router.put("/assign-admin-department", assignAdminDepartment);

router.get("/dashboard", dashboard);

router.get("/trainees", getAllTrainees);


export default router;