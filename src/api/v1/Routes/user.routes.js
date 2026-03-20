
import express from "express";
import { registerUser, loginUser, getUserStats, forgotPassword, resetPassword } from "../Controllers/user.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { requireManager, requireAdmin } from "../../../middlewares/role.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login",    loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password",  resetPassword);
// router.post("/upload-profile", upload.single("image"), uploadProfile);

// Protected: any authenticated user can read dashboard stats
router.get("/stats", authenticate, getUserStats);

// Protected: Manager + Admin can list all users
router.get("/", authenticate, requireManager, async (req, res) => {
  // Placeholder — you'll move this to a controller later
  return res.status(200).json({ success: true, message: "User list (manager view)" });
});

// Protected: Admin only
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  return res.status(200).json({ success: true, message: `Delete user ${req.params.id} (admin only)` });
});

export default router;
