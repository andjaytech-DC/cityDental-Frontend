import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const locations = await prisma.location.findMany({ where: { status: "ACTIVE" }, take: 50, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items: locations });
}
