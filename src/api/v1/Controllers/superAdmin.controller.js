import User from "../Models/user.js";
import Role from "../Models/role.js";
import Department from "../Models/department.js";
import Trainee from "../Models/trainee.js";
import Task from "../Models/task.js";
import Project from "../Models/project.js";
import Evaluation from "../Models/evaluation.js";
import Attendance from "../Models/attendance.js";
import SystemSetting from "../Models/systemSetting.js";
import logger from "../../../helper/logger.js";

// 1️⃣ Get All Admins
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role_id: 1 },
      include: [{ model: Role, attributes: ["role_name"] }]
    });

    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 2️⃣ Create Admin
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, dept_id } = req.body;

    const admin = await User.create({
      name,
      email,
      password,
      role_id: 1,
      dept_id
    });

    res.json({
      message: "Admin created successfully",
      admin
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 3️⃣ Get All Departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 4️⃣ Assign Admin to Department
export const assignAdminDepartment = async (req, res) => {
  try {
    const { admin_id, dept_id } = req.body;

    const admin = await User.update(
      { dept_id },
      { where: { id: admin_id } }
    );

    res.json({
      message: "Admin assigned to department successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 5️⃣ Dashboard
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
      departments: deptCount
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 6️⃣ Get All Trainees
export const getAllTrainees = async (req, res) => {
  try {

    const trainees = await Trainee.findAll();

    res.json(trainees);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7️⃣ Get All Tasks (for Override Decisions)
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name'] },
        { model: User, as: 'assigner', attributes: ['id', 'name'] }
      ]
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9️⃣ Get All System Settings
export const getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll();
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔟 Bulk Update/Upsert System Settings
export const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: "Settings must be an array" });
    }

    for (const item of settings) {
      if (!item.key) continue;
      await SystemSetting.upsert({
        key: item.key,
        value: item.value?.toString() || "",
        category: item.category || 'general'
      });
    }

    res.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8️⃣ Override Task Status
export const overrideTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await task.update({ status });
    res.json({ success: true, message: "Task status overridden successfully", data: task });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 1️⃣1️⃣ Export All System Data
export const exportSystemData = async (req, res) => {
  try {
    const data = {
      users: await User.findAll({ raw: true }),
      roles: await Role.findAll({ raw: true }),
      departments: await Department.findAll({ raw: true }),
      trainees: await Trainee.findAll({ raw: true }),
      projects: await Project.findAll({ raw: true }),
      tasks: await Task.findAll({ raw: true }),
      evaluations: await Evaluation.findAll({ raw: true }),
      attendance: await Attendance.findAll({ raw: true }),
      system_settings: await SystemSetting.findAll({ raw: true }),
      exported_at: new Date().toISOString()
    };

    res.json({ success: true, data });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};