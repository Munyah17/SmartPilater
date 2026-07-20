"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  demoConductors,
  demoDrivers,
  demoVehicles,
  withLatency,
} from "@/lib/demo-data";
import { formatDate } from "@/lib/format";
import type { StaffMember } from "@/types/domain";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}

function StaffTable({ staff }: { staff: StaffMember[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Phone</th>
              <th className="px-5 py-3.5">National ID</th>
              {staff[0]?.role === "driver" && <th className="px-5 py-3.5">Licence</th>}
              <th className="px-5 py-3.5">Vehicle</th>
              <th className="px-5 py-3.5">Joined</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => {
              const vehicle = demoVehicles.find(
                (v) => v.id === member.assignedVehicleId,
              );
              return (
                <tr
                  key={member.id}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs">
                          {initials(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.fullName}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground tabular">
                    {member.phone}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground tabular">
                    {member.nationalId}
                  </td>
                  {member.role === "driver" && (
                    <td className="px-5 py-4 text-muted-foreground tabular">
                      {member.licenceNumber}
                    </td>
                  )}
                  <td className="px-5 py-4">{vehicle?.registration ?? "—"}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatDate(member.joinedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={member.active ? "success" : "outline"}>
                      {member.active ? "on duty" : "inactive"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function StaffPage() {
  const { data } = useQuery({
    queryKey: ["staff"],
    queryFn: () =>
      withLatency({ drivers: demoDrivers, conductors: demoConductors }),
  });

  return (
    <>
      <PageHeader
        title="Drivers & conductors"
        description="Crew profiles, assignments and duty status across the fleet."
        actions={
          <Button onClick={() => toast.info("Staff onboarding opens once Supabase is connected.")}>
            <Plus className="size-4" />
            Add crew member
          </Button>
        }
      />

      <Tabs defaultValue="conductors">
        <TabsList>
          <TabsTrigger value="conductors">Conductors</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
        </TabsList>
        <TabsContent value="conductors">
          {data ? (
            <StaffTable staff={data.conductors} />
          ) : (
            <Skeleton className="h-96 w-full rounded-2xl" />
          )}
        </TabsContent>
        <TabsContent value="drivers">
          {data ? (
            <StaffTable staff={data.drivers} />
          ) : (
            <Skeleton className="h-96 w-full rounded-2xl" />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
