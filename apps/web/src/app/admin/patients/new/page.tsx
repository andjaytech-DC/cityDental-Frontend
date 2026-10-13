import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createPatient } from "@/lib/patients";
import { CreatePatientForm } from "./form";

export default async function NewPatientPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/patients/new");
  if (!session.isSuperAdmin && !session.permissions.includes("patient:create")) {
    return <div className="cd-container">Forbidden — missing patient:create</div>;
  }
  async function action(formData: FormData): Promise<void> {
    "use server";
    const raw = Object.fromEntries(formData.entries());
    // coerce empty to undefined handled by validation
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      const s = String(v).trim();
      data[k] = s === "" ? undefined : s;
    }
    try {
      const created = await createPatient(data);
      redirect(`/admin/patients/${created.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // surface as query param via redirect with error page — simpler: throw
      throw new Error(msg);
    }
  }
  return <CreatePatientForm action={action} />;
}
