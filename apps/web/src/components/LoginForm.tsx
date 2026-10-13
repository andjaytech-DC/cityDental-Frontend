"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@citydental/validation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button, Input, ErrorState, LoadingState } from "./ui";

export function loginErrorMessage(error: unknown): string {
  const status = error instanceof ApiError ? error.status : typeof error === "number" ? error : 0;
  if (status === 401) return "Sign-in was not accepted. Check your email, password and organization.";
  if (status === 403) return "Access is unavailable for this account. Contact your administrator.";
  if (status === 429) return "Too many attempts. Please wait before trying again.";
  if (status === 404 || status >= 500) return "The sign-in service is unavailable. Please try again later.";
  // also handle non-ApiError network failures
  if (error instanceof TypeError) return "We could not complete sign-in. Check your connection and try again.";
  return "We could not complete sign-in. Check your connection and try again.";
}

export function LoginForm() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, resetField, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  if (isLoading && !isSubmitting) return <LoadingState label="Checking saved session…" />;
  if (user) return <div role="status"><p>You have a saved session for {user.email}. Access to data is checked by the server.</p><Link href="/workspace" className="cd-button cd-button-primary mt-4">Return to overview</Link></div>;
  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        setServerError(loginErrorMessage(res.status));
        requestAnimationFrame(() => alertRef.current?.focus());
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setServerError(loginErrorMessage(err));
      requestAnimationFrame(() => alertRef.current?.focus());
    } finally {
      resetField("password");
    }
  });
  return <form noValidate onSubmit={submit} className="space-y-5" aria-label="Sign in">
    <p className="cd-muted text-sm">Use your existing account. If the authentication service is not connected, sign-in will be unavailable.</p>
    {serverError ? <div tabIndex={-1} ref={alertRef}><ErrorState title="Unable to sign in" description={serverError} /></div> : null}
    <fieldset disabled={isSubmitting} className="min-w-0 space-y-5">
      <Input label="Email" type="email" autoComplete="username" required {...register("email")} error={errors.email?.message} />
      <Input label="Password" type="password" autoComplete="current-password" required {...register("password")} error={errors.password?.message} />
      <Input label="Organization (optional)" autoComplete="off" hint="Enter your organization identifier only if provided by your administrator."
        {...register("organizationSlug", { setValueAs: (value: string) => value === "" ? undefined : value })} error={errors.organizationSlug?.message} />
      <Button type="submit" fullWidth isLoading={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</Button>
    </fieldset>
    <p className="cd-muted text-sm">Need an account or help accessing it? Contact your practice administrator.</p>
  </form>;
}
