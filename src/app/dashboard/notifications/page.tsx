"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  BatteryLow,
  Check,
  Download,
  Printer,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { demoAlerts, withLatency } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import type { DeviceAlert } from "@/types/domain";

const kindIcon: Record<DeviceAlert["kind"], LucideIcon> = {
  low_battery: BatteryLow,
  offline: WifiOff,
  printer_error: Printer,
  payment_failed: AlertTriangle,
  update_available: Download,
};

const severityStyles: Record<DeviceAlert["severity"], string> = {
  critical: "bg-destructive/10 text-destructive",
  warning: "bg-warning/15 text-warning-foreground dark:text-warning",
  info: "bg-primary/10 text-primary",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => withLatency(demoAlerts),
  });

  const acknowledge = (alert: DeviceAlert) => {
    queryClient.setQueryData<DeviceAlert[]>(["alerts"], (old) =>
      old?.map((a) => (a.id === alert.id ? { ...a, acknowledged: true } : a)),
    );
    toast.success("Alert acknowledged");
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Device alerts and platform events, newest first."
      />

      <div className="space-y-3">
        {alerts
          ? alerts.map((alert) => {
              const Icon = kindIcon[alert.kind];
              return (
                <Card
                  key={alert.id}
                  className={cn(
                    "flex items-start gap-4 p-5 transition-opacity",
                    alert.acknowledged && "opacity-55",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      severityStyles[alert.severity],
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{alert.terminalLabel}</p>
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : alert.severity === "warning"
                              ? "warning"
                              : "default"
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => acknowledge(alert)}
                    >
                      <Check className="size-3.5" />
                      Acknowledge
                    </Button>
                  )}
                </Card>
              );
            })
          : Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
      </div>
    </>
  );
}
