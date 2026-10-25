import { SignJWT, jwtVerify } from "jose";

import type { Role } from "@awi/shared";

import { env } from "../env.js";

const ISSUER = "awi-api";
const AUDIENCE = "awi-web";
const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  const role = payload.role;
  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    (role !== "STUDENT" && role !== "MENTOR")
  ) {
    throw new Error("Malformed token payload");
  }

  return { sub: payload.sub, email: payload.email, role };
}
