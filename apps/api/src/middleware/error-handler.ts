import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler, RequestHandler } from "express";

import { HttpError } from "../lib/http-error.js";
import { formatIssues } from "../lib/validation.js";
import { ZodError } from "zod";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: { message: error.message, details: error.details },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(422).json({
      error: { message: "Validation failed", details: formatIssues(error) },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({
        error: { message: "That record already exists." },
      });
      return;
    }

    if (error.code === "P2025") {
      res.status(404).json({ error: { message: "Resource not found" } });
      return;
    }
  }

  console.error("[api] unhandled error", error);
  res.status(500).json({ error: { message: "Internal server error" } });
};
