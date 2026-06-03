import Link from "next/link";
import { Sparkles } from "lucide-react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-slate-950 shadow-glow">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="mt-3 text-lg font-bold text-white">AI Sales Copilot</div>
        </div>

        <div className="glass rounded-2xl border border-line p-7">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-slate-400">{footer}</div> : null}

        <div className="mt-6 text-center text-xs text-slate-600">
          <Link href="/" className="hover:text-slate-400">
            Back to overview
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <input className="field h-11 w-full px-3.5 text-sm" {...props} />
    </label>
  );
}

export function AuthMessage({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      className={
        tone === "error"
          ? "rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200"
          : "rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-200"
      }
    >
      {children}
    </div>
  );
}
