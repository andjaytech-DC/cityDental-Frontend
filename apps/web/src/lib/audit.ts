import "server-only";
import { prisma } from "@/lib/db";

/**
 * Mirrors `enum AuditAction` in apps/api/prisma/schema.prisma.
 *
 * Declared locally instead of imported from `@prisma/client` because the web app
 * does not run `prisma generate` on Vercel, so model and enum types are absent
 * from the generated client there. Keep both definitions in sync.
 */
export type AuditAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED";

export async function writeAudit(params: {
  organizationId: string;
  actorUserId?: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      actorUserId: params.actorUserId ?? null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      metadata: (params.metadata as never) ?? undefined,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
}
