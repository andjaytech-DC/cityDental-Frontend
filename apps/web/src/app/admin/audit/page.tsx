import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, EmptyState, PageHeading, ErrorState } from "@/components/ui";

export default async function AuditPage({ searchParams }: { searchParams: { page?: string } }) {
  const s = await getSession();
  if (!s) return null;
  if (!s.isSuperAdmin && !s.permissions.includes("audit:read")) return <ErrorState title="Forbidden" description="Missing audit:read" />;
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const pageSize = 30;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where: { organizationId: s.organizationId }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.auditLog.count({ where: { organizationId: s.organizationId } }),
  ]);
  return (
    <>
      <PageHeading title="Audit Log" description="Append-only trail — never updated or deleted by application code. Server-generated only." />
      <Card>
        {items.length === 0 ? (
          <EmptyState title="No audit entries" description="Actions will be recorded here." />
        ) : (
          <>
            <div className="cd-muted text-xs mb-3">
              {total} entries · page {page}/{Math.ceil(total / pageSize)}
            </div>
            <Table aria-label="Audit log">
              <TableHead>
                <TableRow>
                  <TableHeader>When</TableHeader>
                  <TableHeader>Action</TableHeader>
                  <TableHeader>Resource</TableHeader>
                  <TableHeader>Actor</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{a.action}</TableCell>
                    <TableCell>
                      {a.resourceType}
                      {a.resourceId ? ` · ${a.resourceId.slice(0, 8)}` : ""}
                    </TableCell>
                    <TableCell>{a.actorUserId ? a.actorUserId.slice(0, 8) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Card>
    </>
  );
}
