import User from "../Models/user.js";
import Role from "../Models/role.js";
import Department from "../Models/department.js";
import Trainee from "../Models/trainee.js";


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