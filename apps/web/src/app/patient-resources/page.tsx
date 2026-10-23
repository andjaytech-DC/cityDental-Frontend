import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Patient Resources | CityDental",
  description: "Patient resources and information to help you prepare for your visit at CityDental, including new-patient guidance and FAQs.",
  path: "/patient-resources",
});

export default function PatientResourcesPage() {
  return (
    <div className="patient-resources-page">
      <div className="premium-wrap">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Patient Resources" }]} />
      </div>
      <section className="premium-section premium-wrap" aria-labelledby="resources-title">
        <div className="cd-page-heading" id="resources-title"><h1>Patient Resources</h1><p>Helpful information and resources to make your visit to CityDental as smooth as possible.</p></div>
        <div className="resource-grid">
          <Link href="/patient-resources/new-patients" className="resource-card">
            <h3>New Patients</h3>
            <p>Everything you need to know about your first visit to CityDental.</p>
          </Link>
          <Link href="/patient-resources/forms" className="resource-card">
            <h3>Patient Forms</h3>
            <p>Find the forms and paperwork you may need for your appointment.</p>
          </Link>
          <Link href="/patient-resources/what-to-expect" className="resource-card">
            <h3>What to Expect</h3>
            <p>A general overview of what happens during a typical visit.</p>
          </Link>
          <Link href="/patient-resources/faqs" className="resource-card">
            <h3>Frequently Asked Questions</h3>
            <p>Common questions answered to help you feel confident and informed.</p>
          </Link>
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="resources-related-title">
        <div className="cd-page-heading" id="resources-related-title">
          <h2>Continue planning</h2>
          <p>Explore services, meet the doctor, or get in touch with the clinic.</p>
        </div>
        <div className="cd-related">
          <Link href="/services">Explore our services</Link>
          <Link href="/doctors">Meet our doctor</Link>
          <Link href="/book-appointment">Book an appointment</Link>
          <Link href="/contact">Contact CityDental</Link>
        </div>
      </section>
    </div>
  );
}
