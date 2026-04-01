import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const Leave = sequelize.define('leaves', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  trainee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'trainees', key: 'id' },
    onDelete: 'CASCADE'
  },
  leave_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  leave_type: {
    type: DataTypes.ENUM('casual', 'sick', 'emergency', 'personal', 'unpaid'),
    defaultValue: 'casual'
  },
  leave_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'pending'
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL'
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

export default Leave;
