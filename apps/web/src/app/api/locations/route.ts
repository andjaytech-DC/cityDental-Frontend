import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Force dynamic rendering so this route is evaluated at request time,
// not prerendered at build time (where DATABASE_URL is unavailable).
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const locations = await prisma.location.findMany({ where: { status: "ACTIVE" }, take: 50, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items: locations });
}
