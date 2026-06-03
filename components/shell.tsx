"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Kanban, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/simulator", label: "Simulator", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 z-30 border-b border-line bg-night/82 backdrop-blur-xl lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-3 px-5 lg:h-20">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-300 text-slate-950 shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold text-white">AI Sales Copilot</div>
            <div className="text-xs text-slate-400">Revenue command center</div>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-2 lg:overflow-visible">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-fit items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/8 hover:text-white",
                  active && "bg-white/12 text-white shadow-soft"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-5 lg:block">
          <div className="glass rounded-lg p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <BarChart3 className="h-4 w-4 text-cyan-300" />
              AI Copilot active
            </div>
            <p className="text-sm leading-6 text-slate-300">Mock intelligence is scoring leads, drafting replies, and guiding the pipeline.</p>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-night/72 px-4 backdrop-blur-xl sm:px-6 lg:h-20 lg:px-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Premium MVP</div>
            <div className="text-sm text-slate-400">Mock data, local persistence, investor-ready workflow</div>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="green">AI Copilot active</Badge>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-fuchsia-400 text-sm font-bold text-slate-950">
              SM
            </div>
          </div>
        </header>
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
