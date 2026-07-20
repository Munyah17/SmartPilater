import type { Metadata } from "next";
import { TerminalApp } from "@/components/terminal/terminal-app";

export const metadata: Metadata = {
  title: "Terminal",
};

export default function TerminalPage() {
  return <TerminalApp />;
}
