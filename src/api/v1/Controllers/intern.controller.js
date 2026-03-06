import fs from "fs/promises";
import path from "path";
import Task from "../Models/task.js";
import User from "../Models/user.js";
import TaskSubmission from "../Models/taskSubmission.js";
import logger from "../../../helper/logger.js";
import rootPath from "../../../helper/rootPath.js";

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
