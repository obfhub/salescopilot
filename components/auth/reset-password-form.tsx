"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { AuthField, AuthMessage } from "@/components/auth/auth-card";
import { resetPassword } from "@/app/auth-actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!token) {
    return <AuthMessage tone="error">Missing reset token. Request a new link from the forgot password page.</AuthMessage>;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const result = await resetPassword({ token, password });
      if (!result.ok) {
        setError(result.error ?? "Could not reset password.");
        return;
      }
      setSuccess(result.message ?? "Password updated.");
      setTimeout(() => router.push("/login"), 1500);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
      {success ? <AuthMessage tone="success">{success}</AuthMessage> : null}
      <AuthField label="New password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} />

      <button
        type="submit"
        disabled={isPending || Boolean(success)}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-sm font-semibold text-slate-950 shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Update password
      </button>

      <div className="text-center text-xs text-slate-500">
        <Link href="/login" className="hover:text-slate-300">
          Return to sign in
        </Link>
      </div>
    </form>
  );
}
