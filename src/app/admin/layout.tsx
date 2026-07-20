import type { Metadata } from "next";
import { AdminShell } from "@/components/portal/shells";

export const metadata: Metadata = {
  title: "Super admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
