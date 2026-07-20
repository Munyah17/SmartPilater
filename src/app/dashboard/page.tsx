"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BusFront,
  DollarSign,
  MonitorSmartphone,
  Route as RouteIcon,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import {
  HourlyPassengersChart,
  PaymentMixList,
  RevenueTrendChart,
} from "@/components/dashboard/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buildSnapshot, withLatency } from "@/lib/demo-data";
import { formatCompactMoney, formatMoney, formatNumber } from "@/lib/format";

export default function OverviewPage() {
  const { data: snapshot } = useQuery({
    queryKey: ["dashboard-snapshot"],
    queryFn: () => withLatency(buildSnapshot()),
  });

  return (
    <>
      <PageHeader
        title="Overview"
        description="Live picture of the fleet: revenue, passengers and terminals right now."
      />

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot ? (
          <>
            <StatCard
              index={0}
              label="Revenue today"
              value={formatMoney(snapshot.todayRevenueCents)}
              delta={snapshot.revenueDeltaPercent}
              hint="vs yesterday"
              icon={DollarSign}
            />
            <StatCard
              index={1}
              label="Passengers today"
              value={formatNumber(snapshot.todayPassengers)}
              delta={snapshot.passengersDeltaPercent}
              hint="vs yesterday"
              icon={Users}
            />
            <StatCard
              index={2}
              label="Trips completed"
              value={formatNumber(snapshot.todayTrips * 5)}
              delta={snapshot.tripsDeltaPercent}
              hint="across all vehicles"
              icon={RouteIcon}
            />
            <StatCard
              index={3}
              label="Terminals online"
              value={`${snapshot.activeTerminals}/${snapshot.totalTerminals}`}
              hint="1 offline · 1 degraded"
              icon={MonitorSmartphone}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Revenue, last 14 days</CardTitle>
            <CardDescription>Paid fares across the whole fleet</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot ? (
              <RevenueTrendChart data={snapshot.revenueByDay} />
            ) : (
              <Skeleton className="h-[280px] w-full" />
            )}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Payment mix</CardTitle>
            <CardDescription>Share of paid tickets by provider</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot ? (
              <PaymentMixList data={snapshot.paymentMix} />
            ) : (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Passengers by hour, today</CardTitle>
            <CardDescription>
              Peak waves around 06:00–09:00 and 16:00–19:00
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot ? (
              <HourlyPassengersChart data={snapshot.revenueByHour} />
            ) : (
              <Skeleton className="h-[280px] w-full" />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Top routes</CardTitle>
              <CardDescription>All-time paid revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {snapshot ? (
                <ul className="space-y-3">
                  {snapshot.topRoutes.map((route) => (
                    <li
                      key={route.routeId}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BusFront className="size-4" />
                        </span>
                        <span className="truncate font-medium">{route.name}</span>
                      </span>
                      <span className="shrink-0 font-semibold tabular">
                        {formatCompactMoney(route.revenueCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top conductors</CardTitle>
              <CardDescription>Ranked by collected revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {snapshot ? (
                <ul className="space-y-3">
                  {snapshot.topConductors.map((conductor, i) => (
                    <li
                      key={conductor.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground tabular">
                          {i + 1}
                        </span>
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {conductor.name
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">{conductor.name}</span>
                      </span>
                      <span className="shrink-0 font-semibold tabular">
                        {formatCompactMoney(conductor.revenueCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
