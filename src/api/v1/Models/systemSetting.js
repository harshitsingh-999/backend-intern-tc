import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const SystemSetting = sequelize.define('system_settings', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'general'
  },
  description: {
    type: DataTypes.STRING(255)
  }
}, {
  timestamps: true
});

export default SystemSetting;
