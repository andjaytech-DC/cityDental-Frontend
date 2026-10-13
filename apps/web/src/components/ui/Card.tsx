import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
}

export function Card({ title, className = "", children, ...props }: CardProps) {
  return <div className={`cd-card ${className}`} {...props}>
    {title ? <div className="cd-card-header"><h2 className="font-semibold">{title}</h2></div> : null}
    <div className="cd-card-body">{children}</div>
  </div>;
}

/** Interactive cards are real links, not clickable divs. */
export function CardLink({ href, title, children }: { href: string; title: string; children: ReactNode }) {
  return <Link href={href} className="cd-card cd-card-link cd-card-body">
    <h2 className="font-semibold">{title} <span aria-hidden="true">→</span></h2>
    <div className="cd-muted mt-2 text-sm">{children}</div>
  </Link>;
}

