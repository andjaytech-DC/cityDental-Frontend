import { notFound, redirect } from "next/navigation";
import { getDoctor, updateDoctor } from "@/lib/admin-doctors";
import { getSession } from "@/lib/auth/session";
import { Card, Badge } from "@/components/ui";

export default async function DoctorDetail({ params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin/doctors");
  let doctor;
  try {
    doctor = await getDoctor(params.id);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "NOT_FOUND") notFound();
    throw e;
  }
  async function action(formData: FormData): Promise<void> {
    "use server";
    const raw = Object.fromEntries(formData.entries());
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      const s = String(v).trim();
      data[k] = s === "" ? undefined : s;
    }
    if (data.specialties !== undefined) {
      const arr = String(data.specialties)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      data.specialties = arr;
    }
    await updateDoctor(params.id, data);
    redirect(`/admin/doctors/${params.id}`);
  }
  const canEdit = s.isSuperAdmin || s.permissions.includes("doctor:manage");
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-serif">
        {doctor.firstName} {doctor.lastName} <Badge>{doctor.status}</Badge>
      </h1>
      <Card title="Details">
        <div className="text-sm space-y-1">
          <div>Email: {doctor.email ?? "—"}</div>
          <div>Phone: {doctor.phone ?? "—"}</div>
          <div>Specialties: {doctor.specialties.map((x) => x.name).join(", ") || "—"}</div>
        </div>
      </Card>
      {canEdit ? (
        <form action={action} className="space-y-4">
          <h2 className="font-serif">Edit</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm">First name</span>
              <input name="firstName" defaultValue={doctor.firstName} className="cd-input w-full" />
            </label>
            <label className="block">
              <span className="text-sm">Last name</span>
              <input name="lastName" defaultValue={doctor.lastName} className="cd-input w-full" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm">Specialties (comma-separated, replaces existing)</span>
              <input name="specialties" defaultValue={doctor.specialties.map((x) => x.name).join(", ")} className="cd-input w-full" />
            </label>
          </div>
          <button type="submit" className="cd-button cd-button-primary">
            Save
          </button>
        </form>
      ) : null}
    </div>
  );
}
