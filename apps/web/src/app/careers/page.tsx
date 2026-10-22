import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CareersForm } from "@/components/CareersForm";
import { SectionHeading } from "@/components/MarketingSections";
import { doctorProfile } from "@/lib/navigation";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Careers at City Dental | Etah",
  description:
    "City Dental in Etah is inviting applications from dentists, dental support staff and receptionists. Explore hiring interests and apply online.",
  path: "/careers",
});

const hiringCategories = [
  {
    title: "Doctors and Dental Professionals",
    symbol: "01",
    roles: [
      "Dentist / Dental Surgeon",
      "Other qualified dental professionals, according to current staffing requirements",
    ],
  },
  {
    title: "Dental Support Staff",
    symbol: "02",
    roles: ["Dental Assistant", "Chairside Assistant", "Clinic Support Staff"],
  },
  {
    title: "Receptionist and Front Desk",
    symbol: "03",
    roles: ["Receptionist", "Front Desk Executive", "Patient Coordination and Appointment Scheduling"],
  },
] as const;

export default function CareersPage() {
  const contact = doctorProfile.contact;
  const telUrl = "tel:+919415192948";
  const waUrl = "https://wa.me/919415192948";
  const mailUrl = `mailto:${contact.email}`;

  return (
    <div className="careers-page">
      <div className="premium-wrap">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Careers" }]} />
      </div>

      <section className="about-hero premium-section premium-wrap" aria-labelledby="careers-title">
        <p className="eyebrow"><span className="eyebrow-line" /> Careers</p>
        <h1 id="careers-title">Build Your Career <br /><em>with City Dental</em></h1>
        <p className="about-description">
          City Dental welcomes dedicated, responsible and patient-focused professionals who want to contribute to a
          friendly, organized and professional dental care environment. Explore our current opportunities and apply to
          join our team.
        </p>
        <div className="hero-actions">
          <a href="#openings" className="cd-button cd-button-primary">Explore opportunities <span aria-hidden="true">↗</span></a>
          <a href="#apply" className="text-link">Apply now</a>
        </div>
      </section>

      <section id="openings" className="premium-section premium-wrap" aria-labelledby="openings-title">
        <div className="careers-notice" role="note">
          <strong>Hiring interests, not confirmed vacancies.</strong>
          <p>
            These categories show where City Dental is inviting applications. The clinic activates individual roles
            when a position is approved. Salary, experience requirements, qualifications and employment terms are
            published only when supplied and confirmed by the clinic.
          </p>
        </div>

        <SectionHeading eyebrow="Opportunities" title="Where you could join us">
          <p>
            We are gathering interest across three areas of the practice. Select the position that best matches your
            background in the application form below.
          </p>
        </SectionHeading>

        <div className="premium-resource-grid">
          {hiringCategories.map(category => (
            <article key={category.title} className="premium-resource careers-card">
              <span className="resource-symbol" aria-hidden="true">{category.symbol}</span>
              <h3>{category.title}</h3>
              <span className="availability">Hiring interest</span>
              <ul className="careers-role-list">
                {category.roles.map(role => (
                  <li key={role}>{role}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="environment-title">
        <SectionHeading eyebrow="Working here" title="A friendly, organised place to care">
          <p>
            City Dental looks for people who bring care, responsibility and clear communication to their work. The
            practice aims to maintain a calm and professional environment where patients and colleagues are treated
            with respect.
          </p>
        </SectionHeading>

        <div className="careers-environment">
          <div className="careers-environment-copy">
            <p>
              Whether you work chairside, at reception or as a dental professional, your work supports patients at
              the point of care. We value reliable teamwork, thoughtful communication and a patient-first approach.
            </p>
            <p>
              This page describes the working environment and the categories we are interested in. It does not imply
              that every category is currently open, and it does not publish benefits, hours, pay or employment terms
              that the clinic has not confirmed.
            </p>
          </div>
          <div className="careers-environment-aside">
            <h3>What we value</h3>
            <ul>
              <li>Patient-focused care</li>
              <li>Responsibility and reliability</li>
              <li>Respectful, clear communication</li>
              <li>A professional and organised approach</li>
            </ul>
            <p className="careers-small">
              Specific hours, benefits and employment terms are shared only when the clinic confirms a role.
            </p>
          </div>
        </div>
      </section>

      <section id="apply" className="premium-section premium-wrap" aria-labelledby="apply-title">
        <div className="cd-page-heading" id="apply-title">
          <h2>Apply to join City Dental</h2>
          <p>
            Share your details and the role you are interested in. Applications are sent to the clinic for review. If
            a suitable role is approved, the clinic will contact you directly.
          </p>
        </div>
        <CareersForm />
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="recruitment-contact-title">
        <div className="contact-card">
          <div className="contact-info">
            <h2 id="recruitment-contact-title">Recruitment enquiries</h2>
            <p className="about-description">
              Prefer to apply by email? Send your CV and a short introduction to the clinic. You can also call or
              message for a recruitment enquiry.
            </p>
          </div>
          <div className="contact-actions">
            <a href={mailUrl} className="contact-action">
              <span className="contact-action-label">Email</span>
              <span className="contact-action-value">{contact.email}</span>
            </a>
            <a href={telUrl} className="contact-action">
              <span className="contact-action-label">Call</span>
              <span className="contact-action-value">{contact.phone}</span>
            </a>
            <a href={waUrl} className="contact-action" target="_blank" rel="noopener noreferrer">
              <span className="contact-action-label">WhatsApp</span>
              <span className="contact-action-value">{contact.whatsapp}</span>
            </a>
          </div>
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="careers-related-title">
        <div className="cd-page-heading">
          <h2 id="careers-related-title">Learn more about City Dental</h2>
          <p>Find out how the practice works and how to reach the team.</p>
        </div>
        <div className="cd-related">
          <Link href="/about">About City Dental <span aria-hidden="true">→</span></Link>
          <Link href="/doctors">Meet our doctors <span aria-hidden="true">→</span></Link>
          <Link href="/contact">Contact the clinic <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </div>
  );
}
