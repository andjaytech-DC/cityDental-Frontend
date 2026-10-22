import Link from "next/link";
import { listLocations } from "@/lib/locations";
import { getSession } from "@/lib/auth/session";
import { Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, EmptyState, PageHeading, ErrorState, Badge } from "@/components/ui";

export const metadata = { title: "Locations | CityDental Admin" };

export default async function AdminLocationsPage() {
  const s = await getSession();
  if (!s) return null;
  if (!s.isSuperAdmin && !s.permissions.includes("location:read")) return <ErrorState title="Forbidden" description="Missing location:read" />;
  const locations = await listLocations();
  const canManage = s.isSuperAdmin || s.permissions.includes("location:manage");
  return (
    <>
      <PageHeading title="Locations" description="Practice locations — server-authorized. Deactivation preferred over deletion to avoid scope escalation." />
      {canManage ? <div className="mb-4"><Link href="/admin/locations/new" className="cd-button cd-button-primary">New location</Link></div> : null}
      <Card>
        {locations.length === 0 ? (
          <EmptyState title="No locations found" description="Locations will appear here once configured." />
        ) : (
          <Table aria-label="Locations">
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Code</TableHeader>
                <TableHeader>City</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((l) => (
                <TableRow key={l.id}>
                  <TableCell><Link href={`/admin/locations/${l.id}`} className="underline">{l.name}</Link></TableCell>
                  <TableCell>{l.code ?? "—"}</TableCell>
                  <TableCell>{l.city ?? "—"}</TableCell>
                  <TableCell><Badge variant={l.status === "ACTIVE" ? "info" : "neutral"}>{l.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
