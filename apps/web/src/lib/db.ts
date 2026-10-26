import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Next.js only loads `.env` files from the Next project root — `apps/web`,
 * which has none — while the repository's `.env` (the only one that exists)
 * sits two directories above. `next dev` and `next start` therefore never see
 * `DATABASE_URL` unless it happens to be exported in the shell, and every
 * database-backed route throws `Environment variable not found: DATABASE_URL`.
 * Because callers such as the booking wizard swallow fetch errors, that 500
 * reaches the user as "No doctors available / No active doctors found. Please
 * contact clinic." — indistinguishable from a genuinely empty database.
 *
 * Fill the gap from the workspace-root `.env` (the directory holding
 * `pnpm-workspace.yaml`). Two rules keep this safe:
 *   - a value already in `process.env` always wins, so a deployment
 *     environment (Vercel) is authoritative and unaffected;
 *   - `NEXT_PUBLIC_*` is skipped — those are inlined into the client bundle at
 *     build time and must never be introduced at runtime from a server module.
 *
 * This module is `server-only`, so nothing loaded here can reach the browser.
 */
function loadWorkspaceEnv(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      const file = path.join(dir, ".env");
      if (!existsSync(file)) return null;
      for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        if (!key || key.startsWith("NEXT_PUBLIC_")) continue;
        if (process.env[key]) continue;
        const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (value) process.env[key] = value;
      }
      return file;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

const workspaceEnvFile = loadWorkspaceEnv();

declare global {
  // eslint-disable-next-line no-var
  var __citydentalPrisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Fail loudly once, at client creation, instead of per query with a
    // PrismaClientInitializationError that callers often swallow.
    console.warn(
      `[db] DATABASE_URL is not set (checked ${workspaceEnvFile ?? "no workspace .env"}); ` +
        "database-backed routes will fail until it is provided.",
    );
  }
  return new PrismaClient();
}

export const prisma: PrismaClient =
  globalThis.__citydentalPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__citydentalPrisma = prisma;
}
