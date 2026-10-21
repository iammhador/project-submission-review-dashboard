/**
 * Shared domain vocabulary used by both the web and API apps.
 * Validation schemas and DTOs will live here as features are implemented.
 */

export const ROLES = {
  STUDENT: "STUDENT",
  MENTOR: "MENTOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const SUBMISSION_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type SubmissionStatus =
  (typeof SUBMISSION_STATUSES)[keyof typeof SUBMISSION_STATUSES];
