import jwt from "jsonwebtoken";
import User from "../api/v1/Models/user.js";

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Token invalid or expired"
    });
  }
};