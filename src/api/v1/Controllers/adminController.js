import User from '../Models/user.js';
import Trainee from '../Models/trainee.js';
import Department from '../Models/department.js';
import Task from '../Models/task.js';
import Role from '../Models/role.js';
import logger from '../../../helper/logger.js';
import bcrypt from 'bcryptjs';
// import { error } from 'winston';

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────
const dashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTrainees,
      totalDepartments,
      pendingTasks,
      completedTasks,
      totalTasks
    ] = await Promise.all([
      User.count(),
      Trainee.count(),
      Department.count(),
      Task.count({ where: { status: 'pending' } }),
      Task.count({ where: { status: 'completed' } }),
      Task.count()
    ]);

    const taskCompletionRate = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTrainees,
        totalDepartments,
        pendingTasks,
        completedTasks,
        totalTasks,
        taskCompletionRate: `${taskCompletionRate}%`
      },
      message: "Dashboard metrics fetched"
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error fetching dashboard metrics", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET ALL USERS
// ─────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Role, attributes: ['id', 'role_name'] },
        { model: Department, attributes: ['id', 'dept_name'] }
      ]
    });
    const normalizedUsers = users.map((user) => {
      const plainUser = user.toJSON();
      return {
        ...plainUser,
        role: plainUser.role?.role_name || null,
        department: plainUser.department?.dept_name || null
      };
    });

    res.json({ success: true, users: normalizedUsers, message: "Users fetched successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET SINGLE USER
// ─────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role }]
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found", error: error.message });
    res.json({ success: true, user, message: "User fetched successfully", error: error.message });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error fetching user", error: error.message });
  }
};

// ─────────────────────────────────────────────
// CREATE USER
// ─────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { name, email, password, role_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role_id: role_id || 4
    });

    res.status(201).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role_id: user.role_id },
      message: "User created successfully"
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error creating user", error: error.message  });
  }
};

// ─────────────────────────────────────────────
// UPDATE USER
// ─────────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role_id } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found",error: error.message });

    await user.update({ name, email, role_id });

    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error updating user", error: error.message });
  }
};

// ─────────────────────────────────────────────
// DEACTIVATE USER
// ─────────────────────────────────────────────
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found", error: error.message  });

    // Prevent admin from deactivating themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account", error: error.message });
    }

    await user.update({ is_active: false });
    res.json({ success: true, message: "User deactivated successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error deactivating user", error: error.message });
  }
};

// ─────────────────────────────────────────────
// REACTIVATE USER
// ─────────────────────────────────────────────
const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found", error: error.message  });

    await user.update({ is_active: true });
    res.json({ success: true, message: "User reactivated successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error reactivating user", error: error.message });
  }
};

// ─────────────────────────────────────────────
// ASSIGN ROLE
// ─────────────────────────────────────────────
const assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    if (!role_id) {
      return res.status(400).json({ success: false, message: "role_id is required", error: error.message });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found", error: error.message });

    const role = await Role.findByPk(role_id);
    if (!role) return res.status(404).json({ success: false, message: "Role not found", error: error.message });

    await user.update({ role_id });
    res.json({ success: true, message: `Role updated to ${role.role_name}` });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error assigning role" ,error: error.message});
  }
};

// ─────────────────────────────────────────────
// GET ALL TRAINEES
// ─────────────────────────────────────────────
const getTrainees = async (req, res) => {
  try {
    const trainees = await Trainee.findAll({
      include: [{ model: User, attributes:{exclude:['password']} }]
    });
    res.json({ success: true, trainees, message: "Trainees fetched successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error fetching trainees", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET ALL ROLES (for dropdowns)
// ─────────────────────────────────────────────
const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json({ success: true, roles, message: "Roles fetched successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error fetching roles", error: error.message });
  }
};

export default {
  dashboard,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  assignRole,
  getTrainees,
  getRoles
};
