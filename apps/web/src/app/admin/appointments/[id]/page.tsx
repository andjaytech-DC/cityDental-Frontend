import { notFound, redirect } from "next/navigation";
import { getAppointment, updateAppointment } from "@/lib/appointments";
import { getSession } from "@/lib/auth/session";
import { Card } from "@/components/ui";

export default async function AppointmentDetail({ params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin/appointments");
  let appt;
  try {
    appt = await getAppointment(params.id);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "NOT_FOUND") notFound();
    throw e;
  }
  const canUpdate = s.isSuperAdmin || s.permissions.includes("appointment:update");
  async function action(formData: FormData): Promise<void> {
    "use server";
    const status = String(formData.get("status") ?? "");
    await updateAppointment(params.id, status ? { status } : {});
    redirect(`/admin/appointments/${params.id}`);
  }
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-serif">Appointment</h1>
      <Card title="Details">
        <div className="text-sm space-y-1">
          <div>
            Patient: {appt.patient.firstName} {appt.patient.lastName}
          </div>
          <div>Doctor: {appt.doctor ? `${appt.doctor.firstName} ${appt.doctor.lastName}` : "—"}</div>
          <div>Location: {appt.location.name}</div>
          <div>When: {new Date(appt.scheduledStart).toLocaleString()} — {new Date(appt.scheduledEnd).toLocaleString()}</div>
          <div>Status: {appt.status}</div>
          <div>Reason: {appt.reason ?? "—"}</div>
        </div>
      </Card>
      {canUpdate ? (
        <form action={action} className="space-y-3">
          <label className="block">
            <span className="text-sm">Update status (enum only)</span>
            <select name="status" defaultValue={appt.status} className="cd-input w-full">
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CHECKED_IN">CHECKED_IN</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="NO_SHOW">NO_SHOW</option>
            </select>
          </label>
          <button type="submit" className="cd-button cd-button-primary">
            Update status
          </button>
        </form>
      ) : null}
    </div>
  );
}
