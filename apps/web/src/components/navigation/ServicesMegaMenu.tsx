"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { serviceCategories } from "@/lib/navigation";

export function ServicesMegaMenu() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const openCategory = useCallback((slug: string) => {
    clearTimeout(timeoutRef.current);
    setActiveCategory(slug);
  }, []);

  const closeCategory = useCallback(() => {
    timeoutRef.current = setTimeout(() => setActiveCategory(null), 200);
  }, []);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div
      className="mega-menu"
      onMouseEnter={() => setActiveCategory(null)}
      onMouseLeave={closeCategory}
      onFocus={() => setActiveCategory(null)}
      onBlur={closeCategory}
      role="menubar"
      aria-label="Services"
    >
      <div className="mega-menu-trigger" />
      <div className={`mega-menu-panel ${activeCategory ? "is-open" : ""}`} role="menu" aria-label="Service categories">
        <div className="mega-menu-inner">
          <div className="mega-menu-columns">
            {serviceCategories.map(category => (
              <div
                key={category.slug}
                className="mega-menu-column"
                onMouseEnter={() => openCategory(category.slug)}
                onFocus={() => openCategory(category.slug)}
                role="presentation"
              >
                <Link href={category.href} className="mega-menu-category" role="menuitem">
                  <span className="mega-menu-icon" aria-hidden="true">{category.icon}</span>
                  <h3>{category.name}</h3>
                </Link>
                <ul className="mega-menu-services" role="group" aria-label={category.name}>
                  {category.services.map(service => (
                    <li key={service.slug} role="none">
                      <Link href={service.href} className="mega-menu-service" role="menuitem">{service.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mega-menu-cta">
            <Link href="/services" className="cd-button cd-button-secondary" role="menuitem">View All Services <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
