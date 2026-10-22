import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { ServiceItem } from "@/lib/services";

/** @deprecated Use <Breadcrumbs /> directly; kept as a thin alias for existing callers. */
export function ServiceBreadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <Breadcrumbs items={items} />;
}

export function CategoryCard({ category, href }: { category: { name: string; description: string; services: ServiceItem[]; icon: string }; href: string }) {
  return <Link href={href} className="service-category-card">
    <span className="category-icon" aria-hidden="true">{category.icon}</span>
    <h2>{category.name}</h2>
    <p>{category.description}</p>
    <span className="service-count">{category.services.length} services</span>
  </Link>;
}

export function ServiceCard({ service, categorySlug }: { service: ServiceItem; categorySlug: string }) {
  return <Link href={`/services/${categorySlug}/${service.slug}`} className="service-card">
    <span className="service-arrow" aria-hidden="true">→</span>
    <div>
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <Badge variant="info">{service.name}</Badge>
    </div>
  </Link>;
}
