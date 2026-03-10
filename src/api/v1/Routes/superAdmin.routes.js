import express from 'express';
import { getAllAdmins,
  createAdmin,
  getDepartments,
  assignAdminDepartment,
  dashboard,
  getAllTrainees } from '../Controllers/superAdmin.controller.js';

const router = express.Router();

router.get('/admins', getAllAdmins);
router.post("/create-admin", createAdmin);

router.get("/departments", getDepartments);

router.put("/assign-admin-department", assignAdminDepartment);

router.get("/dashboard", dashboard);

router.get("/trainees", getAllTrainees);


export default router;