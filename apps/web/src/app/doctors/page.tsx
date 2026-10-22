import type { Metadata } from "next";
import Link from "next/link";
import { doctorProfile } from "@/lib/doctors";
import { PageHeading } from "@/components/ui";
import { Badge } from "@/components/ui";
import { SectionHeading } from "@/components/MarketingSections";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Doctors | CityDental",
  description: "Meet the dedicated dental professionals at CityDental in Etah and find the right care for your visit.",
  path: "/doctors",
});

export default function DoctorsPage() {
  const d = doctorProfile;

  return (
    <div className="doctors-page">
      <div className="premium-wrap"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Doctors" }]} /></div>
      <section className="doctors-hero premium-section premium-wrap" aria-labelledby="doctors-title">
        <SectionHeading eyebrow="Our team" title="Meet the professionals behind CityDental">
          <p>CityDental is home to dedicated dental professionals committed to patient-focused care.</p>
        </SectionHeading>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="doctor-list-title">
        <PageHeading title="Doctor Directory" description="Our practice is led by experienced professionals who prioritize your comfort and well-being." />
        <div className="doctor-listing">
          <Link href={`/doctors/${d.slug}`} className="doctor-listing-card">
            <div className="doctor-listing-visual">
              <span className="doctor-listing-initials">CD</span>
            </div>
            <div className="doctor-listing-info">
              <h2>{d.fullName}</h2>
              <p className="doctor-listing-role">{d.role}</p>
              <p className="doctor-listing-location">{d.location}</p>
              <Badge variant="info">{d.brand}</Badge>
            </div>
          </Link>
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="doctor-related-title">
        <div className="cd-page-heading" id="doctor-related-title">
          <h2>Plan your visit</h2>
          <p>Explore the care we provide and the practical information you may need before your appointment.</p>
        </div>
        <div className="cd-related">
          <Link href="/services">Explore our services</Link>
          <Link href="/patient-resources">Patient resources</Link>
          <Link href="/book-appointment">Book an appointment</Link>
        </div>
      </section>
    </div>
  );
}