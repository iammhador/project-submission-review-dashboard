/**
 * Shared domain vocabulary used by both the web and API apps.
 * Validation schemas stay in the API; this package carries the contract
 * (enums, DTOs and pagination shapes) that both sides compile against.
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

export const REVIEW_DECISIONS = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ReviewDecision =
  (typeof REVIEW_DECISIONS)[keyof typeof REVIEW_DECISIONS];

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface SubmissionAuthor {
  id: string;
  name: string;
  email: string;
}

export interface SubmissionReviewer {
  id: string;
  name: string;
}

export interface SubmissionReview {
  id: string;
  decision: ReviewDecision;
  note: string | null;
  reviewedAt: string;
  reviewer: SubmissionReviewer;
}

export interface Submission {
  id: string;
  title: string;
  description: string;
  repoUrl: string;
  liveUrl: string | null;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  student: SubmissionAuthor;
  review: SubmissionReview | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface AuthResponse {
  user: UserSummary;
  token: string;
}
