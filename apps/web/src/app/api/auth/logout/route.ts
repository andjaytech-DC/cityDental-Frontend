import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, getSession } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (session) {
    try {
      await writeAudit({
        organizationId: session.organizationId,
        actorUserId: session.id,
        action: "LOGOUT",
        resourceType: "User",
        resourceId: session.id,
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: req.headers.get("user-agent"),
      });
    } catch {}
  }
  clearAuthCookies();
  return NextResponse.json({ ok: true });
}
