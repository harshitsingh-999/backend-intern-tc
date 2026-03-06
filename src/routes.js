import authRoutes from "./api/v1/Routes/auth.route.js";
import userRoutes from "./api/v1/Routes/user.routes.js";
import managerRoutes from "./api/v1/Routes/manager.routes.js";
import internRoutes from "./api/v1/Routes/intern.routes.js";
import attendenceroutes from "./api/v1/Routes/attendence.route.js";

const routes = (app) => {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/manager", managerRoutes);
  app.use("/api/v1/attendance", attendenceroutes);
  app.use("/api/v1/intern", internRoutes);
  return app;
};

export default routes;
  