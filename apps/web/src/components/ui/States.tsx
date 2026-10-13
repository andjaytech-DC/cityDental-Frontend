import type { ReactNode } from "react";
import { Button } from "./Button";

export function PageHeading({ title, description }: { title: string; description?: string }) {
  return <div className="cd-page-heading"><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>;
}

export function LoadingState({ label = "Loading page…" }: { label?: string }) {
  return <div role="status" className="cd-state"><span aria-hidden="true" className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /><p>{label}</p></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="cd-state"><p className="font-semibold">{title}</p><p className="cd-muted text-sm">{description}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}

export function ErrorState({ title = "Unable to load this section", description = "Please try again. If the problem continues, contact your administrator.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return <div role="alert" className="cd-state cd-state-error"><p className="font-semibold">{title}</p><p>{description}</p>{onRetry ? <Button variant="secondary" className="mt-4" onClick={onRetry}>Try again</Button> : null}</div>;
}

export function AccessErrorState() {
  return <ErrorState title="Access unavailable" description="The server could not allow this request. Check your account with your administrator." />;
}
