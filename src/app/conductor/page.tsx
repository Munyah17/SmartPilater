"use client";

import * as React from "react";
import Link from "next/link";
import {
  BusFront,
  DollarSign,
  MonitorSmartphone,
  QrCode,
  Route as RouteIcon,
  Ticket as TicketIcon,
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
  demoConductors,
  demoDrivers,
  demoFares,
  demoOrg,
  demoRoutes,
  demoVehicles,
} from "@/lib/demo-data";
import { listRecentTickets } from "@/lib/offline/db";
import { formatFare, formatMoney, formatTime, shortRef } from "@/lib/format";
import type { Ticket } from "@/types/domain";

/**
 * Conductor portal: the day at a glance. Selling happens on /terminal —
 * this portal answers "how is my day going" and "what did I sell".
 * Today's numbers come from the terminal's own IndexedDB, so they are
 * accurate even before the queue syncs to the server.
 */

const conductor = demoConductors[0];
const vehicle = demoVehicles[0];
const route = demoRoutes[0];
const driver = demoDrivers[0];

export default function ConductorHomePage() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);

  React.useEffect(() => {
    void listRecentTickets(200).then(setTickets).catch(() => {});
  }, []);

  const todayKey = new Date().toDateString();
  const paidToday = tickets.filter(
    (t) => t.paymentStatus === "paid" && new Date(t.issuedAt).toDateString() === todayKey,
  );
  const revenueToday = paidToday.reduce((acc, t) => acc + t.amountCents, 0);
  const publicToday = paidToday.filter((t) => t.channel === "public").length;

  return (
    <>
      <PageHeader
        title={`Mhoro, ${conductor.fullName.split(" ")[0]}`}
        description={`${demoOrg.tradingName} · ${vehicle.registration} · ${route.name}`}
        actions={
          <Button asChild size="lg">
            <Link href="/terminal">
              <MonitorSmartphone className="size-4" />
              Open terminal
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Collected today"
          value={formatMoney(revenueToday, demoOrg.currency)}
          hint="synced from your terminal"
          icon={DollarSign}
        />
        <StatCard
          index={1}
          label="Passengers today"
          value={String(paidToday.length)}
          hint={`${publicToday} paid self-service`}
          icon={Users}
        />
        <StatCard
          index={2}
          label="Vehicle"
          value={vehicle.registration}
          hint={`Driver ${driver.fullName}`}
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

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Latest tickets</CardTitle>
            <CardDescription>
              Everything issued on this device today, including self-service payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paidToday.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <TicketIcon className="size-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No tickets yet today. Open the terminal to start selling.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {paidToday.slice(0, 8).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {t.destination}
                      </span>
                      <span className="block text-xs text-muted-foreground tabular">
                        {shortRef(t.id)} · {formatTime(t.issuedAt)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {t.channel === "public" && (
                        <Badge variant="outline" className="gap-1">
                          <QrCode className="size-3" />
                          self-service
                        </Badge>
                      )}
                      <span className="font-semibold tabular">
                        {formatMoney(t.amountCents, t.currency ?? demoOrg.currency)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {paidToday.length > 0 && (
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/conductor/tickets">See all tickets</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Your fares</CardTitle>
            <CardDescription>
              As a signed-in conductor you can charge any of these — or a custom
              fare for early drop-offs. Self-service passengers always pay the flat{" "}
              {formatFare(route.publicFareCents, demoOrg.currency)} to{" "}
              {route.destination}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {demoFares.map((fare) => (
                <li
                  key={fare.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{fare.label}</p>
                    <p className="text-xs text-muted-foreground">{fare.description}</p>
                  </div>
                  <span className="text-lg font-semibold text-primary tabular">
                    {formatFare(fare.amountCents, demoOrg.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
