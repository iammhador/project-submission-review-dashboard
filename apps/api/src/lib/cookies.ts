import type { CookieOptions, Request, Response } from "express";

import { env } from "../env.js";

export const AUTH_COOKIE = "awi_token";

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
};

/** Parses the compact durations accepted by JWT_EXPIRES_IN, e.g. "7d" or "12h". */
export function durationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return UNIT_SECONDS.d * 7;
  return Number(match[1]) * UNIT_SECONDS[match[2]];
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }

  return undefined;
}

export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: durationToSeconds(env.JWT_EXPIRES_IN) * 1000,
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, authCookieOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, { ...authCookieOptions(), maxAge: undefined });
}
