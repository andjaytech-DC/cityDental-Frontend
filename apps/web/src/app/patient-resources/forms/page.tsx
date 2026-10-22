import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Patient Forms | CityDental",
  description: "Review the patient forms and paperwork you may need before your visit to CityDental in Etah.",
  path: "/patient-resources/forms",
});

export default function FormsPage() {
  return (
    <div className="patient-resource-detail">
      <div className="premium-wrap">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Patient Resources", href: "/patient-resources" }, { label: "Patient Forms" }]} />
      </div>
      <section className="premium-section premium-wrap">
        <div className="cd-page-heading"><h1>Patient Forms</h1><p>Find the forms and paperwork you may need for your appointment.</p></div>
        <div className="resource-content">
          <p>Below are the available patient forms. Please print and complete them before your visit to help streamline your appointment.</p>
          <div className="resource-list">
            <div className="resource-item">
              <h3>New Patient Registration Form</h3>
              <p>Complete this form if you are visiting CityDental for the first time.</p>
            </div>
            <div className="resource-item">
              <h3>Medical History Form</h3>
              <p>Provide details about your medical history and current medications.</p>
            </div>
            <div className="resource-item">
              <h3>Consent and Privacy Policy</h3>
              <p>Review and sign the consent form and privacy policy.</p>
            </div>
          </div>
          <p>All forms will be available for download once the practice supplies them.</p>
        </div>
      </section>
    </div>
  );
}
