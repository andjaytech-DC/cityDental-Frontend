import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { doctorProfile } from "@/lib/doctors";
import { Badge } from "@/components/ui";
import { SectionHeading } from "@/components/MarketingSections";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArrowUpRightIcon } from "@/components/icons";
import { siteImages } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Doctors | CityDental",
  description: "Meet the verified dental professional at CityDental in Etah and find the right care for your visit.",
  path: "/doctors",
});

export default function DoctorsPage() {
  const d = doctorProfile;

  return (
    <div className="doctors-page">
      <div className="premium-wrap"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Doctors" }]} /></div>
      <section className="doctors-hero premium-section premium-wrap" aria-labelledby="doctors-title">
        <SectionHeading id="doctors-title" eyebrow="Our doctor" title="A verified profile, clearly presented">
          <p>CityDental&rsquo;s public directory currently lists the verified profile of Dr. Kamlesh Kumar Yadav. More profiles will be added only when the clinic confirms them.</p>
        </SectionHeading>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="doctor-list-title">
        <div className="cd-page-heading" id="doctor-list-title">
          <h2>Doctor Directory</h2>
          <p>The verified profile currently available. Contact the clinic directly for any details not shown here.</p>
        </div>
        <div className="doctor-listing">
          <Link href={`/doctors/${d.slug}`} className="doctor-listing-card">
            <div className="doctor-listing-visual">
              <span className="doctor-listing-initials">KK</span>
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

      <section className="premium-section premium-wrap" aria-labelledby="doctors-photo-title">
        <div className="doctors-photo-band">
          <figure>
            <Image src={siteImages.consultation.src} alt={siteImages.consultation.alt} fill loading="lazy" sizes="(max-width: 900px) 92vw, 48vw" />
          </figure>
          <div className="doctors-photo-band-copy">
            <p className="eyebrow">Clear information</p>
            <h2 id="doctors-photo-title">Know who you are seeing.</h2>
            <p>We publish only the profiles, contact details and service information the clinic has confirmed. When something is not available, we say so.</p>
            <Link href="/about" className="text-link">Learn about our approach <ArrowUpRightIcon width={15} height={15} /></Link>
            <p className="doctors-photo-caption">{siteImages.consultation.caption}</p>
          </div>
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