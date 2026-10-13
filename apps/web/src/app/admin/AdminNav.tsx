"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; show: boolean };

export function AdminNav({ items, onNavigate }: { items: Item[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };
  return (
    <nav aria-label="Admin navigation" className="admin-nav">
      {items.filter((i) => i.show).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          onClick={onNavigate}
        >
          <span aria-hidden="true" className="admin-nav-icon">•</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
