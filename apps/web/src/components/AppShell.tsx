"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button, Modal } from "./ui";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { SiteFooter } from "@/components/footer/SiteFooter";

function WorkspaceNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="cd-nav">
    <Link href="/workspace" aria-current={pathname === "/workspace" ? "page" : undefined} onClick={onNavigate}>Overview</Link>
    <Link href="/patients" aria-current={pathname === "/patients" ? "page" : undefined} onClick={onNavigate}>Patients</Link>
    <Link href="/doctors" aria-current={pathname === "/doctors" ? "page" : undefined} onClick={onNavigate}>Doctors</Link>
    <Link href="/appointments" aria-current={pathname === "/appointments" ? "page" : undefined} onClick={onNavigate}>Appointments</Link>
    <Link href="/workspace#workspace" onClick={onNavigate}>Workspace readiness</Link>
    <Link href="/login" aria-current={pathname === "/login" ? "page" : undefined} onClick={onNavigate}>Sign in</Link>
  </nav>;
}

export function AccountMenu() {
  const { user, isLoading, logout } = useAuth();
  if (isLoading) return <span role="status" className="cd-muted text-sm">Checking saved session…</span>;
  return user ? <div className="flex flex-wrap items-center gap-3 text-sm">
    <span>{user.firstName} {user.lastName}</span>
    <Button variant="secondary" onClick={logout}>Sign out on this device</Button>
  </div> : <Link href="/login" className="cd-button cd-button-primary">Sign in</Link>;
}

export function AppShell({ children, account }: { children: ReactNode; account?: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (media.matches) setMenuOpen(false); };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);
  const accountControl = account ?? <Link href="/login" className="cd-button cd-button-ghost">Sign in</Link>;
  const isPublic = pathname === "/" || pathname.startsWith("/book-appointment") || pathname.startsWith("/services") || pathname.startsWith("/doctors") || pathname.startsWith("/about") || pathname.startsWith("/patient-resources") || pathname === "/contact";
  if (isPublic) return <div className="premium-site">
    <a className="cd-skip" href="#main-content">Skip to content</a>
    <SiteHeader account={accountControl} />
    <main id="main-content" tabIndex={-1}>{children}</main>
    <SiteFooter />
  </div>;
  return <div className="clinical-site">
    <SiteHeader account={accountControl} />
    <div className="cd-shell">
    <a className="cd-skip" href="#main-content">Skip to content</a>
    <aside className="cd-sidebar">
      <Link href="/workspace" className="cd-brand px-4">Practice workspace</Link>
      <WorkspaceNavigation />
      <p className="cd-muted mt-auto px-4 text-xs">Practice workspace<br />No clinical data is loaded.</p>
    </aside>
    <div className="min-w-0">
      <header className="cd-header">
        <div className="flex items-center gap-3">
          <Button className="cd-mobile-menu" variant="secondary" onClick={() => setMenuOpen(true)} aria-haspopup="dialog">Menu</Button>
          <Link href="/workspace" className="cd-brand">Practice workspace</Link>
        </div>
        <span className="cd-muted text-xs">Clinical information · connection pending</span>
      </header>
      <main id="main-content" tabIndex={-1} className="cd-container">{children}</main>
    </div>
    <Modal isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="Navigation">
      <WorkspaceNavigation onNavigate={() => setMenuOpen(false)} />
    </Modal>
    </div>
    <SiteFooter />
  </div>;
}