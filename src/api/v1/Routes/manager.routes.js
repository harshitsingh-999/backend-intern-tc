import express from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { requireManager } from "../../../middlewares/role.middleware.js";
import { getMyInterns, getMyTasks, createTask, updateTask, deleteTask, assignLeave, getInternLeaves } from "../Controllers/manager.controller.js";

const router = express.Router();

router.use(authenticate, requireManager); // every route below requires login + manager role

router.get("/interns",                  getMyInterns);
router.get("/tasks",                    getMyTasks);
router.post("/tasks",                   createTask);
router.put("/tasks/:id",                updateTask);
router.delete("/tasks/:id",             deleteTask);
router.post("/leaves",                  assignLeave);
router.get("/leaves/:trainee_user_id",  getInternLeaves);

export default router;