import authRoutes from "./api/v1/Routes/auth.route.js";
import userRoutes from "./api/v1/Routes/user.routes.js";

const routes = (app) => {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  return app;
};

export default routes;
