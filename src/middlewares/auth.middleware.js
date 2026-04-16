import User from "../api/v1/Models/user.js";
import Trainee from "../api/v1/Models/trainee.js";
import { verifyAccessToken } from "../utils/authTokens.js";

export const authenticate = async (req, res, next) => {
  try {
    // Accept token from cookie OR Authorization Bearer header
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers?.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "name", "email", "role_id", "is_active"]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive account"
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id
    };
    req.auth = {
      accessTokenExpiresAt: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      code: err?.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
      message: err?.name === "TokenExpiredError" ? "Access token expired" : "Token invalid or expired"
    });
  }
};

export const checkInternExpiry = async (req, res, next) => {
  try {
    if (!req.user || Number(req.user.role_id) !== 4) {
      return next();
    }

    const trainee = await Trainee.findOne({
      where: { user_id: req.user.id },
      attributes: ['expected_end_date', 'current_status']
    });

    if (!trainee) {
      return res.status(404).json({ success: false, message: 'Trainee profile not found' });
    }

    const todayISO = new Date().toISOString().slice(0, 10);
    const endDate = trainee.expected_end_date || null;

    if (endDate && endDate < todayISO) {
      return res.status(403).json({
        success: false,
        message: 'Your internship period has ended. Please contact Admin or SuperAdmin to extend your duration.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to verify trainee expiration', error: error.message });
  }
};
