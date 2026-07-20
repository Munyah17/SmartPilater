"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Building2,
  DollarSign,
  MonitorSmartphone,
  Ticket,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { RevenueTrendChart } from "@/components/dashboard/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { withLatency } from "@/lib/demo-data";
import { buildPlatformSnapshot, platformOrgs } from "@/lib/demo-platform";
import { formatCompactMoney, formatMoney, formatNumber } from "@/lib/format";

const statusVariant: Record<string, string> = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning-foreground dark:text-warning",
  suspended: "bg-destructive/10 text-destructive",
};

export default function AdminOverviewPage() {
  const { data: snapshot } = useQuery({
    queryKey: ["platform-snapshot"],
    queryFn: () => withLatency(buildPlatformSnapshot()),
  });

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Every fleet company, terminal and dollar moving through SmartPilater."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot ? (
          <>
            <StatCard
              index={0}
              label="GMV this month (USD)"
              value={formatCompactMoney(snapshot.monthGmvUsdCents)}
              hint={`+ ${formatMoney(snapshot.monthGmvZwgCents, "ZWG")} ZiG fleets`}
              icon={DollarSign}
            />
            <StatCard
              index={1}
              label="Platform fee revenue"
              value={formatMoney(snapshot.monthFeeUsdCents)}
              hint={`+ ${formatMoney(snapshot.monthFeeZwgCents, "ZWG")}`}
              icon={Banknote}
            />
            <StatCard
              index={2}
              label="Fleet companies"
              value={formatNumber(snapshot.activeOrgs)}
              hint={`${snapshot.pendingOrgs} awaiting approval`}
              icon={Building2}
            />
            <StatCard
              index={3}
              label="Terminals online"
              value={`${snapshot.terminalsOnline}/${snapshot.terminalsTotal}`}
              hint={`${formatNumber(snapshot.totalVehicles)} vehicles registered`}
              icon={MonitorSmartphone}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Platform GMV, last 14 days</CardTitle>
            <CardDescription>Paid fares across all USD fleets</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot ? (
              <RevenueTrendChart data={snapshot.gmvByDay} />
            ) : (
              <Skeleton className="h-[280px] w-full" />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Fleet companies</CardTitle>
            <CardDescription>Gross this month · platform status</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {platformOrgs.map((org) => (
                <li key={org.id}>
                  <Link
                    href="/admin/organizations"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {org.tradingName}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {org.city} · {org.vehicles} vehicles
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-semibold tabular">
                        {org.monthGrossCents === 0
                          ? "—"
                          : formatCompactMoney(org.monthGrossCents)}
                        {org.currency === "ZWG" && (
                          <span className="ml-1 text-xs text-muted-foreground">ZiG</span>
                        )}
                      </span>
                      <Badge
                        className={`border-transparent capitalize ${statusVariant[org.status]}`}
                      >
                        {org.status}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Today across the platform</CardTitle>
            <CardDescription>
              {snapshot ? (
                <span className="flex items-center gap-1.5">
                  <Ticket className="size-3.5" />
                  {formatNumber(snapshot.ticketsToday)} tickets sold so far today on
                  Seke Express alone — the busiest window is the evening peak.
                </span>
              ) : (
                "Loading…"
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
