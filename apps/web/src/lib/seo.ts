import type { Metadata } from "next";

/**
 * Central SEO helpers.
 *
 * `NEXT_PUBLIC_SITE_URL` must be set to the canonical production origin
 * (for example https://citydental.example). Canonical and Open Graph URLs are
 * emitted as absolute URLs, which crawlers require.
 */
export const SITE_NAME = "CityDental";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const SHARE_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "CityDental — thoughtful dental care in Etah",
};

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface PageMetadataInput {
  title: string;
  description: string;
  /** Route path, for example "/services". Used for canonical + og:url. */
  path: string;
  /** Set true for authenticated or internal pages that must not be indexed. */
  noIndex?: boolean;
}

/**
 * Metadata for a single page: canonical URL, Open Graph, Twitter card and
 * robots directives. The share image is supplied automatically by
 * `app/opengraph-image.tsx` (file convention), so it is not duplicated here.
 */
export function pageMetadata({ title, description, path, noIndex = false }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      title,
      description,
      url,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SHARE_IMAGE.url],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
