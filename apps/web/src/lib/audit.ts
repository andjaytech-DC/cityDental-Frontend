import "server-only";
import { prisma } from "@/lib/db";
import type { AuditAction } from "@prisma/client";

/**
 * `AuditAction` is `enum AuditAction` in apps/api/prisma/schema.prisma, surfaced
 * through the generated Prisma Client. Importing it from `@prisma/client` keeps
 * the allowed values tied to the database schema instead of a hand-copied union
 * that can silently drift.
 *
 * This type only exists once the client has been generated. The web build must
 * therefore run `prisma generate` before `next build` — see
 * scripts/generate-prisma-client.mjs, which is inlined into the `build`/`dev`
 * scripts because Vercel does not execute package.json lifecycle hooks. Without
 * generation, `@prisma/client` resolves to its ungenerated stub
 * (`export * from '.prisma/client/default'`) and this import fails to resolve.
 */
export type { AuditAction };

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
