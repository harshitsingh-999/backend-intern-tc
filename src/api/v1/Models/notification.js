import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const Notification = sequelize.define('notifications', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING(50), defaultValue: 'general' }, // 'task', 'leave', 'report', 'general'
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  link: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true });

export default Notification;