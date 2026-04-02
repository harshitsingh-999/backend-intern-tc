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
import { DataTypes } from "sequelize";

const ensureTaskStatusEnum = async () => {
  const enumValues = TASK_STATUSES.map((status) => `'${status}'`).join(", ");

  await sequelize.query(`
    ALTER TABLE tasks
    MODIFY COLUMN status ENUM(${enumValues}) DEFAULT 'todo'
  `);
};

const ensureUserResetColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const userTable = await queryInterface.describeTable("users");

  if (!userTable.password_reset_token) {
    await queryInterface.addColumn("users", "password_reset_token", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    });
    console.log("Added users.password_reset_token column");
  }

  if (!userTable.password_reset_expires) {
    await queryInterface.addColumn("users", "password_reset_expires", {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    });
    console.log("Added users.password_reset_expires column");
  }
};

const syncModels = async () => {
  try {
    setupAssociations();
    await sequelize.sync({ alter: false });
    await ensureUserResetColumns();
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
