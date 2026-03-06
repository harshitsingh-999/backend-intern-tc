import authRoutes from "./api/v1/Routes/auth.route.js";

const routes = (app) => {
    app.use('/api/v1/auth', authRoutes);

    return app;
}
 
export default routes