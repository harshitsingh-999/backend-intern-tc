import User from './src/api/v1/Models/user.js';
import Role from './src/api/v1/Models/role.js';
import Department from './src/api/v1/Models/department.js';

const testModels = async () => {
  const models = [
    { name: 'User', model: User },
    { name: 'Role', model: Role },
    { name: 'Department', model: Department }
  ];

  for (const m of models) {
    try {
      await m.model.findAll({ limit: 1 });
      process.stdout.write(`SUCCESS: ${m.name}\n`);
    } catch (err) {
      process.stdout.write(`FAILURE: ${m.name} - ${err.message}\n`);
    }
  }
  process.exit(0);
};

testModels();
