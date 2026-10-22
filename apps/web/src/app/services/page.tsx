import type { Metadata } from "next";
import Link from "next/link";
import { serviceCategories } from "@/lib/services";
import { CategoryCard } from "@/components/ServicesContent";
import { PageHeading } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/MarketingSections";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Services | CityDental",
  description: "Explore CityDental's comprehensive service categories including oral surgery, implants & bone grafting, and specialty services in Etah.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <div className="services-page">
      <div className="premium-wrap"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Services" }]} /></div>
      <section className="services-hero premium-section premium-wrap" aria-labelledby="services-hero-title">
        <p className="eyebrow"><span className="eyebrow-line" /> CityDental Services</p>
        <h1 id="services-hero-title">Comprehensive care,<br /><em>every step of the way.</em></h1>
        <p className="hero-description">From surgical precision to targeted specialty treatments, CityDental offers a range of services designed to support your oral health journey. Browse the categories below to learn more about what we offer.</p>
        <div className="hero-actions">
          <a href="#categories" className="cd-button cd-button-primary">Explore Services <span aria-hidden="true">↓</span></a>
          <a href="/book-appointment" className="cd-button cd-button-secondary">Book an Appointment <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <section id="categories" className="premium-section premium-wrap" aria-labelledby="categories-title">
        <PageHeading title="Our Service Categories" description="Each category represents a focused area of dental care. Click a category to explore the services within it." />
        <div className="service-category-grid">
          {serviceCategories.map(category => (
            <CategoryCard key={category.slug} category={category} href={`/services/${category.slug}`} />
          ))}
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="quick-services-title">
        <SectionHeading eyebrow="At a glance" title="Services across all categories">
          <p>A quick overview of the treatments and procedures available within CityDental&#39;s service catalog.</p>
          <a href="/services" className="text-link">View all categories ↗</a>
        </SectionHeading>
        <div className="service-quick-grid">
          {serviceCategories.map(category =>
            category.services.slice(0, 2).map(service => (
              <a key={service.slug} href={`/services/${category.slug}/${service.slug}`} className="service-quick-card">
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <span className="service-quick-category">{category.name}</span>
              </a>
            ))
          )}
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="services-related-title">
        <div className="cd-page-heading" id="services-related-title">
          <h2>Next steps</h2>
          <p>Meet the team, read patient information, or request an appointment.</p>
        </div>
        <div className="cd-related">
          <Link href="/doctors">Meet our doctors</Link>
          <Link href="/patient-resources">Patient resources</Link>
          <Link href="/book-appointment">Book an appointment</Link>
          <Link href="/contact">Contact CityDental</Link>
        </div>
      </section>
    </div>
  );
}