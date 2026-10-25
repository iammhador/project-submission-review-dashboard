import type { RequestHandler } from "express";

import { HttpError } from "../lib/http-error.js";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Defaults to the authenticated user, falling back to the client IP. */
  key?: (req: Parameters<RequestHandler>[0]) => string;
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const SWEEP_INTERVAL_MS = 60_000;

/**
 * Small in-memory fixed-window limiter. Adequate for a single API instance;
 * swap for Redis when the API is scaled horizontally.
 */
export function rateLimit({
  windowMs,
  max,
  key = (req) => req.user?.id ?? req.ip ?? "anonymous",
  message = "Too many requests. Please try again later.",
}: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }, SWEEP_INTERVAL_MS);
  sweep.unref();

  return (req, res, next) => {
    const now = Date.now();
    const bucketKey = key(req);
    const bucket = buckets.get(bucketKey);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= max) {
      res.setHeader(
        "Retry-After",
        Math.ceil((bucket.resetAt - now) / 1000).toString(),
      );
      next(new HttpError(429, message));
      return;
    }

    bucket.count += 1;
    next();
  };
}
