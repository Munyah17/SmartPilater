import type { Metadata } from "next";
import { ConductorShell } from "@/components/portal/shells";

export const metadata: Metadata = {
  title: "Conductor",
};

export default function ConductorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConductorShell>{children}</ConductorShell>;
}
