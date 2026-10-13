import { AccountMenu } from "@/components/AppShell";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { SiteFooter as FooterSite } from "@/components/footer/SiteFooter";
import type { ReactNode } from "react";
import Link from "next/link";

export function Brand() {
  return <Link href="/" className="premium-brand" aria-label="CityDental home"><span aria-hidden="true" className="brand-mark">C<span>✦</span></span><span>CityDental<small>A little more considered.</small></span></Link>;
}

export function PublicHeader({ account }: { account: ReactNode }) {
  return <SiteHeader account={account} />;
}

export function SiteFooter() {
  return <FooterSite />;
}