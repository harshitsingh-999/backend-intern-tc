import express from 'express';
import adminController from '../Controllers/adminController.js';
import adminAuth from '../../../middlewares/adminAuth.js';

const router = express.Router();

router.get('/dashboard', adminAuth, adminController.dashboard);   
router.post('/create-user', adminAuth, adminController.createUser);  //  New ROUTE

router.post('/users', adminAuth, adminController.createUser);       
router.get('/users', adminAuth, adminController.getUsers);          
router.get('/trainees', adminAuth, adminController.getTrainees);    

export default router;
