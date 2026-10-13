"use client";
import { useState } from "react";

export function ChangePasswordForm() {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function submit(fd: FormData): Promise<void> {
    setMsg(null);
    setErr(null);
    const payload = {
      currentPassword: String(fd.get("currentPassword") ?? ""),
      newPassword: String(fd.get("newPassword") ?? ""),
    };
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg(data.message ?? "Password changed. Please sign in again.");
      // Optionally redirect to login after a delay
    } else {
      setErr((data.message as string) ?? `Failed: ${res.status}`);
    }
  }
  return (
    <form action={submit} className="space-y-4 max-w-md">
      <label className="block"><span className="text-sm">Current password *</span><input name="currentPassword" type="password" required className="cd-input w-full" /></label>
      <label className="block"><span className="text-sm">New password * (10+ chars, upper/lower/digit)</span><input name="newPassword" type="password" required className="cd-input w-full" /></label>
      <button type="submit" className="cd-button cd-button-primary">Change password</button>
      {msg ? <div role="status" className="cd-muted text-sm">{msg}</div> : null}
      {err ? <div role="alert" className="text-sm text-red-700">{err}</div> : null}
    </form>
  );
}
