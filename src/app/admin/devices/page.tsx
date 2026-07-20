"use client";

import * as React from "react";
import {
  Battery,
  BatteryLow,
  MonitorSmartphone,
  Printer,
  Signal,
  Wifi,
  WifiOff,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { demoTerminals } from "@/lib/demo-data";
import { platformOrgs } from "@/lib/demo-platform";
import { formatDateTime } from "@/lib/format";

const statusStyle: Record<string, string> = {
  online: "bg-success/10 text-success",
  degraded: "bg-warning/10 text-warning-foreground dark:text-warning",
  offline: "bg-destructive/10 text-destructive",
};

export default function AdminDevicesPage() {
  return (
    <>
      <PageHeader
        title="All devices"
        description="Terminal estate across every fleet — health, software versions and sync."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {platformOrgs
          .filter((o) => o.terminals > 0)
          .map((org) => (
            <Card key={org.id}>
              <CardHeader className="pb-2">
                <CardDescription>{org.tradingName}</CardDescription>
                <CardTitle className="text-2xl tabular">
                  {org.terminalsOnline}/{org.terminals}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    online
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.round((org.terminalsOnline / org.terminals) * 100)}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorSmartphone className="size-4 text-primary" />
            Seke Express terminals (live detail)
          </CardTitle>
          <CardDescription>
            Other fleets stream the same telemetry once their devices are provisioned.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Terminal</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Battery</th>
                  <th className="pb-2 font-medium">Signal</th>
                  <th className="pb-2 font-medium">Printer</th>
                  <th className="pb-2 font-medium">Version</th>
                  <th className="pb-2 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {demoTerminals.map((t) => (
                  <tr key={t.id} className="border-b border-border/40 last:border-0">
                    <td className="py-3">
                      <p className="font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.serial}</p>
                    </td>
                    <td className="py-3">
                      <Badge
                        className={`border-transparent capitalize ${statusStyle[t.status]}`}
                      >
                        {t.status === "online" ? (
                          <Wifi className="size-3" />
                        ) : (
                          <WifiOff className="size-3" />
                        )}
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5 tabular">
                        {t.batteryPercent < 20 ? (
                          <BatteryLow className="size-4 text-destructive" />
                        ) : (
                          <Battery className="size-4 text-muted-foreground" />
                        )}
                        {t.batteryPercent}%
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5 tabular">
                        <Signal className="size-4 text-muted-foreground" />
                        {t.signalBars}/4
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5">
                        <Printer
                          className={`size-4 ${t.printerOk ? "text-muted-foreground" : "text-destructive"}`}
                        />
                        {t.printerOk ? "OK" : "Error"}
                      </span>
                    </td>
                    <td className="py-3 tabular">{t.softwareVersion}</td>
                    <td className="py-3 text-muted-foreground">
                      {formatDateTime(t.lastSeenAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
