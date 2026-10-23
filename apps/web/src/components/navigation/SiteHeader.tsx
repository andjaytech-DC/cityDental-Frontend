"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavLinks, aboutSections } from "@/lib/navigation";
import { ServicesMegaMenu } from "./ServicesMegaMenu";
import { MobileNavigation } from "./MobileNavigation";

export function SiteHeader({ account }: { account?: ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname !== null && (pathname === href || (href !== "/" && pathname.startsWith(href)));

  return (
    <header className={`cd-header premium-header ${scrolled ? "is-scrolled" : ""}`} ref={menuRef}>
      <div className="premium-header-inner">
        <Link href="/" className="premium-brand" aria-label="CityDental home">
          <span aria-hidden="true" className="brand-mark">C<span>✦</span></span>
          <span>CityDental<small>A complete dental care</small></span>
        </Link>

        <nav aria-label="Main navigation" className="premium-nav">
          {mainNavLinks.map(link => (
            <NavItem key={link.href} link={link} isActive={isActive(link.href)}>
              {link.label === "Services" ? <ServicesMegaMenu /> : null}
              {link.label === "About" ? <AboutDropdown /> : null}
            </NavItem>
          ))}
        </nav>

        <div className="premium-header-actions">
          <div className="premium-account">{account}</div>
          <Link href="/book-appointment" className="cd-button cd-button-primary">Book Appointment <span aria-hidden="true">↗</span></Link>
          <button
            className="cd-button cd-button-ghost premium-menu"
            aria-haspopup="dialog"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            Menu
          </button>
        </div>
      </div>

      {mobileOpen && <MobileNavigation onClose={() => setMobileOpen(false)} />}
    </header>
  );
}

function NavItem({ link, isActive, children }: { link: { href: string; label: string }; isActive: boolean; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const openMenu = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div
      className="nav-item"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onFocus={openMenu}
      onBlur={closeMenu}
    >
      <Link
        href={link.href}
        className={`premium-nav-link${isActive ? " is-active" : ""}`}
        aria-current={isActive ? "page" : undefined}
        aria-haspopup={children ? "true" : undefined}
        aria-expanded={children ? open : undefined}
      >
        {link.label}
      </Link>
      {children && open ? <div className="nav-dropdown">{children}</div> : null}
    </div>
  );
}

function AboutDropdown() {
  return (
    <div className="nav-dropdown">
      <div className="nav-dropdown-inner">
        <div className="nav-dropdown-column">
          {aboutSections.map(item => (
            <Link key={item.href} href={item.href} className="nav-dropdown-link">{item.label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
