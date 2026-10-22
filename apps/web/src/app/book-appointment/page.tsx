import { Suspense } from "react";
import type { Metadata } from "next";
import { BookAppointmentWizard } from "@/components/booking/BookAppointmentWizard";
import { LoadingState } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Book an appointment | CityDental",
  description: "Request an appointment with CityDental in Etah. Choose a service, doctor and time, then confirm your details.",
  path: "/book-appointment",
});

export default function BookAppointmentPage() {
  // useSearchParams requires a Suspense boundary during static prerendering.
  return <Suspense fallback={<LoadingState label="Preparing appointment options…" />}>
    <BookAppointmentWizard />
  </Suspense>;
}
