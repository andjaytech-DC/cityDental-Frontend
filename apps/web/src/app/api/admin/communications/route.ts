import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sendCommunication } from "@/lib/communications";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ status: "FAILED", reason: "Unauthenticated" }, { status: 401 });
  // Require some patient permission to message
  if (!session.isSuperAdmin && !session.permissions.includes("patient:read")) {
    return NextResponse.json({ status: "FAILED", reason: "Forbidden" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "FAILED", reason: "Invalid JSON" }, { status: 400 });
  }
  const { patientId, channel, message, template } = body as { patientId?: string; channel?: string; message?: string; template?: string };
  if (!patientId || !channel || !message) return NextResponse.json({ status: "FAILED", reason: "Missing fields" }, { status: 400 });
  if (!["email", "sms", "whatsapp"].includes(channel)) return NextResponse.json({ status: "FAILED", reason: "Invalid channel" }, { status: 400 });
  if (message.trim().length < 2 || message.length > 2000) return NextResponse.json({ status: "FAILED", reason: "Invalid message" }, { status: 400 });

  const patient = await prisma.patient.findFirst({ where: { id: patientId, organizationId: session.organizationId } });
  if (!patient) return NextResponse.json({ status: "FAILED", reason: "Recipient not found" }, { status: 404 });

  const to =
    channel === "email" ? patient.email : patient.phone;
  if (!to) return NextResponse.json({ status: "FAILED", reason: "Recipient has no contact for this channel" }, { status: 400 });

  const result = await sendCommunication({ channel: channel as never, to, message, patientId, template });

  await writeAudit({
    organizationId: session.organizationId,
    actorUserId: session.id,
    action: result.status === "SUCCESS" ? "CREATE" : "READ",
    resourceType: "Communication",
    resourceId: patient.id,
    metadata: { channel, status: result.status },
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: req.headers.get("user-agent"),
  });

  return NextResponse.json(result, { status: result.status === "SUCCESS" ? 200 : result.status === "NOT_CONFIGURED" ? 503 : 502 });
}
