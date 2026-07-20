"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { demoFares, demoRoutes, withLatency } from "@/lib/demo-data";
import { formatFare } from "@/lib/format";

export default function RoutesPage() {
  const { data: routes } = useQuery({
    queryKey: ["routes"],
    queryFn: () => withLatency(demoRoutes),
  });

  return (
    <>
      <PageHeader
        title="Routes & fares"
        description="Every route the fleet runs, its stops, and the quick-fare presets conductors tap all day."
        actions={
          <Button onClick={() => toast.info("Route builder opens once Supabase is connected.")}>
            <Plus className="size-4" />
            New route
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {routes
          ? routes.map((route) => {
              const fares = demoFares.filter((f) => f.routeId === route.id);
              return (
                <Card key={route.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{route.name}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-1.5">
                          {route.origin}
                          <ArrowRight className="size-3.5" />
                          {route.destination}
                          <span className="mx-1">·</span>
                          {route.distanceKm} km
                        </CardDescription>
                      </div>
                      <Badge variant={route.active ? "success" : "outline"}>
                        {route.active ? "active" : "inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Stops as a compact journey line */}
                    <ol className="flex flex-wrap items-center gap-y-1.5 text-xs text-muted-foreground">
                      {route.stops.map((stop, i) => (
                        <li key={stop.id} className="flex items-center">
                          {i > 0 && (
                            <span className="mx-1.5 h-px w-4 bg-border" aria-hidden />
                          )}
                          <span
                            className={
                              i === 0 || i === route.stops.length - 1
                                ? "font-medium text-foreground"
                                : ""
                            }
                          >
                            {stop.name}
                          </span>
                        </li>
                      ))}
                    </ol>

                    {fares.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Quick fares
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {fares.map((fare) => (
                            <span
                              key={fare.id}
                              className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3.5 py-1.5 text-sm"
                            >
                              <span className="text-muted-foreground">{fare.label}</span>
                              <span className="font-semibold text-primary tabular">
                                {formatFare(fare.amountCents)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          : Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-2xl" />
            ))}
      </div>
    </>
  );
}
