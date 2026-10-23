"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";
import {
  serviceCategories,
  mainNavLinks,
  aboutSections,
} from "@/lib/navigation";

interface MobileNavigationProps {
  onClose: () => void;
}

export function MobileNavigation({ onClose }: MobileNavigationProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const toggleSection = useCallback((slug: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const isSectionOpen = (slug: string) => openSections.has(slug);

  return (
    <div id="mobile-navigation" className="mobile-nav" role="dialog" aria-label="Navigation menu" aria-modal="true">
      <div className="mobile-nav-inner">
        <div className="mobile-nav-header">
          <span className="mobile-nav-brand">CityDental</span>
          <Button variant="ghost" onClick={onClose} aria-label="Close navigation">✕</Button>
        </div>

        <nav aria-label="Mobile navigation" className="mobile-nav-links">
          {mainNavLinks.map(link => {
            if (link.label === "Services") {
              return (
                <div key={link.href} className="mobile-nav-section">
                  <button
                    className="mobile-nav-trigger"
                    aria-expanded={isSectionOpen("services")}
                    aria-controls="mobile-services"
                    onClick={() => toggleSection("services")}
                  >
                    Services
                    <span className="mobile-nav-chevron" aria-hidden="true">
                      {isSectionOpen("services") ? "▲" : "▼"}
                    </span>
                  </button>
                  {isSectionOpen("services") ? (
                    <ul id="mobile-services" className="mobile-nav-sub">
                      {serviceCategories.map(category => (
                        <li key={category.slug}>
                          <Link href={category.href} className="mobile-nav-link">{category.name}</Link>
                          <ul className="mobile-nav-sub-services">
                            {category.services.map(service => (
                              <li key={service.slug}>
                                <Link href={service.href} className="mobile-nav-sub-link">{service.name}</Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                      <li>
                        <Link href="/services" className="mobile-nav-link">View All Services</Link>
                      </li>
                    </ul>
                  ) : null}
                </div>
              );
            }

            if (link.label === "About") {
              return (
                <div key={link.href} className="mobile-nav-section">
                  <button
                    className="mobile-nav-trigger"
                    aria-expanded={isSectionOpen("about")}
                    aria-controls="mobile-about"
                    onClick={() => toggleSection("about")}
                  >
                    About
                    <span className="mobile-nav-chevron" aria-hidden="true">
                      {isSectionOpen("about") ? "▲" : "▼"}
                    </span>
                  </button>
                  {isSectionOpen("about") ? (
                    <ul id="mobile-about" className="mobile-nav-sub">
                      {aboutSections.map(item => (
                        <li key={item.href}><Link href={item.href} className="mobile-nav-link">{item.label}</Link></li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            }

            if (link.label === "Patient Resources") {
              return (
                <div key={link.href} className="mobile-nav-section">
                  <Link href={link.href} className="mobile-nav-link" onClick={onClose}>
                    {link.label}
                  </Link>
                </div>
              );
            }

            return (
              <div key={link.href} className="mobile-nav-section">
                <Link
                  href={link.href}
                  className={`mobile-nav-link ${pathname === link.href ? "mobile-nav-active" : ""}`}
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="mobile-nav-cta">
          <Link href="/book-appointment" className="cd-button cd-button-primary" onClick={onClose}>Book Appointment <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </div>
  );
}
