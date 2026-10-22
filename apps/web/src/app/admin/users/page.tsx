import Link from "next/link";
import { listUsers } from "@/lib/users";
import { getSession } from "@/lib/auth/session";
import { Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, EmptyState, PageHeading, ErrorState } from "@/components/ui";

export const metadata = { title: "Users | CityDental Admin" };

export default async function AdminUsersPage({ searchParams }: { searchParams: { search?: string; status?: string; page?: string } }) {
  const s = await getSession();
  if (!s) return null;
  if (!s.isSuperAdmin && !s.permissions.includes("user:read")) return <ErrorState title="Forbidden" description="Missing user:read" />;
  const data = await listUsers({ search: searchParams.search, status: searchParams.status, page: Number(searchParams.page ?? 1), pageSize: 20 });
  return (
    <>
      <PageHeading title="Users" description="Staff accounts — roles and location scope." />
      <div className="mb-4 flex gap-3">
        {(s.isSuperAdmin || s.permissions.includes("user:manage")) ? <Link href="/admin/users/new" className="cd-button cd-button-primary">New user</Link> : null}
        <span className="cd-muted text-sm self-center">{data.total} total · page {data.page}/{data.totalPages || 1}</span>
      </div>
      <Card>
        {data.items.length === 0 ? (
          <EmptyState title="No users" description="Users will appear here." />
        ) : (
          <Table aria-label="Users">
            <TableHead>
              <TableRow>
                <TableHeader>Email</TableHeader>
                <TableHeader>Name</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Roles</TableHeader>
                <TableHeader>View</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.firstName} {u.lastName}</TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell>{u.roles.map((r: { role: { name: string } }) => r.role.name).join(", ") || "—"}</TableCell>
                  <TableCell><Link href={`/admin/users/${u.id}`} className="cd-button cd-button-ghost text-xs">View</Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
