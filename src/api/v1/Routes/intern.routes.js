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
import { getMyAssignedTasks, submitAssignedTask, getMyEvaluations, getMyProfile, updateMyProfile, applyLeave, getMyLeaves, cancelLeave, getLeaveBalance } from '../Controllers/intern.controller.js'


const router = express.Router();

// Intern-only routes
router.use(authenticate, requireRole(4));

router.get("/tasks", getMyAssignedTasks);
router.post("/tasks/:id/submit", submitAssignedTask);
router.get("/evaluations", getMyEvaluations);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.post("/leaves", applyLeave);
router.get("/leaves", getMyLeaves);
router.delete("/leaves/:id", cancelLeave);
router.get("/leave-balance", getLeaveBalance);


// ---

// ## Final checklist in order
// ```
// 1. npm install recharts                     → frontend folder terminal
// 2. Charts.jsx                               → create new file in frontend/src/pages/
// 3. Dashboard.jsx                            → 4 edits (import, 2 states, useEffect, chart cards)
// 4. manager.jsx                              → 4 edits (4 states, submitEvaluation fn, evaluate button in li, modal at bottom)
// 5. interntask.jsx                           → 3 edits (state, fetch in useEffect, evaluations section at bottom)
// 6. manager.controller.js                    → 2 edits (Evaluation import, 2 functions at bottom)
// 7. manager.routes.js                        → 2 edits (update import, 2 new routes)
// 8. intern.controller.js                     → 2 edits (2 imports, 1 function at bottom)
// 9. intern.routes.js                         → 2 edits (update import, 1 new route)

export default router;
