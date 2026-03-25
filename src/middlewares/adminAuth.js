import User from '../api/v1/Models/user.js';
import Role from '../api/v1/Models/role.js';
import { verifyAccessToken } from '../utils/authTokens.js';

export default async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  // DEVELOPMENT: skip verification for mock token
  if (token === 'mock-token-dev') {
    req.user = { id: 1, name: 'Admin User', email: 'admin@company.com', role_id: 1, role: { id: 1, role_name: 'admin' } };
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }]  // lowercase 'role' matches your User model association
    });

    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account is deactivated' });

    // lowercase 'role' and correct field 'role_name'
    const roleName = user.role?.role_name?.toLowerCase();
    if (roleName !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });

    req.user = user;
    req.auth = {
      accessTokenExpiresAt: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      code: error?.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
      message: error?.name === "TokenExpiredError" ? "Access token expired" : 'Invalid or expired token'
    });
  }
};
