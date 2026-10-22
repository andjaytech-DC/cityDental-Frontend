import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/MarketingSections";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About CityDental | Etah",
  description: "Learn about CityDental's patient-first approach to dental care in Etah, from the first conversation to ongoing treatment.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="premium-wrap"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} /></div>
      <section className="about-hero premium-section premium-wrap" aria-labelledby="about-title">
        <p className="eyebrow"><span className="eyebrow-line" /> About CityDental</p>
        <h1 id="about-title">A thoughtful practice,<br /><em>for every smile.</em></h1>
        <p className="about-description">CityDental is committed to providing patient-focused dental care in Etah. Every visit is an opportunity to listen, understand, and plan thoughtful treatment together.</p>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="about-approach-title">
        <SectionHeading eyebrow="Our approach" title="A patient-centered philosophy">
          <p>CityDental believes that every patient deserves clear communication, comfort, and individualized care. We take the time to listen, explain options clearly, and help you understand your treatment journey.</p>
        </SectionHeading>
        <div className="about-values">
          <div className="about-value">
            <h3>Listening first</h3>
            <p>We begin by understanding your concerns, goals, and questions before recommending any treatment.</p>
          </div>
          <div className="about-value">
            <h3>Clear communication</h3>
            <p>We explain treatment options in straightforward language so you can make informed decisions.</p>
          </div>
          <div className="about-value">
            <h3>Individualized care</h3>
            <p>Every patient is unique. We tailor our approach to your specific needs, preferences, and comfort.</p>
          </div>
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="about-team-title">
        <SectionHeading eyebrow="Our team" title="Meet our professionals">
          <p>CityDental is led by dedicated dental professionals committed to your oral health and comfort.</p>
        </SectionHeading>
        <div className="about-team">
          <Link href="/doctors/dr-kamlesh-kumar-yadav" className="about-team-card">
            <div className="about-team-visual">
              <span className="about-team-initials">CK</span>
            </div>
            <div className="about-team-info">
              <h3>Dr. Kamlesh Kumar Yadav</h3>
              <p>Dentist at CityDental, Etah</p>
              <span className="text-link">View profile ↗</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="premium-cta premium-wrap" aria-labelledby="about-cta-title">
        <div>
          <p className="eyebrow" id="about-cta-title">Ready to get started?</p>
          <h2>Take the next step toward your oral health.</h2>
          <p>Your appointment request has not been submitted yet. Online booking will be connected to CityDental when the appointment service is available.</p>
        </div>
        <Link href="/book-appointment" className="cd-button cd-button-primary">Book an Appointment <span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}
