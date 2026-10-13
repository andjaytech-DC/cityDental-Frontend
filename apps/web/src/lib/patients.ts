import "server-only";
import { prisma } from "@/lib/db";
import { getAccessibleLocationIds, isLocationAllowed, requireLocationAccess, requirePermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { createPatientSchema, updatePatientSchema } from "@citydental/validation";
import { writeAudit } from "@/lib/audit";

export async function listPatients(params: { search?: string; status?: string; page?: number; pageSize?: number; locationId?: string }) {
  await requirePermission("patient:read");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: Record<string, unknown> = { organizationId: session.organizationId };
  if (params.status) (where as Record<string, unknown>).status = params.status;
  if (params.locationId) {
    await requireLocationAccess(params.locationId);
    (where as Record<string, unknown>).primaryLocationId = params.locationId;
  } else {
    const allowed = await getAccessibleLocationIds();
    if (allowed !== null) {
      // location-scoped user: only patients in their locations; patients with null location are not visible
      (where as Record<string, unknown>).primaryLocationId = { in: allowed };
    }
  }
  if (params.search) {
    (where as Record<string, unknown>).OR = [
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { patientNumber: { contains: params.search, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.patient.findMany({ where: where as never, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.patient.count({ where: where as never }),
  ]);
  return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

export async function getPatient(id: string) {
  await requirePermission("patient:read");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const item = await prisma.patient.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!item) throw new Error("NOT_FOUND");
  if (!isLocationAllowed(session, item.primaryLocationId)) throw new Error("FORBIDDEN");
  return item;
}

export async function createPatient(input: unknown) {
  await requirePermission("patient:create");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const parsed = createPatientSchema.parse(input);
  if (parsed.primaryLocationId) await requireLocationAccess(parsed.primaryLocationId);
  const created = await prisma.patient.create({
    data: {
      organizationId: session.organizationId,
      primaryLocationId: parsed.primaryLocationId ?? null,
      patientNumber: parsed.patientNumber ?? null,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
      gender: parsed.gender ?? null,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      addressLine1: parsed.addressLine1 ?? null,
      city: parsed.city ?? null,
      state: parsed.state ?? null,
      postalCode: parsed.postalCode ?? null,
      status: "ACTIVE",
    },
  });
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "CREATE", resourceType: "Patient", resourceId: created.id, metadata: { patientNumber: created.patientNumber } });
  return created;
}

export async function updatePatient(id: string, input: unknown) {
  await requirePermission("patient:update");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const parsed = updatePatientSchema.parse(input);
  const existing = await prisma.patient.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!existing) throw new Error("NOT_FOUND");
  if (!isLocationAllowed(session, existing.primaryLocationId)) throw new Error("FORBIDDEN");
  if (parsed.primaryLocationId !== undefined) await requireLocationAccess(parsed.primaryLocationId);
  const data: Record<string, unknown> = {};
  if (parsed.firstName !== undefined) data.firstName = parsed.firstName;
  if (parsed.lastName !== undefined) data.lastName = parsed.lastName;
  if (parsed.dateOfBirth !== undefined) data.dateOfBirth = parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null;
  if (parsed.gender !== undefined) data.gender = parsed.gender;
  if (parsed.email !== undefined) data.email = parsed.email;
  if (parsed.phone !== undefined) data.phone = parsed.phone;
  if (parsed.addressLine1 !== undefined) data.addressLine1 = parsed.addressLine1;
  if (parsed.city !== undefined) data.city = parsed.city;
  if (parsed.state !== undefined) data.state = parsed.state;
  if (parsed.postalCode !== undefined) data.postalCode = parsed.postalCode;
  if (parsed.primaryLocationId !== undefined) data.primaryLocationId = parsed.primaryLocationId;
  if (parsed.patientNumber !== undefined) data.patientNumber = parsed.patientNumber;
  if (parsed.status !== undefined) data.status = parsed.status;
  const updated = await prisma.patient.update({ where: { id }, data: data as never });
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "UPDATE", resourceType: "Patient", resourceId: id });
  return updated;
}
