import { Suspense } from "react";
import type { Metadata } from "next";
import { BookAppointmentWizard } from "@/components/booking/BookAppointmentWizard";
import { LoadingState } from "@/components/ui";

export const metadata: Metadata = { title: "Book an appointment | CityDental" };

export default function BookAppointmentPage() {
  // useSearchParams requires a Suspense boundary during static prerendering.
  return <Suspense fallback={<LoadingState label="Preparing appointment options…" />}>
    <BookAppointmentWizard />
  </Suspense>;
}
