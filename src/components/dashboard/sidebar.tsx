"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { BusFront, Menu, Moon, Sun, X, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Shared portal shell: sidebar + mobile drawer + topbar.
 *
 * Every persona portal (super admin, fleet owner, conductor, driver) renders
 * inside this shell with its own nav and identity; the visual chrome stays
 * identical so switching roles never feels like switching products.
 */

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** Match this item only on an exact pathname (for the portal root). */
  exact?: boolean;
}

export interface PortalPersona {
  name: string;
  roleLabel: string;
  initials: string;
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}

function NavLinks({
  nav,
  onNavigate,
}: {
  nav: PortalNavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {nav.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <item.icon className={cn("size-[18px]", active && "text-sidebar-primary")} />
            <span className="flex-1">{item.label}</span>
            {item.badge ? <Badge className="px-1.5">{item.badge}</Badge> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  nav,
  consoleLabel,
  persona,
  children,
}: {
  nav: PortalNavItem[];
  consoleLabel: string;
  persona: PortalPersona;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const sidebarInner = (
    <>
      <Link href="/" className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <BusFront className="size-5" />
        </div>
        <div className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight">
            SmartPilater
          </span>
          <span className="block text-[11px] text-muted-foreground">{consoleLabel}</span>
        </div>
      </Link>
      <NavLinks nav={nav} onNavigate={() => setMobileOpen(false)} />
      <div className="flex items-center gap-3 border-t border-sidebar-border px-5 py-4">
        <Avatar className="size-9">
          <AvatarFallback>{persona.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{persona.name}</p>
          <p className="truncate text-xs text-muted-foreground">{persona.roleLabel}</p>
        </div>
        <ThemeToggle />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar shadow-lifted">
            <button
              className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            {sidebarInner}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar */}
        <header className="glass sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-sm font-semibold">{consoleLabel}</span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
