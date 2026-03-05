import './src/app.js'








// import dotenv from "dotenv";
// import app from "./src/app.js";
// import { APP_VERSION } from "./version.js";
// import { createDatabaseIfNotExists } from "./src/config/db.init.js";
// import sequelize from "./src/config/db.config.js";
// import syncModels from "./src/api/v1/Models/modelSync.js";
// import express from "express";



// app.use(express.json());

// dotenv.config();

// const PORT = 7358 || 5173;

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

// bootstrap();
