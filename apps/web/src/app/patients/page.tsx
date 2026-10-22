import Link from "next/link";
import type { Metadata } from "next";
import type { PatientDto } from "@citydental/types";
import { PatientWorkspace, type WorkspaceState } from "@/components/clinical/WorkspaceLists";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Patients | City Dental",
  description: "CityDental patient workspace. Sign in to view patient records and administration.",
  path: "/patients",
  noIndex: true,
});

/**
 * Contract-ready: the patient DTO/list contract exists, but no NestJS
 * patients endpoint is available yet, so this page renders the explicit
 * unavailable state. No data is fetched or fabricated here.
 */
const state: WorkspaceState<PatientDto> = { status: "unavailable" };

export default function PatientsPage() {
  return <><PatientWorkspace state={state} /><Link href="/patients/new" className="cd-button cd-button-secondary mt-6">Prepare patient details</Link></>;
}
