import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAccessibleLocationIds } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if (!session.isSuperAdmin && !session.permissions.includes("audit:read") && !session.permissions.includes("appointment:read")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get("entity") ?? "appointments";
  const allowed = await getAccessibleLocationIds();
  const orgId = session.organizationId;

  if (entity === "patients") {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (allowed !== null) (where as Record<string, unknown>).primaryLocationId = { in: allowed };
    const patients = await prisma.patient.findMany({ where: where as never, take: 1000, orderBy: { createdAt: "desc" } });
    const csv = ["id,firstName,lastName,ageGroup,phone,email,status,createdAt", ...patients.map((p) => `${p.id},${p.firstName},${p.lastName},${p.ageGroup ?? ""},${p.phone ?? ""},${p.email ?? ""},${p.status},${p.createdAt.toISOString()}`)].join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="patients-${Date.now()}.csv"` } });
  }
  if (entity === "payments") {
    const payments = await prisma.payment.findMany({ where: { organizationId: orgId }, include: { patient: true }, take: 1000, orderBy: { createdAt: "desc" } });
    const csv = ["id,appointmentId,patient,amount,currency,method,status,provider,createdAt", ...payments.map((p) => `${p.id},${p.appointmentId},${p.patient.firstName} ${p.patient.lastName},${p.amount},${p.currency},${p.method},${p.status},${p.provider},${p.createdAt.toISOString()}`)].join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="payments-${Date.now()}.csv"` } });
  }
  // appointments default
  const where: Record<string, unknown> = { organizationId: orgId };
  if (allowed !== null) (where as Record<string, unknown>).locationId = { in: allowed };
  const appointments = await prisma.appointment.findMany({ where: where as never, include: { patient: true, doctor: true, location: true, payments: true }, take: 1000, orderBy: { createdAt: "desc" } });
  const csv = ["appointmentId,patient,ageGroup,doctor,location,date,time,status,amount,paymentStatus,paymentId,createdAt", ...appointments.map((a) => {
    const pay = a.payments[0];
    return `${a.id},${a.patient.firstName} ${a.patient.lastName},${a.ageGroup ?? ""},${a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName}` : ""},${a.location.name},${new Date(a.scheduledStart).toLocaleDateString()},${new Date(a.scheduledStart).toLocaleTimeString()},${a.status},${pay ? pay.amount : ""},${pay ? pay.status : ""},${pay ? pay.id : ""},${a.createdAt.toISOString()}`;
  })].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="appointments-${Date.now()}.csv"` } });
}
