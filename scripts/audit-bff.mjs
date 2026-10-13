#!/usr/bin/env node
/**
 * scripts/audit-bff.mjs
 *
 * Automated Next.js -> NestJS-only migration audit for the city-dental monorepo.
 *
 * It answers four questions over the repository, with no runtime dependencies:
 *   1. Which /app/api route handlers still exist in the Next.js app?
 *   2. Which NestJS endpoints exist today (controller + handler + full path)?
 *   3. Which repository files reach the database directly from the web app?
 *   4. Does every discovered surface line up with scripts/bff-route-map.json
 *      (the migration registry), or has something been added without a plan?
 *
 * Usage:
 *   node scripts/audit-bff.mjs              # audit + write the report artefacts
 *   node scripts/audit-bff.mjs --check      # exit 1 on hard boundary violations (CI gate)
 *   node scripts/audit-bff.mjs --strict     # exit 1 while any BFF surface or direct
 *                                           # web-side database access still remains
 *   node scripts/audit-bff.mjs --json       # print the machine-readable result to stdout
 *   node scripts/audit-bff.mjs --no-write   # do not touch docs/ or temp/
 *
 * Exit codes: 0 = pass, 1 = failure, 2 = the audit itself could not run.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const args = new Set(process.argv.slice(2));
const CHECK = args.has("--check");
const STRICT = args.has("--strict");
const JSON_STDOUT = args.has("--json");
const WRITE = !args.has("--no-write");

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEB_ROOT = join(REPO_ROOT, "apps", "web");
const WEB_SRC = join(WEB_ROOT, "src");
const API_ROOT = join(REPO_ROOT, "apps", "api");
const API_SRC = join(API_ROOT, "src");
const REGISTRY_PATH = join(REPO_ROOT, "scripts", "bff-route-map.json");
const REPORT_PATH = join(REPO_ROOT, "docs", "architecture", "bff-migration-audit.md");
const JSON_OUT_PATH = join(REPO_ROOT, "temp", "bff-audit.json");

/** Directives that decide which runtime a Next.js file belongs to. */
const USE_CLIENT = /^["']use client["'];?\s*$/m;
const USE_SERVER = /^\s*["']use server["'];?\s*$/m;

/** Import specifiers that mean "this file can reach the database". */
const PRISMA_CLIENT = "@prisma/client";
const WEB_PRISMA_SINGLETON = "@/lib/db";

/**
 * Web modules whose database access is the interim session mechanism (server-side
 * JWT verification plus permission hydration). They are tracked separately from
 * domain access because phase 1 exists precisely to remove them.
 */
const AUTH_BASELINE_MODULES = ["@/lib/auth/session", "@/lib/auth/permissions"];

const IGNORED_DIRS = new Set(["node_modules", ".next", "dist", "coverage", "temp", "logs", ".turbo"]);
const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const TEST_RE = /(\.test\.|\.spec\.|__tests__|\/test\/)/;

const SECRET_EXPOSURE = /NEXT_PUBLIC_[A-Z0-9_]*(SECRET|KEY|TOKEN|PASSWORD|DATABASE|JWT|SMTP|SMS|WHATSAPP)/;

function toPosix(p) {
  return p.split(sep).join("/");
}

function rel(abs) {
  return toPosix(relative(REPO_ROOT, abs));
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), out);
    } else {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

function read(abs) {
  return readFileSync(abs, "utf8");
}

/** Every import specifier in a TypeScript/JavaScript source file. */
function importsOf(src) {
  const found = [];
  for (const match of src.matchAll(/\bfrom\s+["']([^"']+)["']/g)) found.push(match[1]);
  for (const match of src.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) found.push(match[1]);
  return [...new Set(found)];
}

function hasDirectDbAccess(src, importList) {
  return (
    importList.includes(PRISMA_CLIENT) ||
    importList.includes(WEB_PRISMA_SINGLETON) ||
    /\bnew\s+PrismaClient\b/.test(src) ||
    /\bprisma\s*\.\s*[A-Za-z_$]/.test(src)
  );
}

function kindOf(relPath) {
  const padded = `/${relPath}`;
  if (/\/app\/.*\/route\.(ts|js)$/.test(padded)) return "route";
  if (/\/app\/.*\/page\.(tsx?|jsx?)$/.test(padded)) return "page";
  if (/\/app\/.*\/layout\.(tsx?|jsx?)$/.test(padded)) return "layout";
  if (/\/app\//.test(padded)) return "app-other";
  if (/\/components\//.test(padded)) return "component";
  if (/\/lib\//.test(padded)) return "lib";
  return "other";
}
/**
 * Pass 1: read every web source file and record its layer, kind and raw imports.
 */
export function scanWebSources() {
  const files = [];
  for (const abs of walk(WEB_SRC)) {
    if (!SOURCE_EXT.has(abs.slice(abs.lastIndexOf(".")))) continue;
    const relPath = rel(abs);
    if (TEST_RE.test(relPath)) continue;
    const src = read(abs);
    const importList = importsOf(src);
    files.push({
      file: relPath,
      kind: kindOf(relPath),
      client: USE_CLIENT.test(src.slice(0, 2000)),
      serverAction: USE_SERVER.test(src),
      imports: importList,
      directDb: hasDirectDbAccess(src, importList),
      secretExposure: SECRET_EXPOSURE.test(`/${relPath}\n${src}`),
      lines: src.split("\n").length,
    });
  }
  return files;
}

/**
 * Pass 2: derive the set of web modules that can reach the database, so pages and
 * components importing them can be flagged as transitively database-backed.
 */
export function dbBackedModules(files) {
  const backed = new Set();
  for (const file of files) {
    if (file.kind !== "lib" || !file.directDb) continue;
    const rest = file.file.replace("apps/web/src/lib/", "").replace(/\.(ts|tsx)$/, "");
    backed.add(`@/lib/${rest}`);
    backed.add(`@/lib/${rest.replace(/\/index$/, "")}`);
  }
  return backed;
}

function domainImportsOf(file, backed) {
  return file.imports.filter((m) => backed.has(m) && !AUTH_BASELINE_MODULES.includes(m));
}

function classify(file, backed) {
  if (file.directDb) return "direct";
  if (domainImportsOf(file, backed).length > 0) return "via-lib";
  if (file.imports.some((m) => AUTH_BASELINE_MODULES.includes(m))) return "via-auth";
  return "none";
}

/**
 * Discover every Next.js route handler under src/app and its exported HTTP methods.
 * Route groups `(name)` are dropped and dynamic segments are preserved, which is
 * exactly how Next.js resolves the URL.
 */
export function discoverNextRoutes(files) {
  const appDir = join(WEB_SRC, "app");
  return files
    .filter((file) => file.kind === "route")
    .map((file) => {
      const abs = join(REPO_ROOT, file.file);
      const src = read(abs);
      const urlPath =
        "/" +
        toPosix(relative(appDir, abs))
          .replace(/route\.(ts|js)$/, "")
          .replace(/\/\([^)]*\)(?=\/|$)/g, "")
          .replace(/\/$/, "");
      const methods = [
        ...new Set(
          [
            ...src.matchAll(
              /export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g
            ),
          ].map((m) => m[1])
        ),
      ].sort();
      return {
        ...file,
        webPath: urlPath,
        methods,
        usesSession: /@\/lib\/auth\/session/.test(src),
        usesAudit: /@\/lib\/audit/.test(src),
      };
    })
    .sort((a, b) => a.webPath.localeCompare(b.webPath));
}
/**
 * Discover the NestJS HTTP surface: global prefix from main.ts, controller prefix
 * from @Controller(...), method and path from @Get/@Post/... decorators.
 */
export function discoverNestEndpoints() {
  const mainPath = join(API_SRC, "main.ts");
  const globalPrefix = existsSync(mainPath)
    ? (/setGlobalPrefix\(\s*["']([^"']*)["']/.exec(read(mainPath))?.[1] ?? "")
    : "";
  const endpoints = [];

  const controllers = walk(API_SRC).filter((abs) => /\.controller\.ts$/.test(abs));
  for (const abs of controllers) {
    const src = read(abs);
    const file = rel(abs);
    const controllerPrefix = /@Controller\(\s*(?:["'`]([^"'`]*)["'`])?\s*\)/.exec(src)?.[1] ?? "";
    const guards = [...src.matchAll(/@UseGuards\(([^)]*)\)/g)].map((m) => m[1].trim());

    for (const match of src.matchAll(/@(Get|Post|Put|Patch|Delete|Head|Options)\(([^)]*)\)/g)) {
      const method = match[1].toUpperCase();
      const methodArg = /["'`]([^"'`]*)["'`]/.exec(match[2])?.[1] ?? "";
      // Walk forward past stacked decorators to find the handler identifier.
      const after = src.slice(match.index + match[0].length);
      const handler =
        /^\s*(?:@[A-Za-z_$][\w$]*(?:\((?:[^()]|\([^()]*\))*\))?\s*)*(?:public\s+|private\s+|protected\s+)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(/.exec(
          after
        )?.[1] ?? "unknown";
      const path = `/${[globalPrefix, controllerPrefix, methodArg].filter(Boolean).join("/")}`
        .replace(/\/+/g, "/")
        .replace(/\/$/, "");
      endpoints.push({ method, path, controllerFile: file, handler, guards });
    }
  }

  endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  return { globalPrefix, endpoints };
}

function routeKey(method, path) {
  return `${method.toUpperCase()} ${path}`;
}

/** Read the migration registry; a malformed registry is a fatal audit failure. */
export function loadRegistry() {
  const registry = JSON.parse(read(REGISTRY_PATH));
  if (!Array.isArray(registry.routes) || !Array.isArray(registry.serverSurfaces)) {
    throw new Error("registry must contain 'routes' and 'serverSurfaces' arrays");
  }
  for (const entry of registry.routes) {
    for (const field of ["method", "webPath", "nestPath", "nestController", "nestHandler", "phase", "state"]) {
      if (entry[field] === undefined) {
        throw new Error(`registry route entry is missing '${field}': ${JSON.stringify(entry).slice(0, 120)}`);
      }
    }
  }
  for (const entry of registry.serverSurfaces) {
    for (const field of ["webFile", "kind", "phase", "state"]) {
      if (entry[field] === undefined) {
        throw new Error(`registry server surface is missing '${field}': ${JSON.stringify(entry).slice(0, 120)}`);
      }
    }
  }
  return registry;
}

/** The web package must stop depending on Prisma once phase 5 lands. */
function webPrismaDependencies() {
  const pkgPath = join(WEB_ROOT, "package.json");
  if (!existsSync(pkgPath)) return [];
  const pkg = JSON.parse(read(pkgPath));
  return ["dependencies", "devDependencies"]
    .flatMap((section) => Object.keys(pkg[section] ?? {}))
    .filter((name) => name === PRISMA_CLIENT || name === "prisma")
    .sort();
}
/**
 * Run the full audit. Read-only with respect to the repository.
 */
export function runAudit() {
  const registry = loadRegistry();
  const webFiles = scanWebSources();
  const backed = dbBackedModules(webFiles);
  const routes = discoverNextRoutes(webFiles);
  const { globalPrefix, endpoints } = discoverNestEndpoints();

  const violations = [];
  const nestIndex = new Map(endpoints.map((e) => [routeKey(e.method, e.path), e]));
  const registryRoutes = new Map(registry.routes.map((r) => [routeKey(r.method, r.webPath), r]));
  const claimedNest = new Set();

  const seenRouteKeys = new Set();
  for (const entry of registry.routes) {
    const key = routeKey(entry.method, entry.webPath);
    if (seenRouteKeys.has(key)) {
      violations.push({
        code: "registry_duplicate_route",
        detail: `${key} appears more than once in scripts/bff-route-map.json routes`,
      });
    }
    seenRouteKeys.add(key);
  }

  const seenSurfaceFiles = new Set();
  for (const entry of registry.serverSurfaces) {
    if (seenSurfaceFiles.has(entry.webFile)) {
      violations.push({
        code: "registry_duplicate_surface",
        detail: `${entry.webFile} appears more than once in serverSurfaces; merge actions into a single entry`,
      });
    }
    seenSurfaceFiles.add(entry.webFile);
  }

  const mappedRoutes = registry.routes.map((entry) => {
    const key = routeKey(entry.method, entry.webPath);
    const web = routes.find((r) => r.webPath === entry.webPath && r.methods.includes(entry.method));
    const nest = nestIndex.get(routeKey(entry.method, entry.nestPath)) ?? null;
    if (nest) claimedNest.add(routeKey(entry.method, entry.nestPath));

    if (entry.state === "migrated" && !nest) {
      violations.push({
        code: "registry_lies_missing_nest_handler",
        detail: `${key} is registered as 'migrated' but no ${routeKey(entry.method, entry.nestPath)} handler exists`,
      });
    }
    if (entry.state === "migrated" && web) {
      violations.push({
        code: "migration_incomplete_next_route_still_present",
        detail: `${key} is registered as 'migrated' but ${entry.webFile} still exists`,
      });
    }
    for (const ref of entry.testRefs ?? []) {
      if (!existsSync(join(REPO_ROOT, ref))) {
        violations.push({ code: "stale_test_reference", detail: `${key} references missing test file ${ref}` });
      }
    }

    let state;
    if (web && nest) state = "MIGRATED_ROUTE_STILL_PRESENT";
    else if (!web && nest) state = "MIGRATED";
    else if (web && !nest) state = "PENDING_MIGRATION";
    else state = "STALE_REGISTRY_ENTRY";

    return {
      ...entry,
      key,
      webPresent: Boolean(web),
      nestPresent: Boolean(nest),
      nestHandlerFound: nest?.handler ?? null,
      nestControllerFound: nest?.controllerFile ?? null,
      auditState: state,
    };
  });

for (const route of routes) {
    for (const method of route.methods) {
      if (!registryRoutes.has(routeKey(method, route.webPath))) {
        violations.push({
          code: "unregistered_next_route",
          detail: `${routeKey(method, route.webPath)} (${route.file}) is not in scripts/bff-route-map.json`,
        });
      }
    }
  }
  const registeredSurfaces = new Map(registry.serverSurfaces.map((s) => [s.webFile, s]));
  const surfaces = webFiles
    .filter((file) => file.kind === "page" || file.kind === "layout" || file.kind === "app-other")
    .map((file) => ({
      file: file.file,
      kind: file.kind,
      client: file.client,
      serverAction: file.serverAction,
      dbAccess: classify(file, backed),
      domainImports: domainImportsOf(file, backed),
      registered: registeredSurfaces.has(file.file),
    }))
    .filter((s) => s.dbAccess !== "none" || s.serverAction);

  for (const surface of surfaces) {
    if (surface.serverAction && !surface.registered) {
      violations.push({
        code: "unregistered_server_action",
        detail: `${surface.file} declares "use server" but is not in the registry (serverSurfaces)`,
      });
    }
    if (surface.dbAccess !== "via-auth" && surface.dbAccess !== "none" && !surface.registered) {
      violations.push({
        code: "unregistered_domain_db_surface",
        detail: `${surface.file} reaches domain data (${surface.dbAccess}) but is not in the registry (serverSurfaces)`,
      });
    }
  }

  for (const entry of registry.serverSurfaces) {
    if (!existsSync(join(REPO_ROOT, entry.webFile)) && entry.state === "pending") {
      violations.push({
        code: "stale_server_surface_entry",
        detail: `${entry.webFile} is registered but no longer exists; set state to 'migrated' or remove the entry`,
      });
    }
  }

  const dbFiles = webFiles
    .filter((file) => file.directDb || domainImportsOf(file, backed).length > 0)
    .map((file) => ({
      file: file.file,
      kind: file.kind,
      client: file.client,
      dbAccess: classify(file, backed),
      domainImports: domainImportsOf(file, backed),
      directDb: file.directDb,
    }));

  const clientLeaks = webFiles
    .filter(
      (file) =>
        (file.client || file.kind === "component") &&
        (file.directDb || domainImportsOf(file, backed).length > 0)
    )
    .map((file) => file.file)
    .sort();
  for (const file of clientLeaks) {
    violations.push({
      code: "client_component_database_access",
      detail: `${file} is a client-side module that can reach the database`,
    });
  }

  for (const file of webFiles.filter((f) => f.secretExposure)) {
    violations.push({
      code: "next_public_secret_exposure",
      detail: `${file.file} references a NEXT_PUBLIC_* name that looks like a secret`,
    });
  }

  const unmappedNest = endpoints
    .filter((e) => !claimedNest.has(routeKey(e.method, e.path)))
    .filter((e) => !(registry.nestExceptions ?? []).includes(routeKey(e.method, e.path)));

  const summary = {
    generatedAt: new Date().toISOString(),
    globalPrefix,
    webRoutes: routes.length,
    webRouteMethods: routes.reduce((sum, r) => sum + r.methods.length, 0),
    registeredRoutes: registry.routes.length,
    nestEndpoints: endpoints.length,
    migratedRoutes: mappedRoutes.filter((r) => r.auditState === "MIGRATED").length,
    pendingRoutes: mappedRoutes.filter((r) => r.auditState === "PENDING_MIGRATION").length,
    serverSurfaces: surfaces.length,
    registeredSurfaces: registry.serverSurfaces.length,
    domainDbFiles: dbFiles.length,
    domainDbFilesByKind: dbFiles.reduce((acc, f) => {
      acc[f.kind] = (acc[f.kind] ?? 0) + 1;
      return acc;
    }, {}),
    sessionOnlyDbFiles: webFiles.filter((f) => classify(f, backed) === "via-auth").map((f) => f.file).sort(),
    webFilesWithDbAccess: webFiles.filter((f) => classify(f, backed) !== "none").length,
    clientLeaks: clientLeaks.length,
    nestUnmappedEndpoints: unmappedNest.length,
    violations: violations.length,
    webPrismaDependencies: webPrismaDependencies(),
  };

  const strictFailures = [];
  if (summary.pendingRoutes > 0)
    strictFailures.push(`${summary.pendingRoutes} /app/api route(s) are still served by Next.js`);
  if (summary.domainDbFiles > 0)
    strictFailures.push(`${summary.domainDbFiles} web file(s) still reach domain data directly`);
  if (summary.webPrismaDependencies.length > 0)
    strictFailures.push(`apps/web still depends on ${summary.webPrismaDependencies.join(", ")}`);
  if (summary.webFilesWithDbAccess > 0)
    strictFailures.push(
      `${summary.webFilesWithDbAccess} web file(s) still reach the database (including the interim session path)`
    );

  return {
    summary,
    registry,
    routes: mappedRoutes,
    surfaces,
    nestEndpoints: endpoints,
    unmappedNestEndpoints: unmappedNest,
    webDbFiles: dbFiles.sort((a, b) => a.file.localeCompare(b.file)),
    violations,
    strictFailures,
  };
}
function markdownTable(headers, rows) {
  const head = `| ${headers.join(" | ")} |`;
  const rule = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replace(/\|/g, "\\|")).join(" | ")} |`);
  return [head, rule, ...body].join("\n");
}

function phaseLabel(registry, phase) {
  const meta = registry.phases?.[String(phase)];
  return meta ? `Phase ${phase} — ${meta.name}` : `Phase ${phase}`;
}

/** Render the human-readable migration audit report. */
export function renderReport(audit) {
  const { summary, registry, routes, surfaces, nestEndpoints, unmappedNestEndpoints, webDbFiles, violations, strictFailures } =
    audit;
  const lines = [];

  lines.push("# Next.js → NestJS-only BFF migration audit");
  lines.push("");
  lines.push(
    "Generated by `node scripts/audit-bff.mjs` (also run as `pnpm audit:bff`). Do not edit by hand: the file is regenerated on every audit run."
  );
  lines.push("");
  lines.push(`- Generated at: \`${summary.generatedAt}\``);
  lines.push("- Registry: `scripts/bff-route-map.json`");
  lines.push(`- NestJS global prefix: \`${summary.globalPrefix || "(none)"}\``);
  lines.push(
    `- Gate result: \`${violations.length === 0 ? "PASS (no boundary violations)" : `FAIL (${violations.length} violations)`}\``
  );
  lines.push("");

  lines.push("## 1. Executive summary");
  lines.push("");
  lines.push(
    markdownTable(
      ["Metric", "Value"],
      [
        ["Next.js API route files still present", summary.webRoutes],
        ["Next.js API handlers (method + path) still present", summary.webRouteMethods],
        ["Routes registered in the migration registry", summary.registeredRoutes],
        ["Modelled as fully migrated (Next route deleted)", summary.migratedRoutes],
        ["Pending migration (Next route still serving)", summary.pendingRoutes],
        ["NestJS endpoints discovered", summary.nestEndpoints],
        ["NestJS endpoints not claimed by the registry", summary.nestUnmappedEndpoints],
        ["Server surfaces (server actions / server reads) in scope", summary.serverSurfaces],
        [
          "Web files that reach domain data directly",
          `${summary.domainDbFiles} ${
            Object.entries(summary.domainDbFilesByKind ?? {})
              .map(([kind, count]) => `(${count} ${kind})`)
              .join(" ") || ""
          }`.trim(),
        ],
        ["Web files that reach the database at all (incl. session path)", summary.webFilesWithDbAccess],
        ["Client-side modules that can reach the database", summary.clientLeaks],
        ["Hard boundary violations", summary.violations],
        ["Web Prisma dependencies still declared", summary.webPrismaDependencies.join(", ") || "none"],
      ]
    )
  );
  lines.push("");
  lines.push(
    "NestJS currently exposes only the endpoints listed in section 2, so **every** Next.js API route is still un-migrated BFF logic. The registry records the agreed target endpoint for each of them, which is what makes this migration reviewable rather than improvised."
  );
  lines.push("");

  lines.push("## 2. NestJS endpoint inventory");
  lines.push("");
  lines.push(
    markdownTable(
      ["Method", "Path", "Controller", "Handler", "Guards"],
      nestEndpoints.map((e) => [
        e.method,
        e.path,
        e.controllerFile.replace("apps/api/src/", ""),
        e.handler,
        e.guards.join(", ") || "—",
      ])
    )
  );
  lines.push("");
  if (unmappedNestEndpoints.length > 0) {
    lines.push("Endpoints that exist in NestJS but are not claimed by any registry route:");
    lines.push("");
    lines.push(
      markdownTable(
        ["Method", "Path", "Controller"],
        unmappedNestEndpoints.map((e) => [e.method, e.path, e.controllerFile])
      )
    );
    lines.push("");
  }
  lines.push("## 3. /app/api route mapping");
  lines.push("");
  lines.push(
    markdownTable(
      ["Web route", "NestJS target", "Module", "Phase", "Auth", "Audit state", "Registry state", "Consumers"],
      routes.map((r) => [
        `${r.method} ${r.webPath}`,
        `${r.method} ${r.nestPath}`,
        r.nestModule,
        r.phase,
        r.auth,
        r.auditState,
        r.state,
        r.consumers.length === 0 ? "none" : r.consumers.map((c) => `\`${c}\``).join("<br>"),
      ])
    )
  );
  lines.push("");
  lines.push("### Route findings");
  lines.push("");
  for (const r of routes) {
    lines.push(
      `- **${r.method} ${r.webPath} → ${r.method} ${r.nestPath}** (${phaseLabel(registry, r.phase)}, module \`${r.nestModule}\`)`
    );
    lines.push(`  - Web file: \`${r.webFile}\``);
    lines.push(
      `  - Target: \`${r.nestController}\` → \`${r.nestHandler}()\` — ${r.nestPresent ? "implemented" : "**not implemented yet**"}`
    );
    lines.push(`  - Touched models: ${r.models.map((m) => `\`${m}\``).join(", ") || "—"}`);
    if ((r.testRefs ?? []).length > 0) {
      lines.push(
        `  - Tests that import this route module (must move to NestJS): ${r.testRefs.map((t) => `\`${t}\``).join(", ")}`
      );
    }
    lines.push(`  - Notes: ${r.notes}`);
  }
  lines.push("");

  lines.push("## 4. Server-side surfaces behind the API");
  lines.push("");
  lines.push(
    markdownTable(
      ["Web file", "Kind", "Server action", "DB access", "Registered", "Target endpoints", "Phase"],
      surfaces.map((s) => {
        const reg = registry.serverSurfaces.find((x) => x.webFile === s.file);
        return [
          `\`${s.file}\``,
          s.kind,
          s.serverAction ? "yes" : "no",
          s.dbAccess,
          s.registered ? "yes" : "**no**",
          (reg?.targetEndpoints ?? []).join("<br>") || "—",
          reg?.phase ?? "—",
        ];
      })
    )
  );
  lines.push("");
  lines.push(
    "`DB access` means: `direct` = imports `@/lib/db` / `@prisma/client` or calls `prisma.*`; `via-lib` = imports a web library that reaches the database; `via-auth` = only the interim session modules (`lib/auth/session`, `lib/auth/permissions`), which phase 1 removes."
  );
  lines.push("");

  lines.push("## 5. Direct database access in the web app");
  lines.push("");
  lines.push(
    markdownTable(
      ["File", "Kind", "Client-side", "Access", "Domain modules imported"],
      webDbFiles.map((f) => [
        `\`${f.file}\``,
        f.kind,
        f.client ? "**yes**" : "no",
        f.dbAccess,
        f.domainImports.length > 0 ? f.domainImports.map((m) => `\`${m}\``).join(", ") : "—",
      ])
    )
  );
  lines.push("");
  lines.push(`Declared web dependencies on Prisma: ${summary.webPrismaDependencies.join(", ") || "none"}.`);
  lines.push("");
  lines.push(
    `Files that reach the database only through the interim session modules (${AUTH_BASELINE_MODULES.map((m) => `\`${m}\``).join(", ")}), which phase 1 removes:`
  );
  lines.push("");
  if ((summary.sessionOnlyDbFiles ?? []).length === 0) {
    lines.push("- none");
  } else {
    for (const file of summary.sessionOnlyDbFiles) lines.push(`- \`${file}\``);
  }
  lines.push("");
  lines.push("## 6. Violations and gate");
  lines.push("");
  if (violations.length === 0) {
    lines.push("No hard boundary violations. `--check` passes.");
  } else {
    lines.push(markdownTable(["Code", "Detail"], violations.map((v) => [`\`${v.code}\``, v.detail])));
  }
  lines.push("");
  lines.push("Remaining work enforced by `--strict` (expected to be non-empty until phase 5):");
  lines.push("");
  if (strictFailures.length === 0) {
    lines.push("- nothing — the repository is NestJS-only.");
  } else {
    for (const failure of strictFailures) lines.push(`- ${failure}`);
  }
  lines.push("");

  lines.push("## 7. Migration phases");
  lines.push("");
  for (const [id, meta] of Object.entries(registry.phases ?? {})) {
    const routeCount = routes.filter((r) => String(r.phase) === id).length;
    const surfaceCount = registry.serverSurfaces.filter((s) => String(s.phase) === id).length;
    lines.push(`### Phase ${id} — ${meta.name}`);
    lines.push("");
    lines.push(meta.goal);
    lines.push("");
    lines.push(`Scope: ${routeCount} route(s), ${surfaceCount} server surface(s).`);
    lines.push("");
    lines.push("Exit criteria:");
    for (const criterion of meta.exitCriteria) lines.push(`- ${criterion}`);
    lines.push("");
  }

  lines.push("## 8. How to use this audit");
  lines.push("");
  lines.push("```bash");
  lines.push("pnpm audit:bff          # write this report and temp/bff-audit.json");
  lines.push("pnpm audit:bff:check    # CI gate: unregistered surfaces, client-side DB access,");
  lines.push("                        # registry entries that lie, NEXT_PUBLIC_* secret names");
  lines.push("pnpm audit:bff:strict   # end-state gate: any BFF surface or web-side DB access fails");
  lines.push("```");
  lines.push("");
  lines.push(
    'Migration rule: an entry may only move to `"state": "migrated"` in `scripts/bff-route-map.json` once the NestJS handler exists **and** the Next.js route file is deleted **and** every `testRefs` consumer has moved. This audit fails otherwise.'
  );
  lines.push("");
  return lines.join("\n");
}
function printHuman(audit) {
  const { summary, violations, strictFailures } = audit;
  console.log(`BFF audit — ${summary.generatedAt}`);
  console.log(`  Next.js /app/api handlers : ${summary.webRouteMethods} in ${summary.webRoutes} files`);
  console.log(
    `  registered in registry    : ${summary.registeredRoutes} (${summary.pendingRoutes} pending, ${summary.migratedRoutes} migrated)`
  );
  console.log(`  NestJS endpoints          : ${summary.nestEndpoints} (${summary.nestUnmappedEndpoints} unclaimed)`);
  console.log(`  server surfaces in scope  : ${summary.serverSurfaces} (${summary.registeredSurfaces} registered)`);
  console.log(
    `  web DB files (domain)     : ${summary.domainDbFiles} ${Object.entries(summary.domainDbFilesByKind ?? {})
      .map(([kind, count]) => `${count} ${kind}`)
      .join(", ")} (+${summary.webFilesWithDbAccess - summary.domainDbFiles} session-only)`
  );
  console.log(`  client-side DB leaks      : ${summary.clientLeaks}`);
  console.log(`  web Prisma dependencies   : ${summary.webPrismaDependencies.join(", ") || "none"}`);
  if (violations.length > 0) {
    console.log(`\n${violations.length} hard violation(s):`);
    for (const v of violations) console.log(`  [${v.code}] ${v.detail}`);
  } else {
    console.log("\nNo hard boundary violations.");
  }
  if (strictFailures.length > 0) {
    console.log("\nRemaining migration work (--strict):");
    for (const failure of strictFailures) console.log(`  - ${failure}`);
  }
  if (WRITE) {
    console.log("\nReport: docs/architecture/bff-migration-audit.md");
    console.log("Machine-readable: temp/bff-audit.json");
  }
}

function main() {
  let audit;
  try {
    audit = runAudit();
  } catch (error) {
    console.error(`BFF audit could not run: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }

  if (WRITE) {
    mkdirSync(dirname(REPORT_PATH), { recursive: true });
    mkdirSync(dirname(JSON_OUT_PATH), { recursive: true });
    writeFileSync(REPORT_PATH, renderReport(audit), "utf8");
    writeFileSync(JSON_OUT_PATH, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  }

  if (JSON_STDOUT) {
    process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
  } else {
    printHuman(audit);
  }

  if (audit.violations.length > 0 && (CHECK || STRICT)) process.exit(1);
  if (STRICT && audit.strictFailures.length > 0) process.exit(1);
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();