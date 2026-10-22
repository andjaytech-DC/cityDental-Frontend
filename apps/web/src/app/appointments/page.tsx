import type { Metadata } from "next";
import { AppointmentWorkspace } from "@/components/clinical/WorkspaceLists";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Appointments | City Dental",
  description: "Your CityDental appointment workspace. Sign in to view appointment information.",
  path: "/appointments",
  noIndex: true,
});

export default function AppointmentsPage() {
  return <AppointmentWorkspace state={{ status: "unavailable" }} />;
}
