import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getCommunicationStatus } from "@/lib/communications";
import { Card, Badge, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, EmptyState, PageHeading } from "@/components/ui";

export const metadata = { title: "Admin Dashboard | CityDental Admin" };

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) return null;

  const [patientCount, doctorCount, appointmentCount, upcomingCount, todayCount, completedCount, cancelledCount, pendingCount, paidRevenue, pendingRevenue, recentPatients, recentAppointments, recentPayments, recentAudit, comms, paymentStatus] = await Promise.all([
    prisma.patient.count({ where: { organizationId: session.organizationId } }),
    prisma.doctor.count({ where: { organizationId: session.organizationId } }),
    prisma.appointment.count({ where: { organizationId: session.organizationId } }),
    prisma.appointment.count({
      where: { organizationId: session.organizationId, scheduledStart: { gte: new Date() }, status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"] } },
    }),
    prisma.appointment.count({ where: { organizationId: session.organizationId, scheduledStart: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    prisma.appointment.count({ where: { organizationId: session.organizationId, status: "COMPLETED" } }),
    prisma.appointment.count({ where: { organizationId: session.organizationId, status: "CANCELLED" } }),
    prisma.appointment.count({ where: { organizationId: session.organizationId, status: "SCHEDULED" } }),
    prisma.payment.aggregate({ where: { organizationId: session.organizationId, status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { organizationId: session.organizationId, status: "PENDING" }, _sum: { amount: true } }),
    prisma.patient.findMany({ where: { organizationId: session.organizationId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.appointment.findMany({
      where: { organizationId: session.organizationId },
      include: { patient: true, doctor: true },
      orderBy: { scheduledStart: "desc" },
      take: 5,
    }),
    prisma.payment.findMany({ where: { organizationId: session.organizationId }, include: { patient: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.auditLog.findMany({ where: { organizationId: session.organizationId }, orderBy: { createdAt: "desc" }, take: 8 }),
    Promise.resolve(getCommunicationStatus()),
    Promise.resolve((await import("@/lib/payments/provider")).getPaymentStatusConfig()),
  ]);

  return (
    <>
      <PageHeading title="Admin Dashboard" description="Operational overview — data loaded server-side from PostgreSQL via Prisma." />
      <div className="cd-summary-grid mb-8">
        <Card title="Patients">
          <div className="text-2xl font-serif">{patientCount}</div>
          <p className="cd-muted text-sm">Total patient records</p>
        </Card>
        <Card title="Doctors">
          <div className="text-2xl font-serif">{doctorCount}</div>
          <p className="cd-muted text-sm">Active clinicians</p>
        </Card>
        <Card title="Appointments">
          <div className="text-2xl font-serif">{appointmentCount}</div>
          <p className="cd-muted text-sm">Today {todayCount} · Upcoming {upcomingCount} · Completed {completedCount} · Cancelled {cancelledCount} · Pending {pendingCount}</p>
        </Card>
        <Card title="Revenue">
          <div className="text-2xl font-serif">₹{Number(paidRevenue._sum.amount ?? 0).toFixed(2)} INR</div>
          <p className="cd-muted text-sm">Paid · Pending ₹{Number(pendingRevenue._sum.amount ?? 0).toFixed(2)} · <a href="/admin/reports" className="underline">Reports</a></p>
        </Card>
        <Card title="Communications">
          <Badge variant={comms.enabled ? "info" : "warning"}>{comms.enabled ? "Enabled" : "Disabled"}</Badge>
          <div className="cd-muted mt-2 text-xs">
            Email: {comms.email} · SMS: {comms.sms} · WhatsApp: {comms.whatsapp}
          </div>
          {!comms.enabled ? <p className="cd-muted mt-2 text-xs">Providers are NOT_CONFIGURED in this environment — no messages will be sent.</p> : null}
        </Card>
        <Card title="Payments">
          <Badge variant={paymentStatus.enabled ? "info" : "warning"}>{paymentStatus.enabled ? paymentStatus.provider : "NOT_CONFIGURED"}</Badge>
          <div className="cd-muted mt-2 text-xs">Currency {paymentStatus.currency} · Online/UPI/QR via provider</div>
          {!paymentStatus.enabled ? <p className="cd-muted mt-2 text-xs">PAYMENTS_ENABLED=false — no fake success.</p> : null}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Recent patients">
          {recentPatients.length === 0 ? (
            <EmptyState title="No patient records available yet" description="Create a patient to see it here. No fabricated data is shown." />
          ) : (
            <Table aria-label="Recent patients">
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Phone</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentPatients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.firstName} {p.lastName}
                    </TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
                    <TableCell>{p.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
        <Card title="Recent appointments">
          {recentAppointments.length === 0 ? (
            <EmptyState title="No appointments found" description="Appointments will appear here once scheduled." />
          ) : (
            <Table aria-label="Recent appointments">
              <TableHead>
                <TableRow>
                  <TableHeader>When</TableHeader>
                  <TableHeader>Patient</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentAppointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.scheduledStart).toLocaleString()}</TableCell>
                    <TableCell>
                      {a.patient.firstName} {a.patient.lastName}
                    </TableCell>
                    <TableCell>{a.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Recent administrative actions">
          {recentAudit.length === 0 ? (
            <EmptyState title="No audit activity yet" description="Administrative actions will be recorded here." />
          ) : (
            <Table aria-label="Audit trail">
              <TableHead>
                <TableRow>
                  <TableHeader>Action</TableHeader>
                  <TableHeader>Resource</TableHeader>
                  <TableHeader>When</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentAudit.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.action}</TableCell>
                    <TableCell>
                      {e.resourceType}
                      {e.resourceId ? ` · ${e.resourceId.slice(0, 8)}` : ""}
                    </TableCell>
                    <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
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
