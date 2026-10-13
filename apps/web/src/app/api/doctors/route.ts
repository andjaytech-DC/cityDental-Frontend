import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: Record<string, unknown> = {};
  if (status) (where as Record<string, unknown>).status = status;
  const doctors = await prisma.doctor.findMany({ where: where as never, include: { specialties: true }, take: 50, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items: doctors });
}
