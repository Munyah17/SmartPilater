"use client";

import * as React from "react";
import Link from "next/link";
import { QrCode, SearchX } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { demoOrg } from "@/lib/demo-data";
import { listRecentTickets } from "@/lib/offline/db";
import { formatDateTime, formatMoney, shortRef } from "@/lib/format";
import type { Ticket } from "@/types/domain";

const paymentBadge: Record<string, string> = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning-foreground dark:text-warning",
  processing: "bg-warning/10 text-warning-foreground dark:text-warning",
  failed: "bg-destructive/10 text-destructive",
  expired: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-muted text-muted-foreground",
};

export default function ConductorTicketsPage() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    void listRecentTickets(500).then(setTickets).catch(() => {});
  }, []);

  const filtered = tickets.filter((t) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      t.destination.toLowerCase().includes(q) ||
      shortRef(t.id).toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Every ticket issued on this device — tap one to open its verification page."
        actions={
          <Input
            placeholder="Search destination or ref…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-56"
          />
        }
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <SearchX className="size-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              {tickets.length === 0
                ? "Nothing sold on this device yet — tickets appear here the moment they are issued, even offline."
                : "No tickets match that search."}
            </p>
            {tickets.length === 0 && (
              <Button asChild className="mt-5">
                <Link href="/terminal">Open terminal</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => (
            <li key={t.id}>
              <Link
                href={`/verify/${t.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 text-sm shadow-soft transition-shadow hover:shadow-lifted"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-medium">
                    {t.destination}
                    {t.channel === "public" && (
                      <Badge variant="outline" className="gap-1">
                        <QrCode className="size-3" />
                        self-service
                      </Badge>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground tabular">
                    {shortRef(t.id)} · {formatDateTime(t.issuedAt)} · {t.provider}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  <Badge
                    className={`border-transparent capitalize ${paymentBadge[t.paymentStatus] ?? ""}`}
                  >
                    {t.paymentStatus}
                  </Badge>
                  <span className="font-semibold tabular">
                    {formatMoney(t.amountCents, t.currency ?? demoOrg.currency)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
