import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug, serviceCategories } from "@/lib/services";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Badge, PageHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";

export async function generateStaticParams() {
  return serviceCategories.flatMap(category =>
    category.services.map(service => ({
      category: category.slug,
      service: service.slug,
    }))
  );
}

export function generateMetadata({ params }: { params: { category: string; service: string } }): Metadata {
  const result = getServiceBySlug(params.category, params.service);
  if (!result) return { title: "Service Not Found | CityDental", robots: { index: false, follow: false } };
  return pageMetadata({
    title: `${result.service.name} | CityDental`,
    description: result.service.description,
    path: `/services/${result.category.slug}/${result.service.slug}`,
  });
}

export default function ServicePage({ params }: { params: { category: string; service: string } }) {
  const result = getServiceBySlug(params.category, params.service);
  if (!result) notFound();

  const { category, service } = result;
  const relatedServices = category.services.filter(item => item.slug !== service.slug).slice(0, 4);

  return (
    <div className="service-detail-page">
      <div className="premium-wrap">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: category.name, href: `/services/${category.slug}` },
          { label: service.name },
        ]} />
      </div>

      <section className="service-detail-hero premium-section premium-wrap" aria-labelledby="service-title">
        <p className="eyebrow"><span className="eyebrow-line" /> {category.name}</p>
        <h1 id="service-title">{service.name}</h1>
        <p className="service-detail-intro">{service.description}</p>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="service-overview-title">
        <div className="cd-page-heading" id="service-overview-title"><h2>Overview</h2></div>
        <p className="service-detail-body">{service.longerDescription ?? service.description}</p>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="service-expectations-title">
        <div className="cd-page-heading" id="service-expectations-title"><h2>What patients can expect</h2></div>
        <p className="cd-muted" style={{ marginBottom: "1.5rem", maxWidth: "36rem" }}>General information about what patients may experience during a consultation and treatment process. Your dentist or oral health professional can determine whether this treatment is appropriate for you.</p>
        <div className="service-expectations">
          <div className="expectation-card">
            <h3>Initial consultation</h3>
            <p>Your experience begins with a thorough evaluation. Your dental professional will review your health history, discuss your concerns, and perform a careful examination to understand your individual needs.</p>
          </div>
          <div className="expectation-card">
            <h3>Personalized treatment planning</h3>
            <p>Based on the evaluation, your provider will outline a treatment plan tailored to your situation. Questions and preferences are encouraged at every stage, and you can expect clear explanations of each recommended step.</p>
          </div>
          <div className="expectation-card">
            <h3>Ongoing communication</h3>
            <p>Throughout your care, your team will keep you informed about what to expect and what options are available. Open communication helps ensure you feel comfortable and confident at every point.</p>
          </div>
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="service-related-title">
        <div className="cd-page-heading" id="service-related-title">
          <h2>Related care and next steps</h2>
          <p>Services in the same category, plus the information you may need before booking.</p>
        </div>
        <div className="cd-related">
          {relatedServices.map(item => (
            <Link key={item.slug} href={`/services/${category.slug}/${item.slug}`}>{item.name}</Link>
          ))}
          <Link href="/doctors">Meet our doctors</Link>
          <Link href="/patient-resources">Patient resources</Link>
          <Link href="/book-appointment">Book an appointment</Link>
        </div>
      </section>

      <section className="premium-cta premium-wrap" aria-labelledby="service-cta-title">
        <div>
          <p className="eyebrow" id="service-cta-title">Ready to get started?</p>
          <h2>Take the next step toward your oral health.</h2>
          <p>Your appointment request has not been submitted yet. Online booking will be connected to CityDental when the appointment service is available.</p>
        </div>
        <Link href="/book-appointment" className="cd-button cd-button-primary">Book an Appointment <span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}