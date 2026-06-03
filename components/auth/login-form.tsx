"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogIn, Loader2 } from "lucide-react";
import { AuthField, AuthMessage } from "@/components/auth/auth-card";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
      <AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
      <AuthField label="Password" name="password" type="password" autoComplete="current-password" placeholder="********" required />

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-sm font-semibold text-slate-950 shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Sign in
      </button>
    </form>
  );
}
