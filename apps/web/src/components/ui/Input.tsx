"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  /** Validation error message; switches the field into its error state. */
  error?: string | null;
  /** Optional helper text shown below the field (hidden while an error is shown). */
  hint?: ReactNode;
}

const baseStyles =
  "cd-input text-sm";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className = "", id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const ariaDescribedBy =
    [
      props["aria-describedby"],
      error ? errorId : null,
      !error && hint ? hintId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium"
        >
          {label}
          {props.required ? (
            <span className="ml-0.5 cd-error-text" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={`${baseStyles} ${className}`}
        {...props}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={ariaDescribedBy}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-sm cd-error-text">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-sm cd-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
