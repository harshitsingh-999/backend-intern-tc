import dotenv from "dotenv";
import Server from "./common/server.js";
import routes from "./routes.js";
import { createDatabaseIfNotExists } from "./config/db.init.js";
import syncModels from "./api/v1/Models/modelSync.js";

dotenv.config();

const PORT = process.env.PORT || 7357;

// Create server
const server = new Server();
server.router(routes);
server.handleError();

console.log("✅ Server initialized");

// Initialize database and start server
(async () => {
  try {
    await createDatabaseIfNotExists();
    await syncModels();

    // server.listen(PORT);

    console.log(`🚀 Server running on port ${PORT}`);
    console.log("Internship Backend Booting..");
    console.log("🕒 Boot Time:", new Date().toISOString());
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
})();

export default server;