"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BusFront,
  DollarSign,
  MonitorSmartphone,
  Route as RouteIcon,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  demoAlerts,
  demoConductors,
  demoDrivers,
  demoOrg,
  demoRoutes,
  demoTerminals,
  demoVehicles,
} from "@/lib/demo-data";
import { listRecentTickets } from "@/lib/offline/db";
import { formatMoney, formatTime } from "@/lib/format";
import type { Ticket } from "@/types/domain";

/**
 * Driver portal: read-only view of the day plus vehicle duties. Drivers can
 * also sell on the terminal when running without a conductor — the same
 * custom-fare rights apply because they are signed-in, accountable staff.
 */

const driver = demoDrivers[0];
const vehicle = demoVehicles[0];
const route = demoRoutes[0];
const conductor = demoConductors[0];
const terminal = demoTerminals[0];

export default function DriverHomePage() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);

  React.useEffect(() => {
    void listRecentTickets(200).then(setTickets).catch(() => {});
  }, []);

  const todayKey = new Date().toDateString();
  const paidToday = tickets.filter(
    (t) => t.paymentStatus === "paid" && new Date(t.issuedAt).toDateString() === todayKey,
  );
  const revenueToday = paidToday.reduce((acc, t) => acc + t.amountCents, 0);
  const vehicleAlerts = demoAlerts.filter(
    (a) => a.terminalId === vehicle.terminalId && !a.acknowledged,
  );

  return (
    <>
      <PageHeader
        title={`Mhoro, ${driver.fullName.split(" ")[0]}`}
        description={`${demoOrg.tradingName} · ${vehicle.registration} · ${route.name}`}
        actions={
          <Button asChild size="lg" variant="outline">
            <Link href="/terminal">
              <MonitorSmartphone className="size-4" />
              Sell without conductor
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Takings today"
          value={formatMoney(revenueToday, demoOrg.currency)}
          hint={`collected by ${conductor.fullName.split(" ")[0]}`}
          icon={DollarSign}
        />
        <StatCard
          index={1}
          label="Passengers today"
          value={String(paidToday.length)}
          hint="paid tickets on this vehicle"
          icon={Users}
        />
        <StatCard
          index={2}
          label="Vehicle"
          value={vehicle.registration}
          hint={vehicle.model}
          icon={BusFront}
        />
        <StatCard
          index={3}
          label="Route"
          value={route.origin.split(" ")[0]}
          hint={`→ ${route.destination}`}
          icon={RouteIcon}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s timeline</CardTitle>
            <CardDescription>Latest passengers boarding your kombi.</CardDescription>
          </CardHeader>
          <CardContent>
            {paidToday.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No paid tickets yet today.
              </p>
            ) : (
              <ul className="space-y-2">
                {paidToday.slice(0, 8).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm"
                  >
                    <span>
                      {t.destination}
                      <span className="ml-2 text-xs text-muted-foreground tabular">
                        {formatTime(t.issuedAt)}
                      </span>
                    </span>
                    <span className="font-semibold tabular">
                      {formatMoney(t.amountCents, t.currency ?? demoOrg.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Device & alerts
                {vehicleAlerts.length > 0 && (
                  <Badge className="border-transparent bg-warning/10 text-warning-foreground dark:text-warning">
                    {vehicleAlerts.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Terminal {terminal.serial} · battery {terminal.batteryPercent}% ·{" "}
                {terminal.status}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vehicleAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No open alerts for your vehicle. Keep the terminal on charge.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {vehicleAlerts.map((alert) => (
                    <li key={alert.id} className="flex items-start gap-2.5 text-sm">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning" />
                      <span>{alert.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crew</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Conductor</span>
                <span className="font-medium">{conductor.fullName}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Licence</span>
                <span className="font-medium tabular">{driver.licenceNumber}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Fleet contact</span>
                <span className="font-medium tabular">{demoOrg.phone}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
