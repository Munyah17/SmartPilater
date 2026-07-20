import type { Metadata } from "next";
import { PublicPayFlow } from "@/components/pay/public-pay-flow";

export const metadata: Metadata = {
  title: "Pay your fare",
};

// Next 16: dynamic route params are async.
export default async function PayVehiclePage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  return (
    <div className="min-h-screen bg-background">
      <PublicPayFlow vehicleId={decodeURIComponent(vehicleId)} />
    </div>
  );
}
