import authRoutes from "./api/v1/Routes/auth.route.js";
import userRoutes from "./api/v1/Routes/user.routes.js";
import managerRoutes from "./api/v1/Routes/manager.routes.js";
import internRoutes from "./api/v1/Routes/intern.routes.js";
import attendenceroutes from "./api/v1/Routes/attendence.route.js";
import adminRoutes from "./api/v1/Routes/admin.js";
import adminUserRoutes from "./api/v1/Routes/admin.user.routes.js";
import superAdminRoutes from './api/v1/Routes/superAdmin.routes.js';

const routes = (app) => {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/manager", managerRoutes);
  app.use("/api/v1/attendance", attendenceroutes);
  app.use("/api/v1/intern", internRoutes);
   app.use("/api/v1/auth", authRoutes);
  // Specific path must come first so /api/v1/admin/users
  // does not get intercepted by the generic /api/v1/admin router.
  app.use("/api/v1/admin/users", adminUserRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use('/api/v1/superadmin', superAdminRoutes);

  return app;
};

export default routes;
  
// =======
// import adminRoutes from "./api/v1/Routes/admin.js";
// import adminUserRoutes from "./api/v1/Routes/admin.user.routes.js";
// import superAdminRoutes from './api/v1/Routes/superAdmin.routes.js';


// const routes = (app) => {
//   app.use("/api/v1/auth", authRoutes);
//   // Specific path must come first so /api/v1/admin/users
//   // does not get intercepted by the generic /api/v1/admin router.
//   app.use("/api/v1/admin/users", adminUserRoutes);
//   app.use("/api/v1/admin", adminRoutes);
//   app.use('/api/v1/superadmin', superAdminRoutes);

//   return app;
// };

// export default routes;
// >>>>>>> 3c3eeeeb4f4f0982aa3a99868279a19017065dba
