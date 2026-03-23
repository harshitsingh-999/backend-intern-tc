// src/api/v1/Models/syncModels.js

import setupAssociations from './associations.js';

// Import all models once so Sequelize registers them
import './user.js';
import './role.js';
import './department.js';
import './trainee.js';
import './project.js';
import './task.js';
import './attendance.js';
import './evaluation.js';
import './feedback.js';
import './taskSubmission.js';
import './systemSetting.js'; 
import sequelize from '../../../config/db.config.js';

const syncModels = async () => {
  try {

    // 1️⃣ Setup associations FIRST
    setupAssociations();

    // 2️⃣ Sync ALL models together
    await sequelize.sync({ alter: false }); 
    // use { force: true } only in development

    console.log('All tables synced successfully');
  } catch (err) {
    console.error('Error syncing tables:', err);
  }
};

export default syncModels;
