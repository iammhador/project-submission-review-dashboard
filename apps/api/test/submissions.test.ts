import request from "supertest";
import { describe, expect, it } from "vitest";

import { app, as, createUser, submit } from "./helpers.js";

const valid = {
  title: "Portfolio website",
  description: "My personal portfolio built with Next.js.",
  repoUrl: "https://github.com/ada/portfolio",
};

describe("POST /api/submissions", () => {
  it("creates a pending submission in the shared contract shape", async () => {
    const student = await createUser("STUDENT", { name: "Ada" });

    const response = await as(student).post("/api/submissions", {
      ...valid,
      liveUrl: "",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      ...valid,
      liveUrl: null,
      status: "PENDING",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      student: { id: student.id, name: "Ada", email: student.email },
      review: null,
    });
  });

  it("rejects the same repository twice from one student, but not across students", async () => {
    const ada = await createUser();
    const bob = await createUser();
    await as(ada).post("/api/submissions", valid);

    const duplicate = await as(ada).post("/api/submissions", valid);
    const otherStudent = await as(bob).post("/api/submissions", valid);

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.message).toMatch(/already submitted/);
    expect(otherStudent.status).toBe(201);
  });

  it.each([
    ["javascript: URL", { repoUrl: "javascript:alert(1)" }, "repoUrl"],
    ["ftp URL", { repoUrl: "ftp://example.com/repo" }, "repoUrl"],
    ["bad live URL", { liveUrl: "not a url" }, "liveUrl"],
    ["short title", { title: "ab" }, "title"],
    ["short description", { description: "too short" }, "description"],
  ])("rejects a %s", async (_label, overrides, field) => {
    const student = await createUser();

    const response = await as(student).post("/api/submissions", { ...valid, ...overrides });

    expect(response.status).toBe(422);
    expect(response.body.error.details).toContainEqual(
      expect.objectContaining({ path: field }),
    );
  });

  it("is only available to students", async () => {
    const mentor = await createUser("MENTOR");

    const asMentor = await as(mentor).post("/api/submissions", valid);
    const anonymous = await request(app).post("/api/submissions").send(valid);

    expect(asMentor.status).toBe(403);
    expect(anonymous.status).toBe(401);
  });
});

describe("GET /api/submissions/mine", () => {
  it("lists only the student's own submissions, newest first, paginated", async () => {
    const ada = await createUser();
    const bob = await createUser();
    const first = await submit(ada);
    const second = await submit(ada);
    const third = await submit(ada);
    await submit(bob);

    const page1 = await as(ada).get("/api/submissions/mine?pageSize=2");
    const page2 = await as(ada).get("/api/submissions/mine?pageSize=2&page=2");

    expect(page1.status).toBe(200);
    expect(page1.body).toMatchObject({ page: 1, pageSize: 2, total: 3, totalPages: 2 });
    expect(page1.body.items.map((s: { id: string }) => s.id)).toEqual([third.id, second.id]);
    expect(page2.body.items.map((s: { id: string }) => s.id)).toEqual([first.id]);
  });

  it("rejects page sizes above the maximum", async () => {
    const student = await createUser();

    const response = await as(student).get("/api/submissions/mine?pageSize=51");

    expect(response.status).toBe(422);
  });
});

describe("GET /api/submissions/:id", () => {
  it("is visible to its owner and to mentors", async () => {
    const owner = await createUser();
    const mentor = await createUser("MENTOR");
    const submission = await submit(owner);

    const asOwner = await as(owner).get(`/api/submissions/${submission.id}`);
    const asMentor = await as(mentor).get(`/api/submissions/${submission.id}`);

    expect(asOwner.status).toBe(200);
    expect(asMentor.status).toBe(200);
    expect(asMentor.body.id).toBe(submission.id);
  });

  it("looks missing to other students, so ids cannot be probed", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const submission = await submit(owner);

    const other = await as(stranger).get(`/api/submissions/${submission.id}`);
    const missing = await as(stranger).get("/api/submissions/does-not-exist");

    expect(other.status).toBe(404);
    expect(other.body).toEqual(missing.body);
  });
});
