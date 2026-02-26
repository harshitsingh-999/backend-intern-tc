import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import http from "http";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import logger from "../helper/logger.js";
import rootPath from "../helper/rootPath.js";
import responseEmmiter from "../helper/response.js";

dotenv.config();

class ExpressServer {
  constructor() {
    this.app = express();

    // Security
    this.app.use(
      helmet({
        contentSecurityPolicy: false
      })
    );

    // Logging
    this.app.use(morgan("dev"));

    // Body parsing
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ limit: "50mb", extended: true }));

    // CORS
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true
      })
    );

    // Cookies
    this.app.use(cookieParser());

    // Static file serving
    this.registerStaticRoutes();
  }

  registerStaticRoutes() {
    this.app.get("/api/uploads/:type/:id/:filename", (req, res) => {
      const { type, id, filename } = req.params;
      const allowedTypes = ["tickets"];

      if (!allowedTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type"
        });
      }

      const uploadsRoot = path.join(rootPath, "src/uploads");
      const filePath = path.join(uploadsRoot, type, id, filename);

      logger.info(`📤 Serving file: ${filePath}`);

      res.sendFile(filePath, (err) => {
        if (err && !res.headersSent) {
          logger.error("❌ File not found", err);
          return res.status(404).json({
            success: false,
            message: "File not found"
          });
        }
      });

      req.on("aborted", () => {
        logger.warn("⚠️ Client aborted file download");
      });
    });
  }

  router(routes) {
    routes(this.app);
    return this;
  }

  handleError() {
    // 404 handler
    this.app.use((req, res) => {
      return responseEmmiter(res, { status: 404 });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      logger.error(err.stack);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    });

    return this;
  }

  listen(port) {
    this.server = http.createServer(this.app);

    this.server.listen(port, () => {
      logger.info(`🚀 Server listening on port ${port}`);
    });

    this.server.timeout = 500000;
    return this.server;
  }
}

export default ExpressServer;
