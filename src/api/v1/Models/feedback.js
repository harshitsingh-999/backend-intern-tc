// src/api/v1/Models/feedback.js
import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const Feedback = sequelize.define('feedback', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  trainee_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  buddy_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  feedback_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  feedback_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  rating: DataTypes.INTEGER,
  category: {
    type: DataTypes.ENUM('technical','behavioral','progress','general'),
    defaultValue: 'general'
  },
  is_confidential: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

export default Feedback;