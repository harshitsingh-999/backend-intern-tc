import nodemailer from "nodemailer";
import dotenv from "dotenv";
import logger from "../helper/logger.js";

dotenv.config();

const DEFAULT_PORTAL_BASE_URL = "http://localhost:5173";
const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

export const getPortalBaseUrl = () => {
  const configuredOrigins = String(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return (configuredOrigins[0] || DEFAULT_PORTAL_BASE_URL).replace(/\/$/, "");
};

export const buildPortalUrl = (pathname = "/", query = {}) => {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(normalizedPath, `${getPortalBaseUrl()}/`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

const PORTAL_LOGIN_URL = buildPortalUrl("/login");

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

const buildEmailLayout = ({ name, email, password, loginUrl }) => {
  return buildEmailLayout({
    heading: "Your Account Has Been Created 🎉",
    
    intro: `Hello ${name},

Your account for the Intern Management System has been successfully created. Please find your login credentials below:`,

    details: [
      { label: "Email", value: email },
      { label: "Password", value: password },
      { label: "Login URL", value: loginUrl }
    ],

    ctaLabel: "Login Now",
    ctaHref: loginUrl,

    footer: `For security reasons, we recommend changing your password after your first login.

If you face any issues, please contact your administrator.`
  });
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

export const sendPasswordResetEmail = async ({ toEmail, userName, resetLink }) => {
  const html = buildEmailLayout({
    heading: "Reset Your Password",
    intro: `Hello ${userName || "User"}, we received a request to reset your password.`,
    details: [
      { label: "Requested For", value: toEmail },
      { label: "Link Expires", value: "15 minutes from now" },
    ],
    ctaLabel: "Reset Password",
    ctaHref: resetLink,
    footer: "If you did not request this, you can safely ignore this email. Your password will not change.",
  });

  return sendEmail(toEmail, "Password Reset Request", html);
};
