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
    await ensureTaskStatusEnum();

    console.log("All tables synced successfully");
  } catch (err) {
    console.error("Error syncing tables:", err);
  }
};

export default syncModels;
