import { execSync } from "node:child_process";

/** Creates the test database if needed and applies every migration. */
export default function setup() {
  execSync("pnpm exec prisma migrate deploy", {
    stdio: "pipe",
    env: process.env,
  });
}
