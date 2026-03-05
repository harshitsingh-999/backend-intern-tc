import express from "express";
import morgan from "morgan";
import cors from "cors";
import http from "http";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import logger from "../helper/logger.js";
import rootPath from "../helper/rootPath.js";
import responseEmmiter from "../helper/response.js";


class ExpressServer {
  constructor() {
    this.app = express();
    const envOrigins = (process.env.FRONTEND_URL || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    const allowedOrigins = new Set([
      "http://localhost:5173",
      "http://localhost:5174",
      ...envOrigins
    ]);

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
        origin: (origin, callback) => {
          // Allow non-browser clients and same-origin calls.
          if (!origin) return callback(null, true);
          if (allowedOrigins.has(origin)) return callback(null, true);
          return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
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
