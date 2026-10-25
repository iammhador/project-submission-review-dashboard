import { afterAll, beforeEach } from "vitest";

import { prisma } from "../src/lib/prisma.js";

const databaseName = new URL(process.env.DATABASE_URL ?? "").pathname.slice(1);

if (!databaseName.endsWith("_test")) {
  throw new Error(
    `Refusing to run tests against "${databaseName}": the database name must end in _test.`,
  );
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "ProjectReview", "ProjectSubmission", "User" CASCADE',
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
