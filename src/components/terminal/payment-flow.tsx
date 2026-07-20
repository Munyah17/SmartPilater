"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Phone,
  Printer,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatFare, formatMoney, shortRef, formatDateTime } from "@/lib/format";
import { isNfcSupported, readNfcCard } from "@/lib/nfc/bridge";
import type { PaymentIntent } from "@/lib/payments/types";
import type { PaymentProviderId, Ticket } from "@/types/domain";
import { cn } from "@/lib/utils";

/** Friendlier receipt/label text for providers whose id reads awkwardly raw. */
const providerLabels: Partial<Record<PaymentProviderId, string>> = {
  nfc_tap: "Tap Card",
};
function providerLabel(id: PaymentProviderId): string {
  return providerLabels[id] ?? id;
}

/**
 * Full-screen payment stages rendered over the terminal home:
 * waiting (QR + countdown) → success (receipt) | failed (retry).
 * Designed for sunlight: huge type, high contrast, giant touch targets.
 */

const providerOptions: { id: PaymentProviderId; label: string }[] = [
  { id: "ecocash", label: "EcoCash" },
  { id: "innbucks", label: "InnBucks" },
  { id: "onemoney", label: "OneMoney" },
  { id: "omari", label: "Omari" },
  { id: "zipit", label: "ZIPIT" },
  { id: "visa", label: "Card" },
];

/** Loose Zimbabwe mobile check: 07XXXXXXXX, 263…, +263… all accepted. */
function isValidZimMobile(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  const national = digits.startsWith("263")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  return /^7[1378]\d{7}$/.test(national);
}

export function WaitingScreen({
  intent,
  amountCents,
  destination,
  secondsLeft,
  provider,
  onProviderChange,
  onPushToPhone,
  onTapCard,
  onCancel,
}: {
  intent: PaymentIntent | null;
  amountCents: number;
  destination: string;
  secondsLeft: number;
  provider: PaymentProviderId;
  onProviderChange: (p: PaymentProviderId) => void;
  /** Option 2: send a wallet USSD push to the passenger's number. */
  onPushToPhone: (msisdn: string) => void;
  /** Option 3: a contactless bank or commuter card was tapped. */
  onTapCard: (cardId: string) => void;
  onCancel: () => void;
}) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const [phone, setPhone] = React.useState("");
  const [tapState, setTapState] = React.useState<"idle" | "waiting" | "error">("idle");
  const [tapError, setTapError] = React.useState("");

  const handleTap = React.useCallback(async () => {
    setTapState("waiting");
    setTapError("");
    try {
      const { cardId } = await readNfcCard();
      setTapState("idle");
      onTapCard(cardId);
    } catch (error) {
      setTapState("error");
      setTapError(
        error instanceof Error ? error.message : "Could not read the card.",
      );
    }
  }, [onTapCard]);

  return (
    <motion.div
      key="waiting"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.21, 0.6, 0.35, 1] }}
      className="fixed inset-0 z-40 flex flex-col bg-background"
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <Button variant="ghost" size="lg" onClick={onCancel} className="gap-1 px-3">
          <ChevronLeft className="size-5" />
          Cancel
        </Button>
        <div
          className={cn(
            "rounded-full px-4 py-1.5 text-lg font-semibold tabular",
            secondsLeft <= 15
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-foreground",
          )}
        >
          {minutes}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-6 pb-8 pt-4">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {destination}
          </p>
          <p className="text-6xl font-semibold tracking-tight tabular">
            {formatFare(amountCents)}
          </p>
        </div>

        {/* QR with radar pulse instead of a spinner */}
        <div className="relative flex items-center justify-center">
          <span className="animate-radar absolute inset-0 rounded-[2rem] bg-primary/25" />
          <span
            className="animate-radar absolute inset-0 rounded-[2rem] bg-primary/20"
            style={{ animationDelay: "1.2s" }}
          />
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative rounded-[2rem] border border-border/70 bg-white p-6 shadow-lifted"
          >
            {intent ? (
              <QRCodeSVG value={intent.qrPayload} size={224} level="M" marginSize={0} />
            ) : (
              <div className="size-[224px] animate-pulse rounded-xl bg-muted" />
            )}
          </motion.div>
        </div>

        <div className="text-center">
          <p className="text-lg font-medium">
            <span className="mr-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
              Option 1
            </span>
            Scan with {providerOptions.find((p) => p.id === provider)?.label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular">
            Ref {intent ? intent.reference : "…"}
          </p>
        </div>

        {/* Option 2: USSD push — for passengers who can't scan a QR.
            Enter their number, EcoCash prompts them for their PIN. */}
        <div className="w-full max-w-sm">
          <p className="mb-2 text-center text-sm font-medium">
            <span className="mr-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
              Option 2
            </span>
            Send prompt to passenger&apos;s phone
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="tel"
                inputMode="tel"
                placeholder="077 123 4567"
                className="h-12 pl-10 text-base"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button
              size="lg"
              className="h-12"
              disabled={!isValidZimMobile(phone)}
              onClick={() => onPushToPhone(phone)}
            >
              Pay
            </Button>
          </div>
          <p className="mt-1.5 text-center text-xs text-muted-foreground">
            They approve with their wallet PIN — no app or QR needed.
          </p>
        </div>

        {/* Option 3: NFC/RFID tap — mounted card readers or a commuter pass.
            No number to type, no QR to scan: hold the card to the reader. */}
        <div className="w-full max-w-sm">
          <p className="mb-2 text-center text-sm font-medium">
            <span className="mr-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
              Option 3
            </span>
            Tap a card
          </p>
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full gap-2"
            disabled={tapState === "waiting"}
            onClick={() => void handleTap()}
          >
            <CreditCard className="size-4" />
            {tapState === "waiting" ? "Hold card near reader…" : "Tap bank or commuter card"}
          </Button>
          {tapError && (
            <p className="mt-1.5 text-center text-xs text-destructive">{tapError}</p>
          )}
          {!isNfcSupported() && (
            <button
              type="button"
              onClick={() => onTapCard(`DEV${Date.now().toString(36).toUpperCase()}`)}
              className="mt-1.5 block w-full text-center text-xs text-muted-foreground underline underline-offset-2"
            >
              No reader attached — simulate a tap (dev)
            </button>
          )}
          <p className="mt-1.5 text-center text-xs text-muted-foreground">
            Works with contactless bank cards and RFID/NFC commuter passes.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {providerOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onProviderChange(option.id)}
              className={cn(
                "rounded-full border px-5 py-2.5 text-sm font-medium transition-all active:scale-95",
                option.id === provider
                  ? "border-primary bg-primary text-primary-foreground shadow-soft"
                  : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function SuccessScreen({
  ticket,
  vehicleReg,
  routeName,
  companyName,
  autoCloseSeconds,
  onDone,
}: {
  ticket: Ticket;
  vehicleReg: string;
  routeName: string;
  companyName: string;
  autoCloseSeconds: number;
  onDone: () => void;
}) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex flex-col items-center overflow-y-auto bg-background px-6 py-10"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.05 }}
        className="flex size-24 items-center justify-center rounded-full bg-success/12"
      >
        <CheckCircle2 className="size-14 text-success" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-5 text-3xl font-semibold tracking-tight text-success"
      >
        Payment received
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Printer className="size-4" />
        Receipt printing…
      </motion.p>

      {/* On-screen receipt mirrors the thermal printout */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="mt-8 w-full max-w-xs rounded-2xl border border-border/70 bg-card p-6 font-mono text-sm shadow-lifted"
      >
        <p className="text-center text-base font-bold tracking-tight">{companyName}</p>
        <p className="text-center text-xs text-muted-foreground">Digital fare receipt</p>
        <div className="my-3 border-t border-dashed" />
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Vehicle</dt>
            <dd>{vehicleReg}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Route</dt>
            <dd className="text-right">{routeName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Destination</dt>
            <dd>{ticket.destination}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Issued</dt>
            <dd>{formatDateTime(ticket.issuedAt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Paid via</dt>
            <dd className="uppercase">{providerLabel(ticket.provider)}</dd>
          </div>
        </dl>
        <div className="my-3 border-t border-dashed" />
        <p className="text-center text-2xl font-bold tabular">
          {formatMoney(ticket.amountCents, ticket.currency ?? "USD")}
        </p>
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          Ref {shortRef(ticket.id)}
        </p>
        <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
          <QRCodeSVG value={`/verify/${ticket.id}`} size={96} level="M" />
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Scan to verify · Fambai zvakanaka
        </p>
      </motion.div>

      <Button size="xl" onClick={onDone} className="mt-8 w-full max-w-xs">
        Next passenger
        <span className="ml-1 text-primary-foreground/70 tabular">
          ({autoCloseSeconds})
        </span>
      </Button>
    </motion.div>
  );
}

export function FailedScreen({
  reason,
  amountCents,
  onRetry,
  onCancel,
}: {
  reason: string;
  amountCents: number;
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      key="failed"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background px-6"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="flex size-24 items-center justify-center rounded-full bg-destructive/10"
      >
        <XCircle className="size-14 text-destructive" />
      </motion.div>
      <p className="mt-5 text-3xl font-semibold tracking-tight">Payment failed</p>
      <p className="mt-2 max-w-sm text-center text-muted-foreground">{reason}</p>
      <div className="mt-9 flex w-full max-w-xs flex-col gap-3">
        <Button size="xl" onClick={onRetry}>
          Try again · {formatFare(amountCents)}
        </Button>
        <Button size="xl" variant="outline" onClick={onCancel}>
          Back to fares
        </Button>
      </div>
    </motion.div>
  );
}

export { AnimatePresence };
