/**
 * Content-shaped loading placeholders. Prefer these over a spinner for tables
 * and card grids so the layout does not jump when data arrives.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`cd-skeleton ${className}`.trim()} />;
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="cd-skeleton-table">
      <span className="sr-only">Loading table data…</span>
      <div className="cd-skeleton-row cd-skeleton-row-head">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`head-${index}`} className="cd-skeleton-cell" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="cd-skeleton-row">
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton key={`cell-${rowIndex}-${columnIndex}`} className="cd-skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="cd-skeleton-grid">
      <span className="sr-only">Loading content…</span>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="cd-skeleton-card">
          <Skeleton className="cd-skeleton-line cd-skeleton-line-title" />
          <Skeleton className="cd-skeleton-line" />
          <Skeleton className="cd-skeleton-line cd-skeleton-line-short" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="cd-skeleton-page">
      <span className="sr-only">Loading page…</span>
      <Skeleton className="cd-skeleton-line cd-skeleton-heading" />
      <Skeleton className="cd-skeleton-line cd-skeleton-line-short" />
      <CardGridSkeleton cards={3} />
    </div>
  );
}
