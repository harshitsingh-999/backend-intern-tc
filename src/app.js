import Server from './common/server.js';
import routes from './routes.js';
import dotenv from 'dotenv';
import { createDatabaseIfNotExists } from './config/db.init.js';
import { syncModels } from './models/index.js';
import { APP_VERSION } from '../version.js';

dotenv.config();

const port = process.env.PORT || 3000;
let server;

(async () => {
  try {
    // 1. Ensure DB exists
    await createDatabaseIfNotExists();

    // 2. Sync models
    await syncModels();

    // 3. Start server
    server = new Server();
    server.router(routes);
    server.handleError();
    server.listen(port);

    console.log(`✅ Running App Version: ${APP_VERSION}`);

    console.log(`🚀 Server running on port ${port}`);
    console.log(`Task Management Backend Booting..`)
    console.log("🕒 Boot Time:", new Date().toISOString());

  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
})();

export default server;
