import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { getDoctorBySlug, doctorSlugs } from "@/lib/doctors";
import { dentistPageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return doctorSlugs.map(slug => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const doctor = getDoctorBySlug(params.slug);
  if (!doctor) return { title: "Doctor not found | CityDental", robots: { index: false, follow: false } };
  return pageMetadata({
    title: `${doctor.fullName} | CityDental Etah`,
    description: `${doctor.fullName}, ${doctor.role} at CityDental in Etah. Contact CityDental for appointments and service information.`,
    path: `/doctors/${doctor.slug}`,
  });
}

export default function DoctorPage({ params }: { params: { slug: string } }) {
  const d = getDoctorBySlug(params.slug);
  if (!d) notFound();

  const waUrl = "https://wa.me/919415192948";
  const telUrl = "tel:+919415192948";
  const mailUrl = `mailto:${d.contact.email}`;

  return (
    <div className="doctor-profile-page">
      <JsonLd data={dentistPageSchema()} />
      <div className="premium-wrap">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Doctors", href: "/doctors" }, { label: d.fullName }]} />
      </div>
      <section className="doctor-hero premium-section premium-wrap" aria-labelledby="doctor-name">
        <div className="doctor-hero-layout">
          <div className="doctor-visual">
            <div className="doctor-placeholder" role="img" aria-label={`Portrait placeholder for ${d.fullName}`}>
              <span className="doctor-placeholder-initials">KK</span>
              <div className="doctor-placeholder-accent" />
            </div>
          </div>
          <div className="doctor-info">
            <p className="eyebrow"><span className="eyebrow-line" /> {d.brand}</p>
            <h1 id="doctor-name">{d.fullName}</h1>
            <p className="doctor-role">{d.role}</p>
            <p className="doctor-intro">{d.introduction}</p>
            <div className="doctor-cta-actions">
              <Link href="/book-appointment" className="cd-button cd-button-primary">Book an Appointment <span aria-hidden="true">↗</span></Link>
              <a href={telUrl} className="cd-button cd-button-secondary">Call CityDental</a>
              <a href={waUrl} className="cd-button cd-button-outline" target="_blank" rel="noopener noreferrer">WhatsApp CityDental</a>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="doctor-profile-title">
        <PageHeading title="Professional Profile" description="Detailed professional credentials will be added once supplied and verified by the practice." />
        <div className="doctor-profile-card">
          <p>{d.fullName} is a dedicated dental professional providing patient-focused care at CityDental in Etah. The practice values clear communication, comfort, and individualized treatment planning for every patient.</p>
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="doctor-services-title">
        <PageHeading title="Services Available at CityDental" description="CityDental offers a range of dental services across multiple specialty categories." />
        <div className="doctor-services-grid">
          <Link href="/services/oral-surgery" className="doctor-service-card">
            <h3>Oral Surgery</h3>
            <p>Surgical care for the mouth, jaws, and face.</p>
            <Badge variant="info">11 services</Badge>
          </Link>
          <Link href="/services/implants-bone-grafting" className="doctor-service-card">
            <h3>Implants & Bone Grafting</h3>
            <p>Advanced procedures to rebuild and strengthen the jawbone.</p>
            <Badge variant="info">3 services</Badge>
          </Link>
          <Link href="/services/specialty-services" className="doctor-service-card">
            <h3>Specialty Services</h3>
            <p>Targeted therapeutic and restorative services.</p>
            <Badge variant="info">7 services</Badge>
          </Link>
        </div>
        <p className="mt-6"><Link href="/services" className="text-link">View the complete service catalog ↗</Link></p>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="doctor-philosophy-title">
        <div className="cd-page-heading" id="doctor-philosophy-title"><h2>A Patient-Centered Approach</h2><p>CityDental is committed to listening to patients, explaining treatment options clearly, and providing comfortable, individualized care.</p></div>
        <p>Every patient deserves to feel informed and at ease. CityDental prioritizes clear communication, personalized treatment planning, and a comfortable experience from the first visit onward.</p>
      </section>

      <section className="doctor-contact-section premium-section premium-wrap" aria-labelledby="doctor-contact-title">
        <PageHeading title="Contact CityDental" description="Reach out to CityDental in Etah using the contact details below." />
        <div className="doctor-contact-card">
          <div className="contact-brand">
            <h2>{d.brand}</h2>
            <p>{d.contact.address}</p>
          </div>
          <div className="contact-links">
            <a href={telUrl} className="contact-item">
              <span className="contact-label">Call</span>
              <span className="contact-value">{d.contact.phone}</span>
            </a>
            <a href={waUrl} className="contact-item" target="_blank" rel="noopener noreferrer">
              <span className="contact-label">WhatsApp</span>
              <span className="contact-value">{d.contact.whatsapp}</span>
            </a>
            <a href={mailUrl} className="contact-item">
              <span className="contact-label">Email</span>
              <span className="contact-value">{d.contact.email}</span>
            </a>
          </div>
        </div>
      </section>

      <section className="premium-cta premium-wrap" aria-labelledby="doctor-final-cta-title">
        <div>
          <p className="eyebrow" id="doctor-final-cta-title">Ready to take the next step?</p>
          <h2>Book an appointment with CityDental.</h2>
          <p>Your appointment request has not been submitted yet. Online booking will be connected to CityDental when the appointment service is available.</p>
        </div>
        <Link href="/book-appointment" className="cd-button cd-button-primary">Book an Appointment <span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}
