// src/api/v1/Models/department.js
import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const Department = sequelize.define('departments', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  dept_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: DataTypes.STRING(255),
  head_id: DataTypes.INTEGER
}, {
  timestamps: true,
  updatedAt: false
});

export default Department;
