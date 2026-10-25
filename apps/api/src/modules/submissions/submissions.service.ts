import { Prisma } from "@prisma/client";

import type { Paginated, Submission, SubmissionStats } from "@awi/shared";

import { conflict, notFound } from "../../lib/http-error.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthUser } from "../../types/express.js";
import type {
  CreateSubmissionInput,
  ListSubmissionsInput,
  PaginationInput,
  ReviewSubmissionInput,
} from "./submissions.schemas.js";

const submissionInclude = {
  student: { select: { id: true, name: true, email: true } },
  review: {
    select: {
      id: true,
      decision: true,
      note: true,
      reviewedAt: true,
      reviewer: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ProjectSubmissionInclude;

type SubmissionRow = Prisma.ProjectSubmissionGetPayload<{
  include: typeof submissionInclude;
}>;

/** Maps a database row onto the shared API contract. */
export function toSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    repoUrl: row.repoUrl,
    liveUrl: row.liveUrl,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    student: row.student,
    review: row.review && {
      id: row.review.id,
      decision: row.review.decision,
      note: row.review.note,
      reviewedAt: row.review.reviewedAt.toISOString(),
      reviewer: row.review.reviewer,
    },
  };
}

export async function createSubmission(
  studentId: string,
  input: CreateSubmissionInput,
): Promise<Submission> {
  try {
    const row = await prisma.projectSubmission.create({
      data: { ...input, studentId },
      include: submissionInclude,
    });
    return toSubmission(row);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("You have already submitted this repository");
    }
    throw error;
  }
}

export function listStudentSubmissions(
  studentId: string,
  pagination: PaginationInput,
): Promise<Paginated<Submission>> {
  return paginate({ studentId }, [{ createdAt: "desc" }, { id: "desc" }], pagination);
}

/** Mentor view of every submission, optionally filtered by status and text. */
export function listAllSubmissions({
  status,
  q,
  ...pagination
}: ListSubmissionsInput): Promise<Paginated<Submission>> {
  const where: Prisma.ProjectSubmissionWhereInput = {};
  if (status) where.status = status;
  if (q) {
    const contains = { contains: q, mode: "insensitive" } as const;
    where.OR = [
      { title: contains },
      { student: { name: contains } },
      { student: { email: contains } },
    ];
  }

  // The pending queue is first come, first served; everything else is newest first.
  const direction = status === "PENDING" ? "asc" : "desc";

  return paginate(
    where,
    [{ createdAt: direction }, { id: direction }],
    pagination,
  );
}

async function paginate(
  where: Prisma.ProjectSubmissionWhereInput,
  orderBy: Prisma.ProjectSubmissionOrderByWithRelationInput[],
  { page, pageSize }: PaginationInput,
): Promise<Paginated<Submission>> {
  const [rows, total] = await prisma.$transaction([
    prisma.projectSubmission.findMany({
      where,
      include: submissionInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.projectSubmission.count({ where }),
  ]);

  return {
    items: rows.map(toSubmission),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSubmissionStats(): Promise<SubmissionStats> {
  const groups = await prisma.projectSubmission.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const stats: SubmissionStats = { total: 0, pending: 0, approved: 0, rejected: 0 };
  for (const group of groups) {
    const count = group._count._all;
    stats.total += count;
    if (group.status === "PENDING") stats.pending = count;
    if (group.status === "APPROVED") stats.approved = count;
    if (group.status === "REJECTED") stats.rejected = count;
  }
  return stats;
}

/**
 * Records a mentor's decision. The status change and the review row are
 * written in one transaction, and only a PENDING submission can move, so two
 * mentors reviewing at once cannot both succeed.
 */
export async function reviewSubmission(
  reviewerId: string,
  submissionId: string,
  { decision, note }: ReviewSubmissionInput,
): Promise<Submission> {
  try {
    const row = await prisma.$transaction(async (tx) => {
      const { count } = await tx.projectSubmission.updateMany({
        where: { id: submissionId, status: "PENDING" },
        data: { status: decision },
      });

      if (count === 0) {
        const exists = await tx.projectSubmission.findUnique({
          where: { id: submissionId },
          select: { id: true },
        });
        if (!exists) throw notFound("Submission not found");
        throw conflict("This submission has already been reviewed");
      }

      await tx.projectReview.create({
        data: { submissionId, reviewerId, decision, note },
      });

      return tx.projectSubmission.findUniqueOrThrow({
        where: { id: submissionId },
        include: submissionInclude,
      });
    });

    return toSubmission(row);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("This submission has already been reviewed");
    }
    throw error;
  }
}

/** Students may only read their own submissions; mentors may read any. */
export async function getSubmission(
  user: AuthUser,
  id: string,
): Promise<Submission> {
  const row = await prisma.projectSubmission.findUnique({
    where: { id },
    include: submissionInclude,
  });

  // 404 rather than 403 so students cannot probe for other submission ids.
  if (!row || (user.role === "STUDENT" && row.studentId !== user.id)) {
    throw notFound("Submission not found");
  }

  return toSubmission(row);
}
