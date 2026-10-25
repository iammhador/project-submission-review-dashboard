import { Prisma } from "@prisma/client";

import type { AuthResponse, UserSummary } from "@awi/shared";

import { conflict, unauthorized } from "../../lib/http-error.js";
import { signToken } from "../../lib/jwt.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import type { LoginInput, SignupInput } from "./auth.schemas.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

/** New accounts are always students; mentors are provisioned by the seed. */
export async function signup(input: SignupInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  let user;
  try {
    user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash },
      select: userSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("An account with this email already exists");
    }
    throw error;
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const account = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...userSelect, passwordHash: true },
  });

  // Same response for unknown email and wrong password to avoid enumeration.
  if (!account || !(await verifyPassword(input.password, account.passwordHash))) {
    throw unauthorized("Invalid email or password");
  }

  const { passwordHash: _passwordHash, ...user } = account;
  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token };
}

/** Loads the profile behind a verified token; fails if the account was removed. */
export async function getUser(id: string): Promise<UserSummary> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
  if (!user) {
    throw unauthorized("Your account no longer exists. Please sign in again.");
  }
  return user;
}
