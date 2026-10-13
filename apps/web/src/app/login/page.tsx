import { LoginForm } from "@/components/LoginForm";
import { Card, PageHeading } from "@/components/ui";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Sign in | City Dental" };
export default function LoginPage() {
  return <div className="cd-login"><PageHeading title="Sign in" description="Welcome back to your City Dental workspace." /><Card><LoginForm /></Card></div>;
}
