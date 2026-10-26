#!/usr/bin/env node
/**
 * scripts/seed-doctors.mjs
 *
 * Non-destructive doctor seed — the same five doctors, clinic locations and
 * specialties that `apps/api/prisma/seed-realistic.ts` creates for local
 * development.
 *
 * Why this exists: `apps/api/prisma/seed.ts` (the seed behind `pnpm db:seed`)
 * only creates the organization, one location, permissions, roles and the
 * admin user — it creates no doctors at all. An environment that was migrated
 * and seeded correctly therefore still renders
 * "No doctors available / No active doctors found. Please contact clinic."
 * in the booking wizard. `seed-realistic.ts` does create doctors, but it first
 * `deleteMany`s every doctor, patient, appointment and audit row in the
 * organization, which must never run against production.
 *
 * This script only inserts/updates:
 *   - upserts the `citydental` organization and the three clinic locations
 *   - matches doctors by (organizationId, email) — `Doctor.email` has no
 *     unique constraint, so a Prisma upsert is not possible — and updates the
 *     row if it exists, creating it otherwise
 *   - creates only the specialties that are missing
 *   - links the clinician's user account when a user with that email exists
 * Re-running it is safe; it never deletes anything.
 *
 * Usage:
 *   node scripts/seed-doctors.mjs                          # uses DATABASE_URL from the environment, else the repo .env
 *   DATABASE_URL="postgresql://..." node scripts/seed-doctors.mjs
 *   pnpm db:seed:doctors                                   # same script, via the root package.json alias
 *
 * Exit codes: 0 = success, 1 = configuration/seed failure.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const LOCATIONS = [
  { code: "main", name: "Main Clinic - Yadav Market", addressLine1: "Shop No. 5, Yadav Market, MG Road", city: "Etah", state: "Uttar Pradesh", postalCode: "207001", phone: "+91 94151 92948", email: "citydentalEtah@gmail.com" },
  { code: "civil", name: "Civil Lines Branch", addressLine1: "12, Civil Lines", city: "Etah", state: "Uttar Pradesh", postalCode: "207001", phone: "+91 94151 92949", email: "civil@citydental.local" },
  { code: "agra", name: "Agra Road Clinic", addressLine1: "45, Agra Road", city: "Etah", state: "Uttar Pradesh", postalCode: "207002", phone: "+91 94151 92950", email: "agra@citydental.local" },
];

const DOCTORS = [
  { firstName: "Kamlesh", lastName: "Yadav", email: "dr.kamlesh@citydental.local", phone: "+91 94151 92948", licenseNumber: "DCI-UP-12345", qualifications: "BDS, MDS - Oral Surgery", specialties: ["Oral Surgery", "General Dentistry"], location: "main" },
  { firstName: "Priya", lastName: "Singh", email: "dr.priya@citydental.local", phone: "+91 98765 43211", licenseNumber: "DCI-UP-12346", qualifications: "BDS, MDS - Orthodontics", specialties: ["Orthodontics", "General Dentistry"], location: "civil" },
  { firstName: "Amit", lastName: "Verma", email: "dr.amit@citydental.local", phone: "+91 98765 43215", licenseNumber: "DCI-UP-12347", qualifications: "BDS, MDS - Endodontics", specialties: ["Endodontics", "Conservative Dentistry"], location: "main" },
  { firstName: "Sneha", lastName: "Reddy", email: "dr.sneha@citydental.local", phone: "+91 98765 43216", licenseNumber: "DCI-UP-12348", qualifications: "BDS, MDS - Pedodontics", specialties: ["Pedodontics", "Preventive Dentistry"], location: "agra" },
  { firstName: "Vikram", lastName: "Sharma", email: "dr.vikram@citydental.local", phone: "+91 98765 43217", licenseNumber: "DCI-UP-12349", qualifications: "BDS, MDS - Prosthodontics", specialties: ["Prosthodontics", "Geriatric Dentistry"], location: "civil" },
];

/**
 * Prisma Client does not read .env itself, and this script can be launched
 * from any working directory. Load the first .env that defines DATABASE_URL
 * without overriding a value the caller already exported (production).
 */
function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return true;
  const candidates = [
    path.join(repoRoot, ".env"), // repository root
    path.join(repoRoot, "apps", "api", ".env"),
    path.join(repoRoot, "apps", "api", "prisma", ".env"),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      if (line.slice(0, eq).trim() !== "DATABASE_URL") continue;
      const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (value) {
        process.env.DATABASE_URL = value;
        return true;
      }
    }
  }
  return false;
}

if (!loadDatabaseUrl()) {
  console.error("DATABASE_URL is not set (environment or .env) — refusing to run.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const target = (process.env.DATABASE_URL ?? "").split("@")[1]?.split("/")[0] ?? "unknown-host";
  console.log(`Seeding doctors into ${target}...`);

  const org = await prisma.organization.upsert({
    where: { slug: "citydental" },
    update: {},
    create: { name: "City Dental", slug: "citydental", timezone: "Asia/Kolkata" },
  });

  const locationIds = {};
  for (const l of LOCATIONS) {
    const loc = await prisma.location.upsert({
      where: { organizationId_code: { organizationId: org.id, code: l.code } },
      update: { name: l.name, addressLine1: l.addressLine1, city: l.city, state: l.state, postalCode: l.postalCode, phone: l.phone, email: l.email, status: "ACTIVE" },
      create: { organizationId: org.id, ...l, status: "ACTIVE" },
    });
    locationIds[l.code] = loc.id;
  }
  console.log(`Locations: ${LOCATIONS.map((l) => l.code).join(", ")}`);

  for (const d of DOCTORS) {
    // `Doctor.email` is not @unique, so match manually instead of upserting.
    const existing = await prisma.doctor.findFirst({
      where: { organizationId: org.id, email: d.email },
      select: { id: true },
    });
    // Link the clinician account when a user with that email exists
    // (seed.ts only creates the admin, so this is a no-op on a fresh database).
    const user = await prisma.user.findUnique({ where: { email: d.email }, select: { id: true } });

    const data = {
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      licenseNumber: d.licenseNumber,
      qualifications: d.qualifications,
      status: "ACTIVE",
      primaryLocationId: locationIds[d.location] ?? null,
      ...(user ? { userId: user.id } : {}),
    };

    const doctor = existing
      ? await prisma.doctor.update({ where: { id: existing.id }, data })
      : await prisma.doctor.create({ data: { organizationId: org.id, ...data } });

    for (const name of d.specialties) {
      await prisma.doctorSpecialty.upsert({
        where: { doctorId_name: { doctorId: doctor.id, name } },
        update: {},
        create: { doctorId: doctor.id, name },
      });
    }

    console.log(`${existing ? "Updated" : "Created"} doctor ${d.firstName} ${d.lastName} @ ${d.location}`);
  }

  const active = await prisma.doctor.count({ where: { organizationId: org.id, status: "ACTIVE" } });
  console.log(`Seed complete: ${active} active doctor(s) in organization ${org.slug}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
