import dotenv from 'dotenv';
dotenv.config();

import server from './src/app.js';
import { createDatabaseIfNotExists } from './src/config/db.init.js';
import syncModels from './src/api/v1/Models/modelSync.js';

const PORT = process.env.PORT || 7357;

(async () => {
  try {
    await createDatabaseIfNotExists();
    await syncModels();
    server.listen(PORT);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Internship Backend Booting..`);
    console.log('🕒 Boot Time:', new Date().toISOString());
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
})();