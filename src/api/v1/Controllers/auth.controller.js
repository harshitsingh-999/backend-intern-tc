import bcrypt from "bcryptjs";
import User from "../Models/user.js";
import Role from "../Models/role.js";
import Department from "../Models/department.js";
import responseEmmiter from "../../../helper/response.js";
import logger from "../../../helper/logger.js";
import { isValidEmail, normalizeEmail } from "../../../validators/validators.js";
import {
  clearCookieOptions,
  getAuthSecrets,
  issueAuthTokens,
  verifyRefreshToken
} from "../../../utils/authTokens.js";
import crypto from "crypto";
import { buildPortalUrl, sendPasswordResetEmail } from "../../../utils/sendEmail.js";
import { isValidPassword } from "../../../validators/validators.js";

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = normalizeEmail(email);
      const { accessTokenSecret } = getAuthSecrets();

      if (!normalizedEmail || !password) {
        return responseEmmiter(res, { status: 400, message: "Email and password are required" });
      }

      if (!isValidEmail(normalizedEmail)) {
        return responseEmmiter(res, { status: 400, message: "Please enter a valid email address" });
      }

      if (!accessTokenSecret) {
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

      const session = issueAuthTokens({ id: user.id, role_id: user.role_id });

      user.last_login = new Date();
      await user.save();

      res.cookie("token", session.accessToken, session.accessCookieOptions);
      res.cookie("refreshToken", session.refreshToken, session.refreshCookieOptions);

      const { password: _, ...userData } = user.toJSON();

      return responseEmmiter(res, {
        status: 200,
        message: "Login successful",
        data: {
          token: session.accessToken,
          accessTokenExpiresAt: session.accessTokenExpiresAt,
          refreshTokenExpiresAt: session.refreshTokenExpiresAt,
          user: userData
        }
      });

    } catch (error) {
      logger.error(error);
      return responseEmmiter(res, { status: 500, message: "Internal Server Error" });
    }
  }

  async refresh(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          code: "REFRESH_TOKEN_MISSING",
          message: "Refresh token is required"
        });
      }

      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findByPk(decoded.id, {
        attributes: ["id", "name", "email", "role_id", "dept_id", "is_active", "last_login", "profile_picture"],
        include: [{ model: Role, attributes: ["role_name"] }]
      });

      if (!user || !user.is_active) {
        res.cookie("token", "", clearCookieOptions);
        res.cookie("refreshToken", "", clearCookieOptions);
        return res.status(401).json({
          success: false,
          code: "REFRESH_TOKEN_USER_INVALID",
          message: "Invalid or inactive account"
        });
      }

      const session = issueAuthTokens({ id: user.id, role_id: user.role_id });
      res.cookie("token", session.accessToken, session.accessCookieOptions);
      res.cookie("refreshToken", session.refreshToken, session.refreshCookieOptions);

      return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          token: session.accessToken,
          accessTokenExpiresAt: session.accessTokenExpiresAt,
          refreshTokenExpiresAt: session.refreshTokenExpiresAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            role_name: user.role?.role_name || "User",
            dept_id: user.dept_id,
            profile_picture: user.profile_picture,
            last_login: user.last_login
          }
        }
      });
    } catch (error) {
      logger.error(error);
      res.cookie("token", "", clearCookieOptions);
      res.cookie("refreshToken", "", clearCookieOptions);
      return res.status(401).json({
        success: false,
        code: "REFRESH_TOKEN_INVALID",
        message: "Refresh token invalid or expired"
      });
    }
  }

  async me(req, res) {
    try {
      let refreshTokenExpiresAt = null;

      if (req.cookies?.refreshToken) {
        try {
          const decodedRefreshToken = verifyRefreshToken(req.cookies.refreshToken);
          refreshTokenExpiresAt = decodedRefreshToken?.exp
            ? new Date(decodedRefreshToken.exp * 1000).toISOString()
            : null;
        } catch (error) {
          refreshTokenExpiresAt = null;
        }
      }

      const user = await User.findByPk(req.user.id, {
        attributes: ["id", "name", "email", "role_id", "dept_id", "is_active", "last_login", "profile_picture"],
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
          dept_id: user.dept_id,
          profile_picture: user.profile_picture,
          accessTokenExpiresAt: req.auth?.accessTokenExpiresAt || null,
          refreshTokenExpiresAt
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
    res.cookie("token", "", clearCookieOptions);
    res.cookie("refreshToken", "", clearCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  }

  async forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return responseEmmiter(res, { status: 400, message: "Please enter a valid email address" });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });

    // Always respond with success to prevent email enumeration
    if (!user || !user.is_active) {
      return responseEmmiter(res, {
        status: 200,
        message: "If this email is registered, a reset link has been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.password_reset_token = token;
    user.password_reset_expires = expires;
    await user.save();

    const resetLink = buildPortalUrl("/reset-password", { token });

    await sendPasswordResetEmail({
      toEmail: user.email,
      userName: user.name,
      resetLink,
    });

    return responseEmmiter(res, {
      status: 200,
      message: "If this email is registered, a reset link has been sent.",
    });
  } catch (error) {
    logger.error(error);
    return responseEmmiter(res, { status: 500, message: "Internal Server Error" });
  }
}

async resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return responseEmmiter(res, { status: 400, message: "Token and new password are required" });
    }

    if (!isValidPassword(password)) {
      return responseEmmiter(res, {
        status: 400,
        message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const user = await User.findOne({ where: { password_reset_token: token } });

    if (!user || !user.password_reset_expires || new Date() > user.password_reset_expires) {
      return responseEmmiter(res, { status: 400, message: "Reset link is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await user.save();

    return responseEmmiter(res, { status: 200, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    logger.error(error);
    return responseEmmiter(res, { status: 500, message: "Internal Server Error" });
  }
}
}


export default new AuthController();
