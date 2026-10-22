import { Suspense } from "react";
import type { Metadata } from "next";
import { BookAppointmentWizard } from "@/components/booking/BookAppointmentWizard";
import { LoadingState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Book appointment | CityDental",
  description: "Request an appointment with CityDental in Etah.",
  // Alias of /book-appointment: keep a single canonical booking URL.
  alternates: { canonical: "/book-appointment" },
};
export default function AppointmentsBookPage() {
  return <Suspense fallback={<LoadingState label="Preparing booking wizard…" />}><BookAppointmentWizard /></Suspense>;
}
