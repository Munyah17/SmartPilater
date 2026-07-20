import type { Metadata } from "next";
import { FleetShell } from "@/components/portal/shells";

export const metadata: Metadata = {
  title: "Fleet console",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FleetShell>{children}</FleetShell>;
}
