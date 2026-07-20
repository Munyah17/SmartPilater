"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BusFront, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoOrg, demoRoutes, demoTickets, demoVehicles } from "@/lib/demo-data";
import { listRecentTickets } from "@/lib/offline/db";
import { formatDateTime, formatMoney, shortRef } from "@/lib/format";
import type { Ticket } from "@/types/domain";

/**
 * Public ticket verification.
 *
 * Anyone (inspector, passenger, police roadblock) scans the receipt QR and
 * lands here. Looks up the ticket on this device's offline store first,
 * then the shared dataset; in production this is a single indexed lookup
 * through the verification RPC.
 */

type LookupState =
  | { status: "loading" }
  | { status: "found"; ticket: Ticket }
  | { status: "not_found" };

export function VerifyResult({ code }: { code: string }) {
  const [state, setState] = React.useState<LookupState>({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // Small pause so the check-in animation reads deliberately.
      await new Promise((r) => setTimeout(r, 600));
      const local = await listRecentTickets(1000).catch(() => [] as Ticket[]);
      const ticket =
        local.find((t) => t.id === code || t.verifyCode === code) ??
        demoTickets.find((t) => t.id === code || t.verifyCode === code);
      if (cancelled) return;
      setState(ticket ? { status: "found", ticket } : { status: "not_found" });
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (state.status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <div className="relative flex items-center justify-center">
          <span className="animate-radar absolute inset-0 rounded-full bg-primary/25" />
          <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/10">
            <BusFront className="size-8 text-primary" />
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Checking ticket…
        </p>
      </div>
    );
  }

  if (state.status === "not_found") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center py-20 text-center"
      >
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <HelpCircle className="size-10 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Ticket not found
        </h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          No ticket matches this code. It may have been issued on a terminal
          that has not synced yet, or the code is invalid.
        </p>
        <Button asChild className="mt-8">
          <Link href="/verify">Try another code</Link>
        </Button>
      </motion.div>
    );
  }

  const { ticket } = state;
  const paid = ticket.paymentStatus === "paid";
  const vehicle = demoVehicles.find((v) => v.id === ticket.vehicleId);
  const route = demoRoutes.find((r) => r.id === ticket.routeId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.6, 0.35, 1] }}
      className="mx-auto w-full max-w-md py-10"
    >
      <div
        className={`flex flex-col items-center rounded-t-3xl p-8 text-center ${
          paid ? "bg-success/10" : "bg-destructive/10"
        }`}
      >
        <motion.div
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.1 }}
        >
          {paid ? (
            <CheckCircle2 className="size-16 text-success" />
          ) : (
            <XCircle className="size-16 text-destructive" />
          )}
        </motion.div>
        <h1
          className={`mt-3 text-3xl font-semibold tracking-tight ${
            paid ? "text-success" : "text-destructive"
          }`}
        >
          {paid ? "Paid" : "Not paid"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {paid
            ? "This ticket is genuine and fully paid."
            : `Payment status: ${ticket.paymentStatus}`}
        </p>
      </div>

      <div className="rounded-b-3xl border border-t-0 border-border/70 bg-card p-7 shadow-soft">
        <dl className="space-y-3.5 text-sm">
          {[
            ["Operator", demoOrg.tradingName],
            ["Vehicle", vehicle?.registration ?? "—"],
            ["Route", route?.name ?? "—"],
            ["Destination", ticket.destination],
            ["Fare", formatMoney(ticket.amountCents)],
            ["Paid via", ticket.provider.toUpperCase()],
            ["Issued", formatDateTime(ticket.issuedAt)],
            ["Receipt", shortRef(ticket.id)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-3.5">
            <dt className="text-muted-foreground">Ticket status</dt>
            <dd>
              <Badge variant={ticket.status === "valid" ? "success" : "destructive"}>
                {ticket.status}
              </Badge>
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Verified by SmartPilater · {new Date().getFullYear()}
      </p>
    </motion.div>
  );
}
