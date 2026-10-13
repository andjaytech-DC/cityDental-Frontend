import type { Metadata } from "next";
import { AppointmentWorkspace } from "@/components/clinical/WorkspaceLists";

export const metadata: Metadata = { title: "Appointments | City Dental" };

export default function AppointmentsPage() {
  return <AppointmentWorkspace state={{ status: "unavailable" }} />;
}
