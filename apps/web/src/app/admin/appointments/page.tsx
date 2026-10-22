import Link from "next/link";
import { listAppointments } from "@/lib/appointments";
import { Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, EmptyState, PageHeading, ErrorState } from "@/components/ui";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Appointments | CityDental Admin" };

export default async function AdminAppointmentsPage({ searchParams }: { searchParams: { page?: string; status?: string } }) {
  const s = await getSession();
  if (!s) return null;
  if (!s.isSuperAdmin && !s.permissions.includes("appointment:read")) return <ErrorState title="Forbidden" description="Missing appointment:read" />;
  const data = await listAppointments({ page: Number(searchParams.page ?? 1), pageSize: 20, status: searchParams.status });
  return (
    <>
      <PageHeading title="Appointments" description="Inspect patient/doctor/location, date/time, status, and notes. Status transitions enforced server-side." />
      <div className="mb-4">
        <Link href="/admin/appointments/new" className="cd-button cd-button-primary">
          New appointment
        </Link>
      </div>
      <Card>
        {data.items.length === 0 ? (
          <EmptyState title="No appointments found" description="Create an appointment to see it here." />
        ) : (
          <Table aria-label="Appointments">
            <TableHead>
              <TableRow>
                <TableHeader>When</TableHeader>
                <TableHeader>Patient</TableHeader>
                <TableHeader>Doctor</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>View</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{new Date(a.scheduledStart).toLocaleString()}</TableCell>
                  <TableCell>
                    {a.patient.firstName} {a.patient.lastName}
                  </TableCell>
                  <TableCell>{a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName}` : "—"}</TableCell>
                  <TableCell>{a.status}</TableCell>
                  <TableCell>
                    <Link href={`/admin/appointments/${a.id}`} className="cd-button cd-button-ghost text-xs">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
