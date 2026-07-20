"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Battery,
  HardDrive,
  MapPin,
  MoreHorizontal,
  Power,
  Printer,
  RefreshCw,
  Signal,
  Download,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { demoTerminals, demoVehicles, withLatency } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import type { Terminal } from "@/types/domain";

function statusVariant(status: Terminal["status"]) {
  return status === "online"
    ? ("success" as const)
    : status === "degraded"
      ? ("warning" as const)
      : ("destructive" as const);
}

function remoteAction(label: string, terminal: Terminal) {
  toast.success(`${label} queued for ${terminal.label}`, {
    description:
      terminal.status === "offline"
        ? "The command will run when the terminal reconnects."
        : "The terminal will pick this up within a few seconds.",
  });
}

function TerminalCard({ terminal }: { terminal: Terminal }) {
  const vehicle = demoVehicles.find((v) => v.id === terminal.vehicleId);
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{terminal.label}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground tabular">
              {terminal.serial} · {vehicle?.model ?? "Unassigned"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={statusVariant(terminal.status)}>{terminal.status}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Remote management</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => remoteAction("Reboot", terminal)}>
                  <Power />
                  Reboot terminal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => remoteAction("Diagnostics run", terminal)}>
                  <RefreshCw />
                  Run diagnostics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => remoteAction("OTA update", terminal)}>
                  <Download />
                  Push update (1.4.0)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => remoteAction("Remote logout", terminal)}>
                  <LogOut />
                  Log out conductor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Battery className="size-3.5" />
              Battery
            </span>
            <span className="font-medium tabular">{terminal.batteryPercent}%</span>
          </div>
          <Progress
            value={terminal.batteryPercent}
            indicatorClassName={cn(
              terminal.batteryPercent <= 20 && "bg-destructive",
              terminal.batteryPercent > 20 && terminal.batteryPercent <= 40 && "bg-warning",
            )}
          />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Signal className="size-3.5" />
              Signal
            </dt>
            <dd className="font-medium tabular">{terminal.signalBars}/4</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5" />
              GPS
            </dt>
            <dd className="font-medium">{terminal.gpsFix ? "Locked" : "No fix"}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Printer className="size-3.5" />
              Printer
            </dt>
            <dd
              className={cn(
                "font-medium",
                !terminal.printerOk && "text-destructive",
              )}
            >
              {terminal.printerOk ? "Ready" : "Fault"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="size-3.5" />
              Storage free
            </dt>
            <dd className="font-medium tabular">{terminal.storageFreePercent}%</dd>
          </div>
        </dl>

        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span>
            v{terminal.softwareVersion} · Android {terminal.androidVersion}
            {terminal.softwareVersion !== "1.4.0" && (
              <Badge variant="warning" className="ml-2">
                update available
              </Badge>
            )}
          </span>
          <span>
            Synced {formatDistanceToNow(new Date(terminal.lastSyncAt), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DevicesPage() {
  const { data: terminals } = useQuery({
    queryKey: ["terminals"],
    queryFn: () => withLatency(demoTerminals),
  });

  return (
    <>
      <PageHeader
        title="Devices"
        description="Health, connectivity and remote management for every mounted terminal."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Fleet-wide OTA update scheduled", {
                description: "Terminals update overnight while parked at the rank.",
              })
            }
          >
            <Download className="size-4" />
            Update all to 1.4.0
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {terminals
          ? terminals.map((terminal) => (
              <TerminalCard key={terminal.id} terminal={terminal} />
            ))
          : Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl" />
            ))}
      </div>
    </>
  );
}
