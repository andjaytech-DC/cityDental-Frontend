import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date"); // YYYY-MM-DD
  if (!doctorId || !date) return NextResponse.json({ message: "doctorId and date required" }, { status: 400 });
  const doctor = await prisma.doctor.findFirst({ where: { id: doctorId, status: "ACTIVE" } });
  if (!doctor) return NextResponse.json({ message: "Doctor not found or inactive" }, { status: 404 });
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59`);
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"] },
      scheduledStart: { gte: start, lte: end },
    },
    select: { scheduledStart: true, scheduledEnd: true },
  });
  // Generate 9-17 slots hourly, exclude booked
  const slots: string[] = [];
  for (let h = 9; h < 17; h++) {
    const slotStart = new Date(`${date}T${String(h).padStart(2, "0")}:00:00`);
    const slotEnd = new Date(`${date}T${String(h).padStart(2, "0")}:30:00`);
    const booked = appointments.some((a) => slotStart < a.scheduledEnd && slotEnd > a.scheduledStart);
    if (!booked) slots.push(slotStart.toISOString());
  }
  return NextResponse.json({ date, slots });
}
