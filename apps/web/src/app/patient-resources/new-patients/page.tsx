import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Patients | CityDental", description: "Information for new patients visiting CityDental for the first time." };

export default function NewPatientsPage() {
  return (
    <div className="patient-resource-detail">
      <section className="premium-section premium-wrap">
        <div className="cd-page-heading"><h1>New Patients</h1><p>Everything you need to know about your first visit to CityDental.</p></div>
        <div className="resource-content">
          <p>We look forward to welcoming you to CityDental. Your first visit is an opportunity to meet our team, discuss your concerns, and plan your path to a healthy smile.</p>
          <h2>What to Bring</h2>
          <ul>
            <li>A valid photo ID</li>
            <li>Your dental insurance information, if applicable</li>
            <li>Any previous dental records or X-rays</li>
            <li>A list of current medications</li>
          </ul>
          <h2>What to Expect</h2>
          <p>Your first visit typically includes a consultation, examination, and discussion of treatment options. We will take the time to answer all your questions and ensure you feel comfortable.</p>
          <p>Please arrive a few minutes early to complete any necessary paperwork.</p>
          <div className="resource-cta">
            <a href="/book-appointment" className="cd-button cd-button-primary">Book an Appointment <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>
    </div>
  );
}
