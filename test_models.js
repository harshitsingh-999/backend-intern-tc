import User from './src/api/v1/Models/user.js';
import Role from './src/api/v1/Models/role.js';
import Department from './src/api/v1/Models/department.js';
import Trainee from './src/api/v1/Models/trainee.js';
import Project from './src/api/v1/Models/project.js';
import Task from './src/api/v1/Models/task.js';
import Evaluation from './src/api/v1/Models/evaluation.js';
import Attendance from './src/api/v1/Models/attendance.js';
import SystemSetting from './src/api/v1/Models/systemSetting.js';

const testModels = async () => {
  const models = [
    { name: 'User', model: User },
    { name: 'Role', model: Role },
    { name: 'Department', model: Department },
    { name: 'Trainee', model: Trainee },
    { name: 'Project', model: Project },
    { name: 'Task', model: Task },
    { name: 'Evaluation', model: Evaluation },
    { name: 'Attendance', model: Attendance },
    { name: 'SystemSetting', model: SystemSetting }
  ];

  for (const m of models) {
    try {
      console.log(`Testing ${m.name}...`);
      await m.model.findAll({ limit: 1 });
      console.log(`✅ ${m.name} OK`);
    } catch (err) {
      console.error(`❌ ${m.name} FAILED: ${err.message}`);
    }
  }
  process.exit(0);
};

testModels();
