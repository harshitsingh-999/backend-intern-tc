import dotenv from "dotenv";
import Server from "./common/server.js";
import routes from "./routes.js";
import { createDatabaseIfNotExists } from "./config/db.init.js";
import syncModels from "./api/v1/Models/modelSync.js";

dotenv.config();

const port = process.env.PORT || 3000;
let server;

(async () => {
  try {
    await createDatabaseIfNotExists();
    await syncModels();

    server = new Server();
    server.router(routes);
    server.handleError();
    server.listen(port);

    console.log(`Server running on port ${port}`);
    console.log("Internship Backend Booting..");
    console.log("Boot Time:", new Date().toISOString());
  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1);
  }
})();
// const bootstrap = async () => {
//   try {
//     await createDatabaseIfNotExists();
//     await sequelize.authenticate();
//     await syncModels();

//     app.listen(PORT, () => {
//       console.log(`Running App Version: ${APP_VERSION}`);
//       console.log(`Server running on port ${PORT}`);
//       console.log("Task Management Backend Booting..");
//       console.log("Boot Time:", new Date().toISOString());
//       console.log("Database connected successfully");
//     });
//   } catch (error) {
//     console.error("Database connection failed:", error.message);
//     process.exit(1);
//   }
// };

export default server;
