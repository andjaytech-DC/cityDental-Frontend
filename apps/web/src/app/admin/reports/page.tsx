import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getAccessibleLocationIds } from "@/lib/auth/permissions";
import { Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, PageHeading, Badge } from "@/components/ui";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfWeek(d: Date) { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; }
function startOfMonth(d: Date) { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }

export default async function ReportsPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.organizationId;
  const allowed = await getAccessibleLocationIds();
  const locFilter = allowed === null ? {} : { in: allowed };

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [totalPatients, newPatients, activePatients, patientsByAge, patientsByLocation, totalDoctors, activeDoctors, doctorsBySpecialty, totalAppointments, todayAppointments, weekAppointments, monthAppointments, upcoming, completed, cancelled, pending, totalPayments, paidPayments, pendingPayments, failedPayments, refunded, revenue, pendingRevenue, refundedAmount] = await Promise.all([
    prisma.patient.count({ where: { organizationId: orgId, ...(allowed !== null ? { primaryLocationId: locFilter } : {}) } }),
    prisma.patient.count({ where: { organizationId: orgId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, ...(allowed !== null ? { primaryLocationId: locFilter } : {}) } }),
    prisma.patient.count({ where: { organizationId: orgId, status: "ACTIVE", ...(allowed !== null ? { primaryLocationId: locFilter } : {}) } }),
    prisma.patient.groupBy({ by: ["ageGroup"], where: { organizationId: orgId, ...(allowed !== null ? { primaryLocationId: locFilter } : {}) }, _count: true }),
    prisma.patient.groupBy({ by: ["primaryLocationId"], where: { organizationId: orgId }, _count: true }),
    prisma.doctor.count({ where: { organizationId: orgId, ...(allowed !== null ? { primaryLocationId: locFilter } : {}) } }),
    prisma.doctor.count({ where: { organizationId: orgId, status: "ACTIVE", ...(allowed !== null ? { primaryLocationId: locFilter } : {}) } }),
    prisma.doctorSpecialty.groupBy({ by: ["name"], where: { doctor: { organizationId: orgId } }, _count: true }),
    prisma.appointment.count({ where: { organizationId: orgId, ...(allowed !== null ? { locationId: locFilter } : {}) } }),
    prisma.appointment.count({ where: { organizationId: orgId, scheduledStart: { gte: todayStart }, ...(allowed !== null ? { locationId: locFilter } : {}) } }),
    prisma.appointment.count({ where: { organizationId: orgId, scheduledStart: { gte: weekStart }, ...(allowed !== null ? { locationId: locFilter } : {}) } }),
    prisma.appointment.count({ where: { organizationId: orgId, scheduledStart: { gte: monthStart }, ...(allowed !== null ? { locationId: locFilter } : {}) } }),
    prisma.appointment.count({ where: { organizationId: orgId, status: "SCHEDULED", scheduledStart: { gte: now }, ...(allowed !== null ? { locationId: locFilter } : {}) } }),
    prisma.appointment.count({ where: { organizationId: orgId, status: "COMPLETED", ...(allowed !== null ? { locationId: locFilter } : {}) } }),
    prisma.appointment.count({ where: { organizationId: orgId, status: "CANCELLED", ...(allowed !== null ? { locationId: locFilter } : {}) } }),
    prisma.appointment.count({ where: { organizationId: orgId, status: "SCHEDULED", ...(allowed !== null ? { locationId: locFilter } : {}) } }),
    prisma.payment.count({ where: { organizationId: orgId } }),
    prisma.payment.count({ where: { organizationId: orgId, status: "PAID" } }),
    prisma.payment.count({ where: { organizationId: orgId, status: "PENDING" } }),
    prisma.payment.count({ where: { organizationId: orgId, status: "FAILED" } }),
    prisma.payment.count({ where: { organizationId: orgId, status: "REFUNDED" } }),
    prisma.payment.aggregate({ where: { organizationId: orgId, status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { organizationId: orgId, status: "PENDING" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { organizationId: orgId, status: "REFUNDED" }, _sum: { amount: true } }),
  ]);

  const recentAppointments = await prisma.appointment.findMany({ where: { organizationId: orgId, ...(allowed !== null ? { locationId: locFilter } : {}) }, include: { patient: true, doctor: true, location: true }, orderBy: { createdAt: "desc" }, take: 10 });
  const recentPayments = await prisma.payment.findMany({ where: { organizationId: orgId }, include: { patient: true, appointment: true }, orderBy: { createdAt: "desc" }, take: 10 });

  return (
    <>
      <PageHeading title="Reports" description="Database-backed totals — organization/location filtered, no hard-coded numbers." />
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card title="Patients"><div className="text-2xl font-serif">{totalPatients}</div><div className="cd-muted text-xs">Active {activePatients} · New 30d {newPatients}</div></Card>
        <Card title="Doctors"><div className="text-2xl font-serif">{totalDoctors}</div><div className="cd-muted text-xs">Active {activeDoctors}</div></Card>
        <Card title="Appointments"><div className="text-2xl font-serif">{totalAppointments}</div><div className="cd-muted text-xs">Today {todayAppointments} · Week {weekAppointments} · Month {monthAppointments}</div></Card>
        <Card title="Revenue"><div className="text-2xl font-serif">₹{Number(revenue._sum.amount ?? 0).toFixed(2)} INR</div><div className="cd-muted text-xs">Paid {paidPayments} · Pending ₹{Number(pendingRevenue._sum.amount ?? 0).toFixed(2)}</div></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card title="Patients by Age Group">
          {patientsByAge.length === 0 ? <div className="cd-muted text-sm">No age group data</div> : <Table aria-label="Patients by age"><TableHead><TableRow><TableHeader>Age Group</TableHeader><TableHeader>Count</TableHeader></TableRow></TableHead><TableBody>{patientsByAge.map((r) => <TableRow key={String(r.ageGroup)}><TableCell>{r.ageGroup ?? "Unspecified"}</TableCell><TableCell>{r._count}</TableCell></TableRow>)}</TableBody></Table>}
        </Card>
        <Card title="Doctors by Specialty">
          {doctorsBySpecialty.length === 0 ? <div className="cd-muted text-sm">No specialty data</div> : <Table aria-label="Doctors by specialty"><TableHead><TableRow><TableHeader>Specialty</TableHeader><TableHeader>Count</TableHeader></TableRow></TableHead><TableBody>{doctorsBySpecialty.map((r) => <TableRow key={r.name}><TableCell>{r.name}</TableCell><TableCell>{r._count}</TableCell></TableRow>)}</TableBody></Table>}
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card title="Appointment Status">
          <div className="text-sm space-y-1"><div>Upcoming <Badge>{upcoming}</Badge></div><div>Completed <Badge>{completed}</Badge></div><div>Cancelled <Badge>{cancelled}</Badge></div><div>Pending <Badge>{pending}</Badge></div></div>
        </Card>
        <Card title="Payment Overview">
          <div className="text-sm space-y-1"><div>Total <Badge>{totalPayments}</Badge> · Paid <Badge variant="info">{paidPayments}</Badge> · Pending {pendingPayments} · Failed {failedPayments} · Refunded {refunded}</div><div>Refunded amount ₹{Number(refundedAmount._sum.amount ?? 0).toFixed(2)}</div></div>
        </Card>
      </div>

      <Card title="Recent Appointments (server pagination, 10)">
        <Table aria-label="Recent appointments report"><TableHead><TableRow><TableHeader>Patient</TableHeader><TableHeader>Age Group</TableHeader><TableHeader>Doctor</TableHeader><TableHeader>Location</TableHeader><TableHeader>Date</TableHeader><TableHeader>Status</TableHeader></TableRow></TableHead><TableBody>{recentAppointments.map((a) => <TableRow key={a.id}><TableCell>{a.patient.firstName} {a.patient.lastName}</TableCell><TableCell>{a.ageGroup ?? "—"}</TableCell><TableCell>{a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName}` : "—"}</TableCell><TableCell>{a.location.name}</TableCell><TableCell>{new Date(a.scheduledStart).toLocaleString()}</TableCell><TableCell>{a.status}</TableCell></TableRow>)}</TableBody></Table>
      </Card>

      <div className="mt-6">
        <Card title="Recent Payments">
          <Table aria-label="Recent payments"><TableHead><TableRow><TableHeader>Appointment</TableHeader><TableHeader>Patient</TableHeader><TableHeader>Amount</TableHeader><TableHeader>Method</TableHeader><TableHeader>Status</TableHeader><TableHeader>Created</TableHeader></TableRow></TableHead><TableBody>{recentPayments.map((p) => <TableRow key={p.id}><TableCell>{p.appointmentId.slice(0, 8)}</TableCell><TableCell>{p.patient.firstName} {p.patient.lastName}</TableCell><TableCell>₹{Number(p.amount).toFixed(2)} {p.currency}</TableCell><TableCell>{p.method}</TableCell><TableCell><Badge variant={p.status === "PAID" ? "info" : p.status === "PENDING" ? "warning" : "neutral"}>{p.status}</Badge></TableCell><TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell></TableRow>)}</TableBody></Table>
        </Card>
      </div>

      <div className="mt-6 flex gap-3">
        <a href="/api/reports/export?entity=appointments" className="cd-button cd-button-secondary">Export Appointments CSV</a>
        <a href="/api/reports/export?entity=payments" className="cd-button cd-button-secondary">Export Payments CSV</a>
        <a href="/api/reports/export?entity=patients" className="cd-button cd-button-secondary">Export Patients CSV</a>
      </div>
    </>
  );
}
