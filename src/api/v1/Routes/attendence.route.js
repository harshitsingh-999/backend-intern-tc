import express from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { checkIn, checkOut, getTodayAttendance, getAttendanceHistory } from "../Controllers/attendence.controller.js";

const router = express.Router();

router.use(authenticate); // all routes require login

router.post("/checkin",   checkIn);
router.post("/checkout",  checkOut);
router.get("/today",      getTodayAttendance);
router.get("/history",    getAttendanceHistory);

export default router;