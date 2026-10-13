import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <section className="premium-section premium-wrap">
        <div className="cd-page-heading"><h1>About CityDental</h1><p>The page you are looking for does not exist.</p></div>
        <p>Learn about CityDental&rsquo;s patient-first approach to dental care in Etah.</p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/about" className="cd-button cd-button-primary">Learn More</Link>
          <Link href="/contact" className="cd-button cd-button-secondary">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}
