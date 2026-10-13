import { Suspense } from "react";
import { BookAppointmentWizard } from "@/components/booking/BookAppointmentWizard";
import { LoadingState } from "@/components/ui";

export const metadata = { title: "Book appointment | CityDental" };
export default function AppointmentsBookPage() {
  return <Suspense fallback={<LoadingState label="Preparing booking wizard…" />}><BookAppointmentWizard /></Suspense>;
}
