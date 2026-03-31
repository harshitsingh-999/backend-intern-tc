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
  createIntern,
  createEvaluation,
  getEvaluations,
  getPendingLeaveRequests,
  respondToLeaveRequest,
  getInternWorklog,
  assignSelfAsManager,
  getMyProjects,
  createProject,
  getProjectProgress,
  getRecentSubmissions,
  getInternAttendance,
  deleteProject,
} from "../Controllers/manager.controller.js";
import { getInternDailyReports, acknowledgeDailyReport } from '../Controllers/dailyreport.controller.js';

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
router.post("/trainees", createIntern);
router.post("/evaluations",            createEvaluation);
router.get("/evaluations/:trainee_id", getEvaluations);
router.get("/leave-requests",          getPendingLeaveRequests);
router.put("/leave-requests/:id",      respondToLeaveRequest);
router.get("/interns/:trainee_user_id/worklog", getInternWorklog);
router.get("/recent-submissions", getRecentSubmissions);
router.put("/interns/:id/assign-manager", assignSelfAsManager);
router.patch("/interns/:id/assign-manager", assignSelfAsManager);
router.put("/trainees/:id/assign-manager", assignSelfAsManager);
router.patch("/trainees/:id/assign-manager", assignSelfAsManager);
router.get("/interns/:trainee_user_id/attendance", getInternAttendance);


// Project routes (DB table = 'projects', UI label = 'Task' context)
router.get("/projects", getMyProjects);
router.post("/projects", createProject);
router.delete("/projects/:id", deleteProject);
router.get("/project-progress", getProjectProgress);
router.get('/daily-reports', getInternDailyReports);
router.patch('/daily-reports/:id/acknowledge', acknowledgeDailyReport);

export default router;
