import bcrypt from "bcryptjs";
import User from "../Models/user.js";
import Role from "../Models/role.js";
import Department from "../Models/department.js";
import Trainee from "../Models/trainee.js";
import Task, { TASK_STATUSES } from "../Models/task.js";
import Project from "../Models/project.js";
import Evaluation from "../Models/evaluation.js";
import Attendance from "../Models/attendance.js";
import SystemSetting from "../Models/systemSetting.js";
import logger from "../../../helper/logger.js";
import sequelize from "../../../config/db.config.js";
import {
  isPositiveInteger,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  normalizeOptionalString,
  parsePositiveInteger,
  toTrimmedString,
} from "../../../validators/validators.js";

const exportTable = async (tableName) => {
  const [rows] = await sequelize.query(`SELECT * FROM \`${tableName}\``);
  return rows;
};

const normalizeSettingItem = (item = {}) => ({
  key: toTrimmedString(item.key),
  value: item.value === undefined || item.value === null ? "" : String(item.value).trim(),
  category: toTrimmedString(item.category) || "general",
  description: normalizeOptionalString(item.description),
});

// Get all admins
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role_id: 1 },
      include: [{ model: Role, attributes: ["role_name"] }],
      attributes: { exclude: ["password"] },
    });

    res.json(admins);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Create admin
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, dept_id } = req.body;

    const normalizedName = toTrimmedString(name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = String(password || "");

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({
        success: false,
        message: "name, email and password are required",
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    if (!isValidPassword(normalizedPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must include @, !, 1 and 2",
      });
    }

    if (dept_id !== undefined && dept_id !== null && dept_id !== "" && !isPositiveInteger(dept_id)) {
      return res.status(400).json({ success: false, message: "dept_id must be a valid numeric id" });
    }

    const existingAdmin = await User.findOne({ where: { email: normalizedEmail } });
    if (existingAdmin) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    let departmentId = null;
    if (dept_id !== undefined && dept_id !== null && dept_id !== "") {
      const department = await Department.findByPk(Number(dept_id));
      if (!department) {
        return res.status(404).json({ success: false, message: "Department not found" });
      }
      departmentId = department.id;
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    const admin = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role_id: 1,
      dept_id: departmentId,
    });

    const { password: _, ...adminData } = admin.toJSON();
    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: adminData,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get all departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({ raw: true });
    res.json({ success: true, data: departments });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Assign admin to department
export const assignAdminDepartment = async (req, res) => {
  try {
    const { admin_id, dept_id } = req.body;

    if (!isPositiveInteger(admin_id) || !isPositiveInteger(dept_id)) {
      return res.status(400).json({
        success: false,
        message: "admin_id and dept_id must be valid numeric ids",
      });
    }

    const admin = await User.findOne({ where: { id: Number(admin_id), role_id: 1 } });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const department = await Department.findByPk(Number(dept_id));
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    await admin.update({ dept_id: department.id });

    res.json({
      success: true,
      message: "Admin assigned to department successfully",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Dashboard
export const dashboard = async (req, res) => {
  try {
    const adminCount = await User.count({ where: { role_id: 1 } });
    const managerCount = await User.count({ where: { role_id: 2 } });
    const traineeCount = await User.count({ where: { role_id: 4 } });
    const deptCount = await Department.count();

    res.json({
      admins: adminCount,
      managers: managerCount,
      trainees: traineeCount,
      departments: deptCount,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get all trainees
export const getAllTrainees = async (req, res) => {
  try {
    const trainees = await Trainee.findAll();
    res.json(trainees);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get all tasks
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, as: "assignee", attributes: ["id", "name"] },
        { model: User, as: "assigner", attributes: ["id", "name"] },
      ],
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all system settings
export const getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll();
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk update/upsert system settings
export const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: "Settings must be an array" });
    }

    for (const rawItem of settings) {
      if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
        return res.status(400).json({
          success: false,
          message: "Each setting must be an object",
        });
      }

      const item = normalizeSettingItem(rawItem);

      if (!item.key) {
        return res.status(400).json({
          success: false,
          message: "Each setting must include a non-empty key",
        });
      }

      if (item.key.length > 100) {
        return res.status(400).json({
          success: false,
          message: `Setting key "${item.key}" exceeds 100 characters`,
        });
      }

      if (item.category.length > 50) {
        return res.status(400).json({
          success: false,
          message: `Category for "${item.key}" exceeds 50 characters`,
        });
      }

      if (item.description && item.description.length > 255) {
        return res.status(400).json({
          success: false,
          message: `Description for "${item.key}" exceeds 255 characters`,
        });
      }

      await SystemSetting.upsert(item);
    }

    res.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Override task status
export const overrideTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isPositiveInteger(id)) {
      return res.status(400).json({ success: false, message: "A valid task id is required" });
    }

    const normalizedStatus = toTrimmedString(status);
    if (!normalizedStatus || !TASK_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of ${TASK_STATUSES.join(", ")}`,
      });
    }

    const task = await Task.findByPk(Number(id));
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await task.update({ status: normalizedStatus });
    res.json({ success: true, message: "Task status overridden successfully", data: task });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export all system data
export const exportSystemData = async (req, res) => {
  try {
    const data = {
      users: await exportTable("users"),
      roles: await exportTable("roles"),
      departments: await exportTable("departments"),
      trainees: await exportTable("trainees"),
      projects: await exportTable("projects"),
      tasks: await exportTable("tasks"),
      evaluations: await exportTable("evaluations"),
      attendance: await exportTable("attendance"),
      system_settings: await exportTable("system_settings"),
      exported_at: new Date().toISOString(),
    };

    const fileName = `system-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.type("application/json");
    res.status(200).send(JSON.stringify({ success: true, data }, null, 2));
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
