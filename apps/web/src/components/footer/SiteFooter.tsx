import Link from "next/link";
import { footerLinks, doctorProfile } from "@/lib/navigation";
import { CookiePreferences } from "@/components/CookiePreferences";
import { MailIcon, PhoneIcon, PinIcon } from "@/components/icons";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const contact = doctorProfile.contact;

  return (
    <footer className="premium-footer" role="contentinfo">
      <div className="premium-wrap footer-grid">
        <div className="footer-brand">
          <Link href="/" className="premium-brand" aria-label="CityDental home">
            <span aria-hidden="true" className="brand-mark">C<span>✦</span></span>
            <span>CityDental<small>A complete dental care</small></span>
          </Link>
          <p>Patient-focused dental care in Etah, with clear information and a thoughtful next step.</p>
          <Link href="/book-appointment" className="footer-cta">Book Appointment <span aria-hidden="true">↗</span></Link>
        </div>

        <nav aria-label="Quick links">
          <h2>Quick Links</h2>
          <ul className="footer-list">
            {footerLinks.quick.map(item => (
              <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Services">
          <h2>Services</h2>
          <ul className="footer-list">
            {footerLinks.services.map(item => (
              <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
            ))}
            <li><Link href="/services">View all services</Link></li>
          </ul>
        </nav>

        <div className="footer-contact-block" role="group" aria-label="Contact details">
          <h2>Contact Us</h2>
          <address>
            <span><PinIcon width={16} height={16} /> {contact.address}</span>
            <a href="tel:+919415192948"><PhoneIcon width={16} height={16} /> {contact.phone}</a>
            <a href="https://wa.me/919415192948" target="_blank" rel="noopener noreferrer">
              WhatsApp: {contact.whatsapp}
            </a>
            <a href={`mailto:${contact.email}`}><MailIcon width={16} height={16} /> {contact.email}</a>
          </address>
        </div>
      </div>

      <div className="premium-wrap footer-bottom">
        <span>© {year} CityDental. All rights reserved.</span>
        <div className="cd-footer-meta">
          <CookiePreferences />
        </div>
        <span>Illustrative photography · No clinical records shown</span>
      </div>
    </footer>
  );
}
