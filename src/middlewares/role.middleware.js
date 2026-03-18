// Role IDs: 1=Admin  2=Manager  3=Buddy  4=Intern  5=SuperAdmin

export const requireRole = (...allowedRoleIds) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const userRoleId = Number(req.user.role_id);
    // SuperAdmin (5) always has access to everything
    if (userRoleId === 5 || allowedRoleIds.includes(userRoleId)) {
      return next();
    }
    return res.status(403).json({ success: false, message: "Access denied" });
  };
};

export const requireAdmin      = requireRole(1);
export const requireManager    = requireRole(1, 2);
export const requireBuddy      = requireRole(1, 2, 3);
export const requireIntern     = requireRole(1, 2, 3, 4);
export const requireSuperAdmin = requireRole(5);
