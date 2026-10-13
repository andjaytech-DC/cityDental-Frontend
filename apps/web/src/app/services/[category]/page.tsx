import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, serviceCategories } from "@/lib/services";
import { ServiceCard } from "@/components/ServicesContent";
import { Badge } from "@/components/ui";

export async function generateStaticParams() {
  return serviceCategories.map(category => ({ category: category.slug }));
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const category = getCategoryBySlug(params.category);
  if (!category) return { title: "Category Not Found" };
  return { title: `${category.name} | CityDental`, description: category.description };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  return (
    <div className="service-category-page">
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
    </div>
  );
}