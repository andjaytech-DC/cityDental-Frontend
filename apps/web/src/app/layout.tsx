import type { Metadata, Viewport } from "next";
import { AppShell, AccountMenu } from "@/components/AppShell";
import { AppProviders } from "@/components/AppProviders";
import { JsonLd } from "@/components/JsonLd";
import { AuthProvider } from "@/lib/auth-context";
import { dentistSchema } from "@/lib/schema";
import { SITE_NAME, SITE_URL, SHARE_IMAGE, absoluteUrl } from "@/lib/seo";
import { Inter } from "next/font/google";
import "./globals.css";
import "./premium.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CityDental | Healthy smiles for a brighter life",
  description: "Patient-focused dental care in Etah. Explore oral surgery, implants and specialty services, meet Dr. Kamlesh Kumar Yadav, and request an appointment with CityDental.",
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    url: absoluteUrl("/"),
    title: "CityDental | Healthy smiles for a brighter life",
    description: "Patient-focused dental care in Etah, with clear service information, a verified doctor profile and appointment requests.",
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "CityDental | Healthy smiles for a brighter life",
    description: "Patient-focused dental care in Etah, with clear service information, a verified doctor profile and appointment requests.",
    images: [SHARE_IMAGE.url],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: true, address: true, email: true },
};

export const viewport: Viewport = {
  themeColor: "#153F38",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
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
        <JsonLd data={dentistSchema()} />
        <AppProviders>
          <AuthProvider><AppShell account={<AccountMenu />}>{children}</AppShell></AuthProvider>
        </AppProviders>
      </body>
    </html>
  );
}
