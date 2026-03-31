import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const DailyReport = sequelize.define('daily_reports', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  intern_user_id: { type: DataTypes.INTEGER, allowNull: false },
  manager_user_id: { type: DataTypes.INTEGER, allowNull: true },
  report_date: { type: DataTypes.DATEONLY, allowNull: false },
  work_done: { type: DataTypes.TEXT, allowNull: false },
  blockers: { type: DataTypes.TEXT, allowNull: true },
  plan_tomorrow: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('submitted', 'acknowledged'), defaultValue: 'submitted' },
}, { timestamps: true });

export default DailyReport;