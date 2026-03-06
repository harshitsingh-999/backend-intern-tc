import Attendance from "../Models/attendance.js";
import Trainee from "../Models/trainee.js";
import logger from "../../../helper/logger.js";

// Helper — get current time as HH:MM:SS
const getCurrentTime = () => new Date().toTimeString().split(" ")[0];
const getCurrentDate = () => new Date().toISOString().split("T")[0];

// POST /api/v1/attendance/checkin
export const checkIn = async (req, res) => {
  try {
    // Find trainee record for this logged-in user
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });
    if (!trainee) {
      return res.status(404).json({ success: false, message: "Trainee record not found for your account" });
    }

    const today = getCurrentDate();

    // Check if already checked in today
    const existing = await Attendance.findOne({
      where: { trainee_id: trainee.id, attendance_date: today },
    });

    if (existing) {
      if (existing.check_in_time) {
        return res.status(400).json({
          success: false,
          message: "You have already checked in today",
          data: existing,
        });
      }
    }

    // Create or update attendance record with check-in time
    const [record] = await Attendance.upsert({
      trainee_id:      trainee.id,
      attendance_date: today,
      check_in_time:   getCurrentTime(),
      status:          "present",
    });

    return res.status(200).json({
      success: true,
      message: `Checked in at ${getCurrentTime()}`,
      data: record,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// POST /api/v1/attendance/checkout
export const checkOut = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });
    if (!trainee) {
      return res.status(404).json({ success: false, message: "Trainee record not found for your account" });
    }

    const today = getCurrentDate();

    const record = await Attendance.findOne({
      where: { trainee_id: trainee.id, attendance_date: today },
    });

    if (!record || !record.check_in_time) {
      return res.status(400).json({ success: false, message: "You have not checked in today yet" });
    }

    if (record.check_out_time) {
      return res.status(400).json({
        success: false,
        message: "You have already checked out today",
        data: record,
      });
    }

    await record.update({ check_out_time: getCurrentTime() });

    return res.status(200).json({
      success: true,
      message: `Checked out at ${getCurrentTime()}`,
      data: record,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/attendance/today
export const getTodayAttendance = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });

    // Managers don't have a trainee record — return null gracefully
    if (!trainee) {
      return res.status(200).json({ success: true, data: null });
    }

    const record = await Attendance.findOne({
      where: { trainee_id: trainee.id, attendance_date: getCurrentDate() },
    });

    return res.status(200).json({ success: true, data: record || null });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/attendance/history
export const getAttendanceHistory = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });

    // Managers don't have a trainee record — return empty array gracefully
    if (!trainee) {
      return res.status(200).json({ success: true, data: [] });
    }

    const records = await Attendance.findAll({
      where: { trainee_id: trainee.id },
      order: [["attendance_date", "DESC"]],
      limit: 30,
    });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};