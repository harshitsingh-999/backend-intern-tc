import jwt from "jsonwebtoken";
import User from "../api/v1/Models/user.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "name", "email", "role_id", "is_active"],
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: "Invalid or inactive account" });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};




// ------------------------------//
// import jwt from "jsonwebtoken";
// import User from "../models/user.model.js";

// export const authenticate = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         success: false,
//         message: "Authorization token missing"
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);

//     const user = await User.findByPk(decoded.id);

//     if (!user || !user.active) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid or inactive user"
//       });
//     }

//     // Attach user to request
//     req.user = {
//       id: user.id,
//       role: user.role,
//       name: user.name
//     };

//     next();
//   } catch (err) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid token"
//     });
//   }
// };
// src/middlewares/auth.middleware.js


// -----------------------------------//


// import jwt from "jsonwebtoken";
// import User from "../api/v1/Models/user.js";

// // Reads token from the httpOnly cookie (not Authorization header)
// export const authenticate = async (req, res, next) => {
//   try {
//     const token = req.cookies?.token;

//     if (!token) {
//       return res.status(401).json({ success: false, message: "Not authenticated" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findByPk(decoded.id, {
//       attributes: ["id", "name", "email", "role_id", "is_active"],
//     });

//     if (!user || !user.is_active) {
//       return res.status(401).json({ success: false, message: "Invalid or inactive account" });
//     }

//     // Attach user info to request so controllers can use it
//     req.user = {
//       id: user.id,
//       name: user.name,
//       email: user.email,
//       role_id: user.role_id,
//     };

//     next();
//   } catch (err) {
//     return res.status(401).json({ success: false, message: "Token invalid or expired" });
//   }
// };