// src/api/v1/Models/associations.js

import User from './user.js';
import Role from './role.js';
import Department from './department.js';
import Trainee from './trainee.js';
import Project from './project.js';
import Task from './task.js';
import TaskSubmission from './taskSubmission.js';
import Attendance from './attendance.js';
import Evaluation from './evaluation.js';
import Feedback from './feedback.js';
import DailyReport from './dailyreports.js';
import InternDocument from './internDocument.js';
import ProfileChangeRequest from './profileChangeRequest.js';

const setupAssociations = () => {


InternDocument.belongsTo(User, { as: 'intern', foreignKey: 'user_id' });
User.hasMany(InternDocument, { foreignKey: 'user_id' });

  // ===== PROFILE CHANGE REQUESTS =====
  ProfileChangeRequest.belongsTo(User, { as: 'requestor', foreignKey: 'user_id' });
  User.hasMany(ProfileChangeRequest, { foreignKey: 'user_id' });
  
  ProfileChangeRequest.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewed_by' });

  // ===== USER RELATIONS =====
  User.belongsTo(Role, { foreignKey: 'role_id' });
  Role.hasMany(User, { foreignKey: 'role_id' });

  User.belongsTo(Department, { foreignKey: 'dept_id' });
  Department.hasMany(User, { foreignKey: 'dept_id' });


  // ===== TRAINEE RELATIONS =====
  Trainee.belongsTo(User, { foreignKey: 'user_id' });
  User.hasOne(Trainee, { foreignKey: 'user_id' });

  Trainee.belongsTo(User, { as: 'buddy', foreignKey: 'buddy_id' });
  Trainee.belongsTo(User, { as: 'manager', foreignKey: 'manager_id' });


  // ===== PROJECT RELATIONS =====
  Project.belongsTo(Department, { foreignKey: 'dept_id' });
  Department.hasMany(Project, { foreignKey: 'dept_id' });

  Project.belongsTo(User, { as: 'manager', foreignKey: 'manager_id' });
  User.hasMany(Project, { foreignKey: 'manager_id' });


  // ===== TASK RELATIONS =====
  Task.belongsTo(Project, { foreignKey: 'project_id' });
  Project.hasMany(Task, { foreignKey: 'project_id' });

  Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigned_to' });
  Task.belongsTo(User, { as: 'assigner', foreignKey: 'assigned_by' });
  Task.hasMany(TaskSubmission, { foreignKey: 'task_id', as: 'submissions' });

  TaskSubmission.belongsTo(Task, { foreignKey: 'task_id' });
  TaskSubmission.belongsTo(User, { as: 'intern', foreignKey: 'submitted_by' });
  User.hasMany(TaskSubmission, { foreignKey: 'submitted_by' });


  // ===== ATTENDANCE =====
  Attendance.belongsTo(Trainee, { foreignKey: 'trainee_id' });
  Trainee.hasMany(Attendance, { foreignKey: 'trainee_id' });


  // ===== EVALUATION =====
  Evaluation.belongsTo(Trainee, { foreignKey: 'trainee_id' });
  Trainee.hasMany(Evaluation, { foreignKey: 'trainee_id' });

  Evaluation.belongsTo(User, { as: 'evaluator', foreignKey: 'evaluator_id' });


  // ===== FEEDBACK =====
  Feedback.belongsTo(Trainee, { foreignKey: 'trainee_id' });
  Trainee.hasMany(Feedback, { foreignKey: 'trainee_id' });

  Feedback.belongsTo(User, { as: 'feedbackBuddy', foreignKey: 'buddy_id' });

  // ====== Daily Report ========

  DailyReport.belongsTo(User, { as: 'intern', foreignKey: 'intern_user_id' });
  DailyReport.belongsTo(User, { as: 'manager', foreignKey: 'manager_user_id' });
  User.hasMany(DailyReport, { foreignKey: 'intern_user_id' });
};

export default setupAssociations;
