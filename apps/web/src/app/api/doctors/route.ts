import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Force dynamic rendering so this route is evaluated at request time,
// not prerendered at build time (where DATABASE_URL is unavailable).
// Declared explicitly rather than relying on the handler reading `req.url`,
// which is what currently keeps Next.js from treating it as static — a
// refactor that dropped the argument would silently bake an empty doctor
// list into the build. Same pattern as /api/locations.
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: Record<string, unknown> = {};
  if (status) (where as Record<string, unknown>).status = status;
  const doctors = await prisma.doctor.findMany({ where: where as never, include: { specialties: true }, take: 50, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items: doctors });
}
