import "server-only";
import type { PermissionCode } from "@citydental/types";
import { getSession } from "./session";

export async function hasPermission(code: PermissionCode): Promise<boolean> {
  const s = await getSession();
  if (!s) return false;
  if (s.isSuperAdmin) return true;
  return s.permissions.includes(code);
}

export async function requirePermission(code: PermissionCode): Promise<void> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  if (s.isSuperAdmin) return;
  if (!s.permissions.includes(code)) throw new Error("FORBIDDEN");
}

export async function requireLocationAccess(locationId: string | null | undefined): Promise<void> {
  if (!locationId) return;
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  if (s.isSuperAdmin || s.isOrgWide) return;
  if (!s.locationIds.includes(locationId)) throw new Error("FORBIDDEN");
}

export function isLocationAllowed(session: { isSuperAdmin: boolean; isOrgWide: boolean; locationIds: string[] }, locationId: string | null | undefined): boolean {
  if (!locationId) return session.isSuperAdmin || session.isOrgWide;
  if (session.isSuperAdmin || session.isOrgWide) return true;
  return session.locationIds.includes(locationId);
}

export async function getAccessibleLocationIds(): Promise<string[] | null> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  if (s.isSuperAdmin || s.isOrgWide) return null; // null = all locations in org
  return s.locationIds;
}

export const ROLE_PERMISSION_MAP: Record<string, PermissionCode[]> = {
  OWNER: [
    "organization:read",
    "organization:manage",
    "location:read",
    "location:manage",
    "user:read",
    "user:manage",
    "role:read",
    "role:manage",
    "patient:read",
    "patient:create",
    "patient:update",
    "patient:archive",
    "doctor:read",
    "doctor:manage",
    "appointment:read",
    "appointment:create",
    "appointment:update",
    "appointment:cancel",
    "audit:read",
  ],
  ORG_ADMIN: [
    "organization:read",
    "location:read",
    "location:manage",
    "user:read",
    "user:manage",
    "role:read",
    "role:manage",
    "patient:read",
    "patient:create",
    "patient:update",
    "patient:archive",
    "doctor:read",
    "doctor:manage",
    "appointment:read",
    "appointment:create",
    "appointment:update",
    "appointment:cancel",
    "audit:read",
  ],
  LOCATION_ADMIN: [
    "location:read",
    "location:manage",
    "user:read",
    "patient:read",
    "patient:create",
    "patient:update",
    "doctor:read",
    "appointment:read",
    "appointment:create",
    "appointment:update",
    "appointment:cancel",
    "audit:read",
  ],
  DOCTOR: ["patient:read", "doctor:read", "appointment:read", "appointment:update", "location:read"],
  RECEPTIONIST: [
    "patient:read",
    "patient:create",
    "patient:update",
    "appointment:read",
    "appointment:create",
    "appointment:update",
    "appointment:cancel",
    "location:read",
    "doctor:read",
  ],
  ACCOUNTANT: ["patient:read", "appointment:read", "audit:read", "organization:read", "location:read"],
  PATIENT: ["patient:read", "appointment:read"],
};
