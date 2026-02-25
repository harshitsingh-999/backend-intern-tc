import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);

    const user = await User.findByPk(decoded.id);

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive user"
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
      name: user.name
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};
