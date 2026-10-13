import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { changePasswordSchema } from "@citydental/validation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    try {
      await writeAudit({
        organizationId: session.organizationId,
        actorUserId: session.id,
        action: "LOGIN_FAILED",
        resourceType: "User",
        resourceId: session.id,
        metadata: { reason: "change-password current mismatch" },
      });
    } catch {}
    return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 });
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: session.id }, data: { passwordHash: hash, tokenVersion: { increment: 1 } } });
  await writeAudit({
    organizationId: session.organizationId,
    actorUserId: session.id,
    action: "UPDATE",
    resourceType: "User",
    resourceId: session.id,
    metadata: { action: "password_change" },
  });
  // Client should clear cookies and re-login; we increment tokenVersion which invalidates existing refresh/access tokens
  return NextResponse.json({ ok: true, message: "Password changed. Please sign in again." });
}
