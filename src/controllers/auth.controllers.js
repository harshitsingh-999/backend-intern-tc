// src/api/v1/Controllers/auth.controller.js


// -------------------------------//
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import User from "../Models/user.js";
// import Role from "../Models/role.js";
// import logger from "../../../helper/logger.js";

// const COOKIE_OPTIONS = {
//   httpOnly: true,       // JS cannot read it — prevents XSS
//   secure: process.env.NODE_ENV === "production",
//   sameSite: "lax",
//   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
// };

// class AuthController {

//   // POST /api/v1/auth/login
//   async login(req, res) {
//     try {
//       const { email, password } = req.body;

//       if (typeof email !== "string" || typeof password !== "string") {
//         return res.status(400).json({ success: false, message: "email and password must be strings" });
//       }

//       const normalizedEmail = email.trim().toLowerCase();
//       if (!normalizedEmail || !password) {
//         return res.status(400).json({ success: false, message: "email and password are required" });
//       }

//       // Find user and include their role name
//       const user = await User.findOne({
//         where: { email: normalizedEmail },
//         include: [{ model: Role, attributes: ["role_name"] }],
//       });

//       if (!user) {
//         return res.status(401).json({ success: false, message: "Invalid credentials" });
//       }

//       if (!user.is_active) {
//         return res.status(403).json({ success: false, message: "Account is inactive" });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(401).json({ success: false, message: "Invalid credentials" });
//       }

//       await user.update({ last_login: new Date() });

//       // Create JWT payload
//       const payload = {
//         id: user.id,
//         email: user.email,
//         role_id: user.role_id,
//         role_name: user.role?.role_name || "User",
//       };

//       const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

//       // Set token in httpOnly cookie
//       res.cookie("token", token, COOKIE_OPTIONS);

//       return res.status(200).json({
//         success: true,
//         message: "Login successful",
//         data: {
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           role_id: user.role_id,
//           role_name: user.role?.role_name || "User",
//           dept_id: user.dept_id,
//         },
//       });
//     } catch (error) {
//       logger.error(error);
//       return res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
//   }

//   // GET /api/v1/auth/me   (protected — requires auth middleware)
//   async me(req, res) {
//     try {
//       // req.user is set by the auth middleware
//       const user = await User.findByPk(req.user.id, {
//         attributes: ["id", "name", "email", "role_id", "dept_id", "is_active", "last_login"],
//         include: [{ model: Role, attributes: ["role_name"] }],
//       });

//       if (!user) {
//         return res.status(404).json({ success: false, message: "User not found" });
//       }

//       return res.status(200).json({
//         success: true,
//         data: {
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           role_id: user.role_id,
//           role_name: user.role?.role_name || "User",
//           dept_id: user.dept_id,
//         },
//       });
//     } catch (error) {
//       logger.error(error);
//       return res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
//   }

//   // POST /api/v1/auth/logout  (protected — requires auth middleware)
//   async logout(req, res) {
//     // Clear the cookie by overwriting it with an expired one
//     res.cookie("token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
//     return res.status(200).json({ success: true, message: "Logged out successfully" });
//   }
// }

// export default new AuthController();