import Link from "next/link";
import { listDoctors } from "@/lib/admin-doctors";
import { Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, EmptyState, PageHeading, ErrorState } from "@/components/ui";
import { getSession } from "@/lib/auth/session";

export default async function AdminDoctorsPage({ searchParams }: { searchParams: { search?: string; page?: string } }) {
  const session = await getSession();
  if (!session) return null;
  if (!session.isSuperAdmin && !session.permissions.includes("doctor:read")) return <ErrorState title="Forbidden" description="Missing doctor:read" />;
  const data = await listDoctors({ search: searchParams.search, page: Number(searchParams.page ?? 1), pageSize: 20 });
  return (
    <>
      <PageHeading title="Doctors" description="Clinicians — server-authorized." />
      <div className="mb-4">
        <Link href="/admin/doctors/new" className="cd-button cd-button-primary">
          New doctor
        </Link>
      </div>
      <Card>
        {data.items.length === 0 ? (
          <EmptyState title="No doctors found" description="Add a doctor to see it here." />
        ) : (
          <Table aria-label="Doctors">
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Specialties</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>View</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    {d.firstName} {d.lastName}
                  </TableCell>
                  <TableCell>{d.phone ?? "—"}</TableCell>
                  <TableCell>{d.specialties.map((s) => s.name).join(", ") || "—"}</TableCell>
                  <TableCell>{d.status}</TableCell>
                  <TableCell>
                    <Link href={`/admin/doctors/${d.id}`} className="cd-button cd-button-ghost text-xs">
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
