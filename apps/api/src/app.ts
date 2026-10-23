import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
