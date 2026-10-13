import type { Metadata } from "next";

export const metadata: Metadata = { title: "Frequently Asked Questions | CityDental", description: "Common questions answered to help you feel confident and informed about CityDental." };

export default function FAQsPage() {
  return (
    <div className="patient-resource-detail">
      <section className="premium-section premium-wrap">
        <div className="cd-page-heading"><h1>Frequently Asked Questions</h1><p>Common questions answered to help you feel confident and informed.</p></div>
        <div className="resource-content">
          <p>Here are answers to some of the most common questions we receive at CityDental.</p>
          <div className="faq-list">
            <details className="faq-item">
              <summary>When should I schedule my first dental visit?</summary>
              <p>We recommend visiting CityDental as soon as you feel there is a concern or for a routine check-up. Your first visit will include a consultation and examination.</p>
            </details>
            <details className="faq-item">
              <summary>Do I need a referral to see a specialist?</summary>
              <p>While some services may require a referral, many are available directly at CityDental. Contact us to confirm requirements for your specific needs.</p>
            </details>
            <details className="faq-item">
              <summary>What should I bring to my first appointment?</summary>
              <p>Bring a valid photo ID, your dental insurance information if applicable, any previous dental records, and a list of current medications.</p>
            </details>
            <details className="faq-item">
              <summary>How do I book an appointment?</summary>
              <p>You can book an appointment online through our booking system or contact CityDental directly by phone or WhatsApp.</p>
            </details>
            <details className="faq-item">
              <summary>What payment methods do you accept?</summary>
              <p>Payment methods will be confirmed once the practice supplies the information. Please contact CityDental directly for details.</p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
