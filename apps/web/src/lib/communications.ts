import "server-only";
import { getProvider, getAllProviderStatus } from "./communications/providers";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";

export type ProviderStatus = "CONFIGURED" | "NOT_CONFIGURED";

export function getCommunicationStatus(): {
  email: ProviderStatus;
  sms: ProviderStatus;
  whatsapp: ProviderStatus;
  enabled: boolean;
} {
  const enabled = process.env.COMMUNICATIONS_ENABLED === "true";
  const statuses = getAllProviderStatus();
  if (!enabled) return { email: "NOT_CONFIGURED", sms: "NOT_CONFIGURED", whatsapp: "NOT_CONFIGURED", enabled: false };
  return { email: statuses.email as ProviderStatus, sms: statuses.sms as ProviderStatus, whatsapp: statuses.whatsapp as ProviderStatus, enabled };
}

export async function sendCommunication(params: {
  channel: "email" | "sms" | "whatsapp";
  to: string;
  message: string;
  subject?: string;
  patientId?: string;
  template?: string;
}): Promise<{ status: "SUCCESS" | "FAILED" | "NOT_CONFIGURED"; reason?: string; providerMessageId?: string; communicationId?: string }> {
  const provider = getProvider(params.channel);
  if (!provider.isConfigured()) return { status: "NOT_CONFIGURED", reason: `${params.channel} provider is not configured.` };
  const result = await provider.send({ to: params.to, subject: params.subject, message: params.message });
  // Persist history (server-side) if session exists and org known
  try {
    const session = await getSession().catch(() => null);
    if (session) {
      const comm = await prisma.communication.create({
        data: {
          organizationId: session.organizationId,
          patientId: params.patientId ?? null,
          channel: params.channel.toUpperCase() as never,
          template: params.template ?? null,
          message: params.message.slice(0, 2000),
          status: result.status as never,
          provider: provider.constructor.name.replace("Provider", ""),
          providerMessageId: (result as { providerMessageId?: string }).providerMessageId ?? null,
          failureReason: result.status !== "SUCCESS" ? (result as { reason?: string }).reason?.slice(0, 500) ?? null : null,
          initiatedById: session.id,
          sentAt: result.status === "SUCCESS" ? new Date() : null,
        },
      });
      await writeAudit({
        organizationId: session.organizationId,
        actorUserId: session.id,
        action: result.status === "SUCCESS" ? "CREATE" : "READ",
        resourceType: "Communication",
        resourceId: comm.id,
        metadata: { channel: params.channel, status: result.status, template: params.template },
      });
      return { ...result, communicationId: comm.id };
    }
  } catch {}
  return result;
}

export async function listCommunications(params: { page?: number; pageSize?: number } = {}) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where = { organizationId: session.organizationId } as const;
  const [items, total] = await Promise.all([
    prisma.communication.findMany({ where, include: { patient: true, initiatedBy: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.communication.count({ where }),
  ]);
  return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
