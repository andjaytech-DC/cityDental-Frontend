import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

/** Responsive wrapper with semantic <table> markup inside. */
export function Table({
  className = "",
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto" role="region" aria-label={props["aria-label"] ?? "Scrollable table"} tabIndex={0}>
      <table
        className={`cd-table ${className}`}
        {...props}
      />
    </div>
  );
}

export function TableHead({
  className = "",
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />;
}

export function TableBody({
  className = "",
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({
  className = "",
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={className} {...props} />;
}

export function TableHeader({
  className = "",
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cd-muted ${className}`}
      {...props}
    />
  );
}

export function TableCell({
  className = "",
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 ${className}`} {...props} />;
}

/** Empty-state row; render inside <TableBody> when a list has no items. */
export function TableEmpty({
  colSpan = 1,
  children = "No records found.",
  className = "",
}: {
  colSpan?: number;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className={`px-4 py-8 text-center text-sm cd-muted ${className}`}>
        {children}
      </td>
    </tr>
  );
}
