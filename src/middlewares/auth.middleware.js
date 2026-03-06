import jwt from 'jsonwebtoken';
import User from '../api/v1/Models/user.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: false,
        message: 'Authorization token missing',
      });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_TOKEN;

    if (!jwtSecret) {
      return res.status(500).json({
        status: false,
        message: 'Server configuration error',
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json({
        status: false,
        message: 'Invalid or inactive user',
      });
    }

    req.user = {
      id:      user.id,
      role_id: user.role_id,
      name:    user.name,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: 'Invalid or expired token',
    });
  }
};
