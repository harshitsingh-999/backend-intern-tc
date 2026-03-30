import DailyReport from '../Models/dailyreports.js';
import Trainee from '../Models/trainee.js';
import User from '../Models/user.js';
import logger from '../../../helper/logger.js';
import { createNotification } from './notification.controller.js';
import { sendDailyReportEmail } from '../../../utils/sendEmail.js';

const sendSuccess = (res, status, message, data) =>
  res.status(status).json({ success: true, status: true, message, data });

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, status: false, message });

// Intern submits daily report
export const submitDailyReport = async (req, res) => {
  try {
    const intern_user_id = req.user.id;
    const { report_date, work_done, blockers, plan_tomorrow } = req.body;

    if (!report_date || !work_done) {
      return sendError(res, 400, 'Report date and work done are required.');
    }

    const trainee = await Trainee.findOne({ where: { user_id: intern_user_id } });
    if (!trainee) return sendError(res, 404, 'Intern profile not found.');

    const manager_user_id = trainee.manager_id || null;
    if (!manager_user_id) return sendError(res, 400, 'No manager assigned to this intern.');

    const existing = await DailyReport.findOne({ where: { intern_user_id, report_date } });
    if (existing) return sendError(res, 409, 'Report for this date already submitted.');

    const report = await DailyReport.create({
      intern_user_id, manager_user_id, report_date, work_done, blockers, plan_tomorrow,
    });

    // In-app notification to manager
    await createNotification({
      user_id: manager_user_id,
      title: 'New Daily Report',
      message: `${req.user.name} submitted a daily report for ${report_date}.`,
      type: 'report',
      link: '/manager/daily-reports',
    });

    // Email to manager (non-blocking — failure won't break the response)
    try {
      const manager = await User.findByPk(manager_user_id, { attributes: ['id', 'name', 'email'] });
      if (manager?.email) {
        await sendDailyReportEmail({
          managerEmail: manager.email,
          managerName: manager.name,
          internName: req.user.name,
          reportDate: report_date,
          workDone: work_done,
          blockers,
          planTomorrow: plan_tomorrow,
        });
      }
    } catch (emailErr) {
      logger.warn('Daily report email failed (non-blocking):', emailErr?.message);
    }

    return sendSuccess(res, 201, 'Daily report submitted.', report);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Intern views their own reports
export const getMyDailyReports = async (req, res) => {
  try {
    const reports = await DailyReport.findAll({
      where: { intern_user_id: req.user.id },
      order: [['report_date', 'DESC']],
    });
    return sendSuccess(res, 200, 'Daily reports fetched.', reports);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Manager views reports from their interns
export const getInternDailyReports = async (req, res) => {
  try {
    const manager_user_id = req.user.id;
    const reports = await DailyReport.findAll({
      where: { manager_user_id },
      include: [{ model: User, as: 'intern', attributes: ['id', 'name', 'email'] }],
      order: [['report_date', 'DESC']],
    });
    return sendSuccess(res, 200, 'Intern daily reports fetched.', reports);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};

// Alias used by some routes
export const getManagerReports = getInternDailyReports;

// Manager acknowledges a report
export const acknowledgeDailyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await DailyReport.findOne({ where: { id, manager_user_id: req.user.id } });
    if (!report) return sendError(res, 404, 'Report not found.');

    report.status = 'acknowledged';
    await report.save();

    await createNotification({
      user_id: report.intern_user_id,
      title: 'Daily report acknowledged',
      message: `Your daily report for ${report.report_date} was acknowledged by your manager.`,
      type: 'report',
      link: '/daily-report',
    });

    return sendSuccess(res, 200, 'Report acknowledged.', report);
  } catch (error) {
    logger.error(error);
    return sendError(res, 500, 'Internal Server Error');
  }
};
