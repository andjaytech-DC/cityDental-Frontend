import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { PERMISSIONS, ROLE_NAMES } from "@citydental/types";

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  OWNER: [...PERMISSIONS],
  ORG_ADMIN: PERMISSIONS.filter((p) => p !== "organization:manage"),
  LOCATION_ADMIN: [
    "location:read",
    "location:manage",
    "user:read",
    "patient:read",
    "patient:create",
    "patient:update",
    "doctor:read",
    "appointment:read",
    "appointment:create",
    "appointment:update",
    "appointment:cancel",
    "audit:read",
  ],
  DOCTOR: ["patient:read", "doctor:read", "appointment:read", "appointment:update", "location:read"],
  RECEPTIONIST: [
    "patient:read",
    "patient:create",
    "patient:update",
    "appointment:read",
    "appointment:create",
    "appointment:update",
    "appointment:cancel",
    "location:read",
    "doctor:read",
  ],
  ACCOUNTANT: ["patient:read", "appointment:read", "audit:read", "organization:read", "location:read"],
  PATIENT: ["patient:read", "appointment:read"],
};

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const org = await prisma.organization.upsert({
    where: { slug: "citydental" },
    update: {},
    create: { name: "City Dental", slug: "citydental", timezone: "Asia/Kolkata" },
  });

  const location = await prisma.location.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "main" } },
    update: {},
    create: { organizationId: org.id, name: "Main Clinic", code: "main", city: "Etah", state: "Uttar Pradesh" },
  });

  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code, description: code } });
  }

  for (const roleName of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: org.id, name: roleName } },
      update: { isSystem: true },
      create: { organizationId: org.id, name: roleName, isSystem: true, description: `${roleName} system role` },
    });
    const codes = ROLE_PERMISSION_MAP[roleName] ?? [];
    for (const code of codes) {
      const perm = await prisma.permission.findUnique({ where: { code } });
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  const email = "admin@citydental.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hash = await bcrypt.hash("CityDentalAdmin1", 10);
    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        email,
        passwordHash: hash,
        firstName: "Admin",
        lastName: "CityDental",
        isSuperAdmin: true,
        status: "ACTIVE",
      },
    });
    const ownerRole = await prisma.role.findUnique({ where: { organizationId_name: { organizationId: org.id, name: "OWNER" } } });
    if (ownerRole) {
      await prisma.userRole.create({ data: { userId: user.id, roleId: ownerRole.id } });
    }
    console.log(`Seeded admin ${email} / CityDentalAdmin1 @ ${org.slug}`);
  } else {
    console.log(`Admin ${email} already exists`);
  }

  console.log(`Seed complete: org=${org.slug} location=${location.code} db=${process.env.DATABASE_URL?.split("@")[1] ?? "unknown"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
