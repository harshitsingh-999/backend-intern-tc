import express from 'express';
import authController from '../Controllers/auth.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

// ---------------- Authentication Routes ----------------

router.post('/login', authController.login);   
router.get("/me",     authenticate, authController.me);
router.post("/logout", authenticate, authController.logout);

export default router;


// import express from "express";
// import authController from "../Controllers/auth.controller.js";
// import { authenticate } from "../../../middlewares/auth.middleware.js";

// const router = express.Router();

// // Public routes (no auth needed)
// router.post("/login", authController.login);

// // Protected routes (must be logged in)
// router.get("/me",     authenticate, authController.me);
// router.post("/logout", authenticate, authController.logout);

// export default router;
