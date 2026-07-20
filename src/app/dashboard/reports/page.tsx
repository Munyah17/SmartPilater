"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  demoConductors,
  demoRoutes,
  demoTickets,
  demoVehicles,
  withLatency,
} from "@/lib/demo-data";
import { downloadCsv } from "@/lib/csv";
import { formatMoney, formatNumber } from "@/lib/format";

/**
 * Report generator. Each report is an aggregation over the ticket ledger;
 * in production these map one-to-one onto the reporting views in Postgres.
 */

type ReportKey = "route" | "vehicle" | "conductor" | "provider" | "failed";

const reportTabs: { key: ReportKey; label: string }[] = [
  { key: "route", label: "By route" },
  { key: "vehicle", label: "By vehicle" },
  { key: "conductor", label: "By conductor" },
  { key: "provider", label: "By provider" },
  { key: "failed", label: "Failed & cancelled" },
];

interface ReportRow {
  name: string;
  tickets: number;
  revenueCents: number;
}

function aggregate(key: ReportKey): ReportRow[] {
  const paid = demoTickets.filter((t) => t.paymentStatus === "paid");

  if (key === "failed") {
    const failed = demoTickets.filter((t) => t.paymentStatus !== "paid");
    const byReason = new Map<string, ReportRow>();
    for (const t of failed) {
      const label = t.paymentStatus === "failed" ? "Failed payments" : `${t.paymentStatus[0].toUpperCase()}${t.paymentStatus.slice(1)} payments`;
      const row = byReason.get(label) ?? { name: label, tickets: 0, revenueCents: 0 };
      row.tickets += 1;
      row.revenueCents += t.amountCents;
      byReason.set(label, row);
    }
    return [...byReason.values()].sort((a, b) => b.tickets - a.tickets);
  }

  const groupOf = (ticket: (typeof paid)[number]): string => {
    switch (key) {
      case "route":
        return demoRoutes.find((r) => r.id === ticket.routeId)?.name ?? "Unknown route";
      case "vehicle":
        return (
          demoVehicles.find((v) => v.id === ticket.vehicleId)?.registration ??
          "Unknown vehicle"
        );
      case "conductor":
        return (
          demoConductors.find((c) => c.assignedVehicleId === ticket.vehicleId)
            ?.fullName ?? "Unassigned"
        );
      case "provider":
        return ticket.provider.toUpperCase();
    }
  };

  const groups = new Map<string, ReportRow>();
  for (const t of paid) {
    const name = groupOf(t);
    const row = groups.get(name) ?? { name, tickets: 0, revenueCents: 0 };
    row.tickets += 1;
    row.revenueCents += t.amountCents;
    groups.set(name, row);
  }
  return [...groups.values()].sort((a, b) => b.revenueCents - a.revenueCents);
}

export default function ReportsPage() {
  const [report, setReport] = React.useState<ReportKey>("route");
  const { data: rows } = useQuery({
    queryKey: ["report", report],
    queryFn: () => withLatency(aggregate(report), 350),
  });

  const activeLabel = reportTabs.find((t) => t.key === report)?.label ?? "";

  return (
    <>
      <PageHeader
        title="Reports"
        description="Revenue and volume, cut whichever way the question is asked. Everything exports."
        actions={
          <Button
            variant="outline"
            disabled={!rows}
            onClick={() =>
              rows &&
              downloadCsv(
                `smartpilater-report-${report}.csv`,
                ["Group", "Tickets", "Revenue"],
                rows.map((r) => [r.name, String(r.tickets), (r.revenueCents / 100).toFixed(2)]),
              )
            }
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <Tabs value={report} onValueChange={(v) => setReport(v as ReportKey)}>
        <TabsList className="h-auto flex-wrap">
          {reportTabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5">{activeLabel.replace("By ", "")}</th>
                <th className="px-5 py-3.5 text-right">Tickets</th>
                <th className="px-5 py-3.5 text-right">
                  {report === "failed" ? "Value not collected" : "Revenue"}
                </th>
                <th className="px-5 py-3.5 text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {rows ? (
                rows.map((row) => {
                  const total = rows.reduce((acc, r) => acc + r.revenueCents, 0) || 1;
                  const share = Math.round((row.revenueCents / total) * 100);
                  return (
                    <tr
                      key={row.name}
                      className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-5 py-4 font-medium">{row.name}</td>
                      <td className="px-5 py-4 text-right text-muted-foreground tabular">
                        {formatNumber(row.tickets)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold tabular">
                        {formatMoney(row.revenueCents)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <span
                              className="block h-full rounded-full bg-primary"
                              style={{ width: `${share}%` }}
                            />
                          </span>
                          <span className="w-9 text-right text-muted-foreground tabular">
                            {share}%
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td colSpan={4} className="px-5 py-4">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
