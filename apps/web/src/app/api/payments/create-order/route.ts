import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPaymentOrder } from "@/lib/payments/service";

const schema = z.object({
  appointmentId: z.string().uuid(),
  ageGroup: z.enum(["CHILD", "ADULT", "SENIOR"]),
  method: z.enum(["ONLINE", "UPI", "UPI_QR"]),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  // Lookup appointment to get org/patient
  const { prisma } = await import("@/lib/db");
  const appointment = await prisma.appointment.findUnique({ where: { id: parsed.data.appointmentId }, include: { patient: true } });
  if (!appointment) return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
  try {
    const result = await createPaymentOrder({
      organizationId: appointment.organizationId,
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      ageGroup: parsed.data.ageGroup,
      method: parsed.data.method,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "NOT_CONFIGURED") return NextResponse.json({ message: "Payment provider not configured", providerStatus: "NOT_CONFIGURED" }, { status: 503 });
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
