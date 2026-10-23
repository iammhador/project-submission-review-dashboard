-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'MENTOR');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSubmission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "liveUrl" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "studentId" TEXT NOT NULL,
    "mentorId" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "ProjectSubmission_studentId_createdAt_idx" ON "ProjectSubmission"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectSubmission_status_createdAt_idx" ON "ProjectSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectSubmission_mentorId_idx" ON "ProjectSubmission"("mentorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSubmission_studentId_repoUrl_key" ON "ProjectSubmission"("studentId", "repoUrl");

-- AddForeignKey
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

