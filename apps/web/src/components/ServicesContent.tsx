import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import type { ServiceItem } from "@/lib/services";

export function ServiceBreadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav aria-label="Breadcrumb" className="service-breadcrumb">
    <ol style={{ display: "flex", gap: ".5rem", listStyle: "none", padding: 0, margin: 0, flexWrap: "wrap" }}>
      {items.map((item, i) => (
        <li key={item.label}>
          {i > 0 ? <span aria-hidden="true" style={{ color: "var(--color-text-secondary)" }}> / </span> : null}
          {item.href ? <Link href={item.href} className="text-link">{item.label}</Link> : <span style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>}
        </li>
      ))}
    </ol>
  </nav>;
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
