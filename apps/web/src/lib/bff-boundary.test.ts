import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";

/**
 * Automated Next.js → NestJS-only boundary check.
 *
 * This suite does not re-implement the audit: it runs scripts/audit-bff.mjs and
 * asserts the invariants that must hold at all times, so a new /app/api route,
 * a new server action, or a database import inside a client component fails the
 * normal `jest`/`pnpm test` run instead of being discovered later.
 */

const REPO_ROOT = resolve(__dirname, "../../../..");
const AUDIT_SCRIPT = join(REPO_ROOT, "scripts", "audit-bff.mjs");
const REGISTRY_PATH = join(REPO_ROOT, "scripts", "bff-route-map.json");

interface AuditRoute {
  method: string;
  webPath: string;
  nestPath: string;
  nestModule: string;
  nestController: string;
  nestHandler: string;
  phase: number;
  state: string;
  auditState: string;
  webPresent: boolean;
  nestPresent: boolean;
  consumers: string[];
  testRefs?: string[];
}

interface AuditSurface {
  file: string;
  kind: string;
  client: boolean;
  serverAction: boolean;
  dbAccess: string;
  registered: boolean;
}

interface AuditReport {
  summary: {
    webRoutes: number;
    webRouteMethods: number;
    registeredRoutes: number;
    registeredSurfaces: number;
    serverSurfaces: number;
    clientLeaks: number;
    domainDbFiles: number;
    webFilesWithDbAccess: number;
    webPrismaDependencies: string[];
  };
  routes: AuditRoute[];
  surfaces: AuditSurface[];
  violations: { code: string; detail: string }[];
}

interface Registry {
  phases: Record<string, { exitCriteria: string[] }>;
  routes: { method: string; webPath: string; nestPath: string; consumers: string[]; state: string }[];
  serverSurfaces: { webFile: string; kind: string }[];
}

let auditStdout = "";
let auditStatus: number | null = null;
let auditStderr = "";

beforeAll(() => {
  const run = spawnSync(process.execPath, [AUDIT_SCRIPT, "--check", "--json", "--no-write"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  auditStdout = run.stdout ?? "";
  auditStderr = run.stderr ?? "";
  auditStatus = run.status;
});

function auditReport(): AuditReport {
  try {
    return JSON.parse(auditStdout) as AuditReport;
  } catch {
    throw new Error(
      `scripts/audit-bff.mjs did not emit JSON (exit ${String(auditStatus)}): ${auditStderr || auditStdout.slice(0, 400)}`
    );
  }
}

function registry(): Registry {
  return JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) as Registry;
}
describe("Next.js → NestJS-only boundary", () => {
  it("runs the migration audit and passes the hard boundary gate", () => {
    const report = auditReport();
    expect(auditStderr).not.toContain("could not run");
    expect(report.violations).toEqual([]);
    expect(auditStatus).toBe(0);
  });

  it("registers every /app/api handler that still exists in the app", () => {
    const report = auditReport();
    expect(report.summary.webRouteMethods).toBeGreaterThan(0);
    expect(report.summary.registeredRoutes).toBeGreaterThanOrEqual(report.summary.webRouteMethods);
    // Every handler the scan found must be claimed by a registry entry, otherwise
    // BFF logic has been added without a NestJS target.
    expect(report.routes.filter((r) => r.webPresent).length).toBe(report.summary.webRoutes);
  });

  it("maps every web route to a NestJS controller handler under the API base", () => {
    for (const route of auditReport().routes) {
      expect(`${route.method} ${route.nestPath}`).toMatch(/^(GET|POST|PUT|PATCH|DELETE) \/api\/v1\//);
      expect(route.nestController).toMatch(/^apps\/api\/src\/.+\.controller\.ts$/);
      expect(route.nestHandler.length).toBeGreaterThan(0);
      expect(route.nestModule.length).toBeGreaterThan(0);
    }
  });

  it("keeps the registry honest about what is pending", () => {
    for (const route of auditReport().routes) {
      if (route.state === "pending") expect(route.auditState).toBe("PENDING_MIGRATION");
      if (route.auditState === "MIGRATED") expect(route.nestPresent).toBe(true);
    }
  });

  it("points every registered consumer at a real file and lists each file once", () => {
    for (const route of registry().routes) {
      for (const consumer of route.consumers) expect(existsSync(join(REPO_ROOT, consumer))).toBe(true);
    }
    const surfaces = registry().serverSurfaces;
    expect(new Set(surfaces.map((s) => s.webFile)).size).toBe(surfaces.length);
  });

  it("only permits the migration plan to close once the web Prisma dependency is gone", () => {
    expect(registry().phases["5"].exitCriteria.join(" ")).toContain("@prisma/client");
    const report = auditReport();
    if (report.summary.domainDbFiles > 0) {
      expect(report.summary.webPrismaDependencies).toContain("@prisma/client");
    }
  });

  it("never lets a client component reach the database", () => {
    const report = auditReport();
    expect(report.summary.clientLeaks).toBe(0);
    expect(report.violations.filter((v) => v.code === "client_component_database_access")).toEqual([]);
    for (const surface of report.surfaces.filter((s) => s.client)) {
      expect(surface.dbAccess).toBe("none");
    }
  });

  it("keeps Prisma and the web-side database singleton out of client modules", () => {
    const clientFiles = [
      "apps/web/src/components/LoginForm.tsx",
      "apps/web/src/components/booking/BookAppointmentWizard.tsx",
      "apps/web/src/components/clinical/PatientForm.tsx",
      "apps/web/src/app/admin/communications/composer.tsx",
      "apps/web/src/app/admin/settings/form.tsx",
      "apps/web/src/lib/auth-context.tsx",
    ];
    for (const file of clientFiles) {
      const source = readFileSync(join(REPO_ROOT, file), "utf8");
      expect(source.startsWith('"use client"')).toBe(true);
      expect(source).not.toContain("@prisma/client");
      expect(source).not.toContain("@/lib/db");
      expect(source).not.toMatch(/new PrismaClient/);
    }
  });
});