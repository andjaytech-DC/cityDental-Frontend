import { LoginForm } from "@/components/LoginForm";
import { Card, PageHeading } from "@/components/ui";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sign in | City Dental",
  description: "Sign in to your CityDental workspace to manage appointments and patient administration.",
  path: "/login",
  noIndex: true,
});
export default function LoginPage() {
  return <div className="cd-login"><PageHeading title="Sign in" description="Welcome back to your City Dental workspace." /><Card><LoginForm /></Card></div>;
}
