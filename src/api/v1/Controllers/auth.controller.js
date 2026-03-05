import logger from '../../../helper/logger.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../Models/user.js';
import Role from '../Models/role.js';

class AuthController {
  async login(req, res) {
    try {
      const { email, id, password } = req.body;
      const identifier = email || id;

      if (!identifier || !password) {
        return res.status(400).json({ success: false, message: 'Email/ID and password are required' });
      }

      const user = await User.findOne({
        where: email ? { email } : { id },
        include: [{ model: Role }]
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (user.is_active === false) {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
      }

      // Support bcrypt hashes and migrate legacy plaintext password on successful login.
      let isPasswordValid = false;
      if (user.password) {
        const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password);

        if (isBcryptHash) {
          isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
          isPasswordValid = password === user.password;
          if (isPasswordValid) {
            user.password = await bcrypt.hash(password, 10);
          }
        }
      }

      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const roleName = user.role?.role_name || user.Role?.role_name || 'user';

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role_id: user.role_id,
          role: roleName
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-env',
        { expiresIn: '7d' }
      );

      user.last_login = new Date();
      await user.save();

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: user.role_id,
          role: roleName
        }
      });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ success: false, message: 'Internal Server Error: ' + error.message });
    }
  }
}

export default new AuthController();
