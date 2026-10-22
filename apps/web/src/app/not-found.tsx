import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <section className="premium-section premium-wrap" aria-labelledby="not-found-title">
        <div className="cd-page-heading">
          <p className="eyebrow">404</p>
          <h1 id="not-found-title">Page not found</h1>
          <p>The page you are looking for does not exist or has been moved.</p>
        </div>
        <p>You can return to the homepage, explore our services, or contact CityDental for assistance.</p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/" className="cd-button cd-button-primary">Back to overview</Link>
          <Link href="/services" className="cd-button cd-button-secondary">Explore services</Link>
          <Link href="/contact" className="cd-button cd-button-outline">Contact us</Link>
        </div>
      </section>
    </div>
  );
}
