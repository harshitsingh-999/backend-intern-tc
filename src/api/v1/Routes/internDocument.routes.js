import express from 'express';
import { authenticate, checkInternExpiry } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { requireAdmin } from '../../../middlewares/role.middleware.js';
import { uploadDocument as uploadMiddleware } from '../../../middlewares/upload.js';
import { uploadDocument, getMyDocuments, getAllDocuments, reviewDocument } from '../Controllers/internDocument.controller.js';
import InternDocument from '../Models/internDocument.js';

const router = express.Router();

// Intern routes
router.post('/upload', authenticate, requireRole(4), checkInternExpiry, uploadMiddleware.single('document'), uploadDocument);
router.get('/my', authenticate, requireRole(4), checkInternExpiry, getMyDocuments);

// Admin routes
router.get('/all', authenticate, requireAdmin, getAllDocuments);
router.patch('/:id/review', authenticate, requireAdmin, reviewDocument);

export default router;