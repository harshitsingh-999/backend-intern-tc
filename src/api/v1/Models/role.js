// src/api/v1/Models/role.js
import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const Role = sequelize.define('roles', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  role_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING(255)
  }
}, {
  timestamps: false
});

export default Role;