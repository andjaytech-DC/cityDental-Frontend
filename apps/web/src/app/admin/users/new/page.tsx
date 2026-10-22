import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createUser } from "@/lib/users";
import { prisma } from "@/lib/db";

export const metadata = { title: "New User | CityDental Admin" };

export default async function NewUserPage() {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin/users/new");
  if (!s.isSuperAdmin && !s.permissions.includes("user:manage")) return <div className="cd-container">Forbidden — missing user:manage</div>;
  const locations = await prisma.location.findMany({ where: { organizationId: s.organizationId }, take: 50 });
  const roles = await prisma.role.findMany({ where: { organizationId: s.organizationId }, select: { name: true } });

  async function action(formData: FormData): Promise<void> {
    "use server";
    const raw = Object.fromEntries(formData.entries());
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) data[k] = String(v).trim() || undefined;
    const rolesArr = String(raw.roles ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    data.roles = rolesArr;
    if (!data.locationId) delete data.locationId;
    await createUser(data);
    redirect("/admin/users");
  }

  return (
    <form action={action} className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-serif">New user</h1>
      <p className="cd-muted text-sm">Roles: {roles.map((r) => r.name).join(", ")} — comma-separated. Location optional (must be in your scope).</p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block"><span className="text-sm">Email *</span><input name="email" required type="email" className="cd-input w-full" /></label>
        <label className="block"><span className="text-sm">Password * (10+ chars)</span><input name="password" required type="password" className="cd-input w-full" /></label>
        <label className="block"><span className="text-sm">First name *</span><input name="firstName" required className="cd-input w-full" /></label>
        <label className="block"><span className="text-sm">Last name *</span><input name="lastName" required className="cd-input w-full" /></label>
        <label className="block"><span className="text-sm">Phone</span><input name="phone" className="cd-input w-full" /></label>
        <label className="block md:col-span-2"><span className="text-sm">Roles * (comma-separated)</span><input name="roles" required className="cd-input w-full" placeholder="RECEPTIONIST" /></label>
        <label className="block md:col-span-2"><span className="text-sm">Location (optional)</span>
          <select name="locationId" className="cd-input w-full">
            <option value="">Organization-wide</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
      </div>
      <button type="submit" className="cd-button cd-button-primary">Create user</button>
    </form>
  );
}
