import "dotenv/config";

import { PrismaClient, Role } from "@prisma/client";

import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

const NAME = process.env.SEED_MENTOR_NAME?.trim() || "AWI Mentor";
const EMAIL = (process.env.SEED_MENTOR_EMAIL || "mentor@awi.dev")
  .trim()
  .toLowerCase();
const PASSWORD = process.env.SEED_MENTOR_PASSWORD || "mentor-password-123";

async function main() {
  if (PASSWORD.length < 8) {
    throw new Error("SEED_MENTOR_PASSWORD must be at least 8 characters");
  }

  const passwordHash = await hashPassword(PASSWORD);

  const mentor = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { name: NAME, passwordHash, role: Role.MENTOR },
    create: { name: NAME, email: EMAIL, passwordHash, role: Role.MENTOR },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log(
    `[seed] ${mentor.role.toLowerCase()} ready: ${mentor.email} (${mentor.id})`,
  );
  console.log("[seed] change the seeded password before deploying.");
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
