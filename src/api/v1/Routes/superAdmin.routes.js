import express from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';

import { getAllAdmins,
  createAdmin,
  getDepartments,
  assignAdminDepartment,
  dashboard,
  getAllTrainees,
  getAllTasks,
  overrideTaskStatus,
  getSettings,
  updateSettings,
  exportSystemData,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
} from '../Controllers/superAdmin.controller.js';

const router = express.Router();
router.use(authenticate, requireRole(5));

router.get('/admins', getAllAdmins);
router.post("/create-admin", createAdmin);

router.get("/departments", getDepartments);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

router.get("/roles", getAllRoles);
router.post("/roles", createRole);
router.put("/roles/:id", updateRole);
router.delete("/roles/:id", deleteRole);

router.put("/assign-admin-department", assignAdminDepartment);

router.get("/dashboard", dashboard);

router.get("/trainees", getAllTrainees);
router.get("/tasks", getAllTasks);
router.put("/tasks/:id", overrideTaskStatus);

router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.get("/export-data", exportSystemData);

export default router;