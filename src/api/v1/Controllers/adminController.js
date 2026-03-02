import User from '../Models/user.js';
import Trainee from '../Models/trainee.js';
import Department from '../Models/department.js';
import Task from '../Models/task.js';

const dashboard = async (req, res) => {
  const metrics = {
    totalUsers: await User.count(),
    totalTrainees: await Trainee.count(),
    totalDepartments: await Department.count(),
    pendingTasks: await Task.count({ where: { status: 'pending' } })
  };
  res.json({ success: true, data: metrics });
};

const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await User.create({ name, email, password, role });
  res.json({ success: true, user });
};

const getUsers = async (req, res) => {
  const users = await User.findAll();
  res.json({ success: true, users });
};

const getTrainees = async (req, res) => {
  const trainees = await Trainee.findAll({ include: [User] });
  res.json({ success: true, trainees });
};

export default {
  dashboard,
  createUser,
  getUsers,
  getTrainees
};

