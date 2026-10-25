import { z } from "zod";

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  REVIEW_DECISIONS,
  SUBMISSION_STATUSES,
} from "@awi/shared";

const httpUrl = z
  .string()
  .trim()
  .max(2048, "URL must be at most 2048 characters")
  .pipe(
    z.url({
      protocol: /^https?$/,
      error: "Enter a valid http(s) URL",
    }),
  );

export const createSubmissionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters"),
  repoUrl: httpUrl,
  // An empty field from the form means "no live demo".
  liveUrl: z
    .union([z.literal(""), httpUrl])
    .nullish()
    .transform((value) => value || null),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export const listSubmissionsSchema = paginationSchema.extend({
  status: z.enum(SUBMISSION_STATUSES).optional(),
  // Matches the title, or the student's name or email.
  q: z.string().trim().max(100).optional(),
});

export const submissionIdSchema = z.object({
  id: z.string().min(1).max(64),
});

export const reviewSubmissionSchema = z
  .object({
    decision: z.enum(REVIEW_DECISIONS),
    note: z
      .string()
      .trim()
      .max(2000, "Note must be at most 2000 characters")
      .optional()
      .transform((value) => value || null),
  })
  .refine((review) => review.decision === "APPROVED" || review.note, {
    path: ["note"],
    message: "Tell the student what to change before rejecting",
  });

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ListSubmissionsInput = z.infer<typeof listSubmissionsSchema>;
export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;
