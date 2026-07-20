"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  demoConductors,
  demoDrivers,
  demoRoutes,
  demoTerminals,
  demoVehicles,
  withLatency,
} from "@/lib/demo-data";
import { formatDate } from "@/lib/format";

export default function VehiclesPage() {
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => withLatency(demoVehicles),
  });

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Registrations, assignments and compliance for every kombi in the fleet."
        actions={
          <Button onClick={() => toast.info("Vehicle onboarding opens once Supabase is connected.")}>
            <Plus className="size-4" />
            Add vehicle
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5">Vehicle</th>
                <th className="px-5 py-3.5">Route</th>
                <th className="px-5 py-3.5">Driver</th>
                <th className="px-5 py-3.5">Conductor</th>
                <th className="px-5 py-3.5">Terminal</th>
                <th className="px-5 py-3.5">Insurance</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles
                ? vehicles.map((vehicle) => {
                    const driver = demoDrivers.find((d) => d.id === vehicle.driverId);
                    const conductor = demoConductors.find(
                      (c) => c.id === vehicle.conductorId,
                    );
                    const route = demoRoutes.find((r) => r.id === vehicle.routeId);
                    const terminal = demoTerminals.find(
                      (t) => t.id === vehicle.terminalId,
                    );
                    return (
                      <tr
                        key={vehicle.id}
                        className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">{vehicle.registration}</p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.model} · {vehicle.seats} seats
                          </p>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {route?.name ?? "Unassigned"}
                        </td>
                        <td className="px-5 py-4">{driver?.fullName ?? "—"}</td>
                        <td className="px-5 py-4">{conductor?.fullName ?? "—"}</td>
                        <td className="px-5 py-4">
                          {terminal ? (
                            <Badge
                              variant={
                                terminal.status === "online"
                                  ? "success"
                                  : terminal.status === "degraded"
                                    ? "warning"
                                    : "destructive"
                              }
                            >
                              {terminal.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline">none</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {formatDate(vehicle.insuranceExpiry)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={vehicle.active ? "success" : "outline"}>
                            {vehicle.active ? "active" : "parked"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                : Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td colSpan={7} className="px-5 py-4">
                        <Skeleton className="h-9 w-full" />
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
