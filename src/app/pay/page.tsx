import type { Metadata } from "next";
import Link from "next/link";
import { BusFront, ChevronRight, QrCode } from "lucide-react";
import { demoOrg, demoRoutes, demoVehicles } from "@/lib/demo-data";
import { formatFare } from "@/lib/format";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Pay your fare",
};

/**
 * Public pay entry point. In the real world a passenger lands directly on
 * /pay/[vehicleId] by scanning the QR sticker inside the kombi; this page
 * exists for people who type the address, and as the demo picker.
 */
export default function PayIndexPage() {
  const vehicles = demoVehicles.filter((v) => v.active);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-10">
      <div className="flex items-center gap-2.5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <QrCode className="size-5" />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="text-lg font-semibold tracking-tight">Pay your fare</h1>
          <p className="text-xs text-muted-foreground">
            No conductor needed — pay and ride
          </p>
        </div>
        <ThemeToggle />
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        Scan the QR sticker inside your kombi to pay directly, or choose the
        vehicle below. Self-service tickets are one flat fare to the route&apos;s
        final destination — early drop-offs and special fares are handled by
        the conductor.
      </p>

      <ul className="mt-6 space-y-3">
        {vehicles.map((vehicle) => {
          const route = demoRoutes.find((r) => r.id === vehicle.routeId);
          if (!route) return null;
          return (
            <li key={vehicle.id}>
              <Link
                href={`/pay/${vehicle.id}`}
                className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition-shadow hover:shadow-lifted"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BusFront className="size-5" />
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="font-semibold tracking-tight">{vehicle.registration}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {demoOrg.tradingName} · {route.name}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-semibold text-primary tabular">
                  {formatFare(route.publicFareCents, demoOrg.currency)}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Powered by SmartPilater · Tickets are verifiable by the crew
      </p>
    </div>
  );
}
