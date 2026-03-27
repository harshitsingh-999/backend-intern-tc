import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const InternDocument = sequelize.define('intern_documents', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  doc_type: { type: DataTypes.ENUM('10th_marksheet', '12th_marksheet', 'aadhar', 'pan_card', 'other'), allowNull: false },
  file_path: { type: DataTypes.STRING, allowNull: false },
  original_name: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  admin_note: { type: DataTypes.TEXT, allowNull: true },
  reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
}, { timestamps: true });

export default InternDocument;