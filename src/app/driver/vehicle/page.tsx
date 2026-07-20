"use client";

import * as React from "react";
import { toast } from "sonner";
import { CalendarClock, ClipboardCheck, ShieldCheck, Wrench } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { demoRoutes, demoVehicles } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";

/**
 * Driver vehicle page: compliance dates and the pre-trip checklist. The
 * checklist result lands in device_events once Supabase is connected, giving
 * fleet owners a defensible inspection trail.
 */

const vehicle = demoVehicles[0];
const route = demoRoutes[0];

const checklistItems = [
  "Tyres & spare wheel",
  "Brakes responsive",
  "Lights & indicators",
  "Seatbelts present",
  "Fire extinguisher",
  "First aid kit",
  "Terminal mounted & charging",
];

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function ExpiryBadge({ date }: { date: string }) {
  const days = daysUntil(date);
  if (days < 0) {
    return <Badge className="border-transparent bg-destructive/10 text-destructive">Expired</Badge>;
  }
  if (days <= 30) {
    return (
      <Badge className="border-transparent bg-warning/10 text-warning-foreground dark:text-warning">
        {days} days left
      </Badge>
    );
  }
  return <Badge className="border-transparent bg-success/10 text-success">Valid</Badge>;
}

export default function DriverVehiclePage() {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const allChecked = checklistItems.every((item) => checked[item]);

  return (
    <>
      <PageHeader
        title={`${vehicle.registration} · ${vehicle.model}`}
        description={`${vehicle.seats} seats · assigned to ${route.name}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Compliance
            </CardTitle>
            <CardDescription>
              The fleet office renews these; you&apos;ll be notified before expiry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3 text-sm">
              <span className="flex items-center gap-2.5">
                <CalendarClock className="size-4 text-muted-foreground" />
                Insurance
                <span className="text-xs text-muted-foreground">
                  {formatDate(vehicle.insuranceExpiry)}
                </span>
              </span>
              <ExpiryBadge date={vehicle.insuranceExpiry} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3 text-sm">
              <span className="flex items-center gap-2.5">
                <Wrench className="size-4 text-muted-foreground" />
                Fitness inspection
                <span className="text-xs text-muted-foreground">
                  {formatDate(vehicle.inspectionExpiry)}
                </span>
              </span>
              <ExpiryBadge date={vehicle.inspectionExpiry} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-primary" />
              Pre-trip checklist
            </CardTitle>
            <CardDescription>
              Complete before the first trip of the day. Submitted to the fleet office.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklistItems.map((item) => (
              <div key={item} className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{item}</p>
                <Switch
                  checked={Boolean(checked[item])}
                  onCheckedChange={(v) =>
                    setChecked((prev) => ({ ...prev, [item]: v }))
                  }
                />
              </div>
            ))}
            <Button
              className="w-full"
              disabled={!allChecked}
              onClick={() => {
                toast.success("Checklist submitted", {
                  description: `${vehicle.registration} cleared for today's trips.`,
                });
                setChecked({});
              }}
            >
              {allChecked ? "Submit checklist" : "Tick every item to submit"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
