import { Router } from "express";

import type { Paginated, Submission, SubmissionStats } from "@awi/shared";

import { parse } from "../../lib/validation.js";
import { currentUser, requireAuth, requireRole } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import {
  createSubmissionSchema,
  listSubmissionsSchema,
  paginationSchema,
  reviewSubmissionSchema,
  submissionIdSchema,
} from "./submissions.schemas.js";
import {
  createSubmission,
  getSubmission,
  getSubmissionStats,
  listAllSubmissions,
  listStudentSubmissions,
  reviewSubmission,
} from "./submissions.service.js";

export const submissionsRouter = Router();

const createLimiter = rateLimit({
  windowMs: 60 * 60_000,
  max: 30,
  message: "Too many submissions. Try again later.",
});

submissionsRouter.use(requireAuth);

submissionsRouter.post(
  "/",
  requireRole("STUDENT"),
  createLimiter,
  async (req, res) => {
    const input = parse(createSubmissionSchema, req.body);
    const submission = await createSubmission(currentUser(req).id, input);

    res.status(201).json(submission satisfies Submission);
  },
);

submissionsRouter.get("/mine", requireRole("STUDENT"), async (req, res) => {
  const query = parse(paginationSchema, req.query);
  const result = await listStudentSubmissions(currentUser(req).id, query);

  res.status(200).json(result satisfies Paginated<Submission>);
});

submissionsRouter.get("/", requireRole("MENTOR"), async (req, res) => {
  const query = parse(listSubmissionsSchema, req.query);
  const result = await listAllSubmissions(query);

  res.status(200).json(result satisfies Paginated<Submission>);
});

// Registered before "/:id" so "stats" is not treated as a submission id.
submissionsRouter.get("/stats", requireRole("MENTOR"), async (_req, res) => {
  const stats = await getSubmissionStats();

  res.status(200).json(stats satisfies SubmissionStats);
});

submissionsRouter.get("/:id", async (req, res) => {
  const { id } = parse(submissionIdSchema, req.params);
  const submission = await getSubmission(currentUser(req), id);

  res.status(200).json(submission satisfies Submission);
});

submissionsRouter.post(
  "/:id/review",
  requireRole("MENTOR"),
  async (req, res) => {
    const { id } = parse(submissionIdSchema, req.params);
    const input = parse(reviewSubmissionSchema, req.body);
    const submission = await reviewSubmission(currentUser(req).id, id, input);

    res.status(200).json(submission satisfies Submission);
  },
);
