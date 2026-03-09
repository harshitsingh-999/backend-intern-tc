// Role IDs: 1=Admin  2=Manager  3=Buddy  4=Intern

export const requireRole = (...allowedRoleIds) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (!allowedRoleIds.includes(Number(req.user.role_id))) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
};

export const requireAdmin   = requireRole(1);
export const requireManager = requireRole(1, 2);
export const requireBuddy   = requireRole(1, 2, 3);
export const requireIntern  = requireRole(1, 2, 3, 4);




// -----------------------------------//


// src/middlewares/role.middleware.js
// Role IDs in your DB (adjust if yours differ):
// 1 = Admin, 2 = Manager, 3 = Buddy, 4 = Intern/Trainee


// -----------------------------------//

// export const requireRole = (...allowedRoleIds) => {
//   return (req, res, next) => {
//     if (!req.user) {
//       return res.status(401).json({ success: false, message: "Not authenticated" });
//     }

//     if (!allowedRoleIds.includes(req.user.role_id)) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied: insufficient permissions",
//       });
//     }

//     next();
//   };
// };

// // Convenience shortcuts
// export const requireAdmin   = requireRole(1);
// export const requireManager = requireRole(1, 2);   // Admin OR Manager
// export const requireBuddy   = requireRole(1, 2, 3); // Admin, Manager, or Buddy