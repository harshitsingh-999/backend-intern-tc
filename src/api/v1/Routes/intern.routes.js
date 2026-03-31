// import express from "express";
// import { authenticate } from "../../../middlewares/auth.middleware.js";
// import { getInternTasks, submitTaskProgress } from "../Controllers/manager.controller.js";

// const router = express.Router();

// router.use(authenticate);

// router.get("/tasks",      getInternTasks);
// router.put("/tasks/:id",  submitTaskProgress);

// export default router;



import express from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { requireRole } from "../../../middlewares/role.middleware.js";
// import { getMyAssignedTasks, submitAssignedTask } from "../Controllers/intern.controller.js";
import { getMyAssignedTasks, submitAssignedTask, getMyEvaluations, getMyProfile, updateMyProfile, applyLeave, getMyLeaves, cancelLeave, getLeaveBalance, getMyRecentSubmissions } from '../Controllers/intern.controller.js'
import { submitDailyReport, getMyDailyReports } from '../Controllers/dailyreport.controller.js';
import { getMyProfileChangeRequests } from '../Controllers/profileChangeRequest.controller.js';
import { uploadDocument, getMyDocuments } from '../Controllers/internDocument.controller.js';
import { uploadDocument as uploadMiddleware } from '../../../middlewares/upload.js';


const router = express.Router();

// Intern-only routes
router.use(authenticate, requireRole(4));

router.get("/tasks", getMyAssignedTasks);
router.post("/tasks/:id/submit", submitAssignedTask);
router.get("/evaluations", getMyEvaluations);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.get("/profile-changes", getMyProfileChangeRequests);
router.post("/leaves", applyLeave);
router.get("/leaves", getMyLeaves);
router.delete("/leaves/:id", cancelLeave);
router.get("/leave-balance", getLeaveBalance);
router.get("/recent-submissions", getMyRecentSubmissions);
router.post('/daily-report', submitDailyReport);
router.get('/daily-reports', getMyDailyReports);
router.post('/documents', uploadMiddleware.single('document'), uploadDocument);
router.get('/documents', getMyDocuments);



export default router;
