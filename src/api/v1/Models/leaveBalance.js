import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const LeaveBalance = sequelize.define('leave_balances', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  trainee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'unique_trainee_year',
    references: { model: 'trainees', key: 'id' },
    onDelete: 'CASCADE'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'unique_trainee_year'
  },
  casual_leaves: {
    type: DataTypes.INTEGER,
    defaultValue: 12
  },
  sick_leaves: {
    type: DataTypes.INTEGER,
    defaultValue: 6
  },
  emergency_leaves: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  personal_leaves: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  casual_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sick_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  emergency_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  personal_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

export default LeaveBalance;
