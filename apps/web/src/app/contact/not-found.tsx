import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <section className="premium-section premium-wrap">
        <div className="cd-page-heading"><h1>Contact CityDental</h1><p>The page you are looking for does not exist.</p></div>
        <p>Get in touch with CityDental in Etah using the contact details below.</p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/contact" className="cd-button cd-button-primary">Contact Us</Link>
          <Link href="/" className="cd-button cd-button-secondary">Return Home</Link>
        </div>
      </section>
    </div>
  );
}
