import { notFound, redirect } from "next/navigation";
import { getLocation, updateLocation, setLocationStatus } from "@/lib/locations";
import { getSession } from "@/lib/auth/session";
import { Card, Badge } from "@/components/ui";

export const metadata = { title: "Location | CityDental Admin" };

export default async function LocationDetail({ params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin/locations");
  let loc;
  try {
    loc = await getLocation(params.id);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "NOT_FOUND") notFound();
    if (m === "FORBIDDEN") return <div className="cd-container">Forbidden</div>;
    throw e;
  }
  const canManage = s.isSuperAdmin || s.permissions.includes("location:manage");
  async function updateAction(formData: FormData): Promise<void> {
    "use server";
    const raw = Object.fromEntries(formData.entries());
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) if (String(v).trim()) data[k] = String(v).trim();
    await updateLocation(params.id, data);
    redirect(`/admin/locations/${params.id}`);
  }
  async function statusAction(formData: FormData): Promise<void> {
    "use server";
    const status = String(formData.get("status") ?? "") as "ACTIVE" | "INACTIVE";
    await setLocationStatus(params.id, status);
    redirect(`/admin/locations/${params.id}`);
  }
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-serif">{loc.name} <Badge variant={loc.status === "ACTIVE" ? "info" : "neutral"}>{loc.status}</Badge></h1>
      <Card title="Details">
        <div className="text-sm space-y-1">
          <div>Code: {loc.code ?? "—"}</div>
          <div>City: {loc.city ?? "—"} {loc.state ?? ""}</div>
          <div>Address: {loc.addressLine1 ?? "—"}</div>
          <div>Phone: {loc.phone ?? "—"}</div>
          <div>Email: {loc.email ?? "—"}</div>
        </div>
      </Card>
      {canManage ? (
        <>
          <form action={updateAction} className="space-y-3">
            <h2 className="font-serif">Edit</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className="text-sm">Name</span><input name="name" defaultValue={loc.name} className="cd-input w-full" /></label>
              <label className="block"><span className="text-sm">City</span><input name="city" defaultValue={loc.city ?? ""} className="cd-input w-full" /></label>
              <label className="block md:col-span-2"><span className="text-sm">Address</span><input name="addressLine1" defaultValue={loc.addressLine1 ?? ""} className="cd-input w-full" /></label>
            </div>
            <button type="submit" className="cd-button cd-button-primary">Save</button>
          </form>
          <form action={statusAction} className="space-y-2">
            <h2 className="font-serif">Status</h2>
            <p className="cd-muted text-xs">Deactivation is preferred over deletion — UserRole assignments are Cascade-deleted, not broadened.</p>
            <div className="flex gap-2">
              <button name="status" value="ACTIVE" type="submit" className="cd-button cd-button-secondary">Activate</button>
              <button name="status" value="INACTIVE" type="submit" className="cd-button cd-button-secondary">Deactivate</button>
            </div>
          </form>
        </>
      ) : null}
    </div>
  );
}
