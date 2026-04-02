import Leave from '../Models/leave.js';
import LeaveBalance from '../Models/leaveBalance.js';
import Trainee from '../Models/trainee.js';
import User from '../Models/user.js';
import logger from '../../../helper/logger.js';
import { createNotification } from './notification.controller.js';
import { sendEmail } from '../../../utils/sendEmail.js';
import { Op } from 'sequelize';

const sendSuccess = (res, status, message, data) => {
  return res.status(status).json({ success: true, status: true, message, data });
};

const sendError = (res, status, message) => {
  return res.status(status).json({ success: false, status: false, message });
};

// Get or initialize leave balance for trainee
const getOrCreateLeaveBalance = async (trainee_id, year = null) => {
  const currentYear = year || new Date().getFullYear();
  let balance = await LeaveBalance.findOne({ where: { trainee_id, year: currentYear } });
  
  if (!balance) {
    balance = await LeaveBalance.create({
      trainee_id,
      year: currentYear
    });
  }
  
  return balance;
};

// Intern applies for leave
export const applyLeave = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });
    if (!trainee) {
      return sendError(res, 404, 'Trainee record not found. Please complete your profile first.');
    }

    const { leave_date, leave_type = 'casual', leave_reason } = req.body;

    if (!leave_date) {
      return sendError(res, 400, 'leave_date is required');
    }

    const validTypes = ['casual', 'sick', 'emergency', 'personal', 'unpaid'];
    if (!validTypes.includes(leave_type)) {
      return sendError(res, 400, 'leave_type must be one of: casual, sick, emergency, personal, unpaid');
    }

    // Check if leave already exists for this date
    const existing = await Leave.findOne({
      where: { trainee_id: trainee.id, leave_date, status: { [Op.ne]: 'rejected' } }
    });
    if (existing) {
      return sendError(res, 409, 'Leave already exists for this date');
    }

    // Get current year leave balance
    const balance = await getOrCreateLeaveBalance(trainee.id);

    // Check if unpaid leave or if they have balance
    if (leave_type !== 'unpaid') {
      const balanceField = `${leave_type}_leaves`;
      const usedField = `${leave_type}_used`;
      const available = balance[balanceField] - balance[usedField];
      
      if (available <= 0) {
        return sendError(res, 400, `No ${leave_type} leaves available for this year`);
      }
    }

    // Create leave request
    const leave = await Leave.create({
      trainee_id: trainee.id,
      leave_date,
      leave_type,
      leave_reason: leave_reason || null,
      status: 'pending'
    });

    // Notify manager
    if (trainee.manager_id) {
      const manager = await User.findByPk(trainee.manager_id);
      if (manager) {
        await createNotification({
          user_id: trainee.manager_id,
          title: 'Leave Request Pending',
          message: `${req.user.name} has requested ${leave_type} leave for ${leave_date}.`,
          type: 'leave',
          link: `/manager/leaves`
        });

        if (manager.email) {
          await sendEmail({
            to: manager.email,
            subject: 'Leave Request from Intern',
            text: `${req.user.name} has applied for ${leave_type} leave on ${leave_date}.\n\nReason: ${leave_reason || 'Not provided'}\n\nPlease approve or reject the request.`
          });
        }
      }
    }

    return sendSuccess(res, 201, 'Leave request submitted', leave);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Intern views their leaves
export const getMyLeaves = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });
    if (!trainee) {
      return sendSuccess(res, 200, 'No leaves', []);
    }

    const leaves = await Leave.findAll({
      where: { trainee_id: trainee.id },
      order: [['leave_date', 'DESC']]
    });

    return sendSuccess(res, 200, 'Leaves fetched', leaves);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Intern cancels a leave
export const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });
    if (!trainee) {
      return sendError(res, 404, 'Trainee record not found');
    }

    const leave = await Leave.findOne({ where: { id, trainee_id: trainee.id } });
    if (!leave) {
      return sendError(res, 404, 'Leave not found');
    }

    if (leave.status !== 'pending') {
      return sendError(res, 400, 'Can only cancel pending leave requests');
    }

    await leave.update({ status: 'cancelled' });

    // Notify manager
    if (trainee.manager_id) {
      const manager = await User.findByPk(trainee.manager_id);
      if (manager) {
        await createNotification({
          user_id: trainee.manager_id,
          title: 'Leave Request Cancelled',
          message: `${req.user.name} cancelled ${leave.leave_type} leave request for ${leave.leave_date}.`,
          type: 'leave',
          link: `/manager/leaves`
        });
      }
    }

    return sendSuccess(res, 200, 'Leave cancelled', leave);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Get leave balance for intern
export const getLeaveBalance = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });
    if (!trainee) {
      return sendError(res, 404, 'Trainee record not found');
    }

    const currentYear = new Date().getFullYear();
    const balance = await getOrCreateLeaveBalance(trainee.id, currentYear);

    // Get pending leaves count for each type
    const pendingLeaves = await Leave.findAll({
      where: { trainee_id: trainee.id, status: 'pending' }
    });

    const pendingByType = {};
    ['casual', 'sick', 'emergency', 'personal'].forEach(type => {
      pendingByType[type] = pendingLeaves.filter(l => l.leave_type === type).length;
    });

    const result = {
      year: currentYear,
      casual: {
        total: balance.casual_leaves,
        used: balance.casual_used,
        pending: pendingByType.casual || 0,
        available: balance.casual_leaves - balance.casual_used - (pendingByType.casual || 0)
      },
      sick: {
        total: balance.sick_leaves,
        used: balance.sick_used,
        pending: pendingByType.sick || 0,
        available: balance.sick_leaves - balance.sick_used - (pendingByType.sick || 0)
      },
      emergency: {
        total: balance.emergency_leaves,
        used: balance.emergency_used,
        pending: pendingByType.emergency || 0,
        available: balance.emergency_leaves - balance.emergency_used - (pendingByType.emergency || 0)
      },
      personal: {
        total: balance.personal_leaves,
        used: balance.personal_used,
        pending: pendingByType.personal || 0,
        available: balance.personal_leaves - balance.personal_used - (pendingByType.personal || 0)
      }
    };

    return sendSuccess(res, 200, 'Leave balance fetched', result);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Manager views leave requests from their interns
export const getPendingLeaveRequests = async (req, res) => {
  try {
    const manager_id = req.user.id;

    const trainees = await Trainee.findAll({
      where: { manager_id },
      attributes: ['id']
    });

    const traineeIds = trainees.map(t => t.id);

    if (traineeIds.length === 0) {
      return sendSuccess(res, 200, 'No leave requests', []);
    }

    const leaves = await Leave.findAll({
      where: { trainee_id: { [Op.in]: traineeIds }, status: 'pending' },
      include: [
        {
          model: Trainee,
          attributes: ['id', 'user_id'],
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return sendSuccess(res, 200, 'Pending leave requests fetched', leaves);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Manager approves leave
export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const manager_id = req.user.id;

    const leave = await Leave.findByPk(id, {
      include: [{ model: Trainee, attributes: ['id', 'user_id', 'manager_id'] }]
    });

    if (!leave) {
      return sendError(res, 404, 'Leave not found');
    }

    if (leave.Trainee.manager_id !== manager_id) {
      return sendError(res, 403, 'Not authorized to approve this leave');
    }

    if (leave.status !== 'pending') {
      return sendError(res, 400, 'Can only approve pending leave requests');
    }

    // Update leave balance
    const currentYear = new Date().getFullYear();
    const balance = await getOrCreateLeaveBalance(leave.trainee_id, currentYear);
    const usedField = `${leave.leave_type}_used`;

    if (leave.leave_type !== 'unpaid') {
      await balance.increment(usedField);
    }

    // Update leave status
    leave.status = 'approved';
    leave.approved_by = manager_id;
    leave.approved_at = new Date();
    await leave.save();

    // Notify intern
    const user = await User.findByPk(leave.Trainee.user_id);
    if (user) {
      await createNotification({
        user_id: leave.Trainee.user_id,
        title: 'Leave Approved',
        message: `Your ${leave.leave_type} leave for ${leave.leave_date} has been approved.`,
        type: 'leave',
        link: '/myleaves'
      });

      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Leave Request Approved ✅',
          text: `Your ${leave.leave_type} leave request for ${leave.leave_date} has been approved.`
        });
      }
    }

    return sendSuccess(res, 200, 'Leave approved', leave);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Manager rejects leave
export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const manager_id = req.user.id;

    const leave = await Leave.findByPk(id, {
      include: [{ model: Trainee, attributes: ['id', 'user_id', 'manager_id'] }]
    });

    if (!leave) {
      return sendError(res, 404, 'Leave not found');
    }

    if (leave.Trainee.manager_id !== manager_id) {
      return sendError(res, 403, 'Not authorized to reject this leave');
    }

    if (leave.status !== 'pending') {
      return sendError(res, 400, 'Can only reject pending leave requests');
    }

    leave.status = 'rejected';
    leave.approved_by = manager_id;
    leave.approved_at = new Date();
    leave.rejection_reason = rejection_reason || null;
    await leave.save();

    // Notify intern
    const user = await User.findByPk(leave.Trainee.user_id);
    if (user) {
      await createNotification({
        user_id: leave.Trainee.user_id,
        title: 'Leave Rejected',
        message: `Your ${leave.leave_type} leave for ${leave.leave_date} has been rejected. Reason: ${rejection_reason || 'Not provided'}`,
        type: 'leave',
        link: '/myleaves'
      });

      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Leave Request Rejected',
          text: `Your ${leave.leave_type} leave request for ${leave.leave_date} has been rejected.\n\nReason: ${rejection_reason || 'Not provided'}`
        });
      }
    }

    return sendSuccess(res, 200, 'Leave rejected', leave);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Get all leave requests (for admin dashboard)
export const getAllLeaveRequests = async (req, res) => {
  try {
    const { status, leave_type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (leave_type) where.leave_type = leave_type;

    const leaves = await Leave.findAll({
      where,
      include: [
        {
          model: Trainee,
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        },
        { model: User, as: 'approver', attributes: ['id', 'name'], foreignKey: 'approved_by' }
      ],
      order: [['createdAt', 'DESC']]
    });

    return sendSuccess(res, 200, 'Leave requests fetched', leaves);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};
