import { getSession } from "@/lib/auth/session";
import { getCommunicationStatus, listCommunications } from "@/lib/communications";
import { Card, PageHeading, Badge, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, EmptyState } from "@/components/ui";
import { Composer } from "./composer";
import { TEMPLATES } from "@/lib/communications/templates";

export default async function CommunicationsPage() {
  const s = await getSession();
  if (!s) return null;
  const status = getCommunicationStatus();
  const patients = await (await import("@/lib/db")).prisma.patient.findMany({
    where: { organizationId: s.organizationId },
    take: 30,
    orderBy: { createdAt: "desc" },
  });
  const history = await listCommunications({ page: 1, pageSize: 20 });

  return (
    <>
      <PageHeading title="Communications" description="Send email/SMS/WhatsApp via server-side providers. Credentials never touch the browser." />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card title="Email">
          <Badge variant={status.email === "CONFIGURED" && status.enabled ? "info" : "warning"}>{status.enabled ? status.email : "NOT_CONFIGURED"}</Badge>
          <p className="cd-muted text-xs mt-2">Provider: {process.env.SMTP_HOST ? "configured" : "missing"} — no key is exposed.</p>
        </Card>
        <Card title="SMS">
          <Badge variant={status.sms === "CONFIGURED" && status.enabled ? "info" : "warning"}>{status.enabled ? status.sms : "NOT_CONFIGURED"}</Badge>
          <p className="cd-muted text-xs mt-2">Provider: {process.env.SMS_PROVIDER ? "configured" : "missing"}</p>
        </Card>
        <Card title="WhatsApp">
          <Badge variant={status.whatsapp === "CONFIGURED" && status.enabled ? "info" : "warning"}>{status.enabled ? status.whatsapp : "NOT_CONFIGURED"}</Badge>
          <p className="cd-muted text-xs mt-2">Provider: {process.env.WHATSAPP_PROVIDER ? "configured" : "missing"}</p>
        </Card>
      </div>
      {!status.enabled ? (
        <Card title="Configuration">
          <p className="cd-muted text-sm">Communications are disabled in this environment (COMMUNICATIONS_ENABLED=false). Enable and configure SMTP/SMS/WhatsApp to send.</p>
        </Card>
      ) : null}
      <Card title="Composer">
        <Composer patients={patients.map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, email: p.email, phone: p.phone }))} />
        <div className="mt-4 cd-muted text-xs">
          Templates: {Object.entries(TEMPLATES).map(([k, v]) => `${k} — ${v.name}`).join(" · ")} — variables: patientName, doctorName, appointmentDate, appointmentTime, clinicName, clinicPhone
        </div>
      </Card>
      <div className="mt-6">
        <Card title="Communication history">
          {history.items.length === 0 ? (
            <EmptyState title="No communications yet" description="Send a message to see history. No fake delivery — status reflects real provider result." />
          ) : (
            <Table aria-label="Communication history">
              <TableHead><TableRow><TableHeader>When</TableHeader><TableHeader>Channel</TableHeader><TableHeader>Patient</TableHeader><TableHeader>Template</TableHeader><TableHeader>Status</TableHeader><TableHeader>Provider</TableHeader></TableRow></TableHead>
              <TableBody>
                {history.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{c.channel}</TableCell>
                    <TableCell>{c.patient ? `${c.patient.firstName} ${c.patient.lastName}` : "—"}</TableCell>
                    <TableCell>{c.template ?? "—"}</TableCell>
                    <TableCell><Badge variant={c.status === "SUCCESS" ? "info" : c.status === "NOT_CONFIGURED" ? "warning" : "neutral"}>{c.status}</Badge></TableCell>
                    <TableCell>{c.provider ?? "—"} {c.providerMessageId ? `· ${c.providerMessageId.slice(0, 8)}` : ""} {c.failureReason ? `· ${c.failureReason.slice(0, 30)}` : ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
