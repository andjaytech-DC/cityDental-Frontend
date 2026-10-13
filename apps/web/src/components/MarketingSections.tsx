import Link from "next/link";
import type { ReactNode } from "react";

/** Section titles are deliberately concise; detail stays in contracts and backend APIs. */
export function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="premium-section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children ? <div className="section-intro">{children}</div> : null}</div>;
}
export function AppointmentCTA() {
  return <section className="premium-cta premium-wrap" aria-labelledby="visit-title"><div><p className="eyebrow">Your next chapter</p><h2 id="visit-title">Make room for<br /><em>your next visit.</em></h2><p>Start an appointment request. Booking will confirm only when the clinic service is connected.</p></div><Link className="cd-button cd-button-primary" href="/book-appointment">Book an appointment <span aria-hidden="true">↗</span></Link></section>;
}
