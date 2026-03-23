import { Op } from "sequelize";
import Task from "../api/v1/Models/task.js";
import User from "../api/v1/Models/user.js";
import Project from "../api/v1/Models/project.js";
import SystemSetting from "../api/v1/Models/systemSetting.js";
import logger from "../helper/logger.js";
import { sendTaskDeadlineReminderEmail } from "../utils/sendEmail.js";

const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";
const RUN_INTERVAL_MS = 60 * 60 * 1000;

let reminderIntervalId = null;

const getDateParts = (date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
};

const formatDateForQuery = (date) => {
  const parts = getDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const shiftDate = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const buildReminderKey = (taskId, dueDate, stage) => `task-reminder:${taskId}:${dueDate}:${stage}`;

const claimReminderDelivery = async (task, stage) => {
  const reminderKey = buildReminderKey(task.id, task.due_date, stage);

  const [marker, created] = await SystemSetting.findOrCreate({
    where: { key: reminderKey },
    defaults: {
      value: new Date().toISOString(),
      category: "task_reminder",
      description: `Delivery marker for ${stage} reminder on task ${task.id}`
    }
  });

  return { marker, created };
};

const runReminderPass = async () => {
  const today = new Date();
  const todayString = formatDateForQuery(today);
  const tomorrowString = formatDateForQuery(shiftDate(today, 1));

  const tasks = await Task.findAll({
    where: {
      due_date: { [Op.in]: [todayString, tomorrowString] },
      status: { [Op.not]: "completed" }
    },
    include: [
      { model: User, as: "assignee", attributes: ["id", "name", "email"] },
      { model: User, as: "assigner", attributes: ["id", "name", "email"] },
      { model: Project, attributes: ["id", "project_name"] }
    ]
  });

  for (const task of tasks) {
    const stage = task.due_date === todayString ? "due_today" : "due_tomorrow";

    if (!task.assignee?.email) {
      logger.warn(`Skipping deadline reminder for task ${task.id} because assignee email is missing`);
      continue;
    }

    const reminderClaim = await claimReminderDelivery(task, stage);
    if (!reminderClaim.created) {
      continue;
    }

    const sent = await sendTaskDeadlineReminderEmail({
      assigneeEmail: task.assignee.email,
      assigneeName: task.assignee.name,
      title: task.title,
      dueDate: task.due_date,
      priority: task.priority,
      projectName: task.project?.project_name,
      assignerName: task.assigner?.name,
      stage
    });

    if (!sent) {
      await reminderClaim.marker.destroy();
      logger.warn(`Deadline reminder could not be delivered for task ${task.id}; delivery marker removed so it can retry later`);
    }
  }
};

const runReminderPassSafely = async () => {
  try {
    await runReminderPass();
  } catch (error) {
    logger.error(`Task deadline reminder job failed: ${error.message}`);
  }
};

export const startTaskDeadlineReminderJob = () => {
  if (reminderIntervalId) {
    return reminderIntervalId;
  }

  void runReminderPassSafely();
  reminderIntervalId = setInterval(() => {
    void runReminderPassSafely();
  }, RUN_INTERVAL_MS);

  logger.info("Task deadline reminder job started");
  return reminderIntervalId;
};
