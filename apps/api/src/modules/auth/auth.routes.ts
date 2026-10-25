import { Router } from "express";

import type { AuthResponse, UserSummary } from "@awi/shared";

import { clearAuthCookie, setAuthCookie } from "../../lib/cookies.js";
import { parse } from "../../lib/validation.js";
import { currentUser, requireAuth } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { loginSchema, signupSchema } from "./auth.schemas.js";
import { getUser, login, signup } from "./auth.service.js";

export const authRouter = Router();

const signupLimiter = rateLimit({
  windowMs: 60 * 60_000,
  max: 10,
  message: "Too many accounts created from this address. Try again later.",
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  message: "Too many sign-in attempts. Try again in a few minutes.",
});

authRouter.post("/signup", signupLimiter, async (req, res) => {
  const input = parse(signupSchema, req.body);
  const result = await signup(input);

  setAuthCookie(res, result.token);
  res.status(201).json(result satisfies AuthResponse);
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  const input = parse(loginSchema, req.body);
  const result = await login(input);

  setAuthCookie(res, result.token);
  res.status(200).json(result satisfies AuthResponse);
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await getUser(currentUser(req).id);

  res.status(200).json({ user } satisfies { user: UserSummary });
});
