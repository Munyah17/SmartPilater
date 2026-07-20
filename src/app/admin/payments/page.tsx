"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed, Zap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PaymentMixList } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buildSnapshot, withLatency } from "@/lib/demo-data";
import { recentPlatformTransactions } from "@/lib/demo-platform";
import { isEcocashLive, listAdapters } from "@/lib/payments/registry";
import { formatDateTime, formatMoney } from "@/lib/format";

export default function AdminPaymentsPage() {
  const ecocashLive = isEcocashLive();
  const adapters = listAdapters();
  const transactions = recentPlatformTransactions();

  const { data: snapshot } = useQuery({
    queryKey: ["dashboard-snapshot"],
    queryFn: () => withLatency(buildSnapshot()),
  });

  return (
    <>
      <PageHeader
        title="Payments & rails"
        description="Provider adapters, the EcoCash Instant Payment rail and the latest transactions."
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                EcoCash Instant Payment
                <Badge
                  className={
                    ecocashLive
                      ? "border-transparent bg-success/10 text-success"
                      : "border-transparent bg-muted text-muted-foreground"
                  }
                >
                  {ecocashLive ? "Sandbox live" : "Simulated"}
                </Badge>
              </CardTitle>
              <CardDescription>
                USSD push charges with webhook callbacks. Passengers approve with
                their wallet PIN — QR optional, phone number is enough.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm">
                {[
                  {
                    done: true,
                    label: "Charge request (API 1) via /api/payments/ecocash/charge",
                  },
                  {
                    done: true,
                    label: "Transaction lookup (API 2) polled at 1 Hz during payment",
                  },
                  {
                    done: true,
                    label: "Refund / reversal (API 3) for fleet-owner disputes",
                  },
                  {
                    done: true,
                    label: "notifyUrl webhook receiver storing payment events",
                  },
                  {
                    done: ecocashLive,
                    label: ecocashLive
                      ? "Sandbox credentials active — PIN matrix: 0000 pass, 1111 low funds, 2222 wrong PIN, 9999 limit"
                      : "Add EIP credentials in .env to go live (see .env.example)",
                  },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5">
                    {item.done ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : (
                      <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className={item.done ? "" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent transactions</CardTitle>
              <CardDescription>Latest paid fares across all fleets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Reference</th>
                      <th className="pb-2 font-medium">Fleet</th>
                      <th className="pb-2 font-medium">Provider</th>
                      <th className="pb-2 font-medium">When</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-border/40 last:border-0">
                        <td className="py-2.5 font-medium tabular">{t.reference}</td>
                        <td className="py-2.5">{t.orgName}</td>
                        <td className="py-2.5 capitalize">{t.provider}</td>
                        <td className="py-2.5 text-muted-foreground">
                          {formatDateTime(t.createdAt)}
                        </td>
                        <td className="py-2.5 text-right font-semibold tabular">
                          {formatMoney(t.amountCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>Registered adapters</CardTitle>
              <CardDescription>
                Every rail implements the same createIntent / checkStatus / refund
                contract.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {adapters.map((adapter) => (
                  <li
                    key={adapter.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm"
                  >
                    <span className="font-medium">{adapter.displayName}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {adapter.flow}
                      </Badge>
                      {adapter.id === "ecocash" && ecocashLive ? (
                        <Badge className="border-transparent bg-success/10 text-success">
                          live
                        </Badge>
                      ) : (
                        <Badge className="border-transparent bg-muted text-muted-foreground">
                          simulated
                        </Badge>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
