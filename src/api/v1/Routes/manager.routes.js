import express from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { requireManager } from "../../../middlewares/role.middleware.js";
import {
  getMyInterns,
  getMyTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskSubmissions,
  assignLeave,
  getInternLeaves,
  getAllInterns,
  getDashboardStats,
  createIntern
} from "../Controllers/manager.controller.js";

const router = express.Router();

router.use(authenticate, requireManager);

router.get("/interns", getMyInterns);
router.get("/tasks", getMyTasks);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);
router.get("/tasks/:id/submissions", getTaskSubmissions);
router.post("/leaves", assignLeave);
router.get("/leaves/:trainee_user_id", getInternLeaves);
router.get("/all-interns", getAllInterns);
router.get("/stats", getDashboardStats);
router.post("/interns", createIntern);

export default router;
