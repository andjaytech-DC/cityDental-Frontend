import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { siteImages } from "@/lib/site-content";
import { serviceCategories } from "@/lib/services";
import { doctorProfile } from "@/lib/doctors";
import { pageMetadata } from "@/lib/seo";
import {
  ArrowUpRightIcon,
  ChatIcon,
  CheckIcon,
  HeartIcon,
  ImplantIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  ShieldCheckIcon,
  SparkleIcon,
  SurgeryIcon,
  ToothIcon,
} from "@/components/icons";

export const metadata: Metadata = pageMetadata({
  title: "CityDental | Healthy smiles for a brighter life in Etah",
  description: "Patient-focused dental care in Etah. Explore oral surgery, implants and specialty services, meet Dr. Kamlesh Kumar Yadav, and request an appointment with CityDental.",
  path: "/",
});

const trustPoints = [
  { title: "Patient-first care", text: "Every conversation starts with listening.", Icon: HeartIcon },
  { title: "Clear communication", text: "Treatment options explained in plain language.", Icon: ChatIcon },
  { title: "Honest information", text: "Only verified clinic details are published.", Icon: ShieldCheckIcon },
];

const categoryCards = serviceCategories.map((category, index) => ({
  name: category.name,
  description: category.description,
  href: `/services/${category.slug}`,
  kicker: "Care category",
  Icon: [SurgeryIcon, ImplantIcon, SparkleIcon][index] ?? ToothIcon,
}));

const featuredCards = [
  {
    name: "Wisdom Teeth Removal",
    description: "Care for impacted or partially erupted third molars, planned around your individual needs.",
    href: "/services/oral-surgery/wisdom-teeth-removal",
    kicker: "Focused treatment",
    Icon: ToothIcon,
  },
  {
    name: "Dental Implants",
    description: "A modern approach to replacing a missing tooth with a stable, natural-looking restoration.",
    href: "/services/specialty-services/dental-implants",
    kicker: "Focused treatment",
    Icon: ImplantIcon,
  },
  {
    name: "TMJ Therapy",
    description: "Non-surgical options for jaw discomfort, including splints and bite-focused care.",
    href: "/services/specialty-services/tmj-therapy",
    kicker: "Focused treatment",
    Icon: ShieldCheckIcon,
  },
];

const homeServices = [...categoryCards, ...featuredCards];

const whyPoints = [
  "Patient-focused care from the first conversation",
  "Clear explanations of treatment options",
  "Comfort considered at every step",
  "A simple, organised visit experience",
];

const careerPaths = [
  {
    title: "Doctors & Dental Professionals",
    description: "Qualified applicants whose credentials will be verified.",
  },
  {
    title: "Dental Support Staff",
    description: "Dental assistants and clinic support staff.",
  },
  {
    title: "Receptionist & Front Desk",
    description: "Patient coordination, appointment handling and reception responsibilities.",
  },
];

export default function HomePage() {
  const doctorInitials = doctorProfile.fullName
    .replace("Dr. ", "")
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2);
  const contact = doctorProfile.contact;

  return (
    <>
      <section className="home-hero premium-wrap" aria-labelledby="hero-title">
        <div className="home-hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> Your trusted dental care partner</p>
          <h1 id="hero-title">Healthy smiles<br />for a <em>brighter life.</em></h1>
          <p className="home-hero-description">
            CityDental brings thoughtful, patient-focused dental care to Etah. From your first question to your
            next visit, we make space to listen, explain clearly, and help you plan care with confidence.
          </p>
          <div className="home-hero-actions">
            <Link href="/book-appointment" className="cd-button cd-button-primary cd-button-lg">
              Book Appointment <ArrowUpRightIcon width={18} height={18} />
            </Link>
            <Link href="/services" className="cd-button cd-button-secondary cd-button-lg">
              Explore Our Services
            </Link>
          </div>
          <p className="home-hero-note">
            Online appointment requests are reviewed by the clinic. Online booking is not connected yet.
          </p>
          <ul className="home-trust-list" aria-label="Our approach to care">
            {trustPoints.map(({ title, text, Icon }) => (
              <li key={title}>
                <span className="home-trust-icon" aria-hidden="true"><Icon width={18} height={18} /></span>
                <span><strong>{title}</strong><small>{text}</small></span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="home-hero-visual">
          <div className="home-hero-photo">
            <Image
              src={siteImages.heroClinic.src}
              alt={siteImages.heroClinic.alt}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 767px) 92vw, (max-width: 1100px) 48vw, 600px"
            />
          </div>
          <div className="home-hero-badge">
            <span className="home-hero-badge-icon" aria-hidden="true"><ToothIcon width={22} height={22} /></span>
            <div><strong>Patient-first dental care</strong><small>For a healthier, brighter smile</small></div>
            <Link href="/services" aria-label="Explore CityDental services"><ArrowUpRightIcon width={16} height={16} /></Link>
          </div>
          <figcaption>{siteImages.heroClinic.caption}</figcaption>
        </figure>
      </section>

      <section id="services" className="home-section home-services" aria-labelledby="services-home-title">
        <div className="premium-wrap">
          <div className="home-section-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" /> Our services</p>
              <h2 id="services-home-title">Focused dental care,<br /><em>under one roof.</em></h2>
            </div>
            <p>
              Explore the care categories and focused treatments represented at CityDental. Every card links to a
              service page with more detail.
            </p>
          </div>

          <div className="home-service-grid">
            {homeServices.map(({ name, description, href, kicker, Icon }) => (
              <Link key={href} href={href} className="home-service-card">
                <span className="home-service-icon" aria-hidden="true"><Icon width={24} height={24} /></span>
                <span className="home-service-kicker">{kicker}</span>
                <h3>{name}</h3>
                <p>{description}</p>
                <span className="home-service-link">Learn more <ArrowUpRightIcon width={15} height={15} /></span>
              </Link>
            ))}
          </div>

          <div className="home-section-footer">
            <Link href="/services" className="text-link">View all services <ArrowUpRightIcon width={15} height={15} /></Link>
          </div>
        </div>
      </section>

      <section id="why-choose" className="home-why" aria-labelledby="why-choose-title">
        <div className="premium-wrap home-why-grid">
          <figure className="home-why-visual">
            <div className="home-why-photo">
              <Image
                src={siteImages.consultation.src}
                alt={siteImages.consultation.alt}
                fill
                loading="lazy"
                sizes="(max-width: 767px) 92vw, 46vw"
              />
            </div>
            <div className="home-why-stat">
              <strong>Patient-first</strong>
              <span>Every visit begins with listening.</span>
            </div>
            <figcaption>{siteImages.consultation.caption}</figcaption>
          </figure>

          <div className="home-why-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> Why choose CityDental</p>
            <h2 id="why-choose-title">Thoughtful care.<br /><em>A healthier you.</em></h2>
            <p>
              Care at CityDental starts with understanding. We take time to listen to your concerns, explain the
              options in plain language, and help you make an informed decision about your oral health.
            </p>
            <ul className="home-check-list">
              {whyPoints.map(point => (
                <li key={point}><CheckIcon width={18} height={18} /> {point}</li>
              ))}
            </ul>
            <Link href="/about" className="cd-button cd-button-primary">
              Learn more about us <ArrowUpRightIcon width={17} height={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section home-doctors" aria-labelledby="doctors-home-title">
        <div className="premium-wrap">
          <div className="home-section-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" /> Our doctor</p>
              <h2 id="doctors-home-title">People behind<br /><em>your healthy smile.</em></h2>
            </div>
            <p>
              Every profile published here is verified with the clinic. We add more only when the details are
              confirmed.
            </p>
          </div>

          <div className="home-doctor-grid">
            <Link href={`/doctors/${doctorProfile.slug}`} className="home-doctor-card">
              <div className="home-doctor-monogram" aria-hidden="true">{doctorInitials}</div>
              <div className="home-doctor-info">
                <span className="home-doctor-role">{doctorProfile.role}</span>
                <h3>{doctorProfile.fullName}</h3>
                <p>{doctorProfile.introduction} Based in {doctorProfile.location}.</p>
                <span className="text-link">View profile <ArrowUpRightIcon width={15} height={15} /></span>
              </div>
            </Link>

            <aside className="home-team-card" aria-labelledby="home-team-title">
              <p className="eyebrow">Our team is growing</p>
              <h3 id="home-team-title">Join our team</h3>
              <p>
                We welcome dental professionals and support staff who want to contribute to a caring,
                patient-focused clinic.
              </p>
              <Link href="/careers" className="text-link">Explore careers <ArrowUpRightIcon width={15} height={15} /></Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="home-careers" aria-labelledby="careers-home-title">
        <div className="premium-wrap home-careers-grid">
          <div className="home-careers-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> Careers at City Dental</p>
            <h2 id="careers-home-title">Build your career<br /><em>with City Dental.</em></h2>
            <p>
              We welcome dedicated dental professionals and supportive team members who want to contribute to a
              caring, patient-focused clinic.
            </p>
            <ul className="home-career-list">
              {careerPaths.map((path, index) => (
                <li key={path.title}>
                  <span className="home-career-index" aria-hidden="true">0{index + 1}</span>
                  <div><strong>{path.title}</strong><span>{path.description}</span></div>
                </li>
              ))}
            </ul>
            <Link href="/careers" className="cd-button cd-button-primary">
              Explore Careers <ArrowUpRightIcon width={17} height={17} />
            </Link>
          </div>

          <figure className="home-careers-visual">
            <div className="home-careers-photo">
              <Image
                src={siteImages.careers.src}
                alt={siteImages.careers.alt}
                fill
                loading="lazy"
                sizes="(max-width: 767px) 92vw, 48vw"
              />
            </div>
            <figcaption>{siteImages.careers.caption}</figcaption>
          </figure>
        </div>
      </section>

      <section className="home-contact" aria-labelledby="contact-home-title">
        <div className="premium-wrap">
          <div className="home-contact-card">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" /> Contact CityDental</p>
              <h2 id="contact-home-title">Ready to take the next step<br /><em>toward your oral health?</em></h2>
              <p>
                Request an appointment, call the clinic, or send a message. The team will confirm the next step
                with you directly.
              </p>
              <p className="home-contact-note">Online booking is not connected yet; appointment requests are reviewed by the clinic.</p>
            </div>
            <div className="home-contact-actions">
              <Link href="/book-appointment" className="cd-button cd-button-primary">
                Book Appointment <ArrowUpRightIcon width={17} height={17} />
              </Link>
              <Link href="/contact" className="cd-button cd-button-secondary">Contact Us</Link>
            </div>
            <div className="home-contact-details">
              <a href="tel:+919415192948"><PhoneIcon width={17} height={17} /> {contact.phone}</a>
              <a href={`mailto:${contact.email}`}><MailIcon width={17} height={17} /> {contact.email}</a>
              <span><PinIcon width={17} height={17} /> {contact.address}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
