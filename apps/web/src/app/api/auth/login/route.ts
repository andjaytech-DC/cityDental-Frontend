import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@citydental/validation";
import { verifyCredentials, signTokens, setAuthCookies } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";

// Simple in-memory brute-force guard: 5 attempts per 15 min per IP+email
const attempts = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  entry.count += 1;
  if (entry.count > 5) return true;
  return false;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }
  const { email, password, organizationSlug } = parsed.data;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const ua = req.headers.get("user-agent");
  const rateKey = `${ip}:${email.toLowerCase().trim()}`;
  if (isRateLimited(rateKey)) {
    return NextResponse.json({ message: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }
  const user = await verifyCredentials(email, password, organizationSlug);
  if (!user) {
    // audit failed login without actor
    try {
      // try to find org for audit context; fallback to first org
      const { prisma } = await import("@/lib/db");
      const org = organizationSlug ? await prisma.organization.findUnique({ where: { slug: organizationSlug } }) : await prisma.organization.findFirst();
      if (org) {
        await writeAudit({
          organizationId: org.id,
          action: "LOGIN_FAILED",
          resourceType: "User",
          metadata: { email: email.toLowerCase().trim() },
          ipAddress: ip,
          userAgent: ua,
        });
      }
    } catch {}
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }
  const { accessToken, refreshToken, expiresIn } = signTokens(user);
  setAuthCookies(accessToken, refreshToken);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
      organizationSlug: user.organizationSlug,
      isSuperAdmin: user.isSuperAdmin,
      roles: user.roles,
      permissions: user.permissions,
      locationIds: user.locationIds,
    },
    tokens: { accessToken, refreshToken, expiresIn },
  });
}
