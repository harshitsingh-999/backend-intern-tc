import express from "express";
import { authenticate, checkInternExpiry } from "../../../middlewares/auth.middleware.js";
import { requireRole } from "../../../middlewares/role.middleware.js";
import { checkIn, checkOut, getTodayAttendance, getAttendanceHistory } from "../Controllers/attendence.controller.js";

const router = express.Router();

router.use(authenticate, requireRole(4), checkInternExpiry);

router.post("/checkin",   checkIn);
router.post("/checkout",  checkOut);
router.get("/today",      getTodayAttendance);
router.get("/history",    getAttendanceHistory);

export default router;