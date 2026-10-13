import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Patient Resources | CityDental", description: "Patient resources and information to help you prepare for your visit at CityDental." };

export default function PatientResourcesPage() {
  return (
    <div className="patient-resources-page">
      <section className="premium-section premium-wrap" aria-labelledby="resources-title">
        <div className="cd-page-heading"><h1>Patient Resources</h1><p>Helpful information and resources to make your visit to CityDental as smooth as possible.</p></div>
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
    </div>
  );
}
