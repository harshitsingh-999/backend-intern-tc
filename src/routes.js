import authRoutes from "./api/v1/Routes/auth.route.js";
import adminRoutes from "./api/v1/Routes/admin.js";
import adminUserRoutes from "./api/v1/Routes/admin.user.routes.js";

const routes = (app) => {
  app.use("/api/v1/auth", authRoutes);
  // Specific path must come first so /api/v1/admin/users
  // does not get intercepted by the generic /api/v1/admin router.
  app.use("/api/v1/admin/users", adminUserRoutes);
  app.use("/api/v1/admin", adminRoutes);

  return app;
};

export default routes;
