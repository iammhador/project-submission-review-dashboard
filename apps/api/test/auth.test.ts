import request from "supertest";
import { describe, expect, it } from "vitest";

import { AUTH_COOKIE_NAME } from "@awi/shared";

import { prisma } from "../src/lib/prisma.js";
import { PASSWORD, app, as, createUser } from "./helpers.js";

const signup = (body: object) => request(app).post("/api/auth/signup").send(body);
const login = (body: object) => request(app).post("/api/auth/login").send(body);

function authCookie(response: request.Response) {
  const cookies = ([] as string[]).concat(response.headers["set-cookie"] ?? []);
  return cookies.find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`));
}

describe("POST /api/auth/signup", () => {
  it("creates a student, returns a token, and sets an httpOnly cookie", async () => {
    const response = await signup({
      name: "  Ada Lovelace ",
      email: "ADA@Example.com",
      password: PASSWORD,
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toEqual({
      id: expect.any(String),
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "STUDENT",
    });
    expect(response.body.token).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");

    const cookie = authCookie(response);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("never lets a client choose the mentor role", async () => {
    const response = await signup({
      name: "Sneaky",
      email: "sneaky@test.dev",
      password: PASSWORD,
      role: "MENTOR",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe("STUDENT");
  });

  it("rejects an email that is already registered, ignoring case", async () => {
    await createUser("STUDENT", { email: "taken@test.dev" });

    const response = await signup({
      name: "Copycat",
      email: "Taken@Test.dev",
      password: PASSWORD,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toMatch(/already exists/);
  });

  it("returns a message for each invalid field", async () => {
    const response = await signup({ name: "A", email: "nope", password: "short" });

    expect(response.status).toBe(422);
    expect(response.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual([
      "email",
      "name",
      "password",
    ]);
  });
});

describe("POST /api/auth/login", () => {
  it("signs in with the right password", async () => {
    const user = await createUser("MENTOR", { email: "mentor@test.dev" });

    const response = await login({ email: "MENTOR@test.dev", password: PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ id: user.id, role: "MENTOR" });
    expect(authCookie(response)).toBeDefined();
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    await createUser("STUDENT", { email: "real@test.dev" });

    const wrongPassword = await login({ email: "real@test.dev", password: "wrong-password" });
    const unknownEmail = await login({ email: "ghost@test.dev", password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the full profile for a bearer token", async () => {
    const user = await createUser("STUDENT", { name: "Grace Hopper" });

    const response = await as(user).get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: user.id,
      name: "Grace Hopper",
      email: user.email,
      role: "STUDENT",
    });
  });

  it("accepts the session cookie set at login", async () => {
    await createUser("STUDENT", { email: "cookie@test.dev" });
    const cookie = authCookie(await login({ email: "cookie@test.dev", password: PASSWORD }));

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie!.split(";")[0]);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("cookie@test.dev");
  });

  it("rejects missing, malformed, and orphaned tokens", async () => {
    const deleted = await createUser();
    await prisma.user.delete({ where: { id: deleted.id } });

    const missing = await request(app).get("/api/auth/me");
    const malformed = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-jwt");
    const orphaned = await as(deleted).get("/api/auth/me");

    expect([missing.status, malformed.status, orphaned.status]).toEqual([401, 401, 401]);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(204);
    expect(authCookie(response)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});
