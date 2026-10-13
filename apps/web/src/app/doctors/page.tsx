import type { Metadata } from "next";
import Link from "next/link";
import { doctorProfile } from "@/lib/doctors";
import { PageHeading } from "@/components/ui";
import { Badge } from "@/components/ui";
import { SectionHeading } from "@/components/MarketingSections";

export const metadata: Metadata = { title: "Doctors | CityDental", description: "Meet the dedicated dental professionals at CityDental in Etah." };

export default function DoctorsPage() {
  const d = doctorProfile;

  return (
    <div className="doctors-page">
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
    </div>
  );
}