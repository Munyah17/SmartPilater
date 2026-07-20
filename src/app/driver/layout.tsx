import type { Metadata } from "next";
import { DriverShell } from "@/components/portal/shells";

export const metadata: Metadata = {
  title: "Driver",
};

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DriverShell>{children}</DriverShell>;
}
