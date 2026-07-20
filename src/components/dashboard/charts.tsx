"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactMoney, formatMoney } from "@/lib/format";

/**
 * Chart wrappers for the fleet dashboard.
 *
 * Conventions (see the dataviz method): one hue for magnitude, the fixed
 * categorical order for identity, recessive grid, 2px lines, tooltips on
 * every plot, values rendered in text tokens rather than series colors.
 */

const CATEGORICAL = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function ChartTooltip({
  active,
  payload,
  label,
  money = true,
}: {
  active?: boolean;
  payload?: { value: number; name?: string }[];
  label?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/70 bg-popover px-3.5 py-2.5 shadow-lifted">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold tabular">
          {money ? formatMoney(entry.value) : `${entry.value} passengers`}
        </p>
      ))}
    </div>
  );
}

const axisStyle = {
  fontSize: 11,
  fill: "var(--color-muted-foreground)",
} as const;

export function RevenueTrendChart({
  data,
}: {
  data: { day: string; revenueCents: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--color-border)"
        />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={axisStyle}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={axisStyle}
          tickFormatter={(v: number) => formatCompactMoney(v)}
          width={56}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)" }} />
        <Area
          type="monotone"
          dataKey="revenueCents"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#revenueFill)"
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HourlyPassengersChart({
  data,
}: {
  data: { hour: string; passengers: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%">
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--color-border)"
        />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          tick={axisStyle}
          interval={2}
        />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={32} allowDecimals={false} />
        <Tooltip
          content={<ChartTooltip money={false} />}
          cursor={{ fill: "color-mix(in oklab, var(--color-muted) 60%, transparent)" }}
        />
        <Bar
          dataKey="passengers"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Payment mix as a labeled horizontal bar list: identity comes from the
 * fixed categorical order plus a direct label, never color alone.
 */
export function PaymentMixList({
  data,
}: {
  data: { provider: string; label: string; share: number }[];
}) {
  const top = data.slice(0, 4);
  const otherShare = data.slice(4).reduce((acc, d) => acc + d.share, 0);
  const rows = otherShare > 0 ? [...top, { provider: "other", label: "Other", share: otherShare }] : top;

  return (
    <ul className="space-y-4">
      {rows.map((row, i) => (
        <li key={row.provider}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <span
                className="size-2.5 rounded-full"
                style={{ background: CATEGORICAL[i % CATEGORICAL.length] }}
              />
              {row.label}
            </span>
            <span className="text-muted-foreground tabular">{row.share}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${row.share}%`,
                background: CATEGORICAL[i % CATEGORICAL.length],
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MiniBars({ data }: { data: { revenueCents: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={44}>
      <BarChart data={data}>
        <Bar dataKey="revenueCents" fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
