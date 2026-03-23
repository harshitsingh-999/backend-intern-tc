import nodemailer from "nodemailer";
import dotenv from "dotenv";
import logger from "../helper/logger.js";

dotenv.config();

const PORTAL_BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PORTAL_LOGIN_URL = `${PORTAL_BASE_URL.replace(/\/$/, "")}/login`;
const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const formatDate = (value) => {
  if (!value) return "Not specified";
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

const truncateText = (value = "", maxLength = 180) => {
  const normalized = String(value).trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3)}...`;
};

const buildEmailLayout = ({ heading, intro, details = [], ctaLabel, ctaHref, footer }) => {
  const detailRows = details
    .filter((item) => item?.label && item?.value !== undefined && item?.value !== null && item?.value !== "")
    .map((item) => `
      <tr>
        <td style="padding: 8px 0; color: #4b5563; font-weight: 600; width: 160px;">${escapeHtml(item.label)}</td>
        <td style="padding: 8px 0; color: #111827;">${escapeHtml(item.value)}</td>
      </tr>
    `)
    .join("");

  return `
    <div style="background:#f3f4f6;padding:24px;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
        <h2 style="margin:0 0 12px;color:#111827;">${escapeHtml(heading)}</h2>
        <p style="margin:0 0 20px;color:#374151;line-height:1.6;">${escapeHtml(intro)}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          ${detailRows}
        </table>
        ${ctaHref ? `
          <a href="${escapeHtml(ctaHref)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
            ${escapeHtml(ctaLabel || "Open Portal")}
          </a>
        ` : ""}
        <p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
          ${escapeHtml(footer || "Please log in to the Intern Management portal for full details.")}
        </p>
      </div>
    </div>
  `;
};

const isEmailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

export const sendEmail = async (to, subject, html) => {
  if (!to) {
    logger.warn("Skipping email because recipient address is missing");
    return false;
  }

  if (!isEmailConfigured()) {
    logger.warn("Skipping email because EMAIL_USER or EMAIL_PASS is not configured");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Intern Management" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    logger.info(`Email sent to ${to} with subject "${subject}"`);
    return true;
  } catch (error) {
    logger.error(`Email error for ${to}: ${error.message}`);
    return false;
  }
};

export const sendTaskAssignedEmail = async ({
  assigneeEmail,
  assigneeName,
  title,
  description,
  dueDate,
  startDate,
  priority,
  techStack,
  projectName,
  assignerName
}) => {
  const html = buildEmailLayout({
    heading: "New Task Assigned",
    intro: `Hello ${assigneeName || "Intern"}, a new task has been assigned to you.`,
    details: [
      { label: "Task", value: title },
      { label: "Project", value: projectName || "General" },
      { label: "Assigned By", value: assignerName || "Manager" },
      { label: "Start Date", value: formatDate(startDate) },
      { label: "Due Date", value: formatDate(dueDate) },
      { label: "Priority", value: priority || "medium" },
      { label: "Tech Stack", value: techStack || "Not specified" },
      { label: "Description", value: description || "No description provided" }
    ],
    ctaLabel: "Open Portal",
    ctaHref: PORTAL_LOGIN_URL
  });

  return sendEmail(assigneeEmail, `New Task Assigned: ${title}`, html);
};

export const sendTaskSubmittedEmail = async ({
  managerEmail,
  managerName,
  internName,
  taskTitle,
  submissionStatus,
  completionPercentage,
  workNotes,
  fileAttached
}) => {
  const html = buildEmailLayout({
    heading: "Task Submitted for Review",
    intro: `Hello ${managerName || "Manager"}, ${internName || "an intern"} has submitted progress for a task.`,
    details: [
      { label: "Task", value: taskTitle },
      { label: "Submitted By", value: internName || "Intern" },
      { label: "Status", value: submissionStatus },
      { label: "Completion", value: `${completionPercentage}%` },
      { label: "Attachment", value: fileAttached ? "Yes" : "No" },
      { label: "Work Notes", value: truncateText(workNotes, 240) || "No notes provided" }
    ],
    ctaLabel: "Review Submission",
    ctaHref: PORTAL_LOGIN_URL
  });

  return sendEmail(managerEmail, `Task Submitted: ${taskTitle}`, html);
};

export const sendTaskDeadlineReminderEmail = async ({
  assigneeEmail,
  assigneeName,
  title,
  dueDate,
  priority,
  projectName,
  assignerName,
  stage
}) => {
  const isDueToday = stage === "due_today";
  const heading = isDueToday ? "Task Due Today" : "Task Deadline Reminder";
  const intro = isDueToday
    ? `Hello ${assigneeName || "Intern"}, this task is due today.`
    : `Hello ${assigneeName || "Intern"}, this task is due tomorrow.`;

  const html = buildEmailLayout({
    heading,
    intro,
    details: [
      { label: "Task", value: title },
      { label: "Project", value: projectName || "General" },
      { label: "Assigned By", value: assignerName || "Manager" },
      { label: "Due Date", value: formatDate(dueDate) },
      { label: "Priority", value: priority || "medium" },
      { label: "Reminder Type", value: isDueToday ? "Due today" : "Due tomorrow" }
    ],
    ctaLabel: "Open Tasks",
    ctaHref: PORTAL_LOGIN_URL,
    footer: "Please review your task and update progress in the portal as soon as possible."
  });

  return sendEmail(assigneeEmail, `${heading}: ${title}`, html);
};
