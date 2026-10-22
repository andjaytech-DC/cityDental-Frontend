import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createDoctor } from "@/lib/admin-doctors";

export const metadata = { title: "New Doctor | CityDental Admin" };

export default async function NewDoctorPage() {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin/doctors/new");
  if (!s.isSuperAdmin && !s.permissions.includes("doctor:manage")) return <div>Forbidden</div>;

  async function action(formData: FormData): Promise<void> {
    "use server";
    const raw = Object.fromEntries(formData.entries());
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      const s = String(v).trim();
      data[k] = s === "" ? undefined : s;
    }
    if (data.specialties) {
      const arr = String(data.specialties)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      data.specialties = arr;
    } else data.specialties = [];
    const created = await createDoctor(data);
    redirect(`/admin/doctors/${created.id}`);
  }

  return (
    <form action={action} className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-serif">New doctor</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm">First name *</span>
          <input name="firstName" required className="cd-input w-full" />
        </label>
        <label className="block">
          <span className="text-sm">Last name *</span>
          <input name="lastName" required className="cd-input w-full" />
        </label>
        <label className="block">
          <span className="text-sm">Email</span>
          <input name="email" className="cd-input w-full" type="email" />
        </label>
        <label className="block">
          <span className="text-sm">Phone</span>
          <input name="phone" className="cd-input w-full" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm">Specialties (comma-separated)</span>
          <input name="specialties" className="cd-input w-full" placeholder="Orthodontics, Endodontics" />
        </label>
      </div>
      <button type="submit" className="cd-button cd-button-primary">
        Create doctor
      </button>
    </form>
  );
}
