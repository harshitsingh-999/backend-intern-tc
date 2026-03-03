import User from '../Models/user.js';
import Trainee from '../Models/trainee.js';
import Department from '../Models/department.js';
import Task from '../Models/task.js';
import logger from '../../../helper/logger.js';

const dashboard = async (req, res) => {
  try {
    const metrics = {
      totalUsers: await User.count(),
      totalTrainees: await Trainee.count(),
      totalDepartments: await Department.count(),
      pendingTasks: await Task.count({ where: { status: 'pending' } })
    };
    res.json({ success: true, data: metrics, message: "Dashboard metrics fetched" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error fetching dashboard metrics" });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role_id } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    const user = await User.create({ 
      name, 
      email, 
      password, 
      role_id: role_id || 4 
    });

    res.status(201).json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id
      },
      message: "User created successfully" 
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error creating user" });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: Department, as: 'department' }]
    });
    res.json({ success: true, users, message: "Users fetched successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

const getTrainees = async (req, res) => {
  try {
    const trainees = await Trainee.findAll({ 
      include: [
        { model: User, as: 'user' }
      ]
    });
    res.json({ success: true, trainees, message: "Trainees fetched successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error fetching trainees" });
  }
};

export default {
  dashboard,
  createUser,
  getUsers,
  getTrainees
};

