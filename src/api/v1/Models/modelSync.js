import setupAssociations from "./associations.js";
import "./user.js";
import "./role.js";
import "./department.js";
import "./trainee.js";
import "./project.js";
import { TASK_STATUSES } from "./task.js";
import "./attendance.js";
import "./evaluation.js";
import "./feedback.js";
import "./taskSubmission.js";
import "./systemSetting.js";
import "./dailyreports.js";
import "./internDocument.js";
import "./notification.js";
import sequelize from "../../../config/db.config.js";

const ensureTaskStatusEnum = async () => {
  const enumValues = TASK_STATUSES.map((status) => `'${status}'`).join(", ");

  await sequelize.query(`
    ALTER TABLE tasks
    MODIFY COLUMN status ENUM(${enumValues}) DEFAULT 'todo'
  `);
};

const syncModels = async () => {
  try {
    setupAssociations();
    await sequelize.sync({ alter: false });
    console.log("All tables synced successfully");
  } catch (err) {
    console.error("Error syncing tables:", err);
  }

  // Run enum migration separately so a failure here never blocks startup
  try {
    await ensureTaskStatusEnum();
    console.log("Task status enum updated");
  } catch (err) {
    console.warn("ensureTaskStatusEnum skipped (table may not exist yet):", err.message);
  }
};

export default syncModels;
