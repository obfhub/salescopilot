"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BarChart3, Bot, Inbox, Kanban, LayoutDashboard, LogOut, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useDemoMode } from "@/contexts/demo-mode-context";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/capture", label: "Capture", icon: Inbox },
  { href: "/simulator", label: "Simulator", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings }
];

const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

function initialsFrom(value: string) {
  const parts = value.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isDemoMode, setDemoMode } = useDemoMode();

  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isAuthRoute) {
    return <>{children}</>;
  }

  const displayName = session?.user?.name || session?.user?.email || "Account";
  const initials = initialsFrom(displayName);
  const withDemo = (href: string) => (isDemoMode ? `${href}?demo=1` : href);

  function updateDemoMode(enabled: boolean) {
    setDemoMode(enabled);
    const params = new URLSearchParams(window.location.search);
    if (enabled) {
      params.set("demo", "1");
    } else {
      params.delete("demo");
    }

    const targetPath = pathname.startsWith("/leads/") ? "/" : pathname;
    const query = params.toString();
    router.push(`${targetPath}${query ? `?${query}` : ""}`);
  }

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
                href={withDemo(item.href)}
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
            <p className="text-sm leading-6 text-slate-300">Live intelligence is scoring leads, drafting replies, and guiding the pipeline.</p>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-night/72 px-4 backdrop-blur-xl sm:px-6 lg:h-20 lg:px-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Premium MVP</div>
            <div className="text-sm text-slate-400">Live database, AI analysis, investor-ready workflow</div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/8">
              <input
                type="checkbox"
                checked={isDemoMode}
                onChange={(event) => updateDemoMode(event.target.checked)}
                className="h-4 w-4 accent-cyan-300"
              />
              Demo
            </label>
            <Badge tone="green">AI Copilot active</Badge>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-white">{displayName}</div>
              {session?.user?.email ? <div className="text-xs text-slate-400">{session.user.email}</div> : null}
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-fuchsia-400 text-sm font-bold text-slate-950">
              {initials}
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Sign out"
              className="grid h-10 w-10 place-items-center rounded-lg border border-line text-slate-300 transition hover:bg-white/8 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
