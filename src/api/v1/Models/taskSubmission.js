import { DataTypes } from "sequelize";
import sequelize from "../../../config/db.config.js";

const TaskSubmission = sequelize.define("task_submissions", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  submitted_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  work_notes: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  file_name: DataTypes.STRING(255),
  file_path: DataTypes.STRING(500),
  file_size: DataTypes.INTEGER,
  mime_type: DataTypes.STRING(120)
}, {
  timestamps: true
});

export default TaskSubmission;
