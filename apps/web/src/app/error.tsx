"use client";
import { ErrorState, PageHeading } from "@/components/ui";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <><PageHeading title="Something went wrong" /><ErrorState description="This page could not be displayed. Please try again." onRetry={reset} /></>;
}
