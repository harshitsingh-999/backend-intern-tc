import authRoutes from "./api/v1/Routes/auth.route.js";
import adminRoutes from "./api/v1/Routes/admin.js";  // ← Import sahi hai

const routes = (app) => {
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/admin', adminRoutes);  // 
    
    return app;
}

export default routes;
