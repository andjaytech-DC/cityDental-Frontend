import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({ children, variant = "primary", size = "md", isLoading = false,
  leftIcon, rightIcon, className = "", disabled, fullWidth, type = "button", ...props }: ButtonProps) {
  return (
    <button {...props} type={type} className={`cd-button cd-button-${variant} cd-button-${size} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || isLoading} aria-busy={isLoading || undefined}>
      {isLoading ? <span aria-hidden="true" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}

