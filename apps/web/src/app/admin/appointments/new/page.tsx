import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createAppointment } from "@/lib/appointments";
import { prisma } from "@/lib/db";

export const metadata = { title: "New Appointment | CityDental Admin" };

export default async function NewAppointmentPage() {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin/appointments/new");
  if (!s.isSuperAdmin && !s.permissions.includes("appointment:create")) return <div>Forbidden</div>;
  const [patients, doctors, locations] = await Promise.all([
    prisma.patient.findMany({ where: { organizationId: s.organizationId }, take: 50, orderBy: { createdAt: "desc" } }),
    prisma.doctor.findMany({ where: { organizationId: s.organizationId }, take: 50, orderBy: { createdAt: "desc" } }),
    prisma.location.findMany({ where: { organizationId: s.organizationId }, take: 20 }),
  ]);

  async function action(formData: FormData): Promise<void> {
    "use server";
    const raw = Object.fromEntries(formData.entries());
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) data[k] = String(v);
    await createAppointment({
      patientId: data.patientId,
      doctorId: data.doctorId || undefined,
      locationId: data.locationId,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      reason: data.reason || undefined,
    });
    redirect("/admin/appointments");
  }

  return (
    <form action={action} className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-serif">New appointment</h1>
      <label className="block">
        <span className="text-sm">Patient *</span>
        <select name="patientId" required className="cd-input w-full">
          <option value="">Select</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.firstName} {p.lastName}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm">Doctor</span>
        <select name="doctorId" className="cd-input w-full">
          <option value="">Unassigned</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.firstName} {d.lastName}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm">Location *</span>
        <select name="locationId" required className="cd-input w-full">
          <option value="">Select</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm">Start *</span>
        <input name="scheduledStart" type="datetime-local" required className="cd-input w-full" />
      </label>
      <label className="block">
        <span className="text-sm">End *</span>
        <input name="scheduledEnd" type="datetime-local" required className="cd-input w-full" />
      </label>
      <label className="block">
        <span className="text-sm">Reason</span>
        <input name="reason" className="cd-input w-full" />
      </label>
      <button type="submit" className="cd-button cd-button-primary">
        Create
      </button>
    </form>
  );
}
