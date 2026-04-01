import authRoutes      from "./api/v1/Routes/auth.route.js";
import userRoutes      from "./api/v1/Routes/user.routes.js";
import managerRoutes   from "./api/v1/Routes/manager.routes.js";
import internRoutes    from "./api/v1/Routes/intern.routes.js";
import attendenceRoutes from "./api/v1/Routes/attendence.route.js";
import adminRoutes     from "./api/v1/Routes/admin.js";
import adminUserRoutes from "./api/v1/Routes/admin.user.routes.js";
import superAdminRoutes from './api/v1/Routes/superAdmin.routes.js';
import eventRoutes     from "./api/v1/Routes/event.routes.js";
import notificationRoutes from './api/v1/Routes/notification.routes.js';
import documentRoutes from './api/v1/Routes/internDocument.routes.js';
import dailyReportRoutes from './api/v1/Routes/dailyreport.routes.js' 
import profileChangeRoutes from './api/v1/Routes/profileChangeRequest.routes.js';
import leaveRoutes from './api/v1/Routes/leave.routes.js';

const routes = (app) => {
  app.use("/api/v1/auth",       authRoutes);
  app.use("/api/v1/users",      userRoutes);
  app.use("/api/v1/manager",    managerRoutes);
  app.use("/api/v1/attendance", attendenceRoutes);
  app.use("/api/v1/intern",     internRoutes);
  app.use("/api/v1/superadmin", superAdminRoutes);
  app.use("/api/v1",            eventRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/documents', documentRoutes);
  app.use('/api/v1/daily-reports', dailyReportRoutes);
  app.use('/api/v1/profile-changes', profileChangeRoutes);
  app.use('/api/v1/leaves', leaveRoutes);

  // admin/users must come BEFORE generic /admin
  // so the adminUserRoutes controller (paginated, full-featured) handles user CRUD
  app.use("/api/v1/admin/users",    adminUserRoutes);
  // generic admin router handles trainees, dashboard, roles, assign-manager
  app.use("/api/v1/admin",          adminRoutes);

  return app;
};

export default routes;
