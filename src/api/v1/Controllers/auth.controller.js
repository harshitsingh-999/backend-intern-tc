import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../Models/user.js';
import Role from '../Models/role.js';
import Department from '../Models/department.js';
import responseEmmiter from '../../../helper/response.js';
import logger from '../../../helper/logger.js';

class AuthController {

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email?.trim();
      const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_TOKEN;

      if (!normalizedEmail || !password) {
        return responseEmmiter(res, { status: 400, message: 'Email and password are required' });
      }

      if (!jwtSecret) {
        logger.error('JWT secret is not configured');
        return responseEmmiter(res, { status: 500, message: 'Server configuration error' });
      }

      const user = await User.findOne({
        where: { email: normalizedEmail },
        include: [
          { model: Role,       attributes: ['id', 'role_name'] },
          { model: Department, attributes: ['id', 'dept_name'] },
        ],
      });

      if (!user) {
        return responseEmmiter(res, { status: 401, message: 'Invalid email or password' });
      }

      if (!user.is_active) {
        return responseEmmiter(res, { status: 401, message: 'Your account is inactive. Contact admin.' });
      }

      const storedPassword = user.password || '';
      const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);
      let isMatch = false;

      if (isBcryptHash) {
        isMatch = await bcrypt.compare(password, storedPassword);
      } else {
        isMatch = password === storedPassword;
      }

      if (!isMatch) {
        return responseEmmiter(res, { status: 401, message: 'Invalid email or password' });
      }

      // Auto-migrate legacy plaintext passwords after successful login.
      if (!isBcryptHash) {
        user.password = await bcrypt.hash(password, 10);
      }

      const token = jwt.sign(
        { id: user.id, role_id: user.role_id },
        jwtSecret,
        { expiresIn: '8h' }
      );

      user.last_login = new Date();
      await user.save();

      const { password: _, ...userData } = user.toJSON();

      return responseEmmiter(res, {
        status: 200,
        error: true,
        message: 'Login successful',
        data: { token, user: userData },
      });

    } catch (error) {
      logger.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

export default new AuthController();
