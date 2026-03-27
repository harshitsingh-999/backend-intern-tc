import dotenv from "dotenv";
import Server from "./common/server.js";
import routes from "./routes.js";
// import errorHandler from "./middlewares/errorMiddleware";

dotenv.config();


const server = new Server();
server.router(routes);
server.handleError();

console.log("Server initialized");


// app.use(errorHandler);


export default server;


