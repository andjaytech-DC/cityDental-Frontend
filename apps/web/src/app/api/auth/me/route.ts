import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  return NextResponse.json({
    id: session.id,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    organizationId: session.organizationId,
    organizationSlug: session.organizationSlug,
    isSuperAdmin: session.isSuperAdmin,
    roles: session.roles,
    permissions: session.permissions,
    locationIds: session.locationIds,
  });
}
