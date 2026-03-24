import User from '../Models/user.js';
import Trainee from '../Models/trainee.js';
import Department from '../Models/department.js';
import Task from '../Models/task.js';
import Role from '../Models/role.js';
import logger from '../../../helper/logger.js';
import bcrypt from 'bcryptjs';

const toDateOnly = (value = new Date()) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString().split('T')[0]
    : date.toISOString().split('T')[0];
};

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────
const dashboard = async (req, res) => {
  try {
    const [totalUsers, totalTrainees, totalDepartments, pendingTasks, completedTasks, totalTasks] = await Promise.all([
      User.count(), Trainee.count(), Department.count(),
      Task.count({ where: { status: 'pending' } }),
      Task.count({ where: { status: 'completed' } }),
      Task.count()
    ]);
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    res.json({ success: true, data: { totalUsers, totalTrainees, totalDepartments, pendingTasks, completedTasks, totalTasks, taskCompletionRate: `${taskCompletionRate}%` }, message: "Dashboard metrics fetched" });
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
      return { ...plainUser, role: plainUser.role?.role_name || null, department: plainUser.department?.dept_name || null };
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
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] }, include: [{ model: Role }] });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user, message: "User fetched successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error fetching user", error: error.message });
  }
};

// ─────────────────────────────────────────────
// CREATE USER — Admin cannot create another Admin (role_id 1)
// ─────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { name, email, password, role_id } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    // ── FIX 5: Block admin creation ──
    const parsedRole = parseInt(role_id) || 4;
    if (parsedRole === 1) {
      return res.status(403).json({ success: false, message: "Admin accounts cannot be created through this form. Contact your super admin." });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role_id: parsedRole });
    res.status(201).json({ success: true, user: { id: user.id, name: user.name, email: user.email, role_id: user.role_id }, message: "User created successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error creating user", error: error.message });
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
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
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
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.id === req.user.id) return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
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
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
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
    if (!role_id) return res.status(400).json({ success: false, message: "role_id is required" });
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const role = await Role.findByPk(role_id);
    if (!role) return res.status(404).json({ success: false, message: "Role not found" });
    await user.update({ role_id });
    res.json({ success: true, message: `Role updated to ${role.role_name}` });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error assigning role", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET ALL TRAINEES — raw SQL to avoid Sequelize
// association ambiguity (Trainee has 3 belongsTo User)
// ─────────────────────────────────────────────
const getTrainees = async (req, res) => {
  try {
    const [results] = await Trainee.sequelize.query(`
      SELECT
        CASE
          WHEN t.id IS NULL THEN CONCAT('user-', u.id)
          ELSE CAST(t.id AS CHAR)
        END AS id,
        t.id AS trainee_id,
        u.id AS user_id,
        t.college_name, t.course, t.batch_year,
        t.enrollment_date, t.expected_end_date, COALESCE(t.current_status, 'active') AS current_status,
        t.gpa, t.buddy_id, t.manager_id, t.certifications,
        CASE WHEN t.id IS NULL THEN 0 ELSE 1 END AS has_profile,
        u.id    AS u_id,
        u.name  AS u_name,
        u.email AS u_email,
        u.phone AS u_phone,
        u.is_active AS u_is_active
      FROM users u
      LEFT JOIN trainees t ON t.user_id = u.id
      WHERE u.role_id IN 4
      ORDER BY COALESCE(t.createdAt, u.createdAt) DESC
    `);

    const trainees = results.map(row => ({
      id: row.id,
      trainee_id: row.trainee_id,
      has_profile: Number(row.has_profile) === 1,
      user_id: row.user_id,
      college_name: row.college_name,
      course: row.course, batch_year: row.batch_year,
      enrollment_date: row.enrollment_date, expected_end_date: row.expected_end_date,
      current_status: row.current_status, gpa: row.gpa,
      buddy_id: row.buddy_id, manager_id: row.manager_id, certifications: row.certifications,
      user: { id: row.u_id, name: row.u_name, email: row.u_email, phone: row.u_phone, is_active: row.u_is_active }
    }));

    res.json({ success: true, trainees, message: "Trainees fetched successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Error fetching trainees", error: error.message });
  }
};

// ─────────────────────────────────────────────
// ASSIGN MANAGER TO INTERN (Admin)
// ─────────────────────────────────────────────
const assignManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { manager_id } = req.body;

    if (manager_id) {
      const manager = await User.findOne({ where: { id: manager_id, role_id: 2, is_active: 1 } });
      if (!manager) return res.status(404).json({ success: false, message: 'Manager not found or inactive' });
    }

    let trainee = null;
    let user = null;
    const rawId = String(id || '').trim();

    if (rawId.startsWith('user-')) {
      const userId = Number(rawId.slice(5));
      if (!Number.isInteger(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid intern identifier' });
      }
      trainee = await Trainee.findOne({ where: { user_id: userId } });
      user = await User.findByPk(userId);
    } else if (/^\d+$/.test(rawId)) {
      trainee = await Trainee.findByPk(Number(rawId));
      if (trainee) {
        user = await User.findByPk(trainee.user_id);
      } else {
        const userId = Number(rawId);
        trainee = await Trainee.findOne({ where: { user_id: userId } });
        user = await User.findByPk(userId);
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid intern identifier' });
    }

    if (!trainee) {
      if (!user || ![3, 4].includes(Number(user.role_id))) {
        return res.status(404).json({ success: false, message: 'Intern not found' });
      }

      trainee = await Trainee.create({
        user_id: user.id,
        enrollment_date: toDateOnly(user.createdAt),
        current_status: 'active',
        buddy_id: null,
        manager_id: null,
      });
    }

    await trainee.update({ manager_id: manager_id || null });
    res.json({ success: true, message: manager_id ? 'Manager assigned successfully' : 'Manager removed', data: trainee });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: 'Error assigning manager', error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET ALL ROLES
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

export default { dashboard, getUsers, getUserById, createUser, updateUser, deactivateUser, reactivateUser, assignRole, getTrainees, getRoles, assignManager };


// import User from '../Models/user.js';
// import Trainee from '../Models/trainee.js';
// import Department from '../Models/department.js';
// import Task from '../Models/task.js';
// import Role from '../Models/role.js';
// import logger from '../../../helper/logger.js';
// import bcrypt from 'bcryptjs';
// // import { error } from 'winston';

// // ─────────────────────────────────────────────
// // DASHBOARD STATS
// // ─────────────────────────────────────────────
// const dashboard = async (req, res) => {
//   try {
//     const [
//       totalUsers,
//       totalTrainees,
//       totalDepartments,
//       pendingTasks,
//       completedTasks,
//       totalTasks
//     ] = await Promise.all([
//       User.count(),
//       Trainee.count(),
//       Department.count(),
//       Task.count({ where: { status: 'pending' } }),
//       Task.count({ where: { status: 'completed' } }),
//       Task.count()
//     ]);

//     const taskCompletionRate = totalTasks > 0
//       ? Math.round((completedTasks / totalTasks) * 100)
//       : 0;

//     res.json({
//       success: true,
//       data: {
//         totalUsers,
//         totalTrainees,
//         totalDepartments,
//         pendingTasks,
//         completedTasks,
//         totalTasks,
//         taskCompletionRate: `${taskCompletionRate}%`
//       },
//       message: "Dashboard metrics fetched"
//     });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ success: false, message: "Error fetching dashboard metrics", error: error.message });
//   }
// };

// // ─────────────────────────────────────────────
// // GET ALL USERS
// // ─────────────────────────────────────────────
// const getUsers = async (req, res) => {
//   try {
//     const users = await User.findAll({
//       attributes: { exclude: ['password'] },
//       include: [
//         { model: Role, attributes: ['id', 'role_name'] },
//         { model: Department, attributes: ['id', 'dept_name'] }
//       ]
//     });
//     const normalizedUsers = users.map((user) => {
//       const plainUser = user.toJSON();
//       return {
//         ...plainUser,
//         role: plainUser.role?.role_name || null,
//         department: plainUser.department?.dept_name || null
//       };
//     });

//     res.json({ success: true, users: normalizedUsers, message: "Users fetched successfully" });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
//   }
// };

// // ─────────────────────────────────────────────
// // GET SINGLE USER
// // ─────────────────────────────────────────────
// const getUserById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findByPk(id, {
//       attributes: { exclude: ['password'] },
//       include: [{ model: Role }]
//     });
//     if (!user) return res.status(404).json({ success: false, message: "User not found", error: error.message });
//     res.json({ success: true, user, message: "User fetched successfully", error: error.message });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ success: false, message: "Error fetching user", error: error.message });
//   }
// };

// // ─────────────────────────────────────────────
// // CREATE USER
// // ─────────────────────────────────────────────
// const createUser = async (req, res) => {
//   try {
//     const { name, email, password, role_id } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ success: false, message: "Name, email, and password are required" });
//     }

//     const existingUser = await User.findOne({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({ success: false, message: "User with this email already exists" });
//     }

//     // Hash password before saving
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role_id: role_id || 4
//     });

//     res.status(201).json({
//       success: true,
//       user: { id: user.id, name: user.name, email: user.email, role_id: user.role_id },
//       message: "User created successfully"
//     });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ success: false, message: "Error creating user", error: error.message  });
//   }
// };

// // ─────────────────────────────────────────────
// // UPDATE USER
// // ─────────────────────────────────────────────
// const updateUser = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, email, role_id } = req.body;

//     const user = await User.findByPk(id);
//     if (!user) return res.status(404).json({ success: false, message: "User not found",error: error.message });

//     await user.update({ name, email, role_id });

//     res.json({ success: true, message: "User updated successfully" });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ success: false, message: "Error updating user", error: error.message });
//   }
// };

// // ─────────────────────────────────────────────
// // DEACTIVATE USER
// // ─────────────────────────────────────────────
// const deactivateUser = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const user = await User.findByPk(id);
//     if (!user) return res.status(404).json({ success: false, message: "User not found", error: error.message  });

//     // Prevent admin from deactivating themselves
//     if (user.id === req.user.id) {
//       return res.status(400).json({ success: false, message: "You cannot deactivate your own account", error: error.message });
//     }

//     await user.update({ is_active: false });
//     res.json({ success: true, message: "User deactivated successfully" });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ success: false, message: "Error deactivating user", error: error.message });
//   }
// };

// // ─────────────────────────────────────────────
// // REACTIVATE USER
// // ─────────────────────────────────────────────
// const reactivateUser = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findByPk(id);
//     if (!user) return res.status(404).json({ success: false, message: "User not found", error: error.message  });

//     await user.update({ is_active: true });
//     res.json({ success: true, message: "User reactivated successfully" });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ success: false, message: "Error reactivating user", error: error.message });
//   }
// };

// // ─────────────────────────────────────────────
// // ASSIGN ROLE
// // ─────────────────────────────────────────────
// const assignRole = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { role_id } = req.body;

//     if (!role_id) {
//       return res.status(400).json({ success: false, message: "role_id is required", error: error.message });
//     }

//     const user = await User.findByPk(id);
//     if (!user) return res.status(404).json({ success: false, message: "User not found", error: error.message });

//     const role = await Role.findByPk(role_id);
//     if (!role) return res.status(404).json({ success: false, message: "Role not found", error: error.message });

//     await user.update({ role_id });
//     res.json({ success: true, message: `Role updated to ${role.role_name}` });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ success: false, message: "Error assigning role" ,error: error.message});
//   }
// };

// // ─────────────────────────────────────────────
// // GET ALL TRAINEES
// // ─────────────────────────────────────────────
// const getTrainees = async (req, res) => {
//   try {
//     // Raw query avoids Sequelize association ambiguity
//     // (Trainee has 3 belongsTo User: user_id, buddy_id, manager_id)
//     const [results] = await Trainee.sequelize.query(`
//       SELECT
//         t.id, t.user_id, t.college_name, t.course, t.batch_year,
//         t.enrollment_date, t.expected_end_date, t.current_status,
//         t.gpa, t.buddy_id, t.manager_id, t.certifications,
//         u.id   AS u_id,
//         u.name AS u_name,
//         u.email AS u_email,
//         u.phone AS u_phone,
//         u.is_active AS u_is_active
//       FROM trainees t
//       LEFT JOIN users u ON u.id = t.user_id
//       ORDER BY t.createdAt DESC
//     `);

//     // Shape the data to match what frontend expects: trainee.user.name / trainee.user.email
//     const trainees = results.map(row => ({
//       id:               row.id,
//       user_id:          row.user_id,
//       college_name:     row.college_name,
//       course:           row.course,
//       batch_year:       row.batch_year,
//       enrollment_date:  row.enrollment_date,
//       expected_end_date:row.expected_end_date,
//       current_status:   row.current_status,
//       gpa:              row.gpa,
//       buddy_id:         row.buddy_id,
//       manager_id:       row.manager_id,
//       certifications:   row.certifications,
//       user: {
//         id:        row.u_id,
//         name:      row.u_name,
//         email:     row.u_email,
//         phone:     row.u_phone,
//         is_active: row.u_is_active,
//       }
//     }));

//     res.json({ success: true, trainees, message: "Trainees fetched successfully" });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ success: false, message: "Error fetching trainees", error: error.message });
//   }
// };

// // ─────────────────────────────────────────────
// // ASSIGN MANAGER TO INTERN (Admin)
// // PATCH /api/v1/admin/trainees/:id/assign-manager
// // body: { manager_id }
// // ─────────────────────────────────────────────
// const assignManager = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { manager_id } = req.body;

//     const trainee = await Trainee.findByPk(id);
//     if (!trainee) return res.status(404).json({ success: false, message: 'Intern not found' });

//     if (manager_id) {
//       const manager = await User.findOne({ where: { id: manager_id, role_id: 2, is_active: 1 } });
//       if (!manager) return res.status(404).json({ success: false, message: 'Manager not found or inactive' });
//     }

//     await trainee.update({ manager_id: manager_id || null });
//     res.json({ success: true, message: manager_id ? 'Manager assigned successfully' : 'Manager removed', data: trainee });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ success: false, message: 'Error assigning manager', error: error.message });
//   }
// };

// // ─────────────────────────────────────────────
// // GET ALL ROLES (for dropdowns)
// // ─────────────────────────────────────────────
// const getRoles = async (req, res) => {
//   try {
//     const roles = await Role.findAll();
//     res.json({ success: true, roles, message: "Roles fetched successfully" });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ success: false, message: "Error fetching roles", error: error.message });
//   }
// };

// export default {
//   dashboard,
//   getUsers,
//   getUserById,
//   createUser,
//   updateUser,
//   deactivateUser,
//   reactivateUser,
//   assignRole,
//   getTrainees,
//   getRoles,
//   assignManager
// };
