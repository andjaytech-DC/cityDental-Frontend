import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactForm } from "@/components/ContactForm";
import { doctorProfile } from "@/lib/navigation";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact CityDental | Etah",
  description: "Get in touch with CityDental in Etah by phone, WhatsApp, email, or the website contact form.",
  path: "/contact",
});

export default function ContactPage() {
  const d = doctorProfile;
  const waUrl = "https://wa.me/919415192948";
  const telUrl = "tel:+919415192948";
  const mailUrl = `mailto:${d.contact.email}`;

  return (
    <div className="contact-page">
      <div className="premium-wrap">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      </div>
      <section className="contact-hero premium-section premium-wrap" aria-labelledby="contact-title">
        <p className="eyebrow"><span className="eyebrow-line" /> Contact</p>
        <h1 id="contact-title">Let&rsquo;s talk about your smile.</h1>
        <p className="contact-description">Whether you&rsquo;re visiting CityDental for the first time or continuing your care, we&rsquo;re here to help you understand your next step.</p>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="contact-details">
        <div className="cd-page-heading" id="contact-details"><h2>Visit CityDental</h2><p>Find CityDental in Etah and reach out using the contact details below.</p></div>
        <div className="contact-card">
          <div className="contact-info">
            <h2>{d.brand}</h2>
            <address>{d.contact.address}</address>
          </div>
          <div className="contact-actions">
            <a href={telUrl} className="contact-action">
              <span className="contact-action-label">Call</span>
              <span className="contact-action-value">{d.contact.phone}</span>
            </a>
            <a href={waUrl} className="contact-action" target="_blank" rel="noopener noreferrer">
              <span className="contact-action-label">WhatsApp</span>
              <span className="contact-action-value">{d.contact.whatsapp}</span>
            </a>
            <a href={mailUrl} className="contact-action">
              <span className="contact-action-label">Email</span>
              <span className="contact-action-value">{d.contact.email}</span>
            </a>
          </div>
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="contact-form-title">
        <div className="cd-page-heading" id="contact-form-title">
          <h2>Send a message</h2>
          <p>Prefer to write? Use the form below and the clinic will reply by email. Messages are delivered server-side through the practice&rsquo;s configured mailbox.</p>
        </div>
        <ContactForm />
      </section>

      <section className="premium-cta premium-wrap" aria-labelledby="contact-cta-title">
        <div>
          <p className="eyebrow" id="contact-cta-title">Ready to get started?</p>
          <h2>Book an appointment with CityDental.</h2>
          <p>Your appointment request has not been submitted yet. Online booking will be connected to CityDental when the appointment service is available.</p>
        </div>
        <Link href="/book-appointment" className="cd-button cd-button-primary">Book an Appointment <span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}
