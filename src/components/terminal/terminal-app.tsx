"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Delete, Users, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { TerminalStatusBar } from "@/components/terminal/status-bar";
import {
  FailedScreen,
  SuccessScreen,
  WaitingScreen,
} from "@/components/terminal/payment-flow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  demoConductors,
  demoDrivers,
  demoFares,
  demoOrg,
  demoRoutes,
  demoVehicles,
} from "@/lib/demo-data";
import { formatFare, formatMoney } from "@/lib/format";
import { listRecentTickets, saveTicket } from "@/lib/offline/db";
import { startSyncLoop } from "@/lib/offline/sync";
import { getAdapter } from "@/lib/payments/registry";
import type { PaymentIntent } from "@/lib/payments/types";
import { printReceipt } from "@/lib/receipts/escpos";
import { useNetworkStatus } from "@/hooks/use-network-status";
import type { Currency, PaymentProviderId, Ticket } from "@/types/domain";

/**
 * Terminal application: the conductor's whole world.
 *
 * State machine: home → waiting → success | failed → home.
 * Every issued ticket is persisted to IndexedDB before anything else, so a
 * dead zone between Chikwanha and Mbudzi never loses a sale.
 */

type Stage =
  | { name: "home" }
  | { name: "waiting"; amountCents: number; destination: string }
  | { name: "success"; ticket: Ticket }
  | { name: "failed"; amountCents: number; destination: string; reason: string };

const vehicle = demoVehicles[0];
const route = demoRoutes[0];
const driver = demoDrivers[0];
const conductor = demoConductors[0];

const PAYMENT_WINDOW_SECONDS = 90;
const SUCCESS_AUTO_CLOSE_SECONDS = 8;

function newTicketId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TerminalApp() {
  const online = useNetworkStatus();
  const [stage, setStage] = React.useState<Stage>({ name: "home" });
  const [provider, setProvider] = React.useState<PaymentProviderId>("ecocash");
  /**
   * Which currency THIS sale charges in. The fleet decides which currencies
   * are accepted at all (Settings); when more than one is enabled, staff
   * choose per passenger — unlike public pay, where the passenger never
   * chooses and always gets the org's default currency.
   */
  const [currency, setCurrency] = React.useState<Currency>(demoOrg.currency);
  const [intent, setIntent] = React.useState<PaymentIntent | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState(PAYMENT_WINDOW_SECONDS);
  const [autoClose, setAutoClose] = React.useState(SUCCESS_AUTO_CLOSE_SECONDS);
  const [todayStats, setTodayStats] = React.useState({ revenueCents: 0, passengers: 0 });
  const [customOpen, setCustomOpen] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");

  const ticketRef = React.useRef<Ticket | null>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Offline queue drains automatically for the life of the terminal session.
  React.useEffect(() => startSyncLoop(), []);

  const refreshToday = React.useCallback(async () => {
    const recent = await listRecentTickets(500);
    const today = new Date().toDateString();
    const paidToday = recent.filter(
      (t) =>
        t.paymentStatus === "paid" &&
        new Date(t.issuedAt).toDateString() === today,
    );
    setTodayStats({
      revenueCents: paidToday.reduce((acc, t) => acc + t.amountCents, 0),
      passengers: paidToday.length,
    });
  }, []);

  React.useEffect(() => {
    void refreshToday();
  }, [refreshToday]);

  const stopPolling = React.useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  /**
   * Conductor tapped a fare: create the ticket + intent and start polling.
   *
   * `payerPhone` powers Option 2 on the waiting screen — an EcoCash USSD
   * push to the passenger's handset for people who can't scan a QR. The
   * charge API sends the PIN prompt; we poll (webhooks land server-side)
   * until EcoCash reports Paid or Declined.
   */
  const startPayment = React.useCallback(
    async (
      amountCents: number,
      destination: string,
      providerId?: PaymentProviderId,
      payerPhone?: string,
      cardId?: string,
    ) => {
      const chosenProvider = providerId ?? provider;
      const ticketId = newTicketId();
      const issuedAt = new Date().toISOString();

      const ticket: Ticket = {
        id: ticketId,
        orgId: demoOrg.id,
        tripId: null,
        vehicleId: vehicle.id,
        routeId: route.id,
        terminalId: vehicle.terminalId ?? "term-1",
        farePresetId: null,
        destination,
        amountCents,
        provider: chosenProvider,
        status: "valid",
        paymentStatus: "pending",
        reference: "",
        verifyCode: ticketId,
        issuedAt,
        syncState: "queued",
        channel: "terminal",
        currency,
        payerPhone,
        cardId,
      };
      ticketRef.current = ticket;

      setStage({ name: "waiting", amountCents, destination });
      setIntent(null);
      setSecondsLeft(PAYMENT_WINDOW_SECONDS);

      const adapter = getAdapter(chosenProvider);
      let created: PaymentIntent;
      try {
        created = await adapter.createIntent({
          ticketId,
          amountCents,
          currency,
          description: `${route.name} · ${destination}`,
          payerPhone,
          metadata: {
            vehicle: vehicle.registration,
            terminal: ticket.terminalId,
            ...(cardId ? { cardId } : {}),
          },
        });
      } catch (error) {
        if (payerPhone) {
          setStage({
            name: "failed",
            amountCents,
            destination,
            reason:
              error instanceof Error ? error.message : "Could not start the payment.",
          });
        } else {
          // Push-only rail with no number yet (live EcoCash/Paynow): stay on
          // the waiting screen so the conductor can capture the number.
          toast.info("Enter the passenger's number to send the prompt");
        }
        return;
      }
      setIntent(created);
      ticket.reference = created.reference;
      await saveTicket(ticket);

      stopPolling();
      pollRef.current = setInterval(async () => {
        const result = await adapter.checkStatus(created.reference);
        if (result.status === "paid") {
          stopPolling();
          const paid: Ticket = { ...ticket, paymentStatus: "paid" };
          ticketRef.current = paid;
          await saveTicket(paid);
          void refreshToday();
          printReceipt(paid, {
            companyName: demoOrg.tradingName,
            vehicleReg: vehicle.registration,
            routeName: route.name,
            verifyBaseUrl:
              typeof window !== "undefined" ? window.location.origin : "",
          });
          setAutoClose(SUCCESS_AUTO_CLOSE_SECONDS);
          setStage({ name: "success", ticket: paid });
        } else if (result.status === "failed" || result.status === "expired") {
          stopPolling();
          const failed: Ticket = {
            ...ticket,
            paymentStatus: result.status,
            status: "void",
          };
          await saveTicket(failed);
          setStage({
            name: "failed",
            amountCents,
            destination,
            reason: result.failureReason ?? "The wallet did not confirm the payment.",
          });
        }
      }, 1000);
    },
    [provider, currency, refreshToday, stopPolling],
  );

  const cancelPayment = React.useCallback(async () => {
    stopPolling();
    if (ticketRef.current && ticketRef.current.paymentStatus === "pending") {
      await saveTicket({
        ...ticketRef.current,
        paymentStatus: "cancelled",
        status: "void",
      });
    }
    setStage({ name: "home" });
  }, [stopPolling]);

  // Countdown for the payment window.
  React.useEffect(() => {
    if (stage.name !== "waiting") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          stopPolling();
          setStage({
            name: "failed",
            amountCents: stage.amountCents,
            destination: stage.destination,
            reason: "The payment window expired before the wallet confirmed.",
          });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage, stopPolling]);

  // Auto-return to home after success (configurable per fleet).
  React.useEffect(() => {
    if (stage.name !== "success") return;
    const id = setInterval(() => {
      setAutoClose((s) => {
        if (s <= 1) {
          clearInterval(id);
          setStage({ name: "home" });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage.name]);

  const switchProvider = React.useCallback(
    (next: PaymentProviderId) => {
      if (stage.name !== "waiting") return;
      setProvider(next);
      // New provider means a fresh intent for the same fare.
      void startPayment(stage.amountCents, stage.destination, next);
    },
    [stage, startPayment],
  );

  const submitCustomFare = React.useCallback(() => {
    const cents = Math.round(parseFloat(customValue || "0") * 100);
    if (!cents || cents < 25 || cents > 5000) {
      toast.error("Enter a fare between $0.25 and $50");
      return;
    }
    setCustomOpen(false);
    setCustomValue("");
    void startPayment(cents, "Custom fare");
  }, [customValue, startPayment]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TerminalStatusBar
        vehicleReg={vehicle.registration}
        routeName={route.name}
        printerOk
      />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6">
        {/* Today summary */}
        <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Today&apos;s revenue
              </p>
              <p className="mt-1 text-5xl font-semibold tracking-tight tabular">
                {formatMoney(todayStats.revenueCents)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="size-4" />
                {todayStats.passengers} passengers
              </span>
              <span className="flex items-center gap-1.5">
                <RouteIcon className="size-4" />
                {route.origin} → {route.destination}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-border/60 pt-4 text-sm text-muted-foreground">
            <span>
              Driver <span className="font-medium text-foreground">{driver.fullName}</span>
            </span>
            <span>
              Conductor{" "}
              <span className="font-medium text-foreground">{conductor.fullName}</span>
            </span>
            {!online && (
              <span className="font-medium text-warning-foreground dark:text-warning">
                Selling offline — tickets will sync automatically
              </span>
            )}
          </div>
        </section>

        {/* Per-sale currency — only shown when the fleet accepts more than
            one; staff choose here, unlike public pay where nobody does. */}
        {demoOrg.enabledCurrencies.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Charging in
            </span>
            {demoOrg.enabledCurrencies.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setCurrency(id)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  currency === id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {id === "USD" ? "US Dollar" : "ZiG"}
              </button>
            ))}
          </div>
        )}

        {/* Quick fares: the four giant buttons that run the day */}
        <section className="grid flex-1 grid-cols-2 gap-4">
          {demoFares.map((fare, i) => (
            <motion.button
              key={fare.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => void startPayment(fare.amountCents, fare.label)}
              className="flex min-h-36 flex-col items-start justify-between rounded-2xl border border-border/70 bg-card p-5 text-left shadow-soft transition-shadow hover:shadow-lifted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <div>
                <p className="text-lg font-semibold tracking-tight">{fare.label}</p>
                <p className="text-sm text-muted-foreground">{fare.description}</p>
              </div>
              <p className="text-4xl font-semibold tracking-tight text-primary tabular">
                {formatFare(fare.amountCents, currency)}
              </p>
            </motion.button>
          ))}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCustomOpen(true)}
            className="col-span-2 flex min-h-20 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-transparent text-lg font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Custom fare
          </motion.button>
        </section>
      </main>

      {/* Custom fare keypad */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Custom fare</DialogTitle>
          </DialogHeader>
          <p className="text-center text-5xl font-semibold tracking-tight tabular">
            ${customValue || "0"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((key) => (
              <Button
                key={key}
                variant="outline"
                size="xl"
                className="text-xl"
                onClick={() => {
                  if (key === "⌫") {
                    setCustomValue((v) => v.slice(0, -1));
                  } else if (key === "." && customValue.includes(".")) {
                    return;
                  } else if (customValue.replace(".", "").length >= 4) {
                    return;
                  } else {
                    setCustomValue((v) => v + key);
                  }
                }}
              >
                {key === "⌫" ? <Delete className="size-5" /> : key}
              </Button>
            ))}
          </div>
          <Button size="xl" onClick={submitCustomFare} disabled={!customValue}>
            Charge{" "}
            {customValue
              ? formatFare(Math.round(parseFloat(customValue || "0") * 100), currency)
              : ""}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Payment stages */}
      <AnimatePresence>
        {stage.name === "waiting" && (
          <WaitingScreen
            intent={intent}
            amountCents={stage.amountCents}
            destination={stage.destination}
            secondsLeft={secondsLeft}
            provider={provider}
            onProviderChange={switchProvider}
            onPushToPhone={(msisdn) =>
              void startPayment(stage.amountCents, stage.destination, provider, msisdn)
            }
            onTapCard={(cardId) =>
              void startPayment(
                stage.amountCents,
                stage.destination,
                "nfc_tap",
                undefined,
                cardId,
              )
            }
            onCancel={() => void cancelPayment()}
          />
        )}
        {stage.name === "success" && (
          <SuccessScreen
            ticket={stage.ticket}
            vehicleReg={vehicle.registration}
            routeName={route.name}
            companyName={demoOrg.tradingName}
            autoCloseSeconds={autoClose}
            onDone={() => setStage({ name: "home" })}
          />
        )}
        {stage.name === "failed" && (
          <FailedScreen
            reason={stage.reason}
            amountCents={stage.amountCents}
            onRetry={() => void startPayment(stage.amountCents, stage.destination)}
            onCancel={() => setStage({ name: "home" })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
