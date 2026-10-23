import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, serviceCategories } from "@/lib/services";
import { ServiceCard } from "@/components/ServicesContent";
import { Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return serviceCategories.map(category => ({ category: category.slug }));
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const category = getCategoryBySlug(params.category);
  if (!category) return { title: "Category Not Found | CityDental", robots: { index: false, follow: false } };
  return pageMetadata({
    title: `${category.name} | CityDental`,
    description: category.description,
    path: `/services/${category.slug}`,
  });
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const relatedCategories = serviceCategories.filter(item => item.slug !== category.slug);

  return (
    <div className="service-category-page">
      <div className="premium-wrap">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: category.name }]} />
      </div>
      <section className="category-hero premium-section premium-wrap" aria-labelledby="category-title">
        <p className="eyebrow"><span className="eyebrow-line" /> {category.name}</p>
        <h1 id="category-title">{category.name}</h1>
        <p className="category-description">{category.description}</p>
        <Badge variant="info">{category.services.length} services</Badge>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="category-services-title">
        <div className="cd-page-heading" id="category-services-title"><h2>Services in {category.name}</h2><p>Each service below represents a focused area of care within this specialty.</p></div>
        <div className="service-grid">
          {category.services.map(service => (
            <ServiceCard key={service.slug} service={service} categorySlug={category.slug} />
          ))}
        </div>
      </section>

      <section className="premium-section premium-wrap" aria-labelledby="category-related-title">
        <div className="cd-page-heading" id="category-related-title">
          <h2>Explore related care</h2>
          <p>Other service categories, the doctor directory, and appointment information.</p>
        </div>
        <div className="cd-related">
          {relatedCategories.map(item => (
            <Link key={item.slug} href={`/services/${item.slug}`}>{item.name}</Link>
          ))}
          <Link href="/doctors">Meet our doctor</Link>
          <Link href="/book-appointment">Book an appointment</Link>
        </div>
      </section>
    </div>
  );
}