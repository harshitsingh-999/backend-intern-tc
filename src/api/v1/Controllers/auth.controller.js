import bcrypt from "bcrypt";
import User from "../Models/user.js";
import logger from "../../../helper/logger.js";

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

      const user = await User.findOne({ where: { email: normalizedEmail } });
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

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: user.role_id,
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
}

export default new AuthController();
