import fs from "fs/promises";
import path from "path";
import Task from "../Models/task.js";
import User from "../Models/user.js";
import TaskSubmission from "../Models/taskSubmission.js";
import Attendance from "../Models/attendance.js";
import logger from "../../../helper/logger.js";
import rootPath from "../../../helper/rootPath.js";
import Trainee    from "../Models/trainee.js";
import Evaluation from "../Models/evaluation.js";
import { sendTaskSubmittedEmail } from "../../../utils/sendEmail.js";
import { createNotification } from "./notification.controller.js";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const toSafeFilename = (name = "submission.txt") => {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, "_");
};

const buildSubmissionFileUrl = (req, taskId, fileName) => {
  if (!fileName) return null;
  const encoded = encodeURIComponent(fileName);
  return `${req.protocol}://${req.get("host")}/api/uploads/task-submissions/${taskId}/${encoded}`;
};

// GET /api/v1/intern/tasks - tasks assigned to logged-in intern
export const getMyAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { assigned_to: req.user.id },
      include: [{ model: User, as: "assigner", attributes: ["id", "name", "email"] }],
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// POST /api/v1/intern/tasks/:id/submit - submit task notes and optional file
export const submitAssignedTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, assigned_to: req.user.id }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or not assigned to you" });
    }

    const workNotes = String(req.body?.work_notes || "").trim();
    if (!workNotes) {
      return res.status(400).json({ success: false, message: "work_notes is required" });
    }

    const requestedStatus = req.body?.status || "review";
    const allowedStatuses = ["in_progress", "review", "completed"];
    if (!allowedStatuses.includes(requestedStatus)) {
      return res.status(400).json({
        success: false,
        message: "status must be one of in_progress, review, completed"
      });
    }

    const completion = req.body?.completion_percentage ?? (requestedStatus === "completed" ? 100 : task.completion_percentage);
    const completionNumber = Number(completion);
    if (!Number.isFinite(completionNumber) || completionNumber < 0 || completionNumber > 100) {
      return res.status(400).json({
        success: false,
        message: "completion_percentage must be between 0 and 100"
      });
    }

    let fileName = null;
    let filePath = null;
    let mimeType = null;
    let fileSize = null;

    const filePayload = req.body?.file;
    if (filePayload && filePayload.data) {
      const safeOriginalName = toSafeFilename(filePayload.name);
      const base64String = String(filePayload.data).replace(/^data:.*;base64,/, "");
      const buffer = Buffer.from(base64String, "base64");

      if (!buffer.length) {
        return res.status(400).json({ success: false, message: "file data is empty" });
      }
      if (buffer.length > MAX_FILE_SIZE_BYTES) {
        return res.status(400).json({ success: false, message: "file size must be less than 10MB" });
      }

      const uploadDir = path.join(rootPath, "uploads", "task-submissions", String(task.id));
      await fs.mkdir(uploadDir, { recursive: true });

      fileName = `${Date.now()}-${safeOriginalName}`;
      filePath = path.join(uploadDir, fileName);
      mimeType = filePayload.type || null;
      fileSize = buffer.length;

      await fs.writeFile(filePath, buffer);
    }

    const submission = await TaskSubmission.create({
      task_id: task.id,
      submitted_by: req.user.id,
      work_notes: workNotes,
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      mime_type: mimeType
    });

    await task.update({
      status: requestedStatus,
      completion_percentage: completionNumber
    });

    const manager = await User.findByPk(task.assigned_by, {
      attributes: ["id", "name", "email"]
    });

    await sendTaskSubmittedEmail({
      managerEmail: manager?.email,
      managerName: manager?.name,
      internName: req.user.name,
      taskTitle: task.title,
      submissionStatus: requestedStatus,
      completionPercentage: completionNumber,
      workNotes,
      fileAttached: Boolean(fileName)
    });

    return res.status(200).json({
      success: true,
      message: "Task submitted successfully",
      data: {
        ...submission.toJSON(),
        file_url: buildSubmissionFileUrl(req, task.id, fileName)
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// GET /api/v1/intern/evaluations
export const getMyEvaluations = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } })
    if (!trainee) return res.status(200).json({ success: true, data: [] })

    const evals = await Evaluation.findAll({
      where: { trainee_id: trainee.id },
      order: [['evaluation_date', 'DESC']],
    })
    return res.status(200).json({ success: true, data: evals })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}


// GET /api/v1/intern/profile
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "phone", "address", "role_id", "profile_picture"],
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });
    return res.status(200).json({
      success: true,
      data: { user: user.toJSON(), trainee: trainee ? trainee.toJSON() : null },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// PUT /api/v1/intern/profile
export const updateMyProfile = async (req, res) => {
  try {
    const {
      phone, address,
      college_name, course, batch_year,
      enrollment_date, expected_end_date,
      gpa, certifications,
    } = req.body;

    await User.update(
      {
        ...(phone   !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
      { where: { id: req.user.id } }
    );

    const existingTrainee = await Trainee.findOne({ where: { user_id: req.user.id } });

    const traineeData = {
      ...(college_name      !== undefined && { college_name }),
      ...(course            !== undefined && { course }),
      ...(batch_year        !== undefined && { batch_year: batch_year ? Number(batch_year) : null }),
      ...(enrollment_date   !== undefined && { enrollment_date }),
      ...(expected_end_date !== undefined && { expected_end_date }),
      ...(gpa               !== undefined && { gpa }),
      ...(certifications    !== undefined && { certifications }),
    };

    let trainee;
    if (existingTrainee) {
      await existingTrainee.update(traineeData);
      trainee = existingTrainee;
    } else {
      trainee = await Trainee.create({
        user_id: req.user.id,
        current_status: "pending_approval",
        enrollment_date: enrollment_date || new Date().toISOString().split("T")[0],
        ...traineeData,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: await User.findByPk(req.user.id, {
          attributes: ["id", "name", "email", "phone", "address", "role_id", "profile_picture"],
        }),
        trainee: trainee.toJSON(),
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// POST /api/v1/intern/leaves - intern applies for leave
export const applyLeave = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });
    if (!trainee) {
      return res.status(404).json({ success: false, message: "Trainee record not found. Please complete your profile first." });
    }

    const { leave_date, leave_reason, leave_type = 'casual' } = req.body;
    if (!leave_date) {
      return res.status(400).json({ success: false, message: "leave_date is required" });
    }

    const validTypes = ['casual', 'sick', 'emergency', 'personal'];
    if (!validTypes.includes(leave_type)) {
      return res.status(400).json({ success: false, message: "leave_type must be one of: casual, sick, emergency, personal" });
    }

    // Check leave balance before applying
    const year = new Date(leave_date).getFullYear();
    const yearStart = `${year}-01-01`;
    const yearEnd   = `${year}-12-31`;
    const { Op } = await import('sequelize');

    const usedLeaves = await Attendance.findAll({
      where: {
        trainee_id: trainee.id,
        attendance_date: { [Op.between]: [yearStart, yearEnd] },
        status: ['on_leave', 'pending_leave'],
        leave_type,
      }
    });

    const quota = leave_type === 'sick' ? 6 : leave_type === 'emergency' ? 3 : 12;
    if (usedLeaves.length >= quota) {
      return res.status(400).json({
        success: false,
        message: `${leave_type.charAt(0).toUpperCase() + leave_type.slice(1)} leave quota (${quota} days/year) exhausted`
      });
    }

    // Check if a record already exists for this date
    const existing = await Attendance.findOne({
      where: { trainee_id: trainee.id, attendance_date: leave_date }
    });

    if (existing) {
      if (existing.status === 'on_leave') {
        return res.status(400).json({ success: false, message: "Leave already approved for this date" });
      }
      if (existing.status === 'pending_leave') {
        return res.status(400).json({ success: false, message: "Leave request already pending for this date" });
      }
      if (existing.status === 'present') {
        return res.status(400).json({ success: false, message: "You have already checked in on this date" });
      }
      await existing.update({ status: 'pending_leave', leave_reason: leave_reason || null, leave_type, remarks: null });

      if (trainee.manager_id) {
        await createNotification({
          user_id: trainee.manager_id,
          title: 'New leave request',
          message: `${req.user.name} submitted a ${leave_type} leave request for ${leave_date}.`,
          type: 'leave',
          link: '/attendance'
        });
      }

      await createNotification({
        user_id: req.user.id,
        title: 'Leave request submitted',
        message: `Your ${leave_type} leave request for ${leave_date} was submitted to your manager.`,
        type: 'leave',
        link: '/my-leaves'
      });

      return res.status(200).json({ success: true, message: "Leave request submitted for approval", data: existing });
    }

    const record = await Attendance.create({
      trainee_id: trainee.id,
      attendance_date: leave_date,
      status: 'pending_leave',
      leave_reason: leave_reason || null,
      leave_type,
    });

    if (trainee.manager_id) {
      await createNotification({
        user_id: trainee.manager_id,
        title: 'New leave request',
        message: `${req.user.name} submitted a ${leave_type} leave request for ${leave_date}.`,
        type: 'leave',
        link: '/attendance'
      });
    }

    await createNotification({
      user_id: req.user.id,
      title: 'Leave request submitted',
      message: `Your ${leave_type} leave request for ${leave_date} was submitted to your manager.`,
      type: 'leave',
      link: '/my-leaves'
    });

    return res.status(201).json({ success: true, message: "Leave request submitted for approval", data: record });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/intern/leaves - intern views own leave history
export const getMyLeaves = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });
    if (!trainee) {
      return res.status(200).json({ success: true, data: [] });
    }

    const leaves = await Attendance.findAll({
      where: {
        trainee_id: trainee.id,
        status: ['pending_leave', 'on_leave', 'leave_rejected']
      },
      order: [['attendance_date', 'DESC']],
    });

    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// DELETE /api/v1/intern/leaves/:id - cancel a pending leave request
export const cancelLeave = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });
    if (!trainee) {
      return res.status(404).json({ success: false, message: "Trainee record not found" });
    }

    const record = await Attendance.findOne({
      where: { id: req.params.id, trainee_id: trainee.id }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (record.status !== 'pending_leave') {
      return res.status(400).json({
        success: false,
        message: record.status === 'on_leave'
          ? "Cannot cancel an already approved leave. Contact your manager."
          : "This leave request has already been processed."
      });
    }

    await record.destroy();

    if (trainee.manager_id) {
      await createNotification({
        user_id: trainee.manager_id,
        title: 'Leave request cancelled',
        message: `${req.user.name} cancelled the leave request for ${record.attendance_date}.`,
        type: 'leave',
        link: '/attendance'
      });
    }

    return res.status(200).json({ success: true, message: "Leave request cancelled successfully" });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/intern/leave-balance - get leave quota and used counts for current year
export const getLeaveBalance = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ where: { user_id: req.user.id } });
    if (!trainee) {
      return res.status(200).json({
        success: true,
        data: {
          year: new Date().getFullYear(),
          casual:    { total: 12, used: 0, pending: 0, available: 12 },
          sick:      { total: 6,  used: 0, pending: 0, available: 6 },
          emergency: { total: 3,  used: 0, pending: 0, available: 3 },
          personal:  { total: 12, used: 0, pending: 0, available: 12 },
        }
      });
    }

    const { Op } = await import('sequelize');
    const year = new Date().getFullYear();
    const yearStart = `${year}-01-01`;
    const yearEnd   = `${year}-12-31`;

    const allLeaves = await Attendance.findAll({
      where: {
        trainee_id: trainee.id,
        attendance_date: { [Op.between]: [yearStart, yearEnd] },
        status: ['on_leave', 'pending_leave'],
        leave_type: ['casual', 'sick', 'emergency', 'personal'],
      },
      attributes: ['status', 'leave_type'],
    });

    const quotas = { casual: 2, sick: 2, emergency: 2, personal: 2 };
    const balance = {};

    for (const type of ['casual', 'sick', 'emergency', 'personal']) {
      const typeLeaves = allLeaves.filter(l => l.leave_type === type);
      const used    = typeLeaves.filter(l => l.status === 'on_leave').length;
      const pending = typeLeaves.filter(l => l.status === 'pending_leave').length;
      const total   = quotas[type];
      balance[type] = { total, used, pending, available: Math.max(0, total - used - pending) };
    }

    return res.status(200).json({ success: true, data: { year, ...balance } });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/intern/recent-submissions
export const getMyRecentSubmissions = async (req, res) => {
  try {
    const submissions = await TaskSubmission.findAll({
      where: { submitted_by: req.user.id },
      include: [
        { model: Task, attributes: ["title"] }
      ],
      order: [["createdAt", "DESC"]],
      limit: 10
    });
    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
