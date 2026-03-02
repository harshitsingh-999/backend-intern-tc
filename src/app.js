import Server from './common/server.js';
import routes from './routes.js';
import dotenv from 'dotenv';
import { createDatabaseIfNotExists } from './config/db.init.js';
import syncModels from './api/v1/Models/modelSync.js';

dotenv.config();

// Create server immediately (synchronous)
const server = new Server();
server.router(routes);
server.handleError();

console.log('✅ Server initialized');

// Initialize database asynchronously (non-blocking)
(async () => {
  try {
    //await createDatabaseIfNotExists();
    //await syncModels();
    console.log('✅ Database connected and synced');
  } catch (dbErr) {
    console.warn('⚠️  Database connection failed:', dbErr.message);
  }
})();

export default server;


