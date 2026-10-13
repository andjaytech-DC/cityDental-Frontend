import "server-only";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { getAccessibleLocationIds, requirePermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { assignRoleSchema, createUserSchema } from "@citydental/validation";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export async function listUsers(params: { search?: string; status?: string; page?: number; pageSize?: number }) {
  await requirePermission("user:read");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: Record<string, unknown> = { organizationId: session.organizationId };
  if (params.status) (where as Record<string, unknown>).status = params.status;
  if (params.search) {
    (where as Record<string, unknown>).OR = [
      { email: { contains: params.search, mode: "insensitive" } },
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
    ];
  }
  // location-scoped: only users with at least one role in accessible locations (or org-wide if admin is org-wide)
  const allowed = await getAccessibleLocationIds();
  if (allowed !== null) {
    // restrict to users who have a UserRole in allowed locations or have no location restriction? Simpler: filter userRoles
    (where as Record<string, unknown>).roles = { some: { locationId: { in: allowed } } };
  }
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where: where as never,
      include: { roles: { include: { role: true, location: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where: where as never }),
  ]);
  // strip passwordHash
  const sanitized = items.map(({ passwordHash: _p, ...u }) => u);
  return { items: sanitized, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

export async function getUser(id: string) {
  await requirePermission("user:read");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findFirst({ where: { id, organizationId: session.organizationId }, include: { roles: { include: { role: true, location: true } } } });
  if (!user) throw new Error("NOT_FOUND");
  const allowed = await getAccessibleLocationIds();
  if (allowed !== null) {
    const hasAllowed = user.roles.some((r) => r.locationId && allowed.includes(r.locationId));
    if (!hasAllowed && !user.roles.some((r) => r.locationId === null)) throw new Error("FORBIDDEN");
  }
  const { passwordHash: _p, ...sanitized } = user;
  return sanitized;
}

export async function createUser(input: unknown) {
  await requirePermission("user:manage");
  await requirePermission("role:manage");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const parsed = createUserSchema.parse(input);
  // privilege escalation guard: cannot assign role with perms you don't have (unless superadmin)
  if (!session.isSuperAdmin) {
    for (const roleName of parsed.roles) {
      const map = (await import("@/lib/auth/permissions")).ROLE_PERMISSION_MAP[roleName] ?? [];
      const missing = map.filter((p) => !session!.permissions.includes(p));
      if (missing.length) throw new Error("FORBIDDEN");
    }
  }
  if (parsed.locationId) {
    // validate location belongs to org and actor has access
    const loc = await prisma.location.findFirst({ where: { id: parsed.locationId, organizationId: session.organizationId } });
    if (!loc) throw new Error("NOT_FOUND");
    if (!session.isSuperAdmin && !session.isOrgWide && !session.locationIds.includes(parsed.locationId)) throw new Error("FORBIDDEN");
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.email.toLowerCase() } });
  if (existing) throw new Error("CONFLICT");
  const hash = await bcrypt.hash(parsed.password, 10);
  const created = await prisma.user.create({
    data: {
      organizationId: session.organizationId,
      email: parsed.email.toLowerCase(),
      passwordHash: hash,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      phone: parsed.phone ?? null,
      status: "ACTIVE",
    },
  });
  for (const roleName of parsed.roles) {
    const role = await prisma.role.findUnique({ where: { organizationId_name: { organizationId: session.organizationId, name: roleName } } });
    if (!role) throw new Error("NOT_FOUND");
    await prisma.userRole.create({ data: { userId: created.id, roleId: role.id, locationId: parsed.locationId ?? null } });
  }
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "CREATE", resourceType: "User", resourceId: created.id });
  const { passwordHash: _p, ...sanitized } = created;
  return sanitized;
}

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().min(6).max(20).optional(),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).optional(),
});

export async function updateUser(id: string, input: unknown) {
  await requirePermission("user:manage");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (session.id === id && (input as Record<string, unknown>).status === "SUSPENDED") throw new Error("FORBIDDEN"); // cannot self-suspend
  const parsed = updateUserSchema.parse(input);
  const existing = await prisma.user.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!existing) throw new Error("NOT_FOUND");
  const data: Record<string, unknown> = {};
  if (parsed.firstName !== undefined) data.firstName = parsed.firstName;
  if (parsed.lastName !== undefined) data.lastName = parsed.lastName;
  if (parsed.phone !== undefined) data.phone = parsed.phone;
  if (parsed.status !== undefined) data.status = parsed.status;
  const updated = await prisma.user.update({ where: { id }, data: data as never });
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "UPDATE", resourceType: "User", resourceId: id, metadata: { status: parsed.status } });
  const { passwordHash: _p, ...sanitized } = updated;
  return sanitized;
}

export async function assignRole(userId: string, input: unknown) {
  await requirePermission("role:manage");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const parsed = assignRoleSchema.parse(input);
  if (!session.isSuperAdmin) {
    const map = (await import("@/lib/auth/permissions")).ROLE_PERMISSION_MAP[parsed.role] ?? [];
    const missing = map.filter((p) => !session!.permissions.includes(p));
    if (missing.length) throw new Error("FORBIDDEN");
  }
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId: session.organizationId } });
  if (!user) throw new Error("NOT_FOUND");
  const role = await prisma.role.findUnique({ where: { organizationId_name: { organizationId: session.organizationId, name: parsed.role } } });
  if (!role) throw new Error("NOT_FOUND");
  if (parsed.locationId) {
    const loc = await prisma.location.findFirst({ where: { id: parsed.locationId, organizationId: session.organizationId } });
    if (!loc) throw new Error("NOT_FOUND");
    if (!session.isSuperAdmin && !session.isOrgWide && !session.locationIds.includes(parsed.locationId)) throw new Error("FORBIDDEN");
  }
  const existing = await prisma.userRole.findFirst({ where: { userId, roleId: role.id, locationId: parsed.locationId ?? null } });
  if (existing) throw new Error("CONFLICT");
  const created = await prisma.userRole.create({ data: { userId, roleId: role.id, locationId: parsed.locationId ?? null } });
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "CREATE", resourceType: "UserRole", resourceId: created.id, metadata: { role: parsed.role } });
  return created;
}
