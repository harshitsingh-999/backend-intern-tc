import SystemSetting from './src/api/v1/Models/systemSetting.js';

const seedSettings = async () => {
  try {
    await SystemSetting.bulkCreate([
      { key: 'max_interns_per_manager', value: '10', description: 'Maximum number of interns assigned to a single manager' },
      { key: 'internship_duration_days', value: '180', description: 'Default duration of internship in days' },
      { key: 'notify_intern_assignment', value: 'true', category: 'email', description: 'Notify on new intern assignment' },
      { key: 'notify_task_completion', value: 'true', category: 'email', description: 'Notify on task completion' },
      { key: 'weekly_reports', value: 'false', category: 'email', description: 'Weekly performance reports' }
    ], { ignoreDuplicates: true });
    console.log("System settings seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding settings:", error);
    process.exit(1);
  }
};

seedSettings();
