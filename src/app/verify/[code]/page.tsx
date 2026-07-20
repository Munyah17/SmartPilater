import type { Metadata } from "next";
import { VerifyResult } from "@/components/verify/verify-result";

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
    <div className="min-h-screen bg-background px-5">
      <VerifyResult code={decodeURIComponent(code)} />
    </div>
  );
}
