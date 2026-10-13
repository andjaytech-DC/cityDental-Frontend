import type { HTMLAttributes } from "react";

export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "cd-badge-neutral",
  info: "cd-badge-info",
  success: "cd-badge-success",
  warning: "cd-badge-warning",
  danger: "cd-badge-danger",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`cd-badge ${
        variantStyles[variant]
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
