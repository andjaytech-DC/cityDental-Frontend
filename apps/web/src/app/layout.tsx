import { AppShell, AccountMenu } from "@/components/AppShell";
import { AuthProvider } from "@/lib/auth-context";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./premium.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CityDental | A thoughtful beginning",
  description: "Explore CityDental patient resources, doctor information and appointment workspaces. Clinic service information is awaiting publication.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} ${inter.variable}`}>
      <head />
      <body>
        <AuthProvider><AppShell account={<AccountMenu />}>{children}</AppShell></AuthProvider>
      </body>
    </html>
  );
}
