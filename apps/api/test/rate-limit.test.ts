import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { durationToSeconds } from "../src/lib/cookies.js";
import { errorHandler } from "../src/middleware/error-handler.js";
import { rateLimit } from "../src/middleware/rate-limit.js";

function limitedApp(max: number, windowMs: number) {
  const app = express();
  app.get("/", rateLimit({ max, windowMs, message: "Slow down" }), (_req, res) => {
    res.sendStatus(200);
  });
  app.use(errorHandler);
  return app;
}

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit, then answers 429 with Retry-After", async () => {
    const app = limitedApp(2, 60_000);

    const statuses = [];
    for (let i = 0; i < 3; i++) statuses.push((await request(app).get("/")).status);
    const blocked = await request(app).get("/");

    expect(statuses).toEqual([200, 200, 429]);
    expect(blocked.body.error.message).toBe("Slow down");
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("opens again once the window has passed", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const app = limitedApp(1, 60_000);

    expect((await request(app).get("/")).status).toBe(200);
    expect((await request(app).get("/")).status).toBe(429);

    vi.setSystemTime(Date.now() + 60_001);

    expect((await request(app).get("/")).status).toBe(200);
  });
});

describe("durationToSeconds", () => {
  it.each([
    ["30s", 30],
    ["15m", 900],
    ["12h", 43_200],
    ["7d", 604_800],
  ])("parses %s", (value, seconds) => {
    expect(durationToSeconds(value)).toBe(seconds);
  });

  it("falls back to seven days for values it cannot parse", () => {
    expect(durationToSeconds("forever")).toBe(604_800);
  });
});
