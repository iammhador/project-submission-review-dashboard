import "dotenv/config";
import { defineConfig } from "vitest/config";

/**
 * Tests run against a separate database so they never touch development data.
 * By default that is the DATABASE_URL database with a `_test` suffix
 * (awi -> awi_test); set TEST_DATABASE_URL to use a different one.
 */
function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  const url = new URL(
    process.env.DATABASE_URL ?? "postgresql://awi:awi@localhost:5432/awi",
  );
  url.pathname = `/${url.pathname.slice(1)}_test`;
  return url.toString();
}

const env = {
  NODE_ENV: "test",
  DATABASE_URL: testDatabaseUrl(),
  JWT_SECRET:
    process.env.JWT_SECRET ?? "test-secret-that-is-at-least-32-characters",
};

// The global setup runs in this process, so it needs the same environment.
Object.assign(process.env, env);

export default defineConfig({
  test: {
    env,
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    // Every file truncates the same database, so files must not overlap.
    fileParallelism: false,
    hookTimeout: 60_000,
  },
});
