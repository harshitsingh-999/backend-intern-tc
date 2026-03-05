// src/api/v1/Models/attendance.js
import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const Attendance = sequelize.define('attendance', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  trainee_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  attendance_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present','absent','late','half_day','on_leave'),
    defaultValue: 'present'
  },
  check_in_time: DataTypes.TIME,
  check_out_time: DataTypes.TIME,
  remarks: DataTypes.STRING(255)
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['trainee_id','attendance_date']
    }
  ]
});

export default Attendance;