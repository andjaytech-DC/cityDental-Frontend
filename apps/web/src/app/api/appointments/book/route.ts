import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPatientSchema } from "@citydental/validation";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";

const bookSchema = z.object({
  ageGroup: z.enum(["CHILD", "ADULT", "SENIOR"]),
  doctorId: z.string().uuid(),
  locationId: z.string().uuid(),
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:MM
  patient: createPatientSchema,
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  const { ageGroup, doctorId, locationId, date, time, patient } = parsed.data;

  // Validate doctor/location active
  const doctor = await prisma.doctor.findFirst({ where: { id: doctorId, status: "ACTIVE" } });
  if (!doctor) return NextResponse.json({ message: "Doctor inactive" }, { status: 400 });
  const location = await prisma.location.findFirst({ where: { id: locationId, status: "ACTIVE" } });
  if (!location) return NextResponse.json({ message: "Location inactive" }, { status: 400 });

  const scheduledStart = new Date(`${date}T${time}:00`);
  const scheduledEnd = new Date(scheduledStart.getTime() + 30 * 60 * 1000);
  if (isNaN(scheduledStart.getTime()) || scheduledStart < new Date()) return NextResponse.json({ message: "Invalid date/time" }, { status: 400 });

  // Check availability server-side authoritative
  const overlap = await prisma.appointment.findFirst({
    where: { doctorId, status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"] }, scheduledStart: { lt: scheduledEnd }, scheduledEnd: { gt: scheduledStart } },
  });
  if (overlap) return NextResponse.json({ message: "Doctor not available at selected time" }, { status: 409 });

  // Find or create patient — for wizard, create new patient in citydental org (default)
  const org = await prisma.organization.findFirst({ where: { slug: "citydental" } });
  if (!org) return NextResponse.json({ message: "Organization not configured" }, { status: 500 });
  let patientRecord = await prisma.patient.findFirst({ where: { email: patient.email ?? undefined, organizationId: org.id } });
  if (patientRecord && patient.email) {
    // update with latest details if provided
  }
  if (!patientRecord) {
    patientRecord = await prisma.patient.create({
      data: {
        organizationId: org.id,
        primaryLocationId: locationId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : null,
        gender: patient.gender ?? null,
        email: patient.email ?? null,
        phone: patient.phone ?? null,
        addressLine1: patient.addressLine1 ?? null,
        city: patient.city ?? null,
        state: patient.state ?? null,
        postalCode: patient.postalCode ?? null,
        ageGroup: ageGroup as never,
      },
    });
  }

  // Appointment-only — no online payment, pay at clinic
  const appointment = await prisma.appointment.create({
    data: {
      organizationId: org.id,
      locationId,
      patientId: patientRecord.id,
      doctorId,
      scheduledStart,
      scheduledEnd,
      status: "CONFIRMED",
      source: "PATIENT_PORTAL",
      ageGroup: ageGroup as never,
      reason: `Age group ${ageGroup} — pay at clinic`,
    },
  });
  await writeAudit({ organizationId: org.id, action: "CREATE", resourceType: "Appointment", resourceId: appointment.id, metadata: { ageGroup, payAtClinic: true } });

  // Confirmation via mail and WhatsApp (appointment-only, truthful status)
  let emailStatus = "NOT_CONFIGURED";
  let whatsappStatus = "NOT_CONFIGURED";
  try {
    const { getProvider } = await import("@/lib/communications/providers");
    const emailProvider = getProvider("email");
    const whatsappProvider = getProvider("whatsapp");
    const formattedDate = scheduledStart.toLocaleDateString();
    const formattedTime = scheduledStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const clinicName = location.name;
    const doctorName = `${doctor.firstName} ${doctor.lastName}`;
    const patientName = `${patientRecord.firstName} ${patientRecord.lastName}`;
    const message = `Hi ${patientName}, your appointment with ${doctorName} at ${clinicName} on ${formattedDate} at ${formattedTime} is confirmed. Pay at clinic.`;

    if (patientRecord.email) {
      const res = await emailProvider.send({ to: patientRecord.email, subject: `Appointment Confirmed — ${clinicName}`, message });
      emailStatus = res.status;
      await prisma.communication.create({
        data: {
          organizationId: org.id,
          patientId: patientRecord.id,
          channel: "EMAIL",
          template: "appointment_confirmation",
          message: message.slice(0, 2000),
          status: res.status as never,
          provider: "SMTP",
          failureReason: (res as { reason?: string }).reason?.slice(0, 500) ?? null,
          initiatedById: null,
          sentAt: res.status === "SUCCESS" ? new Date() : null,
        },
      });
    }
    if (patientRecord.phone) {
      const res = await whatsappProvider.send({ to: patientRecord.phone, message });
      whatsappStatus = res.status;
      await prisma.communication.create({
        data: {
          organizationId: org.id,
          patientId: patientRecord.id,
          channel: "WHATSAPP",
          template: "appointment_confirmation",
          message: message.slice(0, 2000),
          status: res.status as never,
          provider: "WHATSAPP",
          failureReason: (res as { reason?: string }).reason?.slice(0, 500) ?? null,
          initiatedById: null,
          sentAt: res.status === "SUCCESS" ? new Date() : null,
        },
      });
    }
  } catch {
    // communication failure should not fail booking
  }

  return NextResponse.json(
    {
      appointmentId: appointment.id,
      status: appointment.status,
      emailStatus,
      whatsappStatus,
      message: "Appointment confirmed. Pay at clinic. Confirmation sent via email and WhatsApp where contact was provided.",
    },
    { status: 201 }
  );
}
