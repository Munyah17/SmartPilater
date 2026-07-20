import type { Metadata } from "next";
import { VerifyResult } from "@/components/verify/verify-result";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Verify ticket",
};

// Next 16: dynamic route params are async.
export default async function VerifyCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <div className="relative min-h-screen bg-background px-5">
      <ThemeToggle className="absolute right-4 top-4" />
      <VerifyResult code={decodeURIComponent(code)} />
    </div>
  );
}
