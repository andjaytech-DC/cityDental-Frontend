import Link from "next/link";
import { listPatients } from "@/lib/patients";
import { Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, EmptyState, PageHeading, ErrorState, Badge } from "@/components/ui";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Patients | CityDental Admin" };

export default async function AdminPatientsPage({ searchParams }: { searchParams: { search?: string; status?: string; page?: string } }) {
  const session = await getSession();
  if (!session) return null;
  if (!session.isSuperAdmin && !session.permissions.includes("patient:read")) {
    return <ErrorState title="Forbidden" description="Your account does not have patient:read." />;
  }
  const page = Number(searchParams.page ?? 1);
  try {
    const data = await listPatients({ search: searchParams.search, status: searchParams.status, page, pageSize: 20 });
    return (
      <>
        <PageHeading title="Patients" description="Patient records — server-authorized, validated, and audited." />
        <div className="mb-4 flex flex-wrap gap-3">
          <Link href="/admin/patients/new" className="cd-button cd-button-primary">
            New patient
          </Link>
          <span className="cd-muted text-sm self-center">
            {data.total} total · page {data.page}/{Math.max(1, data.totalPages)}
          </span>
        </div>
        <Card>
          {data.items.length === 0 ? (
            <EmptyState title="No patients found" description={searchParams.search ? "No matching records." : "No patient records available yet."} />
          ) : (
            <Table aria-label="Patients">
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Phone</TableHeader>
                  <TableHeader>City</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>View</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.firstName} {p.lastName}
                    </TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
                    <TableCell>{p.city ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "ACTIVE" ? "info" : "neutral"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/patients/${p.id}`} className="cd-button cd-button-ghost text-xs">
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "FORBIDDEN") return <ErrorState title="Forbidden" description="Missing patient:read permission." />;
    return <ErrorState title="Unable to load patients" description="Check database connectivity." />;
  }
}
