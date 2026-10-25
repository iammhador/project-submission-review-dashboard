import request from "supertest";

import type { Role, Submission } from "@awi/shared";

import { createApp } from "../src/app.js";
import { signToken } from "../src/lib/jwt.js";
import { hashPassword } from "../src/lib/password.js";
import { prisma } from "../src/lib/prisma.js";

export const app = createApp();

export const PASSWORD = "password123";

// bcrypt is deliberately slow, so hash the shared test password only once.
let passwordHash: Promise<string> | undefined;

let userCount = 0;

export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  token: string;
}

/** Inserts a user directly (bypassing the signup rate limit) and signs a token. */
export async function createUser(
  role: Role = "STUDENT",
  overrides: { name?: string; email?: string } = {},
): Promise<TestUser> {
  userCount += 1;
  passwordHash ??= hashPassword(PASSWORD);

  const user = await prisma.user.create({
    data: {
      name: overrides.name ?? `${role === "MENTOR" ? "Mentor" : "Student"} ${userCount}`,
      email: overrides.email ?? `user${userCount}@test.dev`,
      passwordHash: await passwordHash,
      role,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const token = await signToken({ sub: user.id, email: user.email, role: user.role });
  return { ...user, token };
}

export function as(user: TestUser) {
  const auth = { Authorization: `Bearer ${user.token}` };
  return {
    get: (path: string) => request(app).get(path).set(auth),
    post: (path: string, body?: object) =>
      request(app).post(path).set(auth).send(body),
  };
}

let repoCount = 0;

export async function submit(
  student: TestUser,
  overrides: Partial<{ title: string; description: string; repoUrl: string; liveUrl: string }> = {},
): Promise<Submission> {
  repoCount += 1;
  const response = await as(student).post("/api/submissions", {
    title: `Project ${repoCount}`,
    description: "A project built for testing.",
    repoUrl: `https://github.com/test/project-${repoCount}`,
    ...overrides,
  });
  if (response.status !== 201) {
    throw new Error(`submit failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body;
}
