import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { prisma } from "../src/lib/prisma.js";
import { as, createUser, submit } from "./helpers.js";

const ids = (response: { body: { items: { id: string }[] } }) =>
  response.body.items.map((item) => item.id);

describe("GET /api/submissions (mentor list)", () => {
  it("filters by status and serves the pending queue oldest first", async () => {
    const mentor = await createUser("MENTOR");
    const student = await createUser();
    const oldest = await submit(student);
    const reviewed = await submit(student);
    const newest = await submit(student);
    await as(mentor).post(`/api/submissions/${reviewed.id}/review`, { decision: "APPROVED" });

    const pending = await as(mentor).get("/api/submissions?status=PENDING");
    const approved = await as(mentor).get("/api/submissions?status=APPROVED");
    const all = await as(mentor).get("/api/submissions");

    expect(ids(pending)).toEqual([oldest.id, newest.id]);
    expect(ids(approved)).toEqual([reviewed.id]);
    expect(ids(all)).toEqual([newest.id, reviewed.id, oldest.id]);
  });

  it("searches titles and student names without regard to case", async () => {
    const mentor = await createUser("MENTOR");
    const ada = await createUser("STUDENT", { name: "Ada Lovelace" });
    const bob = await createUser("STUDENT", { name: "Bob" });
    const adas = await submit(ada, { title: "Analytical engine" });
    const bobs = await submit(bob, { title: "Weather app" });

    const byName = await as(mentor).get("/api/submissions?q=LOVELACE");
    const byTitle = await as(mentor).get("/api/submissions?q=weather");

    expect(ids(byName)).toEqual([adas.id]);
    expect(ids(byTitle)).toEqual([bobs.id]);
  });

  it("rejects an unknown status and is closed to students", async () => {
    const mentor = await createUser("MENTOR");
    const student = await createUser();

    const badStatus = await as(mentor).get("/api/submissions?status=LOST");
    const asStudent = await as(student).get("/api/submissions");

    expect(badStatus.status).toBe(422);
    expect(asStudent.status).toBe(403);
  });
});

describe("GET /api/submissions/stats", () => {
  it("counts submissions by status", async () => {
    const mentor = await createUser("MENTOR");
    const student = await createUser();
    const [a, b] = [await submit(student), await submit(student)];
    await submit(student);
    await as(mentor).post(`/api/submissions/${a.id}/review`, { decision: "APPROVED" });
    await as(mentor).post(`/api/submissions/${b.id}/review`, {
      decision: "REJECTED",
      note: "Add tests",
    });

    const response = await as(mentor).get("/api/submissions/stats");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ total: 3, pending: 1, approved: 1, rejected: 1 });
  });

  it("is closed to students", async () => {
    const student = await createUser();

    expect((await as(student).get("/api/submissions/stats")).status).toBe(403);
  });
});

describe("POST /api/submissions/:id/review", () => {
  it("records the decision and shows it to the student", async () => {
    const mentor = await createUser("MENTOR", { name: "Grace" });
    const student = await createUser();
    const submission = await submit(student);

    const response = await as(mentor).post(`/api/submissions/${submission.id}/review`, {
      decision: "APPROVED",
      note: "  Great work  ",
    });
    const asStudent = await as(student).get(`/api/submissions/${submission.id}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("APPROVED");
    expect(asStudent.body.review).toEqual({
      id: expect.any(String),
      decision: "APPROVED",
      note: "Great work",
      reviewedAt: expect.any(String),
      reviewer: { id: mentor.id, name: "Grace" },
    });
  });

  it("allows approving without a note", async () => {
    const mentor = await createUser("MENTOR");
    const submission = await submit(await createUser());

    const response = await as(mentor).post(`/api/submissions/${submission.id}/review`, {
      decision: "APPROVED",
    });

    expect(response.status).toBe(200);
    expect(response.body.review.note).toBeNull();
  });

  it.each([undefined, "", "   "])("requires a note to reject (note: %j)", async (note) => {
    const mentor = await createUser("MENTOR");
    const submission = await submit(await createUser());

    const response = await as(mentor).post(`/api/submissions/${submission.id}/review`, {
      decision: "REJECTED",
      note,
    });

    expect(response.status).toBe(422);
    expect(response.body.error.details).toContainEqual(
      expect.objectContaining({ path: "note" }),
    );
    expect(await prisma.projectReview.count()).toBe(0);
  });

  it("refuses to review the same submission twice", async () => {
    const mentor = await createUser("MENTOR");
    const submission = await submit(await createUser());
    const path = `/api/submissions/${submission.id}/review`;
    await as(mentor).post(path, { decision: "APPROVED" });

    const again = await as(mentor).post(path, { decision: "REJECTED", note: "Changed my mind" });
    const stored = await prisma.projectSubmission.findUnique({
      where: { id: submission.id },
      include: { review: true },
    });

    expect(again.status).toBe(409);
    expect(stored?.status).toBe("APPROVED");
    expect(stored?.review?.decision).toBe("APPROVED");
  });

  it("lets exactly one of two simultaneous reviews win", async () => {
    const [alice, bob] = [await createUser("MENTOR"), await createUser("MENTOR")];
    const submission = await submit(await createUser());
    const path = `/api/submissions/${submission.id}/review`;

    const results = await Promise.all([
      as(alice).post(path, { decision: "APPROVED" }),
      as(bob).post(path, { decision: "REJECTED", note: "Needs work" }),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.projectReview.count()).toBe(1);
    const stored = await prisma.projectSubmission.findUniqueOrThrow({
      where: { id: submission.id },
      include: { review: true },
    });
    expect(stored.status).toBe(stored.review?.decision);
  });

  it("returns 404 for an unknown submission and 403 for students", async () => {
    const mentor = await createUser("MENTOR");
    const student = await createUser();
    const submission = await submit(student);

    const missing = await as(mentor).post("/api/submissions/nope/review", { decision: "APPROVED" });
    const asStudent = await as(student).post(`/api/submissions/${submission.id}/review`, {
      decision: "APPROVED",
    });

    expect(missing.status).toBe(404);
    expect(asStudent.status).toBe(403);
  });
});

describe("data integrity", () => {
  it("does not allow deleting a mentor who has written reviews", async () => {
    const mentor = await createUser("MENTOR");
    const submission = await submit(await createUser());
    await as(mentor).post(`/api/submissions/${submission.id}/review`, { decision: "APPROVED" });

    const attempt = prisma.user.delete({ where: { id: mentor.id } });

    await expect(attempt).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect(await prisma.user.count({ where: { id: mentor.id } })).toBe(1);
  });

  it("removes a student's submissions and their reviews with the student", async () => {
    const mentor = await createUser("MENTOR");
    const student = await createUser();
    const submission = await submit(student);
    await as(mentor).post(`/api/submissions/${submission.id}/review`, { decision: "APPROVED" });

    await prisma.user.delete({ where: { id: student.id } });

    expect(await prisma.projectSubmission.count()).toBe(0);
    expect(await prisma.projectReview.count()).toBe(0);
  });
});
