import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../Models/user.js";
import Role from "../Models/role.js";
import logger from "../../../helper/logger.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({
          success: false,
          message: "email and password must be strings"
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        return res.status(400).json({
          success: false,
          message: "email and password are required"
        });
      }

      const user = await User.findOne({
        where: { email: normalizedEmail },
        include: [{ model: Role, attributes: ["role_name"] }]
      });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }

      await user.update({ last_login: new Date() });

      const token = jwt.sign(
        { id: user.id, email: user.email, role_id: user.role_id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: user.role_id,
          role_name: user.role?.role_name || "User",
          dept_id: user.dept_id
        }
      });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  }

  async me(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ["id", "name", "email", "role_id", "dept_id", "is_active", "last_login"],
        include: [{ model: Role, attributes: ["role_name"] }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: user.role_id,
          role_name: user.role?.role_name || "User",
          dept_id: user.dept_id
        }
      });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  }

  async logout(req, res) {
    res.cookie("token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  }
}

export default new AuthController();
