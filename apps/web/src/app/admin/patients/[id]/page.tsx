import { notFound, redirect } from "next/navigation";
import { getPatient, updatePatient } from "@/lib/patients";
import { getSession } from "@/lib/auth/session";
import { Card, Badge } from "@/components/ui";

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/patients");
  let patient;
  try {
    patient = await getPatient(params.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") notFound();
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
    await updatePatient(params.id, data);
    redirect(`/admin/patients/${params.id}`);
  }

  const canEdit = session.isSuperAdmin || session.permissions.includes("patient:update");

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-serif">
        {patient.firstName} {patient.lastName} <Badge variant="info">{patient.status}</Badge>
      </h1>
      <Card title="Details">
        <div className="grid gap-2 text-sm">
          <div>Email: {patient.email ?? "—"}</div>
          <div>Phone: {patient.phone ?? "—"}</div>
          <div>City: {patient.city ?? "—"}</div>
          <div>Patient number: {patient.patientNumber ?? "—"}</div>
          <div>Created: {new Date(patient.createdAt).toLocaleString()}</div>
        </div>
      </Card>
      {canEdit ? (
        <form action={action} className="space-y-4">
          <h2 className="font-serif text-lg">Edit</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm">First name</span>
              <input name="firstName" defaultValue={patient.firstName} className="cd-input w-full" />
            </label>
            <label className="block">
              <span className="text-sm">Last name</span>
              <input name="lastName" defaultValue={patient.lastName} className="cd-input w-full" />
            </label>
            <label className="block">
              <span className="text-sm">Phone</span>
              <input name="phone" defaultValue={patient.phone ?? ""} className="cd-input w-full" />
            </label>
            <label className="block">
              <span className="text-sm">City</span>
              <input name="city" defaultValue={patient.city ?? ""} className="cd-input w-full" />
            </label>
          </div>
          <button type="submit" className="cd-button cd-button-primary">
            Save
          </button>
        </form>
      ) : (
        <p className="cd-muted text-sm">No edit permission.</p>
      )}
    </div>
  );
}
