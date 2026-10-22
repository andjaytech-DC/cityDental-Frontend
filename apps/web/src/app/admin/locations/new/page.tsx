import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createLocation } from "@/lib/locations";

export const metadata = { title: "New Location | CityDental Admin" };

export default async function NewLocationPage() {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin/locations/new");
  if (!s.isSuperAdmin && !s.permissions.includes("location:manage")) return <div className="cd-container">Forbidden</div>;
  async function action(formData: FormData): Promise<void> {
    "use server";
    const raw = Object.fromEntries(formData.entries());
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) if (String(v).trim()) data[k] = String(v).trim();
    const loc = await createLocation(data);
    redirect(`/admin/locations/${loc.id}`);
  }
  return (
    <form action={action} className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-serif">New location</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block"><span className="text-sm">Name *</span><input name="name" required className="cd-input w-full" /></label>
        <label className="block"><span className="text-sm">Code</span><input name="code" className="cd-input w-full" placeholder="main" /></label>
        <label className="block md:col-span-2"><span className="text-sm">Address</span><input name="addressLine1" className="cd-input w-full" /></label>
        <label className="block"><span className="text-sm">City</span><input name="city" className="cd-input w-full" /></label>
        <label className="block"><span className="text-sm">State</span><input name="state" className="cd-input w-full" /></label>
        <label className="block"><span className="text-sm">Phone</span><input name="phone" className="cd-input w-full" /></label>
        <label className="block"><span className="text-sm">Email</span><input name="email" type="email" className="cd-input w-full" /></label>
      </div>
      <button type="submit" className="cd-button cd-button-primary">Create location</button>
    </form>
  );
}
