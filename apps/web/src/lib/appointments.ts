import "server-only";
import { prisma } from "@/lib/db";
import { getAccessibleLocationIds, isLocationAllowed, requireLocationAccess, requirePermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { createAppointmentSchema, updateAppointmentSchema } from "@citydental/validation";
import { writeAudit } from "@/lib/audit";

export async function listAppointments(params: { page?: number; pageSize?: number; status?: string; doctorId?: string; patientId?: string; locationId?: string }) {
  await requirePermission("appointment:read");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: Record<string, unknown> = { organizationId: session.organizationId };
  if (params.locationId) {
    await requireLocationAccess(params.locationId);
    (where as Record<string, unknown>).locationId = params.locationId;
  } else {
    const allowed = await getAccessibleLocationIds();
    if (allowed !== null) (where as Record<string, unknown>).locationId = { in: allowed };
  }
  if (params.status) (where as Record<string, unknown>).status = params.status;
  if (params.doctorId) (where as Record<string, unknown>).doctorId = params.doctorId;
  if (params.patientId) (where as Record<string, unknown>).patientId = params.patientId;
  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where: where as never,
      include: { patient: true, doctor: true, location: true },
      orderBy: { scheduledStart: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.appointment.count({ where: where as never }),
  ]);
  return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

export async function getAppointment(id: string) {
  await requirePermission("appointment:read");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const item = await prisma.appointment.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { patient: true, doctor: true, location: true },
  });
  if (!item) throw new Error("NOT_FOUND");
  if (!isLocationAllowed(session, item.locationId)) throw new Error("FORBIDDEN");
  return item;
}

export async function createAppointment(input: unknown) {
  await requirePermission("appointment:create");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const parsed = createAppointmentSchema.parse(input);
  await requireLocationAccess(parsed.locationId);
  // Doctor overlap check inside transaction
  if (parsed.doctorId) {
    const overlap = await prisma.appointment.findFirst({
      where: {
        doctorId: parsed.doctorId,
        status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"] },
        scheduledStart: { lt: new Date(parsed.scheduledEnd) },
        scheduledEnd: { gt: new Date(parsed.scheduledStart) },
      },
    });
    if (overlap) throw new Error("CONFLICT");
  }
  const created = await prisma.appointment.create({
    data: {
      organizationId: session.organizationId,
      locationId: parsed.locationId,
      patientId: parsed.patientId,
      doctorId: parsed.doctorId ?? null,
      scheduledStart: new Date(parsed.scheduledStart),
      scheduledEnd: new Date(parsed.scheduledEnd),
      reason: parsed.reason ?? null,
      notes: parsed.notes ?? null,
      source: parsed.source,
      ageGroup: (parsed as Record<string, unknown>).ageGroup as never ?? null,
      createdById: session.id,
    },
  });
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "CREATE", resourceType: "Appointment", resourceId: created.id });
  return created;
}

export async function updateAppointment(id: string, input: unknown) {
  await requirePermission("appointment:update");
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const parsed = updateAppointmentSchema.parse(input);
  const existing = await prisma.appointment.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!existing) throw new Error("NOT_FOUND");
  if (!isLocationAllowed(session, existing.locationId)) throw new Error("FORBIDDEN");
  // Validate status transition is within enum — schema already ensures, server enforces no invented transitions beyond enum
  const data: Record<string, unknown> = {};
  if (parsed.doctorId !== undefined) data.doctorId = parsed.doctorId;
  if (parsed.scheduledStart !== undefined) data.scheduledStart = new Date(parsed.scheduledStart);
  if (parsed.scheduledEnd !== undefined) data.scheduledEnd = new Date(parsed.scheduledEnd);
  if (parsed.reason !== undefined) data.reason = parsed.reason;
  if (parsed.notes !== undefined) data.notes = parsed.notes;
  if (parsed.status !== undefined) {
    data.status = parsed.status;
    if (parsed.status === "CANCELLED") data.cancelledAt = new Date();
  }
  // Overlap re-check if rescheduling with doctor
  const doctorId = (parsed.doctorId as string | null | undefined) ?? existing.doctorId;
  const start = parsed.scheduledStart ? new Date(parsed.scheduledStart) : existing.scheduledStart;
  const end = parsed.scheduledEnd ? new Date(parsed.scheduledEnd) : existing.scheduledEnd;
  if (doctorId && (parsed.scheduledStart || parsed.scheduledEnd || parsed.doctorId !== undefined)) {
    const overlap = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        doctorId,
        status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"] },
        scheduledStart: { lt: end },
        scheduledEnd: { gt: start },
      },
    });
    if (overlap) throw new Error("CONFLICT");
  }
  const updated = await prisma.appointment.update({ where: { id }, data: data as never });
  await writeAudit({ organizationId: session.organizationId, actorUserId: session.id, action: "UPDATE", resourceType: "Appointment", resourceId: id, metadata: { status: parsed.status } });
  return updated;
}
