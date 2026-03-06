// src/api/v1/Models/evaluation.js
import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const Evaluation = sequelize.define('evaluations', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  trainee_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  evaluator_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  evaluation_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  technical_skills: { type: DataTypes.INTEGER, defaultValue: 0 },
  communication: { type: DataTypes.INTEGER, defaultValue: 0 },
  teamwork: { type: DataTypes.INTEGER, defaultValue: 0 },
  problem_solving: { type: DataTypes.INTEGER, defaultValue: 0 },
  punctuality: { type: DataTypes.INTEGER, defaultValue: 0 },
  overall_score: DataTypes.DECIMAL(3,2),
  comments: DataTypes.TEXT
}, {
  timestamps: true
});

export default Evaluation;