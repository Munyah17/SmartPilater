/**
 * Formatting helpers shared by the terminal, dashboard and reports.
 * All money in SmartPilater is stored in cents (integer) to avoid
 * floating point drift, and rendered through these helpers only.
 */

import type { Currency } from "@/types/domain";

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const USD_WHOLE = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * ZWG (Zimbabwe Gold) has no Intl currency entry on most runtimes, so it is
 * rendered with an explicit "ZiG" prefix, the name commuters actually use.
 */
function zwg(cents: number, whole = false): string {
  const value = cents / 100;
  return `ZiG ${value.toLocaleString("en-US", {
    minimumFractionDigits: whole && cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: whole && cents % 100 === 0 ? 0 : 2,
  })}`;
}

export function formatMoney(cents: number, currency: Currency = "USD"): string {
  return currency === "ZWG" ? zwg(cents) : USD.format(cents / 100);
}

/** Fare buttons drop trailing ".00" so $1 reads as $1, not $1.00. */
export function formatFare(cents: number, currency: Currency = "USD"): string {
  if (currency === "ZWG") return zwg(cents, true);
  return cents % 100 === 0 ? USD_WHOLE.format(cents / 100) : USD.format(cents / 100);
}

export function formatCompactMoney(cents: number): string {
  const dollars = cents / 100;
  return dollars >= 1000 ? `$${COMPACT.format(dollars)}` : USD.format(dollars);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompact(value: number): string {
  return COMPACT.format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} · ${formatTime(date)}`;
}

/** Short reference like SP-8F3K2Q used on receipts and transaction rows. */
export function shortRef(id: string): string {
  return `SP-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
