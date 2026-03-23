// src/api/v1/Models/task.js
import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

export const TASK_STATUSES = [
  'todo',
  'in_progress',
  'review',
  'completed',
  'blocked',
  'rejected',
  'hold'
];

const Task = sequelize.define('tasks', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: DataTypes.TEXT,
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assigned_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_date: DataTypes.DATEONLY,
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM(...TASK_STATUSES),
    defaultValue: 'todo'
  },
  completion_percentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tech_stack: DataTypes.STRING(255)
}, {
  timestamps: true
});

export default Task;
