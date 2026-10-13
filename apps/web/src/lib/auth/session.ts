import "server-only";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import type { JwtAccessPayload } from "@citydental/types";

const ACCESS_COOKIE = "citydental_access";
const REFRESH_COOKIE = "citydental_refresh";

function getSecrets(): { access: string; refresh: string } {
  const a = process.env.JWT_ACCESS_SECRET;
  const r = process.env.JWT_REFRESH_SECRET;
  if (!a || a.length < 32) throw new Error("JWT_ACCESS_SECRET missing");
  if (!r || r.length < 32) throw new Error("JWT_REFRESH_SECRET missing");
  return { access: a, refresh: r };
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  organizationSlug: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
  locationIds: string[];
  isOrgWide: boolean;
  tokenVersion: number;
}

export async function verifyCredentials(
  email: string,
  password: string,
  organizationSlug?: string,
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      organization: true,
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } }, location: true } },
    },
  });
  if (!user) return null;
  if (user.status !== "ACTIVE") return null;
  if (user.organization.status !== "ACTIVE") return null;
  if (organizationSlug && user.organization.slug !== organizationSlug) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  // collect roles/permissions
  const roles = user.roles.map((ur) => ur.role.name);
  const perms = new Set<string>();
  for (const ur of user.roles) {
    for (const rp of ur.role.permissions) perms.add(rp.permission.code);
  }
  if (user.isSuperAdmin) {
    // super admin gets all permissions
    const all = await prisma.permission.findMany({ select: { code: true } });
    for (const p of all) perms.add(p.code);
    if (!roles.includes("OWNER")) roles.push("OWNER");
  }
  const locationIds = user.roles.filter((ur) => ur.locationId).map((ur) => ur.locationId as string);
  const isOrgWide = user.roles.some((ur) => ur.locationId === null) || user.isSuperAdmin;

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "LOGIN",
      resourceType: "User",
      resourceId: user.id,
      metadata: { email: user.email },
    },
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    organizationId: user.organizationId,
    organizationSlug: user.organization.slug,
    isSuperAdmin: user.isSuperAdmin,
    roles,
    permissions: [...perms],
    locationIds,
    isOrgWide,
    tokenVersion: user.tokenVersion,
  };
}

export function signTokens(user: SessionUser): { accessToken: string; refreshToken: string; expiresIn: number } {
  const { access, refresh } = getSecrets();
  const accessTtl = process.env.JWT_ACCESS_TTL || "15m";
  const refreshTtl = process.env.JWT_REFRESH_TTL || "7d";
  const payload: JwtAccessPayload = {
    sub: user.id,
    org: user.organizationId,
    email: user.email,
    roles: user.roles as never,
    ver: user.tokenVersion,
  };
  const accessToken = jwt.sign(payload, access, { expiresIn: accessTtl } as never);
  const refreshToken = jwt.sign({ ...payload, type: "refresh" as const }, refresh, { expiresIn: refreshTtl } as never);
  const decoded = jwt.decode(accessToken) as { exp?: number; iat?: number } | null;
  const expiresIn =
    decoded?.exp && decoded?.iat ? decoded.exp - decoded.iat : 15 * 60;
  return { accessToken, refreshToken, expiresIn };
}

export function setAuthCookies(accessToken: string, refreshToken: string): void {
  const isProd = process.env.NODE_ENV === "production";
  const c = cookies();
  c.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  c.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearAuthCookies(): void {
  const c = cookies();
  c.delete(ACCESS_COOKIE);
  c.delete(REFRESH_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    const { access } = getSecrets();
    const decoded = jwt.verify(token, access) as JwtAccessPayload & { exp: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        organization: true,
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
    if (!user || user.status !== "ACTIVE" || user.tokenVersion !== decoded.ver) return null;
    const roles = user.roles.map((ur) => ur.role.name);
    const perms = new Set<string>();
    for (const ur of user.roles) for (const rp of ur.role.permissions) perms.add(rp.permission.code);
    if (user.isSuperAdmin) {
      const all = await prisma.permission.findMany({ select: { code: true } });
      for (const p of all) perms.add(p.code);
    }
    const locationIds = user.roles.filter((ur) => ur.locationId).map((ur) => ur.locationId as string);
    const isOrgWide = user.roles.some((ur) => ur.locationId === null) || user.isSuperAdmin;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
      organizationSlug: user.organization.slug,
      isSuperAdmin: user.isSuperAdmin,
      roles,
      permissions: [...perms],
      locationIds,
      isOrgWide,
      tokenVersion: user.tokenVersion,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  return s;
}

export async function refreshSession(): Promise<boolean> {
  const token = cookies().get(REFRESH_COOKIE)?.value;
  if (!token) return false;
  try {
    const { refresh, access } = getSecrets();
    const decoded = jwt.verify(token, refresh) as JwtAccessPayload & { type: string; ver: number };
    if (decoded.type !== "refresh") return false;
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { organization: true, roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });
    if (!user || user.tokenVersion !== decoded.ver) return false;
    const roles = user.roles.map((ur) => ur.role.name);
    const perms = new Set<string>();
    for (const ur of user.roles) for (const rp of ur.role.permissions) perms.add(rp.permission.code);
    if (user.isSuperAdmin) {
      const all = await prisma.permission.findMany({ select: { code: true } });
      for (const p of all) perms.add(p.code);
    }
    const locationIds = user.roles.filter((ur) => ur.locationId).map((ur) => ur.locationId as string);
    const isOrgWide = user.roles.some((ur) => ur.locationId === null) || user.isSuperAdmin;
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
      organizationSlug: user.organization.slug,
      isSuperAdmin: user.isSuperAdmin,
      roles,
      permissions: [...perms],
      locationIds,
      isOrgWide,
      tokenVersion: user.tokenVersion,
    };
    const { accessToken, refreshToken } = signTokens(sessionUser);
    setAuthCookies(accessToken, refreshToken);
    return true;
  } catch {
    return false;
  }
}
