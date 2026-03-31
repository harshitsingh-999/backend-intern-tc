import InternDocument from '../Models/internDocument.js';
import User from '../Models/user.js';
import logger from '../../../helper/logger.js';
import { Op } from 'sequelize';
import { createNotification } from './notification.controller.js';

const buildDocumentFileUrl = (req, fileName) => {
  if (!fileName) return null;
  return `/api/uploads/intern-documents/${req.user.id}/${encodeURIComponent(fileName)}`;
};

const sendSuccess = (res, status, message, data) => {
  return res.status(status).json({ success: true, status: true, message, data });
};

const sendError = (res, status, message) => {
  return res.status(status).json({ success: false, status: false, message });
};

// Intern uploads a document
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file uploaded.');
    const { doc_type } = req.body;
    const allowed = ['10th_marksheet', '12th_marksheet', 'aadhar', 'pan_card', 'other'];
    if (!allowed.includes(doc_type)) return sendError(res, 400, 'Invalid document type.');

    const file_path = buildDocumentFileUrl(req, req.file.filename);
    const doc = await InternDocument.create({
      user_id: req.user.id, doc_type, file_path, original_name: req.file.originalname,
    });

    const adminUsers = await User.findAll({
      where: {
        role_id: { [Op.in]: [1, 5] },
        is_active: 1
      },
      attributes: ['id']
    });

    await Promise.all(
      adminUsers.map((admin) => createNotification({
        user_id: admin.id,
        title: 'New intern document',
        message: `${req.user.name} uploaded a ${doc_type} document for review.`,
        type: 'document',
        link: '/documents'
      }))
    );

    return sendSuccess(res, 201, 'Document uploaded. Pending admin approval.', doc);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Intern views their own documents
export const getMyDocuments = async (req, res) => {
  try {
    const docs = await InternDocument.findAll({ where: { user_id: req.user.id }, order: [['createdAt', 'DESC']] });
    return sendSuccess(res, 200, 'Documents fetched.', docs);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Admin views all pending documents
export const getAllDocuments = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const docs = await InternDocument.findAll({
      where, order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'intern', attributes: ['id', 'name', 'email'] }],
    });
    return sendSuccess(res, 200, 'Documents fetched.', docs);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Admin approves or rejects a document
export const reviewDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;
    if (!['approved', 'rejected'].includes(status)) return sendError(res, 400, 'Status must be approved or rejected.');

    const doc = await InternDocument.findByPk(id);
    if (!doc) return sendError(res, 404, 'Document not found.');

    doc.status = status;
    doc.admin_note = admin_note || null;
    doc.reviewed_by = req.user.id;
    await doc.save();

    await createNotification({
      user_id: doc.user_id,
      title: `Document ${status}`,
      message: `Your ${doc.doc_type} document was ${status}.`,
      type: 'document',
      link: '/documents'
    });

    return sendSuccess(res, 200, `Document ${status}.`, doc);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};
