"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  BusFront,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Phone,
  ShieldCheck,
  Ticket as TicketIcon,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  demoConductors,
  demoDrivers,
  demoOrg,
  demoRoutes,
  demoVehicles,
} from "@/lib/demo-data";
import { formatFare, formatMoney, shortRef, formatDateTime } from "@/lib/format";
import { saveTicket } from "@/lib/offline/db";
import { getAdapter, isEcocashLive } from "@/lib/payments/registry";
import type { PaymentIntent } from "@/lib/payments/types";
import type { Ticket } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Self-service public pay: a passenger scans the QR sticker inside the kombi
 * and pays without any conductor involvement.
 *
 * Rule of the mode: ONE flat fare — the price to the route's final
 * destination. Everyone pays the same. Custom fares and early drop-off
 * pricing exist only on the staff terminal where a conductor or driver is
 * signed in and accountable for the discount.
 */

const PAYMENT_WINDOW_SECONDS = 90;

type Stage =
  | { name: "enter" }
  | { name: "charging"; msisdn: string }
  | { name: "success"; ticket: Ticket }
  | { name: "failed"; reason: string; msisdn: string };

function isValidZimMobile(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  const national = digits.startsWith("263")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  return /^7[1378]\d{7}$/.test(national);
}

function newTicketId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PublicPayFlow({ vehicleId }: { vehicleId: string }) {
  const vehicle = demoVehicles.find((v) => v.id === vehicleId);
  const route = demoRoutes.find((r) => r.id === vehicle?.routeId);
  const driver = demoDrivers.find((d) => d.id === vehicle?.driverId);
  const conductor = demoConductors.find((c) => c.id === vehicle?.conductorId);

  const [stage, setStage] = React.useState<Stage>({ name: "enter" });
  const [phone, setPhone] = React.useState("");
  const [intent, setIntent] = React.useState<PaymentIntent | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState(PAYMENT_WINDOW_SECONDS);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const ticketRef = React.useRef<Ticket | null>(null);

  const currency = demoOrg.currency;
  const live = isEcocashLive();

  const stopPolling = React.useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  React.useEffect(() => stopPolling, [stopPolling]);

  const startPayment = React.useCallback(
    async (msisdn: string) => {
      if (!vehicle || !route) return;
      const ticketId = newTicketId();
      const ticket: Ticket = {
        id: ticketId,
        orgId: demoOrg.id,
        tripId: null,
        vehicleId: vehicle.id,
        routeId: route.id,
        terminalId: vehicle.terminalId ?? "public",
        farePresetId: null,
        destination: route.destination,
        amountCents: route.publicFareCents,
        provider: "ecocash",
        status: "valid",
        paymentStatus: "pending",
        reference: "",
        verifyCode: ticketId,
        issuedAt: new Date().toISOString(),
        syncState: "queued",
        channel: "public",
        currency,
        payerPhone: msisdn,
      };
      ticketRef.current = ticket;

      setStage({ name: "charging", msisdn });
      setIntent(null);
      setSecondsLeft(PAYMENT_WINDOW_SECONDS);

      const adapter = getAdapter("ecocash");
      let created: PaymentIntent;
      try {
        created = await adapter.createIntent({
          ticketId,
          amountCents: ticket.amountCents,
          currency,
          description: `${route.name} · ${route.destination}`,
          payerPhone: msisdn,
          metadata: { vehicle: vehicle.registration, channel: "public" },
        });
      } catch (error) {
        setStage({
          name: "failed",
          msisdn,
          reason:
            error instanceof Error ? error.message : "Could not start the payment.",
        });
        return;
      }

      setIntent(created);
      ticket.reference = created.reference;
      try {
        await saveTicket(ticket);
      } catch {
        // Private browsing can block IndexedDB; the ticket still completes.
      }

      stopPolling();
      pollRef.current = setInterval(async () => {
        const result = await adapter.checkStatus(created.reference);
        if (result.status === "paid") {
          stopPolling();
          const paid: Ticket = { ...ticket, paymentStatus: "paid" };
          ticketRef.current = paid;
          try {
            await saveTicket(paid);
          } catch {}
          setStage({ name: "success", ticket: paid });
        } else if (result.status === "failed" || result.status === "expired") {
          stopPolling();
          try {
            await saveTicket({ ...ticket, paymentStatus: result.status, status: "void" });
          } catch {}
          setStage({
            name: "failed",
            msisdn,
            reason: result.failureReason ?? "The wallet did not confirm the payment.",
          });
        }
      }, 1000);
    },
    [vehicle, route, currency, stopPolling],
  );

  // Payment window countdown.
  React.useEffect(() => {
    if (stage.name !== "charging") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          stopPolling();
          setStage({
            name: "failed",
            msisdn: stage.msisdn,
            reason: "The payment window expired before EcoCash confirmed.",
          });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage, stopPolling]);

  if (!vehicle || !route) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <XCircle className="size-12 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Kombi not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This QR code does not match an active vehicle. Ask the crew for the
          correct sticker, or pay the conductor directly.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/pay">Choose a kombi</Link>
        </Button>
      </div>
    );
  }

  const fare = route.publicFareCents;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/pay"
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          All kombis
        </Link>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" />
          {live ? "EcoCash sandbox" : "Demo mode"}
        </span>
      </div>

      {/* Vehicle card */}
      <div className="mt-6 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BusFront className="size-6" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-lg font-semibold tracking-tight">{vehicle.registration}</p>
            <p className="truncate text-sm text-muted-foreground">
              {demoOrg.tradingName} · {route.name}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-border/60 pt-3.5 text-xs text-muted-foreground">
          {driver && <span>Driver {driver.fullName}</span>}
          {conductor && <span>Conductor {conductor.fullName}</span>}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {stage.name === "enter" && (
          <motion.div
            key="enter"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mt-6 flex flex-1 flex-col"
          >
            <div className="rounded-2xl border border-border/70 bg-card p-6 text-center shadow-soft">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Fare to {route.destination}
              </p>
              <p className="mt-1 text-6xl font-semibold tracking-tight text-primary tabular">
                {formatFare(fare, currency)}
              </p>
              <p className="mx-auto mt-3 max-w-xs text-xs text-muted-foreground">
                Self-service tickets are one flat fare to the final destination.
                Dropping off earlier or need a special fare? Pay the conductor
                instead.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="msisdn">Your EcoCash number</Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="msisdn"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="077 123 4567"
                  className="pl-10 text-base"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                You&apos;ll get a PIN prompt on your phone to approve{" "}
                {formatFare(fare, currency)}.
              </p>
            </div>

            <Button
              size="xl"
              className="mt-6 w-full"
              disabled={!isValidZimMobile(phone)}
              onClick={() => void startPayment(phone)}
            >
              Pay {formatFare(fare, currency)} with EcoCash
            </Button>
          </motion.div>
        )}

        {stage.name === "charging" && (
          <motion.div
            key="charging"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mt-6 flex flex-1 flex-col items-center text-center"
          >
            <div
              className={cn(
                "mt-2 rounded-full px-4 py-1.5 text-lg font-semibold tabular",
                secondsLeft <= 15
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-foreground",
              )}
            >
              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </div>
            <div className="relative mt-10 flex items-center justify-center">
              <span className="animate-radar absolute inset-0 rounded-full bg-primary/25" />
              <span
                className="animate-radar absolute inset-0 rounded-full bg-primary/20"
                style={{ animationDelay: "1.2s" }}
              />
              <div className="relative flex size-24 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="size-10 animate-spin text-primary" />
              </div>
            </div>
            <p className="mt-8 text-xl font-semibold tracking-tight">
              Check your phone
            </p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              EcoCash sent a PIN prompt to{" "}
              <span className="font-medium text-foreground">{stage.msisdn}</span>.
              Enter your PIN to approve {formatFare(fare, currency)}.
            </p>
            <p className="mt-3 text-xs text-muted-foreground tabular">
              Ref {intent ? intent.reference : "…"}
            </p>
            <Button
              variant="outline"
              className="mt-8"
              onClick={() => {
                stopPolling();
                setStage({ name: "enter" });
              }}
            >
              Cancel
            </Button>
          </motion.div>
        )}

        {stage.name === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex flex-1 flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex size-20 items-center justify-center rounded-full bg-success/12"
            >
              <CheckCircle2 className="size-12 text-success" />
            </motion.div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-success">
              Ticket paid
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Show this screen to the crew when asked.
            </p>

            <div className="mt-6 w-full rounded-2xl border border-border/70 bg-card p-6 font-mono text-sm shadow-lifted">
              <p className="text-center text-base font-bold tracking-tight">
                {demoOrg.tradingName}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Self-service digital ticket
              </p>
              <div className="my-3 border-t border-dashed" />
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Vehicle</dt>
                  <dd>{vehicle.registration}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Route</dt>
                  <dd className="text-right">{route.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Destination</dt>
                  <dd>{route.destination}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Issued</dt>
                  <dd>{formatDateTime(stage.ticket.issuedAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Paid via</dt>
                  <dd className="uppercase">EcoCash</dd>
                </div>
              </dl>
              <div className="my-3 border-t border-dashed" />
              <p className="text-center text-2xl font-bold tabular">
                {formatMoney(stage.ticket.amountCents, currency)}
              </p>
              <p className="mt-1 text-center text-[11px] text-muted-foreground">
                Ref {shortRef(stage.ticket.id)}
              </p>
              <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
                <QRCodeSVG
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/verify/${stage.ticket.id}`
                      : `/verify/${stage.ticket.id}`
                  }
                  size={112}
                  level="M"
                />
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Crew scan to verify · Fambai zvakanaka
              </p>
            </div>

            <Button size="lg" variant="outline" className="mt-6 w-full" asChild>
              <Link href={`/pay/${vehicle.id}`}>
                <TicketIcon className="size-4" />
                Buy another ticket
              </Link>
            </Button>
          </motion.div>
        )}

        {stage.name === "failed" && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex flex-1 flex-col items-center justify-center text-center"
          >
            <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-12 text-destructive" />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">Payment failed</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{stage.reason}</p>
            <div className="mt-8 flex w-full flex-col gap-3">
              <Button size="xl" onClick={() => void startPayment(stage.msisdn)}>
                Try again · {formatFare(fare, currency)}
              </Button>
              <Button
                size="xl"
                variant="outline"
                onClick={() => setStage({ name: "enter" })}
              >
                Change number
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
