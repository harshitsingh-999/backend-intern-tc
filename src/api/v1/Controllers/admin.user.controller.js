import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../Models/user.js';
import Role from '../Models/role.js';
import Department from '../Models/department.js';
import responseEmmiter from '../../../helper/response.js';
import logger from '../../../helper/logger.js';

class AdminUserController {

  // GET ALL USERS
  async getAllUsers(req, res) {
    try {
      const page   = parseInt(req.query.page)  || 1;
      const limit  = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const offset = (page - 1) * limit;

      const whereClause = search ? {
        [Op.or]: [
          { name:  { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      } : {};

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include: [
          { model: Role,       attributes: ['id', 'role_name'] },
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

      const user = await User.findByPk(id, {
        include: [
          { model: Role,       attributes: ['id', 'role_name'] },
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
      const { name, email, password, phone, address, role_id, dept_id, is_active } = req.body;

      if (!name || !email || !password) {
        return responseEmmiter(res, { status: 400, message: 'name, email and password are required' });
      }

      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return responseEmmiter(res, { status: 409, message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone:     phone     || null,
        address:   address   || null,
        role_id:   role_id   || 4,
        dept_id:   dept_id   || null,
        is_active: is_active !== undefined ? is_active : 1,
      });

      const { password: _, ...userData } = user.toJSON();

      return responseEmmiter(res, {
        status: 201,
        message: 'User created successfully',
        data: userData,
      });
    } catch (error) {
      logger.error(error);
      return responseEmmiter(res, { status: 500, message: 'Internal Server Error' });
    }
  }

  // UPDATE USER
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, phone, address, role_id, dept_id, is_active, password } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return responseEmmiter(res, { status: 404, message: 'User not found' });
      }

      if (email && email !== user.email) {
        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) {
          return responseEmmiter(res, { status: 409, message: 'Email already in use by another user' });
        }
      }

      const updateData = {};
      if (name      !== undefined) updateData.name      = name;
      if (email     !== undefined) updateData.email     = email;
      if (phone     !== undefined) updateData.phone     = phone;
      if (address   !== undefined) updateData.address   = address;
      if (role_id   !== undefined) updateData.role_id   = role_id;
      if (dept_id   !== undefined) updateData.dept_id   = dept_id;
      if (is_active !== undefined) updateData.is_active = is_active;

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
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
