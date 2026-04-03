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

const buildEmailLayout = ({ heading, intro, details = [], ctaLabel, ctaHref, footer }) => {
  const detailRows = details
    .map(({ label, value }) =>
      `<tr>
        <td style="padding:6px 14px 6px 0;font-weight:600;color:#374151;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:6px 0;color:#4b5563;">${escapeHtml(String(value || "—"))}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px;border-radius:10px;border:1px solid #e5e7eb;">
      <div style="background:#2563eb;color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:24px;">
        <h2 style="margin:0;font-size:20px;">${escapeHtml(heading)}</h2>
      </div>
      <p style="color:#4b5563;line-height:1.6;white-space:pre-line;">${escapeHtml(intro)}</p>
      ${details.length
        ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;padding:12px;border-radius:8px;">${detailRows}</table>`
        : ""}
      ${ctaHref
        ? `<a href="${ctaHref}" style="display:inline-block;margin:16px 0;padding:11px 26px;background:#2563eb;color:#fff;border-radius:7px;text-decoration:none;font-weight:600;">${escapeHtml(ctaLabel || "Open Portal")}</a>`
        : ""}
      ${footer
        ? `<p style="color:#9ca3af;font-size:13px;margin-top:20px;border-top:1px solid #f3f4f6;padding-top:14px;line-height:1.5;">${escapeHtml(footer)}</p>`
        : ""}
    </div>
  `;
};


const isEmailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const normalizeEmailPayload = (toOrOptions, subject, html) => {
  if (typeof toOrOptions === "object" && toOrOptions !== null) {
    return {
      to: toOrOptions.to || toOrOptions.toEmail || "",
      subject: toOrOptions.subject || "",
      html: toOrOptions.html || "",
      text: toOrOptions.text || ""
    };
  }

  return {
    to: toOrOptions || "",
    subject: subject || "",
    html: html || "",
    text: ""
  };
};

export const sendEmail = async (toOrOptions, subject, html) => {
  const payload = normalizeEmailPayload(toOrOptions, subject, html);

  if (!payload.to) {
    logger.warn("Skipping email because recipient address is missing");
    return false;
  }

  if (!isEmailConfigured()) {
    logger.warn("Skipping email because EMAIL_USER or EMAIL_PASS is not configured");
    return false;
  }

  try {
    const mailOptions = {
      from: `"Intern Management" <${process.env.EMAIL_USER}>`,
      to: payload.to,
      subject: payload.subject
    };

    if (payload.html) {
      mailOptions.html = payload.html;
    }

    if (payload.text) {
      mailOptions.text = payload.text;
    }

    if (!mailOptions.html && !mailOptions.text) {
      logger.warn(`Skipping email to ${payload.to} because no html or text content was provided`);
      return false;
    }

    await transporter.sendMail(mailOptions);

    logger.info(`Email sent to ${payload.to} with subject "${payload.subject}"`);
    return true;
  } catch (error) {
    logger.error(`Email error for ${payload.to}: ${error.message}`);
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

export const sendDailyReportEmail = async ({
  managerEmail, managerName, internName,
  reportDate, workDone, blockers, planTomorrow
}) => {
  const details = [
    { label: "Submitted By", value: internName || "Intern" },
    { label: "Report Date", value: formatDate(reportDate) },
    { label: "Work Done", value: truncateText(workDone, 300) },
  ];
  if (blockers) details.push({ label: "Blockers", value: truncateText(blockers, 200) });
  if (planTomorrow) details.push({ label: "Plan for Tomorrow", value: truncateText(planTomorrow, 200) });

  const html = buildEmailLayout({
    heading: "New Daily Report Submitted",
    intro: `Hello ${managerName || "Manager"},\n\n${internName || "An intern"} has submitted their daily work report.`,
    details,
    ctaLabel: "View in Portal",
    ctaHref: buildPortalUrl("/manager/daily-reports"),
    footer: "You can acknowledge this report from the Manager module in the portal.",
  });

  return sendEmail(managerEmail, `Daily Report from ${internName} — ${reportDate}`, html);
};
