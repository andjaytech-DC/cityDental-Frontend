import { notFound, redirect } from "next/navigation";
import { getUser, updateUser, assignRole } from "@/lib/users";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";

export const metadata = { title: "User | CityDental Admin" };

export default async function UserDetail({ params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin/users");
  let user;
  try {
    user = await getUser(params.id);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "NOT_FOUND") notFound();
    if (m === "FORBIDDEN") return <div className="cd-container">Forbidden</div>;
    throw e;
  }
  const canManage = s.isSuperAdmin || s.permissions.includes("user:manage");
  const locations = await prisma.location.findMany({ where: { organizationId: s.organizationId }, take: 50 });

  async function updateAction(formData: FormData): Promise<void> {
    "use server";
    const raw = Object.fromEntries(formData.entries());
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) if (String(v).trim()) data[k] = String(v).trim();
    await updateUser(params.id, data);
    redirect(`/admin/users/${params.id}`);
  }

  async function roleAction(formData: FormData): Promise<void> {
    "use server";
    const role = String(formData.get("role") ?? "").trim();
    const locationId = String(formData.get("locationId") ?? "").trim() || undefined;
    await assignRole(params.id, { role, locationId });
    redirect(`/admin/users/${params.id}`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-serif">{user.firstName} {user.lastName} — {user.email}</h1>
      <Card title="Details">
        <div className="text-sm space-y-1">
          <div>Status: {user.status}</div>
          <div>Roles:</div>
          <ul className="list-disc ml-5">
            {user.roles.map((r: { role: { name: string }; location?: { name: string } | null; locationId: string | null }) => (
              <li key={r.role.name + (r.locationId ?? "")}>{r.role.name} {r.location ? ` @ ${r.location.name}` : r.locationId ? ` @ ${r.locationId.slice(0, 8)}` : " (org-wide)"}</li>
            ))}
          </ul>
        </div>
      </Card>
      {canManage ? (
        <>
          <form action={updateAction} className="space-y-3">
            <h2 className="font-serif">Update</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className="text-sm">First name</span><input name="firstName" defaultValue={user.firstName} className="cd-input w-full" /></label>
              <label className="block"><span className="text-sm">Last name</span><input name="lastName" defaultValue={user.lastName} className="cd-input w-full" /></label>
              <label className="block"><span className="text-sm">Status</span>
                <select name="status" defaultValue={user.status} className="cd-input w-full">
                  <option value="ACTIVE">ACTIVE</option><option value="INVITED">INVITED</option><option value="SUSPENDED">SUSPENDED</option>
                </select>
              </label>
            </div>
            <button type="submit" className="cd-button cd-button-primary">Save</button>
          </form>
          <form action={roleAction} className="space-y-3">
            <h2 className="font-serif">Assign role</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block"><span className="text-sm">Role</span><input name="role" required placeholder="DOCTOR" className="cd-input w-full" /></label>
              <label className="block"><span className="text-sm">Location (optional)</span>
                <select name="locationId" className="cd-input w-full">
                  <option value="">Organization-wide</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </label>
            </div>
            <button type="submit" className="cd-button cd-button-secondary">Assign role</button>
          </form>
        </>
      ) : null}
    </div>
  );
}
