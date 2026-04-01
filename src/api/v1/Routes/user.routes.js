
import express from "express";
import { registerUser, loginUser, getUserStats, forgotPassword, resetPassword, uploadProfile } from "../Controllers/user.controller.js";
import adminUserController from "../Controllers/admin.user.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { requireManager, requireAdmin } from "../../../middlewares/role.middleware.js";
import upload from "../../../middlewares/upload.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
// router.post("/forgot-password", forgotPassword);
// router.post("/reset-password", resetPassword);
router.post("/upload-profile", authenticate, upload.single("image"), uploadProfile);

// Protected: any authenticated user can read dashboard stats
router.get("/stats", authenticate, getUserStats);

// Protected: Manager + Admin can list all users
router.get("/", authenticate, requireManager, adminUserController.getAllUsers);

// Protected: Admin only - delete user
router.delete("/:id", authenticate, requireAdmin, adminUserController.deleteUser);

export default router;
