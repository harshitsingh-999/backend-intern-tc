import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/user.js";
import Role from "../Models/role.js";
import Department from "../Models/department.js";
import responseEmmiter from "../../../helper/response.js";
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
      const normalizedEmail = email?.trim().toLowerCase();
      const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_TOKEN;

      if (!normalizedEmail || !password) {
        return responseEmmiter(res, { status: 400, message: "Email and password are required" });
      }

      if (!jwtSecret) {
        logger.error("JWT secret is not configured");
        return responseEmmiter(res, { status: 500, message: "Server configuration error" });
      }

      const user = await User.findOne({
        where: { email: normalizedEmail },
        include: [
          { model: Role, attributes: ["id", "role_name"] },
          { model: Department, attributes: ["id", "dept_name"] }
        ]
      });

      if (!user) {
        return responseEmmiter(res, { status: 401, message: "Invalid email or password" });
      }

      if (!user.is_active) {
        return responseEmmiter(res, { status: 401, message: "Your account is inactive. Contact admin." });
      }

      const storedPassword = user.password || "";
      const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);

      let isMatch = false;

      if (isBcryptHash) {
        isMatch = await bcrypt.compare(password, storedPassword);
      } else {
        isMatch = password === storedPassword;
      }

      if (!isMatch) {
        return responseEmmiter(res, { status: 401, message: "Invalid email or password" });
      }

      // convert plaintext passwords to bcrypt
      if (!isBcryptHash) {
        user.password = await bcrypt.hash(password, 10);
      }

      const token = jwt.sign(
        { id: user.id, role_id: user.role_id },
        jwtSecret,
        { expiresIn: "8h" }
      );

      user.last_login = new Date();
      await user.save();

      res.cookie("token", token, COOKIE_OPTIONS);

      const { password: _, ...userData } = user.toJSON();

      return responseEmmiter(res, {
        status: 200,
        message: "Login successful",
        data: { token, user: userData }
      });

    } catch (error) {
      logger.error(error);
      return responseEmmiter(res, { status: 500, message: "Internal Server Error" });
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