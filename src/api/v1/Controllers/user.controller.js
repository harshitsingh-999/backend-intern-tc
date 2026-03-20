import bcrypt from "bcrypt";
import User from "../Models/user.js";
import logger from "../../../helper/logger.js";
import { isValidEmail, isValidPassword } from "../../../validators/validators.js";
import { sendEmail } from "../../../utils/sendEmail.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, role_id, dept_id } = req.body;

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "name, email and password must be strings"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim() || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email and password are required"
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must include @, !, 1 and 2"
      });
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      address,
      role_id,
      dept_id
    });
     // 🔥 ADD THIS EMAIL CODE HERE
    await sendEmail(
  normalizedEmail,
  "Your Account Has Been Created 🎉",
  `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 20px;">
      
      <h2 style="color: #333;">Welcome to Intern Management System 👋</h2>
      
      <p style="color: #555; font-size: 14px;">
        Hello <strong>${name}</strong>,
      </p>
      
      <p style="color: #555; font-size: 14px;">
        Your account has been successfully created. You can now log in using the details below:
      </p>

      <div style="background: #f1f1f1; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Email:</strong> ${normalizedEmail}</p>
        <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
      </div>

      <p style="color: #555; font-size: 14px;">
        Please make sure to change your password after logging in for security purposes.
      </p>

      <a href="http://localhost:5173/login"
         style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">
         Login Now
      </a>

      <hr style="margin: 20px 0;" />

      <p style="font-size: 12px; color: #999;">
        If you did not request this account, please ignore this email.
      </p>

      <p style="font-size: 12px; color: #999;">
        © 2026 Intern Management System
      </p>

    </div>
  </div>
  `
);


    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

export const loginUser = async (req, res) => {
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
        dept_id: user.dept_id,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const [activeInterns, buddiesAssigned, managers] = await Promise.all([
      User.count({ where: { role_id: 4, is_active: 1 } }),
      User.count({ where: { role_id: 3, is_active: 1 } }),
      User.count({ where: { role_id: 2, is_active: 1 } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        activeInterns,
        buddiesAssigned,
        managers
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

export const forgotPassword = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "forgotPassword not implemented"
  });
};

export const resetPassword = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "resetPassword not implemented"
  });
};

export const uploadProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const profileUrl = `/api/uploads/profiles/${req.user.id}/${req.file.filename}`;
    await user.update({ profile_picture: profileUrl });

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profile_url: profileUrl
    });
  } catch (error) {
    logger.error("Error uploading profile:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
