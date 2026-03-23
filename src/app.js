import dotenv from "dotenv";
import Server from "./common/server.js";
import routes from "./routes.js";

dotenv.config();

const server = new Server();
server.router(routes);
server.handleError();

console.log("Server initialized");

export default server;
