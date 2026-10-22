import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { faqs } from "@/lib/faqs";
import { faqSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Frequently Asked Questions | CityDental",
  description: "Answers to common questions about visiting CityDental, including referrals, what to bring, booking and payment.",
  path: "/patient-resources/faqs",
});

export default function FAQsPage() {
  return (
    <div className="patient-resource-detail">
      <JsonLd data={faqSchema(faqs)} />
      <div className="premium-wrap">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Patient Resources", href: "/patient-resources" }, { label: "Frequently Asked Questions" }]} />
      </div>
      <section className="premium-section premium-wrap">
        <div className="cd-page-heading"><h1>Frequently Asked Questions</h1><p>Common questions answered to help you feel confident and informed.</p></div>
        <div className="resource-content">
          <p>Here are answers to some of the most common questions we receive at CityDental.</p>
          <div className="faq-list">
            {faqs.map(item => (
              <details key={item.question} className="faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="faq-related-title">
        <div className="cd-page-heading" id="faq-related-title">
          <h2>Still have a question?</h2>
          <p>Contact the clinic directly, or continue with the information below.</p>
        </div>
        <div className="cd-related">
          <Link href="/contact">Contact CityDental</Link>
          <Link href="/book-appointment">Book an appointment</Link>
          <Link href="/patient-resources/new-patients">New patient information</Link>
          <Link href="/patient-resources/what-to-expect">What to expect</Link>
        </div>
      </section>
    </div>
  );
}
