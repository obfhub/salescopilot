"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { UserPlus, Loader2 } from "lucide-react";
import { AuthField, AuthMessage } from "@/components/auth/auth-card";
import { registerUser } from "@/app/auth-actions";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const result = await registerUser({ name, email, password });
      if (!result.ok) {
        setError(result.error ?? "Could not create account.");
        return;
      }

      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (signInResult?.error) {
        router.push("/login");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
      <AuthField label="Full name" name="name" type="text" autoComplete="name" placeholder="Jane Cooper" required />
      <AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
      <AuthField label="Password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} />

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-sm font-semibold text-slate-950 shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Create account
      </button>
    </form>
  );
}
