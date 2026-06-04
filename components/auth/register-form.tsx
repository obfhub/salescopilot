"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Building2, Loader2, UserPlus, Users } from "lucide-react";
import { AuthField, AuthMessage } from "@/components/auth/auth-card";
import { registerUser } from "@/app/auth-actions";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"create-company" | "join-company">("create-company");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const companyName = String(formData.get("companyName") ?? "");
    const companyCode = String(formData.get("companyCode") ?? "");
    const role = String(formData.get("role") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const result = await registerUser({ mode, name, companyName, companyCode, role, email, password });
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
      <div className="grid gap-2 rounded-lg border border-line bg-white/5 p-1 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setMode("create-company");
            setError("");
          }}
          className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
            mode === "create-company" ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/8 hover:text-white"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Create company
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("join-company");
            setError("");
          }}
          className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
            mode === "join-company" ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/8 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          Join company
        </button>
      </div>
      <AuthField label="Full name" name="name" type="text" autoComplete="name" placeholder="Jane Cooper" required />
      {mode === "create-company" ? (
        <AuthField label="Company name" name="companyName" type="text" autoComplete="organization" placeholder="Your company" required />
      ) : (
        <AuthField label="Company ID" name="companyCode" type="text" autoComplete="off" placeholder="Paste the Company ID from Settings" required />
      )}
      <AuthField label="Your role" name="role" type="text" autoComplete="organization-title" placeholder="Sales manager" required />
      <AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
      <AuthField label="Password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} />

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-sm font-semibold text-slate-950 shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {mode === "create-company" ? "Create company account" : "Join company account"}
      </button>
    </form>
  );
}
