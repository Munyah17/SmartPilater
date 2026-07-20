"use client";

import * as React from "react";
import {
  Banknote,
  Bell,
  Building2,
  BusFront,
  ClipboardCheck,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  Map,
  MonitorSmartphone,
  QrCode,
  Route as RouteIcon,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import { DashboardShell, type PortalNavItem } from "@/components/dashboard/sidebar";

/**
 * One shell per persona. Client components so the icon references stay on
 * the client side of the server/client boundary; layouts just pick a shell.
 */

const adminNav: PortalNavItem[] = [
  { href: "/admin", label: "Platform overview", icon: Gauge, exact: true },
  { href: "/admin/organizations", label: "Fleet companies", icon: Building2 },
  { href: "/admin/payments", label: "Payments & rails", icon: Banknote },
  { href: "/admin/devices", label: "All devices", icon: MonitorSmartphone },
  { href: "/admin/settings", label: "Platform settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      nav={adminNav}
      consoleLabel="Super admin"
      persona={{ name: "Munya", roleLabel: "Platform owner", initials: "MU" }}
    >
      {children}
    </DashboardShell>
  );
}

const fleetNav: PortalNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/vehicles", label: "Vehicles", icon: BusFront },
  { href: "/dashboard/routes", label: "Routes & fares", icon: Map },
  { href: "/dashboard/staff", label: "Drivers & conductors", icon: Users },
  { href: "/dashboard/devices", label: "Devices", icon: MonitorSmartphone },
  { href: "/dashboard/public-pay", label: "Public pay QRs", icon: QrCode },
  { href: "/dashboard/settlements", label: "Settlements", icon: Wallet },
  { href: "/dashboard/reports", label: "Reports", icon: FileBarChart },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, badge: 3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function FleetShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      nav={fleetNav}
      consoleLabel="Fleet console"
      persona={{ name: "Seke Express", roleLabel: "Fleet owner", initials: "SE" }}
    >
      {children}
    </DashboardShell>
  );
}

const conductorNav: PortalNavItem[] = [
  { href: "/conductor", label: "My day", icon: Gauge, exact: true },
  { href: "/conductor/tickets", label: "Tickets", icon: Ticket },
  { href: "/terminal", label: "Open terminal", icon: MonitorSmartphone },
];

export function ConductorShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      nav={conductorNav}
      consoleLabel="Conductor"
      persona={{ name: "Tatenda Marufu", roleLabel: "Conductor", initials: "TM" }}
    >
      {children}
    </DashboardShell>
  );
}

const driverNav: PortalNavItem[] = [
  { href: "/driver", label: "My day", icon: Gauge, exact: true },
  { href: "/driver/vehicle", label: "My vehicle", icon: ClipboardCheck },
  { href: "/terminal", label: "Open terminal", icon: MonitorSmartphone },
];

export function DriverShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      nav={driverNav}
      consoleLabel="Driver"
      persona={{ name: "Tendai Moyo", roleLabel: "Driver", initials: "TM" }}
    >
      {children}
    </DashboardShell>
  );
}

export { RouteIcon, ShieldCheck };
