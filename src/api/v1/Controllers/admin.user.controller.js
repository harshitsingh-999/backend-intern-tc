import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../Models/user.js';
import Role from '../Models/role.js';
import Department from '../Models/department.js';
import responseEmmiter from '../../../helper/response.js';
import logger from '../../../helper/logger.js';
import { sendEmail } from '../../../utils/sendEmail.js';
import {
  isPositiveInteger,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  normalizeEmail,
  normalizeOptionalString,
  parseBooleanFlag,
  parsePositiveInteger,
  toTrimmedString,
} from '../../../validators/validators.js';

class AdminUserController {

  // GET ALL USERS
  async getAllUsers(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
      const search = req.query.search || '';
      const offset = (page - 1) * limit;

      const whereClause = search ? {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      } : {};

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include: [
          { model: Role, attributes: ['id', 'role_name'] },
          { model: Department, attributes: ['id', 'dept_name'] },
        ],
        attributes: { exclude: ['password'] },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      const users = rows.map((user) => {
        const plainUser = user.toJSON();
        return {
          ...plainUser,
          role: plainUser.role?.role_name || null,
          department: plainUser.department?.dept_name || null,
        };
      });

      return responseEmmiter(res, {
        status: 200,
        error: true,
        message: 'Users fetched successfully',
        data: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
          users,
        },
      });
    } catch (error) {
      logger.error(error);
      return responseEmmiter(res, { status: 500, message: 'Internal Server Error' });
    }
  }

  // GET SINGLE USER
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      if (!isPositiveInteger(id)) {
        return responseEmmiter(res, { status: 400, message: 'A valid user id is required' });
      }

      const user = await User.findByPk(id, {
        include: [
          { model: Role, attributes: ['id', 'role_name'] },
          { model: Department, attributes: ['id', 'dept_name'] },
        ],
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        return responseEmmiter(res, { status: 404, message: 'User not found' });
      }

      const plainUser = user.toJSON();
      const userData = {
        ...plainUser,
        role: plainUser.role?.role_name || null,
        department: plainUser.department?.dept_name || null,
      };

      return responseEmmiter(res, {
        status: 200,
        error: true,
        message: 'User fetched successfully',
        data: userData,
      });
    } catch (error) {
      logger.error(error);
      return responseEmmiter(res, { status: 500, message: 'Internal Server Error' });
    }
  }

  // CREATE USER
 async createUser(req, res) {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      role_id,
      dept_id,
      department,
      is_active,
    } = req.body;

    const normalizedName = toTrimmedString(name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizeOptionalString(phone);
    const normalizedAddress = normalizeOptionalString(address);
    const normalizedPassword = String(password || '');

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return responseEmmiter(res, { status: 400, message: 'name, email and password are required' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return responseEmmiter(res, { status: 400, message: 'Please provide a valid email address' });
    }

    if (!isValidPassword(normalizedPassword)) {
      return responseEmmiter(res, {
        status: 400,
        message: 'Password must include @, !, 1 and 2',
      });
    }

    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      return responseEmmiter(res, { status: 400, message: 'Please provide a valid phone number' });
    }

    if (role_id !== undefined && !isPositiveInteger(role_id)) {
      return responseEmmiter(res, { status: 400, message: 'role_id must be a valid numeric id' });
    }

    if (dept_id !== undefined && dept_id !== null && dept_id !== '' && !isPositiveInteger(dept_id)) {
      return responseEmmiter(res, { status: 400, message: 'dept_id must be a valid numeric id' });
    }

    const parsedIsActive = parseBooleanFlag(is_active);
    if (is_active !== undefined && parsedIsActive === null) {
      return responseEmmiter(res, { status: 400, message: 'is_active must be true/false or 1/0' });
    }

    const parsedRoleId = parsePositiveInteger(role_id) || 4;
    const role = await Role.findByPk(parsedRoleId);
    if (!role) {
      return responseEmmiter(res, { status: 404, message: 'Role not found' });
    }

    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return responseEmmiter(res, { status: 409, message: 'Email already registered' });
    }

    // Resolve dept_id: accept numeric dept_id OR department name string
    let resolvedDeptId = dept_id || null;
    if (!resolvedDeptId && department) {
      const dept = await Department.findOne({ where: { dept_name: toTrimmedString(department) } });
      if (dept) resolvedDeptId = dept.id;
    }
    if (resolvedDeptId && !await Department.findByPk(resolvedDeptId)) {
      return responseEmmiter(res, { status: 404, message: 'Department not found' });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone,
      address: normalizedAddress,
      role_id: parsedRoleId,
      dept_id: resolvedDeptId,
      is_active: parsedIsActive !== undefined ? parsedIsActive : 1,
    });

    await sendEmail(
      normalizedEmail,
      "Internship Portal - Account Created",
      `Hello ${normalizedName},\n\nYour account has been created successfully by the Admin.\n\nEmail: ${normalizedEmail}\nPassword: ${normalizedPassword}\n\nPlease login and change your password.\nLink: http://localhost:5173/login\n\nThank you.`
    );

    const { password: _, ...userData } = user.toJSON();
    return responseEmmiter(res, { status: 201, message: 'User created successfully', data: userData });
  } catch (error) {
    logger.error(error);
    return responseEmmiter(res, { status: 500, message: 'Internal Server Error' });
  }
}

  // UPDATE USER
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      // const { name, email, phone, address, role_id, dept_id, is_active, password } = req.body;
      const { name, email, phone, address, role_id, dept_id, department, is_active, password } = req.body;

      if (!isPositiveInteger(id)) {
        return responseEmmiter(res, { status: 400, message: 'A valid user id is required' });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return responseEmmiter(res, { status: 404, message: 'User not found' });
      }

      const normalizedEmail = email !== undefined ? normalizeEmail(email) : undefined;
      const normalizedName = name !== undefined ? toTrimmedString(name) : undefined;
      const normalizedPhone = normalizeOptionalString(phone);
      const normalizedAddress = normalizeOptionalString(address);
      const normalizedPassword = password !== undefined ? String(password || '') : undefined;

      if (normalizedName !== undefined && !normalizedName) {
        return responseEmmiter(res, { status: 400, message: 'name cannot be empty' });
      }

      if (normalizedEmail !== undefined) {
        if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
          return responseEmmiter(res, { status: 400, message: 'Please provide a valid email address' });
        }
      }

      if (normalizedPhone && !isValidPhone(normalizedPhone)) {
        return responseEmmiter(res, { status: 400, message: 'Please provide a valid phone number' });
      }

      if (normalizedPassword !== undefined && normalizedPassword && !isValidPassword(normalizedPassword)) {
        return responseEmmiter(res, {
          status: 400,
          message: 'Password must include @, !, 1 and 2',
        });
      }

      if (role_id !== undefined && !isPositiveInteger(role_id)) {
        return responseEmmiter(res, { status: 400, message: 'role_id must be a valid numeric id' });
      }

      if (dept_id !== undefined && dept_id !== null && dept_id !== '' && !isPositiveInteger(dept_id)) {
        return responseEmmiter(res, { status: 400, message: 'dept_id must be a valid numeric id' });
      }

      const parsedIsActive = parseBooleanFlag(is_active);
      if (is_active !== undefined && parsedIsActive === null) {
        return responseEmmiter(res, { status: 400, message: 'is_active must be true/false or 1/0' });
      }

      if (normalizedEmail && normalizedEmail !== user.email) {
        const emailExists = await User.findOne({ where: { email: normalizedEmail } });
        if (emailExists) {
          return responseEmmiter(res, { status: 409, message: 'Email already in use by another user' });
        }
      }

      const updateData = {};
      if (normalizedName !== undefined) updateData.name = normalizedName;
      if (normalizedEmail !== undefined) updateData.email = normalizedEmail;
      if (phone !== undefined) updateData.phone = normalizedPhone;
      if (address !== undefined) updateData.address = normalizedAddress;
      if (role_id !== undefined) {
        const role = await Role.findByPk(Number(role_id));
        if (!role) {
          return responseEmmiter(res, { status: 404, message: 'Role not found' });
        }
        updateData.role_id = Number(role_id);
      }
      if (dept_id !== undefined) {
        if (dept_id === null || dept_id === '') {
          updateData.dept_id = null;
        } else {
          const departmentRecord = await Department.findByPk(Number(dept_id));
          if (!departmentRecord) {
            return responseEmmiter(res, { status: 404, message: 'Department not found' });
          }
          updateData.dept_id = Number(dept_id);
        }
      } else if (department !== undefined) {
        if (department === '' || department === null) {
          updateData.dept_id = null;
        } else {
          const dept = await Department.findOne({ where: { dept_name: toTrimmedString(department) } });
          if (!dept) {
            return responseEmmiter(res, { status: 404, message: 'Department not found' });
          }
          updateData.dept_id = dept.id;
        }
      }
      if (parsedIsActive !== undefined) updateData.is_active = parsedIsActive;

      if (normalizedPassword) {
        updateData.password = await bcrypt.hash(normalizedPassword, 10);
      }

      await user.update(updateData);

      const { password: _, ...userData } = user.toJSON();

      return responseEmmiter(res, {
        status: 202,
        message: 'User updated successfully',
        data: userData,
      });
    } catch (error) {
      logger.error(error);
      return responseEmmiter(res, { status: 500, message: 'Internal Server Error' });
    }
  }

  // DELETE USER
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!isPositiveInteger(id)) {
        return responseEmmiter(res, { status: 400, message: 'A valid user id is required' });
      }

      if (parseInt(id) === req.user.id) {
        return responseEmmiter(res, { status: 400, message: 'You cannot delete your own account' });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return responseEmmiter(res, { status: 404, message: 'User not found' });
      }

      await user.destroy();

      return responseEmmiter(res, {
        status: 204,
        message: 'User deleted successfully',
        data: null,
      });
    } catch (error) {
      logger.error(error);
      return responseEmmiter(res, { status: 500, message: 'Internal Server Error' });
    }
  }

  // TOGGLE ACTIVE / INACTIVE
  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;

      if (!isPositiveInteger(id)) {
        return responseEmmiter(res, { status: 400, message: 'A valid user id is required' });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return responseEmmiter(res, { status: 404, message: 'User not found' });
      }

      await user.update({ is_active: user.is_active ? 0 : 1 });

      return responseEmmiter(res, {
        status: 202,
        message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
        data: { id: user.id, is_active: user.is_active },
      });
    } catch (error) {
      logger.error(error);
      return responseEmmiter(res, { status: 500, message: 'Internal Server Error' });
    }
  }
}

export default new AdminUserController();
