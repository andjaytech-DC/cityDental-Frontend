import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <section className="premium-section premium-wrap">
        <div className="cd-page-heading"><h1>Page Not Found</h1><p>The page you are looking for does not exist or has been moved.</p></div>
        <p>You can return to the homepage or contact CityDental for assistance.</p>
        <p style={{ marginTop: "1rem" }}>Back to overview</p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/" className="cd-button cd-button-primary">Return Home</Link>
          <Link href="/contact" className="cd-button cd-button-secondary">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}
