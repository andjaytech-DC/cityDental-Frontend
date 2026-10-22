import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { siteImages } from "@/lib/site-content";
import { SectionHeading, AppointmentCTA } from "@/components/MarketingSections";
import { serviceCategories } from "@/lib/services";
import { doctorProfile } from "@/lib/doctors";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "CityDental | Thoughtful dental care in Etah",
  description: "Patient-focused dental care in Etah. Explore services, meet the doctor, find patient resources and book an appointment with CityDental.",
  path: "/",
});

export default function HomePage() {
  const image = siteImages.careSpace;
  const d = doctorProfile;
  return <>
    <section className="premium-hero premium-wrap" aria-labelledby="hero-title">
      <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> Welcome to CityDental</p>
        <h1 id="hero-title">A fresh perspective<br />on <em>your smile.</em></h1>
        <p className="hero-description">Your dental journey deserves a thoughtful beginning. Find your way to our team, explore visit information, and take the next step at your own pace.</p>
        <div className="hero-actions"><Link href="/book-appointment" className="cd-button cd-button-primary">Book an appointment <span aria-hidden="true">↗</span></Link><Link href="/services" className="text-link">Discover our services <span aria-hidden="true">↓</span></Link></div>
        <p className="hero-note">A clearer experience, from the very first click.<br /><span>Online booking is not connected yet.</span></p>
      </div>
      <figure className="hero-visual"><Image src={image.src} alt={image.alt} width={image.width} height={image.height} priority sizes="(max-width: 767px) 92vw, 48vw" fetchPriority="high" /><div className="image-label"><span className="label-star" aria-hidden="true">✦</span><span>A calmer point of view.<small>Original CityDental illustration</small></span></div><figcaption>{image.caption}</figcaption></figure>
    </section>
    <section className="premium-highlights premium-wrap" aria-label="A thoughtful online experience">
      {[["01", "Space to explore", "Care information, without the rush."], ["02", "A clear next step", "Find your team and appointment workspace."], ["03", "Honest information", "No invented reviews, claims or credentials."], ["04", "Designed around you", "Readable, accessible navigation on any screen."]].map(([n,title,text]) => <div key={n}><span className="highlight-number">{n}</span><h2>{title}</h2><p>{text}</p></div>)}
    </section>
    <section id="services" className="premium-section premium-wrap" aria-labelledby="services-home-title">
      <SectionHeading eyebrow="Our services" title="Good care starts with clear information."><p>Browse CityDental&#39;s service categories below. Each area represents a focused domain of dental care.</p></SectionHeading>
      <div className="premium-resource-grid">
        {serviceCategories.map(category => (
          <Link key={category.slug} href={`/services/${category.slug}`} className="premium-resource">
            <span className="resource-symbol" aria-hidden="true">{category.icon}</span>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
            <span className="availability">{category.services.length} services</span>
          </Link>
        ))}
        <Link href="/services" className="premium-resource"><span className="resource-symbol" aria-hidden="true">↗</span><h3>View all services</h3><p>Explore the complete service catalog across every category.</p><span className="text-link">View all services ↗</span></Link>
      </div>
    </section>
    <section id="about" className="premium-experience"><div className="premium-wrap experience-grid"><figure><Image src={image.src} alt="Detail of the original dental-room illustration, showing a chair beside soft window light" width={image.width} height={image.height} sizes="(max-width: 767px) 90vw, 42vw" loading="lazy" /><figcaption>Illustration, not clinic photography.</figcaption></figure><div><SectionHeading eyebrow="The CityDental experience" title="A little less uncertainty. A little more clarity."><p>Questions belong at the beginning of every visit. This website gives you a simple place to find information and prepare for a conversation with a dental professional.</p></SectionHeading><ul className="experience-list"><li>Explore care information at your own pace</li><li>Find patient and appointment resources together</li><li>Know when information is still unavailable</li></ul><Link href="/patients" className="text-link">Explore patient resources ↗</Link></div></div></section>
    <section className="premium-section premium-wrap" aria-labelledby="team-title"><p className="eyebrow">People behind the care</p><div className="team-heading"><h2 id="team-title">A personal connection<br /><em>starts with your team.</em></h2><Link href="/doctors" className="text-link">Explore the doctor directory ↗</Link></div><div className="premium-team-empty"><Link href={`/doctors/${d.slug}`} className="doctor-home-link"><span aria-hidden="true" className="team-monogram">{d.fullName.split(" ").map(w => w[0]).join("").slice(0, 2)}</span><div><h3>{d.fullName}</h3><p>{d.role} at CityDental in Etah. Meet the dedicated professionals committed to your oral health.</p></div><span className="availability">{d.brand}</span></Link></div></section>
    <AppointmentCTA />
  </>;
}