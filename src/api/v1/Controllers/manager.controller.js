import Task from "../Models/task.js";
import User from "../Models/user.js";
import Trainee from "../Models/trainee.js";
import Attendance from "../Models/attendance.js";
import logger from "../../../helper/logger.js";

// GET /api/v1/manager/interns — my interns
export const getMyInterns = async (req, res) => {
  try {
    const trainees = await Trainee.findAll({
      where: { manager_id: req.user.id },
      include: [{ model: User, attributes: ["id", "name", "email", "phone"] }],
    });
    return res.status(200).json({ success: true, data: trainees });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/manager/tasks — tasks I created
export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { assigned_by: req.user.id },
      include: [{ model: User, as: "assignee", attributes: ["id", "name", "email"] }],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// POST /api/v1/manager/tasks — create task
export const createTask = async (req, res) => {
  try {
    const { title, description, assigned_to, project_id, start_date, due_date, priority, tech_stack } = req.body;

    if (!title || !assigned_to || !due_date || !project_id) {
      return res.status(400).json({ success: false, message: "title, assigned_to, project_id and due_date are required" });
    }

    const trainee = await Trainee.findOne({ where: { user_id: assigned_to, manager_id: req.user.id } });
    if (!trainee) {
      return res.status(403).json({ success: false, message: "You can only assign tasks to your own interns" });
    }

    const task = await Task.create({
      title, description,
      assigned_to, assigned_by: req.user.id,
      project_id,
      start_date: start_date || new Date(),
      due_date,
      priority: priority || "medium",
      tech_stack, status: "todo",
    });

    return res.status(201).json({ success: true, message: "Task created", data: task });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// PUT /api/v1/manager/tasks/:id — update task
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, assigned_by: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: "Task not found or not yours" });

    const { title, description, due_date, priority, status, completion_percentage, tech_stack } = req.body;
    await task.update({
      title:                 title                 ?? task.title,
      description:           description           ?? task.description,
      due_date:              due_date              ?? task.due_date,
      priority:              priority              ?? task.priority,
      status:                status                ?? task.status,
      completion_percentage: completion_percentage ?? task.completion_percentage,
      tech_stack:            tech_stack            ?? task.tech_stack,
    });

    return res.status(200).json({ success: true, message: "Task updated", data: task });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// DELETE /api/v1/manager/tasks/:id — delete task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, assigned_by: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: "Task not found or not yours" });

    await task.destroy();
    return res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// POST /api/v1/manager/leaves — assign leave to intern
export const assignLeave = async (req, res) => {
  try {
    const { trainee_user_id, leave_date, remarks } = req.body;
    if (!trainee_user_id || !leave_date) {
      return res.status(400).json({ success: false, message: "trainee_user_id and leave_date are required" });
    }

    const trainee = await Trainee.findOne({ where: { user_id: trainee_user_id, manager_id: req.user.id } });
    if (!trainee) return res.status(403).json({ success: false, message: "Intern not under your supervision" });

    const [record, created] = await Attendance.findOrCreate({
      where: { trainee_id: trainee.id, attendance_date: leave_date },
      defaults: { status: "on_leave", remarks: remarks || "Leave approved by manager" },
    });

    if (!created) await record.update({ status: "on_leave", remarks: remarks || "Leave approved by manager" });

    return res.status(200).json({ success: true, message: `Leave assigned for ${leave_date}`, data: record });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/manager/leaves/:trainee_user_id — view intern's leaves
export const getInternLeaves = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.params.trainee_user_id, manager_id: req.user.id } });
    if (!trainee) return res.status(404).json({ success: false, message: "Intern not under your supervision" });

    const leaves = await Attendance.findAll({
      where: { trainee_id: trainee.id, status: "on_leave" },
      order: [["attendance_date", "DESC"]],
    });

    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};