import Link from "next/link";
import { serviceCategories, footerLinks, doctorProfile } from "@/lib/navigation";
import { CookiePreferences } from "@/components/CookiePreferences";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="premium-footer" id="contact" role="contentinfo">
      <div className="premium-wrap footer-grid">
        <div className="footer-brand">
          <Link href="/" className="premium-brand" aria-label="CityDental home">
            <span aria-hidden="true" className="brand-mark">C<span>✦</span></span>
            <span>CityDental<small>A little more considered.</small></span>
          </Link>
          <p>Thoughtful dental care with a patient-first approach.</p>
          <Link href="/book-appointment" className="footer-cta">Book an Appointment <span aria-hidden="true">↗</span></Link>
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
          </ul>
        </nav>

        <nav aria-label="Patient care">
          <h2>Patient Care</h2>
          <ul className="footer-list">
            {footerLinks.care.map(item => (
              <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
            ))}
          </ul>
        </nav>
      </div>

      <section className="premium-cta footer-cta-strip">
        <div className="premium-wrap">
          <div>
            <p className="eyebrow">A more comfortable next step</p>
            <h2>Ready to take the next step toward your oral health?</h2>
            <p>Your appointment request has not been submitted yet. Online booking will be connected to CityDental when the appointment service is available.</p>
          </div>
          <Link href="/book-appointment" className="cd-button cd-button-primary">Book an Appointment <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <div className="footer-contact">
        <div className="premium-wrap">
          <div className="contact-brand">
            <h2>{doctorProfile.brand}</h2>
            <address>{doctorProfile.fullName.replace("Dr. ", "")}<br />Shop No. 5, Yadav Market,<br />MG Road, Etah, 701012</address>
          </div>
          <div className="contact-actions">
            <a href="tel:+919415192948" className="contact-link">
              <span className="contact-label">Call</span>
              <span className="contact-value">+91 94151 92948</span>
            </a>
            <a href="https://wa.me/919415192948" className="contact-link" target="_blank" rel="noopener noreferrer">
              <span className="contact-label">WhatsApp</span>
              <span className="contact-value">+91 94151 92948</span>
            </a>
            <a href="mailto:citydentalEtah@gmail.com" className="contact-link">
              <span className="contact-label">Email</span>
              <span className="contact-value">citydentalEtah@gmail.com</span>
            </a>
          </div>
        </div>
      </div>

      <div className="premium-wrap footer-bottom">
        <div className="cd-footer-meta">
          <span>© {year} CityDental. All rights reserved.</span>
          <CookiePreferences />
        </div>
        <span>Clinic information pending publication · No clinical records shown</span>
      </div>
    </footer>
  );
}
