import "server-only";
import { prisma } from "@/lib/db";
import { requirePermission, requireLocationAccess } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { createLocationSchema, updateLocationSchema } from "@citydental/validation";
import { writeAudit } from "@/lib/audit";

export async function listLocations() {
  await requirePermission("location:read");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const where: Record<string, unknown> = { organizationId: session.organizationId };
  if (!session.isSuperAdmin && !session.isOrgWide) {
    (where as Record<string, unknown>).id = { in: session.locationIds };
  }
  const items = await prisma.location.findMany({ where: where as never, orderBy: { createdAt: "desc" } });
  return items;
}

export async function getLocation(id: string) {
  await requirePermission("location:read");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const item = await prisma.location.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!item) throw new Error("NOT_FOUND");
  if (!session.isSuperAdmin && !session.isOrgWide && !session.locationIds.includes(id)) throw new Error("FORBIDDEN");
  return item;
}

export async function createLocation(input: unknown) {
  await requirePermission("location:manage");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const parsed = createLocationSchema.parse(input);
  const created = await prisma.location.create({
    data: {
      organizationId: session.organizationId,
      name: parsed.name,
      code: parsed.code ?? null,
      addressLine1: parsed.addressLine1 ?? null,
      addressLine2: parsed.addressLine2 ?? null,
      city: parsed.city ?? null,
      state: parsed.state ?? null,
      postalCode: parsed.postalCode ?? null,
      country: parsed.country ?? "India",
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
    },
  });
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "CREATE", resourceType: "Location", resourceId: created.id });
  return created;
}

export async function updateLocation(id: string, input: unknown) {
  await requirePermission("location:manage");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const existing = await prisma.location.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!existing) throw new Error("NOT_FOUND");
  await requireLocationAccess(id);
  const parsed = updateLocationSchema.parse(input);
  const data: Record<string, unknown> = {};
  if (parsed.name !== undefined) data.name = parsed.name;
  if (parsed.code !== undefined) data.code = parsed.code;
  if (parsed.addressLine1 !== undefined) data.addressLine1 = parsed.addressLine1;
  if (parsed.addressLine2 !== undefined) data.addressLine2 = parsed.addressLine2;
  if (parsed.city !== undefined) data.city = parsed.city;
  if (parsed.state !== undefined) data.state = parsed.state;
  if (parsed.postalCode !== undefined) data.postalCode = parsed.postalCode;
  if (parsed.country !== undefined) data.country = parsed.country;
  if (parsed.phone !== undefined) data.phone = parsed.phone;
  if (parsed.email !== undefined) data.email = parsed.email;
  const updated = await prisma.location.update({ where: { id }, data: data as never });
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "UPDATE", resourceType: "Location", resourceId: id });
  return updated;
}

export async function setLocationStatus(id: string, status: "ACTIVE" | "INACTIVE") {
  await requirePermission("location:manage");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const existing = await prisma.location.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!existing) throw new Error("NOT_FOUND");
  await requireLocationAccess(id);
  // Prefer deactivation over deletion — check if users still assigned
  const assigned = await prisma.userRole.count({ where: { locationId: id } });
  if (status === "INACTIVE" && assigned > 0) {
    // Allow deactivation but warn via audit; do not broaden permissions (UserRole onDelete Cascade ensures removal not escalation)
  }
  const updated = await prisma.location.update({ where: { id }, data: { status } });
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "UPDATE", resourceType: "Location", resourceId: id, metadata: { status } });
  return updated;
}
