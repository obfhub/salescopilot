import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "cyan" | "blue" | "purple" | "green" | "amber" | "rose" | "slate";
};

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        tone === "cyan" && "border-cyan-300/30 bg-cyan-300/12 text-cyan-100",
        tone === "blue" && "border-blue-300/30 bg-blue-300/12 text-blue-100",
        tone === "purple" && "border-fuchsia-300/30 bg-fuchsia-300/12 text-fuchsia-100",
        tone === "green" && "border-emerald-300/30 bg-emerald-300/12 text-emerald-100",
        tone === "amber" && "border-amber-300/30 bg-amber-300/12 text-amber-100",
        tone === "rose" && "border-rose-300/30 bg-rose-300/12 text-rose-100",
        tone === "slate" && "border-slate-300/20 bg-slate-300/10 text-slate-200",
        className
      )}
      {...props}
    />
  );
}
