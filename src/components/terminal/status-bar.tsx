"use client";

import * as React from "react";
import {
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  MapPin,
  Printer,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useClock } from "@/hooks/use-clock";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { ThemeToggle } from "@/components/theme-toggle";
import { BackToHome } from "@/components/back-to-home";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Persistent terminal status strip: vehicle, route, connectivity, battery,
 * printer, GPS and clock. Reads the real Battery API where the WebView
 * exposes it; falls back to a healthy demo value.
 */

function useBattery(): number {
  const [level, setLevel] = React.useState(87);
  React.useEffect(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{
        level: number;
        addEventListener: (e: string, f: () => void) => void;
        removeEventListener: (e: string, f: () => void) => void;
      }>;
    };
    let cleanup = () => {};
    nav.getBattery?.().then((battery) => {
      const update = () => setLevel(Math.round(battery.level * 100));
      update();
      battery.addEventListener("levelchange", update);
      cleanup = () => battery.removeEventListener("levelchange", update);
    });
    return () => cleanup();
  }, []);
  return level;
}

function BatteryIcon({ level }: { level: number }) {
  if (level > 75) return <BatteryFull className="size-4" />;
  if (level > 40) return <BatteryMedium className="size-4" />;
  if (level > 15) return <Battery className="size-4" />;
  return <BatteryLow className="size-4 text-destructive" />;
}

export function TerminalStatusBar({
  vehicleReg,
  routeName,
  printerOk,
}: {
  vehicleReg: string;
  routeName: string;
  printerOk: boolean;
}) {
  const online = useNetworkStatus();
  const now = useClock();
  const battery = useBattery();

  return (
    <div className="glass sticky top-0 z-30 border-b border-border/60">
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4 text-xs font-medium">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              online ? "bg-success" : "bg-warning animate-pulse",
            )}
          />
          <span className="truncate text-foreground">
            {vehicleReg}
            <span className="mx-1.5 text-muted-foreground">·</span>
            <span className="text-muted-foreground">{routeName}</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-muted-foreground">
          {online ? (
            <Wifi className="size-4" />
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-warning-foreground dark:text-warning">
              <WifiOff className="size-3.5" />
              Offline
            </span>
          )}
          <MapPin className="size-4 text-success" aria-label="GPS lock" />
          <Printer
            className={cn("size-4", !printerOk && "text-destructive")}
            aria-label={printerOk ? "Printer ready" : "Printer fault"}
          />
          <span className="flex items-center gap-1 tabular">
            <BatteryIcon level={battery} />
            {battery}%
          </span>
          <span className="w-10 text-right tabular text-foreground">
            {now ? formatTime(now) : "--:--"}
          </span>
          <BackToHome iconOnly />
          <ThemeToggle className="-my-1.5 size-7" />
        </div>
      </div>
    </div>
  );
}
