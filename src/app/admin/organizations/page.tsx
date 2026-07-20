"use client";

import * as React from "react";
import { toast } from "sonner";
import { Building2, CheckCircle2, PauseCircle, PlayCircle } from "lucide-react";
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
import { platformOrgs, type OrgStatus, type PlatformOrg } from "@/lib/demo-platform";
import { formatCompactMoney, formatDate, formatPercent } from "@/lib/format";

const statusVariant: Record<OrgStatus, string> = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning-foreground dark:text-warning",
  suspended: "bg-destructive/10 text-destructive",
};

export default function OrganizationsPage() {
  const [orgs, setOrgs] = React.useState<PlatformOrg[]>(platformOrgs);

  const setStatus = (id: string, status: OrgStatus, message: string) => {
    setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success(message);
  };

  return (
    <>
      <PageHeader
        title="Fleet companies"
        description="Approve new operators, suspend defaulters and monitor each fleet's volume."
      />

      <div className="space-y-4">
        {orgs.map((org) => (
          <Card key={org.id}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    {org.tradingName}
                    <Badge
                      className={`border-transparent capitalize ${statusVariant[org.status]}`}
                    >
                      {org.status}
                    </Badge>
                    <Badge variant="outline">{org.currency === "ZWG" ? "ZiG" : "USD"}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {org.legalName} · {org.city} · joined {formatDate(org.joinedAt)} ·{" "}
                    {org.contactPhone}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                {org.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      setStatus(
                        org.id,
                        "active",
                        `${org.tradingName} approved — they can now provision terminals.`,
                      )
                    }
                  >
                    <CheckCircle2 className="size-4" />
                    Approve
                  </Button>
                )}
                {org.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setStatus(
                        org.id,
                        "suspended",
                        `${org.tradingName} suspended — terminals stop selling on next sync.`,
                      )
                    }
                  >
                    <PauseCircle className="size-4" />
                    Suspend
                  </Button>
                )}
                {org.status === "suspended" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setStatus(org.id, "active", `${org.tradingName} reinstated.`)
                    }
                  >
                    <PlayCircle className="size-4" />
                    Reinstate
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Gross this month</dt>
                  <dd className="mt-0.5 font-semibold tabular">
                    {org.monthGrossCents === 0
                      ? "—"
                      : formatCompactMoney(org.monthGrossCents)}
                    {org.currency === "ZWG" && org.monthGrossCents > 0 && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        ZiG
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Platform fee</dt>
                  <dd className="mt-0.5 font-semibold tabular">
                    {formatPercent(org.feeBasisPoints / 100, 1)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Vehicles</dt>
                  <dd className="mt-0.5 font-semibold tabular">{org.vehicles}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Terminals online</dt>
                  <dd className="mt-0.5 font-semibold tabular">
                    {org.terminalsOnline}/{org.terminals}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
