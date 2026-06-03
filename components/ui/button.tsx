import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-cyan-400 text-slate-950 shadow-[0_12px_40px_rgba(34,211,238,0.25)] hover:bg-cyan-300",
        variant === "secondary" && "border border-line bg-white/8 text-slate-100 hover:bg-white/12",
        variant === "ghost" && "text-slate-300 hover:bg-white/8 hover:text-white",
        variant === "danger" && "bg-rose-500/16 text-rose-200 hover:bg-rose-500/22",
        className
      )}
      {...props}
    />
  );
}
