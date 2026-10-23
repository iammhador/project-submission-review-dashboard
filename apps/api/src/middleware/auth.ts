import type { RequestHandler } from "express";

import type { Role } from "@awi/shared";

import { AUTH_COOKIE, readCookie } from "../lib/cookies.js";
import { forbidden, unauthorized } from "../lib/http-error.js";
import { verifyToken } from "../lib/jwt.js";

/**
 * Accepts either an `Authorization: Bearer <token>` header (API clients) or
 * the httpOnly cookie set by the web app.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const bearer =
    header?.startsWith("Bearer ") ? header.slice(7).trim() : undefined;
  const token = bearer || readCookie(req, AUTH_COOKIE);

  if (!token) {
    next(unauthorized());
    return;
  }

  try {
    const payload = await verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(unauthorized("Your session has expired. Please sign in again."));
  }
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(unauthorized());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(forbidden());
      return;
    }

    next();
  };
}

/** Narrowing helper for handlers that sit behind `requireAuth`. */
export function currentUser(req: Parameters<RequestHandler>[0]) {
  if (!req.user) throw unauthorized();
  return req.user;
}
