import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <section className="premium-section premium-wrap">
        <div className="cd-page-heading"><h1>Patient Resources</h1><p>The page you are looking for does not exist.</p></div>
        <p>Explore available patient resources at CityDental.</p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/patient-resources" className="cd-button cd-button-primary">View Resources</Link>
          <Link href="/" className="cd-button cd-button-secondary">Return Home</Link>
        </div>
      </section>
    </div>
  );
}
