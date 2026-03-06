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
import { getMyAssignedTasks, submitAssignedTask } from "../Controllers/intern.controller.js";

const router = express.Router();

// Intern-only routes
router.use(authenticate, requireRole(4));

router.get("/tasks", getMyAssignedTasks);
router.post("/tasks/:id/submit", submitAssignedTask);

export default router;
