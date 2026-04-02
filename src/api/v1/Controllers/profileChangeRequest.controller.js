import ProfileChangeRequest from '../Models/profileChangeRequest.js';
import User from '../Models/user.js';
import Trainee from '../Models/trainee.js';
import logger from '../../../helper/logger.js';
import { createNotification } from './notification.controller.js';
import { sendEmail } from '../../../utils/sendEmail.js';

const sendSuccess = (res, status, message, data) => {
  return res.status(status).json({ success: true, status: true, message, data });
};

const sendError = (res, status, message) => {
  return res.status(status).json({ success: false, status: false, message });
};

// Intern requests to change profile
export const requestProfileChange = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { change_type, new_values } = req.body;

    if (!change_type || !new_values) {
      return sendError(res, 400, 'change_type and new_values are required.');
    }

    if (!['personal_info', 'contact_info', 'academic_info'].includes(change_type)) {
      return sendError(res, 400, 'Invalid change_type. Must be personal_info, contact_info, or academic_info.');
    }

    // Get old values from user/trainee
    const user = await User.findByPk(user_id);
    const trainee = await Trainee.findOne({ where: { user_id } });

    let old_values = {};
    if (change_type === 'personal_info') {
      old_values = { name: user?.name };
    } else if (change_type === 'contact_info') {
      old_values = { phone: user?.phone, address: user?.address };
    } else if (change_type === 'academic_info') {
      old_values = { college_name: trainee?.college_name, course: trainee?.course, gpa: trainee?.gpa };
    }

    const request = await ProfileChangeRequest.create({
      user_id,
      change_type,
      old_values,
      new_values,
      status: 'pending'
    });

    // Notify admins
    const admins = await User.findAll({
      where: { role_id: [1, 5], is_active: 1 },
      attributes: ['id', 'email', 'name']
    });

    await Promise.all(
      admins.map((admin) => createNotification({
        user_id: admin.id,
        title: 'Profile Update Request',
        message: `${req.user.name} requested to update their ${change_type.replace(/_/g, ' ')}.`,
        type: 'profile_update',
        link: `/admin/documents?tab=profiles`
      }))
    );

    return sendSuccess(res, 201, 'Profile change request submitted. Awaiting admin approval.', request);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Get intern's own profile change requests
export const getMyProfileChangeRequests = async (req, res) => {
  try {
    const requests = await ProfileChangeRequest.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    return sendSuccess(res, 200, 'Profile change requests fetched.', requests);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Admin views all profile change requests
export const getAllProfileChangeRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const requests = await ProfileChangeRequest.findAll({
      where,
      include: [
        { model: User, as: 'requestor', attributes: ['id', 'name', 'email', 'role_id'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return sendSuccess(res, 200, 'Profile change requests fetched.', requests);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Admin approves a profile change request
export const approveProfileChange = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_note } = req.body;

    const request = await ProfileChangeRequest.findByPk(id);
    if (!request) {
      return sendError(res, 404, 'Profile change request not found.');
    }

    // Apply the changes to user/trainee
    const { change_type, new_values, user_id } = request;
    const user = await User.findByPk(user_id);

    try {
      if (change_type === 'personal_info') {
        await user.update({ name: new_values.name });
      } else if (change_type === 'contact_info') {
        await user.update({ phone: new_values.phone, address: new_values.address });
      } else if (change_type === 'academic_info') {
        const trainee = await Trainee.findOne({ where: { user_id } });
        if (trainee) {
          await trainee.update({
            college_name: new_values.college_name,
            course: new_values.course,
            gpa: new_values.gpa
          });
        }
      }
    } catch (updateError) {
      logger.error('Error applying profile changes:', updateError);
      return sendError(res, 500, 'Error applying profile changes.');
    }

    // Update request status
    request.status = 'completed';
    request.reviewed_by = req.user.id;
    request.reviewed_at = new Date();
    request.admin_note = admin_note || null;
    await request.save();

    // Notify user
    await createNotification({
      user_id,
      title: 'Profile Update Approved',
      message: `Your profile update request for ${change_type.replace(/_/g, ' ')} was approved.`,
      type: 'profile_update',
      link: '/profile'
    });

    // Send email
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: 'Profile Update Approved ✅',
        text: `Your ${change_type.replace(/_/g, ' ')} update has been approved and is now active.`
      });
    }

    return sendSuccess(res, 200, 'Profile change approved and applied.', request);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Admin rejects a profile change request
export const rejectProfileChange = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_note } = req.body;

    const request = await ProfileChangeRequest.findByPk(id);
    if (!request) {
      return sendError(res, 404, 'Profile change request not found.');
    }

    request.status = 'rejected';
    request.reviewed_by = req.user.id;
    request.reviewed_at = new Date();
    request.admin_note = admin_note || 'No reason provided.';
    await request.save();

    // Notify user
    await createNotification({
      user_id: request.user_id,
      title: 'Profile Update Rejected',
      message: `Your profile update request was rejected. Reason: ${request.admin_note}`,
      type: 'profile_update',
      link: '/profile'
    });

    // Send email
    const user = await User.findByPk(request.user_id);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: 'Profile Update Rejected',
        text: `Your ${request.change_type.replace(/_/g, ' ')} update was rejected.\n\nReason: ${request.admin_note}`
      });
    }

    return sendSuccess(res, 200, 'Profile change request rejected.', request);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};