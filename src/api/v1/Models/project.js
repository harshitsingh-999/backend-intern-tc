// src/api/v1/Models/project.js
import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const Project = sequelize.define('projects', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  project_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: DataTypes.TEXT,
  dept_id: DataTypes.INTEGER,
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: DataTypes.DATEONLY,
  status: {
    type: DataTypes.ENUM('planning','active','completed','on_hold'),
    defaultValue: 'planning'
  },
  priority: {
    type: DataTypes.ENUM('low','medium','high','critical'),
    defaultValue: 'medium'
  }
}, {
  timestamps: true
});

export default Project;