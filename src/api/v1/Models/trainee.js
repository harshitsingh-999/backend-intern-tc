// src/api/v1/Models/trainee.js
import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';
import User from './user.js';

const Trainee = sequelize.define('trainees', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  college_name: DataTypes.STRING(255),
  course: DataTypes.STRING(100),
  batch_year: DataTypes.INTEGER,
  enrollment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  expected_end_date: DataTypes.DATEONLY,
  current_status: {
    type: DataTypes.ENUM('active','completed','on_leave','terminated'),
    defaultValue: 'active'
  },
  gpa: DataTypes.DECIMAL(3,2),
  buddy_id: DataTypes.INTEGER,
  manager_id: DataTypes.INTEGER,
  certifications: DataTypes.TEXT
}, {
  timestamps: true
});

Trainee.belongsTo(User, { foreignKey: 'user_id' });

export default Trainee;