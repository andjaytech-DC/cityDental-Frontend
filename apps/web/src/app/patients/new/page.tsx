import Link from "next/link";
import type { Metadata } from "next";
import { PatientForm } from "@/components/clinical/PatientForm";
import { Card, PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Prepare patient details | City Dental" };
export default function NewPatientPage() {
  return <>
    <Link href="/patients" className="cd-button cd-button-ghost mb-4">Back to patients</Link>
    <PageHeading title="Prepare patient details" description="Contract-ready form. You can check field validation; saving is unavailable until the NestJS patient service is connected. Do not enter real patient information in this disconnected form." />
    <div className="max-w-3xl"><Card><PatientForm mode="create" /></Card></div>
  </>;
}
