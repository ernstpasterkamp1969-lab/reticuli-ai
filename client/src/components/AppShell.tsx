import { ReactNode, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Bot, Image as ImageIcon, Settings2, Sparkles } from "lucide-react";
import SettingsPanel from "@/components/SettingsPanel";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  testId: string;
};

export default function AppShell({
  children,
  title,
  subtitle,
  rightSlot,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}) {
  const [location] = useLocation();

  const navItems: NavItem[] = useMemo(
    () => [
      { href: "/", label: "Chat", icon: <Bot className="h-4 w-4" />, testId: "link-nav-chat" },
      {
        href: "/image-lab",
        label: "Image Lab",
        icon: <ImageIcon className="h-4 w-4" />,
        testId: "link-nav-image-lab",
      },
    ],
    [],
  );

  return (
    <div className="reti-bg min-h-screen">
      <div className="scanlines absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="grain overflow-hidden rounded-3xl border border-sidebar-border/80 bg-sidebar/70 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary/25 to-accent/18 ring-1 ring-primary/20 shadow-[var(--shadow-sm)]">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="display truncate text-lg font-bold tracking-tight">
                        Reti
                      </div>
                      <div className="mono truncate text-xs text-muted-foreground">
                        Reticuli // secure channel
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/40 px-2 py-1 text-[11px] text-muted-foreground shadow-[var(--shadow-2xs)]">
                  v0.1
                </div>
              </div>

              <div className="mt-5 h-px w-full soft-divider opacity-80" />

              <nav className="mt-4 space-y-2">
                {navItems.map((item) => {
                  const active = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-testid={item.testId}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-300",
                        "focus:outline-none focus:ring-4 focus:ring-primary/15",
                        active
                          ? "border-primary/35 bg-gradient-to-r from-primary/14 to-accent/10 text-foreground shadow-[var(--shadow-sm)]"
                          : "border-border/70 bg-card/20 text-muted-foreground hover:border-border hover:bg-card/30 hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-xl border transition-all duration-300",
                          active
                            ? "border-primary/25 bg-primary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]"
                            : "border-border/70 bg-background/20 text-foreground/80 group-hover:border-border group-hover:bg-background/25",
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      <span
                        className={cn(
                          "ml-auto h-2 w-2 rounded-full transition-all duration-300",
                          active ? "bg-primary shadow-[0_0_0_6px_hsl(var(--primary)/0.12)]" : "bg-muted",
                        )}
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-5 h-px w-full soft-divider opacity-80" />

              <div className="mt-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  <Settings2 className="h-3.5 w-3.5" />
                  Instellingen
                </div>
                <div className="mt-3">
                  <SettingsPanel />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border/70 bg-card/20 p-4 shadow-[var(--shadow-xs)]">
                <div className="mono text-xs text-muted-foreground">
                  Tip: zet de provider-volgorde op jouw voorkeur. Reti schakelt direct over bij
                  falen.
                </div>
              </div>
            </div>
          </aside>

          <main className="grain overflow-hidden rounded-3xl border border-card-border/80 bg-card/65 shadow-[var(--shadow-xl)] backdrop-blur-xl">
            <header className="border-b border-border/70 bg-gradient-to-r from-background/30 to-background/10 p-5 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                  <h1 className="text-balance text-2xl font-extrabold leading-tight sm:text-3xl">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
                {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
              </div>
            </header>

            <div className="p-4 sm:p-6 lg:p-7">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
