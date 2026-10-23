-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ProjectReview" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "note" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectReview_pkey" PRIMARY KEY ("id")
);

-- Backfill: carry existing reviews over before the old columns are dropped.
-- Reviews whose mentor was deleted (mentorId set to NULL) have no reviewer and
-- cannot be represented; those submissions keep their status only.
INSERT INTO "ProjectReview" ("id", "submissionId", "reviewerId", "decision", "note", "reviewedAt", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "mentorId",
    "status"::text::"ReviewDecision",
    "reviewNote",
    COALESCE("reviewedAt", "updatedAt"),
    COALESCE("reviewedAt", "updatedAt"),
    CURRENT_TIMESTAMP
FROM "ProjectSubmission"
WHERE "mentorId" IS NOT NULL
  AND "status" IN ('APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "ProjectSubmission" DROP CONSTRAINT "ProjectSubmission_mentorId_fkey";

-- DropIndex
DROP INDEX "ProjectSubmission_mentorId_idx";

-- AlterTable
ALTER TABLE "ProjectSubmission" DROP COLUMN "mentorId",
DROP COLUMN "reviewNote",
DROP COLUMN "reviewedAt";

-- CreateIndex
CREATE UNIQUE INDEX "ProjectReview_submissionId_key" ON "ProjectReview"("submissionId");

-- CreateIndex
CREATE INDEX "ProjectReview_reviewerId_reviewedAt_idx" ON "ProjectReview"("reviewerId", "reviewedAt");

-- CreateIndex
CREATE INDEX "ProjectReview_decision_reviewedAt_idx" ON "ProjectReview"("decision", "reviewedAt");

-- AddForeignKey
ALTER TABLE "ProjectReview" ADD CONSTRAINT "ProjectReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReview" ADD CONSTRAINT "ProjectReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
