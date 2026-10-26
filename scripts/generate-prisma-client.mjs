#!/usr/bin/env node
/**
 * Generates the Prisma client before `next build`.
 *
 * `apps/web` has no schema of its own; it uses apps/api/prisma/schema.prisma.
 * `prisma generate` never opens a database connection and runs no migrations,
 * so this is safe to run during a deploy build.
 *
 * Called inline from the `build`/`dev` scripts rather than a `prebuild` hook
 * because Vercel does not execute package.json lifecycle hooks (see PROD.md).
 *
 * On Windows the generated query-engine DLL is locked by a running dev server,
 * which makes `prisma generate` exit non-zero even though a complete client is
 * already present. In that case we continue instead of failing the build. We
 * only do so when the existing client actually contains our schema's types —
 * otherwise a genuine generation failure still fails the build loudly.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = path.join(repoRoot, "apps", "api", "prisma", "schema.prisma");

/** Returns the generated client's `index.d.ts` contents, or null if absent. */
function generatedClientTypes() {
  try {
    const require = createRequire(path.join(process.cwd(), "noop.js"));
    let dir = path.dirname(require.resolve("@prisma/client"));
    // Walk up to the node_modules dir that holds `.prisma/client`.
    for (let i = 0; i < 6; i++) {
      if (path.basename(dir) === "node_modules") {
        const file = path.join(dir, ".prisma", "client", "index.d.ts");
        return existsSync(file) ? readFileSync(file, "utf8") : null;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return null;
  } catch {
    return null;
  }
}

/** True when `.prisma/client` already holds types generated from our schema. */
function generatedClientIsUsable() {
  return (generatedClientTypes() ?? "").includes("AuditAction");
}

const windows = process.platform === "win32";
const schemaArg = windows ? `--schema="${schema}"` : `--schema=${schema}`;

const result = spawnSync("prisma", ["generate", schemaArg], {
  stdio: ["inherit", "inherit", "pipe"],
  encoding: "utf8",
  shell: windows,
});

const stderr = result.stderr ?? "";

if (result.status === 0) {
  process.exit(0);
}

// The "usable client already exists" fallback exists only for Windows
// development, where a running server can hold the query-engine DLL open and
// make `prisma generate` exit non-zero after writing a complete client.
// On CI/Vercel a failed generation must fail the build: continuing there would
// type-check against whatever stale client happened to be in the cache, which is
// exactly how `AuditAction` went missing on a deployment.
const isCi = process.env.CI === "true" || process.env.CI === "1";

if (!isCi && generatedClientIsUsable()) {
  console.warn("[prisma] generate did not complete, but a usable client is already generated; continuing.");
  if (stderr.trim()) console.warn(stderr.trimEnd());
  process.exit(0);
}

console.error("[prisma] generate failed and no usable generated client was found:");
if (stderr.trim()) console.error(stderr.trimEnd());
process.exit(result.status ?? 1);
