"use client";

import { useState, useTransition } from "react";
import { Mail, Loader2 } from "lucide-react";
import { AuthField, AuthMessage } from "@/components/auth/auth-card";
import { requestPasswordReset } from "@/app/auth-actions";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");

    startTransition(async () => {
      const result = await requestPasswordReset({ email });
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setSuccess(result.message ?? "Check your inbox for the reset link.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
      {success ? <AuthMessage tone="success">{success}</AuthMessage> : null}
      <AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-sm font-semibold text-slate-950 shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Send reset link
      </button>
    </form>
  );
}
