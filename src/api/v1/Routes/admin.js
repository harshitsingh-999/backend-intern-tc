import express from 'express';
import adminController from '../Controllers/adminController.js';
import adminAuth from '../../../middlewares/adminAuth.js';

const router = express.Router();

router.get('/dashboard', adminAuth, adminController.dashboard);     // ← require() hata diya
router.post('/users', adminAuth, adminController.createUser);       // ← require() hata diya  
router.get('/users', adminAuth, adminController.getUsers);          // ← require() hata diya
router.get('/trainees', adminAuth, adminController.getTrainees);    // ← require() hata diya

export default router;
