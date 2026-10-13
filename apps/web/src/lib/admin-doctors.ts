import "server-only";
import { prisma } from "@/lib/db";
import { getAccessibleLocationIds, isLocationAllowed, requireLocationAccess, requirePermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { createDoctorSchema, updateDoctorSchema } from "@citydental/validation";
import { writeAudit } from "@/lib/audit";

export async function listDoctors(params: { search?: string; status?: string; page?: number; pageSize?: number; locationId?: string }) {
  await requirePermission("doctor:read");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: Record<string, unknown> = { organizationId: session.organizationId };
  if (params.locationId) {
    await requireLocationAccess(params.locationId);
    (where as Record<string, unknown>).primaryLocationId = params.locationId;
  } else {
    const allowed = await getAccessibleLocationIds();
    if (allowed !== null) (where as Record<string, unknown>).primaryLocationId = { in: allowed };
  }
  if (params.status) (where as Record<string, unknown>).status = params.status;
  if (params.search) {
    (where as Record<string, unknown>).OR = [
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.doctor.findMany({ where: where as never, include: { specialties: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.doctor.count({ where: where as never }),
  ]);
  return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

export async function getDoctor(id: string) {
  await requirePermission("doctor:read");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const item = await prisma.doctor.findFirst({ where: { id, organizationId: session.organizationId }, include: { specialties: true } });
  if (!item) throw new Error("NOT_FOUND");
  if (!isLocationAllowed(session, item.primaryLocationId)) throw new Error("FORBIDDEN");
  return item;
}

export async function createDoctor(input: unknown) {
  await requirePermission("doctor:manage");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const parsed = createDoctorSchema.parse(input);
  if (parsed.primaryLocationId) await requireLocationAccess(parsed.primaryLocationId);
  const created = await prisma.doctor.create({
    data: {
      organizationId: session.organizationId,
      primaryLocationId: parsed.primaryLocationId ?? null,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      licenseNumber: parsed.licenseNumber ?? null,
      qualifications: parsed.qualifications ?? null,
      specialties: parsed.specialties?.length ? { create: parsed.specialties.map((name: string) => ({ name })) } : undefined,
    },
    include: { specialties: true },
  });
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "CREATE", resourceType: "Doctor", resourceId: created.id });
  return created;
}

export async function updateDoctor(id: string, input: unknown) {
  await requirePermission("doctor:manage");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const parsed = updateDoctorSchema.parse(input);
  const existing = await prisma.doctor.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!existing) throw new Error("NOT_FOUND");
  if (!isLocationAllowed(session, existing.primaryLocationId)) throw new Error("FORBIDDEN");
  if (parsed.primaryLocationId !== undefined) await requireLocationAccess(parsed.primaryLocationId);
  const data: Record<string, unknown> = {};
  if (parsed.firstName !== undefined) data.firstName = parsed.firstName;
  if (parsed.lastName !== undefined) data.lastName = parsed.lastName;
  if (parsed.email !== undefined) data.email = parsed.email;
  if (parsed.phone !== undefined) data.phone = parsed.phone;
  if (parsed.licenseNumber !== undefined) data.licenseNumber = parsed.licenseNumber;
  if (parsed.qualifications !== undefined) data.qualifications = parsed.qualifications;
  if (parsed.primaryLocationId !== undefined) data.primaryLocationId = parsed.primaryLocationId;
  if (parsed.status !== undefined) data.status = parsed.status;
  const updated = await prisma.doctor.update({ where: { id }, data: data as never, include: { specialties: true } });
  if (parsed.specialties !== undefined) {
    await prisma.doctorSpecialty.deleteMany({ where: { doctorId: id } });
    if (parsed.specialties.length) {
      await prisma.doctorSpecialty.createMany({ data: parsed.specialties.map((name: string) => ({ doctorId: id, name })) });
    }
  }
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "UPDATE", resourceType: "Doctor", resourceId: id });
  return updated;
}
