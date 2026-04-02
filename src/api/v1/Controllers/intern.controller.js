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
// ⚠️ UPDATED: Academic info changes now require admin approval
export const updateMyProfile = async (req, res) => {
  try {
    const ProfileChangeRequest = (await import('../Models/profileChangeRequest.js')).default;
    
    const {
      phone, address,
      college_name, course, batch_year,
      enrollment_date, expected_end_date,
      gpa, certifications,
      name
    } = req.body;

    // Direct updates (no approval needed)
    const directUserUpdates = {};
    if (phone !== undefined) directUserUpdates.phone = phone;
    if (address !== undefined) directUserUpdates.address = address;
    if (phone !== undefined || address !== undefined) {
      await User.update(directUserUpdates, { where: { id: req.user.id } });
    }
    // Academic/Sensitive updates (require approval) 
    const sensitiveChanges = {
      ...(college_name !== undefined && { college_name }),
      ...(course !== undefined && { course }),
      ...(batch_year !== undefined && { batch_year }),
      ...(enrollment_date !== undefined && { enrollment_date }),
      ...(expected_end_date !== undefined && { expected_end_date }),
      ...(gpa !== undefined && { gpa }),
      ...(certifications !== undefined && { certifications }),
    };

    const existingTrainee = await Trainee.findOne({ where: { user_id: req.user.id } });

    // If there are sensitive changes, create approval request
    if (Object.keys(sensitiveChanges).length > 0) {
      // Get old values
      let old_values = {};
      if (existingTrainee) {
        old_values = {
          college_name: existingTrainee.college_name,
          course: existingTrainee.course,
          gpa: existingTrainee.gpa
        };
      }

      // Create profile change request
      await ProfileChangeRequest.create({
        user_id: req.user.id,
        change_type: 'academic_info',
        old_values,
        new_values: sensitiveChanges,
        status: 'pending'
      });

      // Notify admins
      const admins = await User.findAll({
        where: { role_id: [1, 5], is_active: 1 },
        attributes: ['id']
      });

      await Promise.all(
        admins.map((admin) => createNotification({
          user_id: admin.id,
          title: 'Academic Profile Update Request',
          message: `${req.user.name} requested to update academic information.`,
          type: 'profile_update',
          link: '/admin/profile-changes'
        }))
      );
    }

    // Get updated profile
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "phone", "address", "role_id", "profile_picture"],
    });

    let trainee = existingTrainee;
    if (existingTrainee) {
      await trainee.reload();
    }

    return res.status(200).json({
      success: true,
      message: Object.keys(sensitiveChanges).length > 0 
        ? "Profile updated. Academic changes require admin approval."
        : "Profile updated successfully",
      data: {
        user: updatedUser.toJSON(),
        trainee: trainee ? trainee.toJSON() : null,
      },
    });
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
