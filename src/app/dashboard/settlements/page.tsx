"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { demoSettlements, withLatency } from "@/lib/demo-data";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";

export default function SettlementsPage() {
  const { data: settlements } = useQuery({
    queryKey: ["settlements"],
    queryFn: () => withLatency(demoSettlements),
  });

  const exportCsv = () => {
    if (!settlements) return;
    downloadCsv(
      "smartpilater-settlements.csv",
      ["Period start", "Period end", "Gross", "Gateway fees", "Net", "Transactions", "Status"],
      settlements.map((s) => [
        formatDate(s.periodStart),
        formatDate(s.periodEnd),
        (s.grossCents / 100).toFixed(2),
        (s.feesCents / 100).toFixed(2),
        (s.netCents / 100).toFixed(2),
        String(s.transactionCount),
        s.status,
      ]),
    );
  };

  return (
    <>
      <PageHeader
        title="Settlements"
        description="Weekly payouts to the fleet account, with gateway fees itemised."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={!settlements}>
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5">Period</th>
                <th className="px-5 py-3.5 text-right">Gross</th>
                <th className="px-5 py-3.5 text-right">Gateway fees</th>
                <th className="px-5 py-3.5 text-right">Net settlement</th>
                <th className="px-5 py-3.5 text-right">Transactions</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Paid</th>
              </tr>
            </thead>
            <tbody>
              {settlements
                ? settlements.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-5 py-4 font-medium">
                        {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
                      </td>
                      <td className="px-5 py-4 text-right tabular">
                        {formatMoney(s.grossCents)}
                      </td>
                      <td className="px-5 py-4 text-right text-muted-foreground tabular">
                        −{formatMoney(s.feesCents)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold tabular">
                        {formatMoney(s.netCents)}
                      </td>
                      <td className="px-5 py-4 text-right text-muted-foreground tabular">
                        {formatNumber(s.transactionCount)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={s.status === "paid" ? "success" : "warning"}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {s.paidAt ? formatDate(s.paidAt) : "—"}
                      </td>
                    </tr>
                  ))
                : Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td colSpan={7} className="px-5 py-4">
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
