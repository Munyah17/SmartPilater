"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BatteryFull,
  BusFront,
  CheckCircle2,
  CloudOff,
  Gauge,
  LayoutDashboard,
  MonitorSmartphone,
  Printer,
  QrCode,
  ShieldCheck,
  Signal,
  Wallet,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.21, 0.6, 0.35, 1] as const },
  }),
};

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <BusFront className="size-5" />
      </div>
      <div className="leading-tight">
        <span className="block text-[17px] font-semibold tracking-tight">
          SmartPilater
        </span>
        <span className="block text-[11px] font-medium text-muted-foreground">
          Seke 1 &amp; 2 paElo
        </span>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 glass border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <a href="#product" className="transition-colors hover:text-foreground">
            Product
          </a>
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#payments" className="transition-colors hover:text-foreground">
            Payments
          </a>
          <a href="#fleet" className="transition-colors hover:text-foreground">
            For fleets
          </a>
        </nav>
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/terminal">
              Launch terminal
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/** Miniature, purely visual replica of the terminal home screen. */
function TerminalMock() {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-lifted">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" />
            AEC 4521 · Seke 1
          </span>
          <span className="flex items-center gap-2">
            <Wifi className="size-3.5" />
            <Signal className="size-3.5" />
            <BatteryFull className="size-3.5" />
            06:42
          </span>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Today&apos;s revenue
            </p>
            <p className="text-3xl font-semibold tracking-tight tabular">$148.50</p>
            <p className="text-xs text-muted-foreground">
              99 passengers · trip 6 of the day
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ["Local", "$1"],
              ["Main Rank", "$1.50"],
              ["Extended", "$2"],
              ["Custom", "···"],
            ].map(([label, price], i) => (
              <div
                key={label}
                className={`rounded-xl border p-3.5 ${
                  i === 1
                    ? "border-primary/50 bg-primary text-primary-foreground shadow-soft"
                    : "border-border/70 bg-background"
                }`}
              >
                <p className="text-xs font-medium opacity-80">{label}</p>
                <p className="text-xl font-semibold tabular">{price}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-foreground text-background">
              <QrCode className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">EcoCash · waiting for payment</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full w-1/2 rounded-full bg-primary"
                  animate={{ x: ["-100%", "220%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold tabular text-muted-foreground">0:47</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const stats = [
  { value: "3 sec", label: "fare to printed receipt" },
  { value: "100%", label: "offline capable" },
  { value: "9+", label: "payment rails supported" },
  { value: "T+1", label: "settlement to your bank" },
];

const features = [
  {
    icon: QrCode,
    title: "Tap a fare, show a QR",
    body: "The conductor taps one preset and the terminal renders a dynamic QR with a live countdown. No typing, no change, no arguments over coins.",
  },
  {
    icon: CloudOff,
    title: "Built for dead zones",
    body: "Every ticket is written to the device first and synced when signal returns. The queue drains itself; nobody thinks about connectivity.",
  },
  {
    icon: Printer,
    title: "Receipts that verify themselves",
    body: "Each thermal receipt carries a unique QR. Anyone can scan it and see the fare, route, vehicle and payment status in one second.",
  },
  {
    icon: LayoutDashboard,
    title: "A dashboard owners actually open",
    body: "Live revenue, peak hours, payment mix, top routes and top conductors, rendered in charts that respect your attention.",
  },
  {
    icon: MonitorSmartphone,
    title: "Every terminal on one screen",
    body: "Battery, signal, GPS, printer health, software version and last sync for the whole fleet, with remote reboot and OTA updates.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-grade posture",
    body: "Row-level security, role-based access, full audit logs and device authentication. Money data is treated like money.",
  },
];

const steps = [
  {
    title: "Passenger boards",
    body: "The conductor asks the destination, exactly as they do today. The workflow does not change; only the cash disappears.",
  },
  {
    title: "One tap, one QR",
    body: "A preset fare generates a payment QR with a countdown. The passenger pays from EcoCash, InnBucks, OneMoney, card or ZIPIT.",
  },
  {
    title: "Receipt prints, money lands",
    body: "A verifiable receipt prints instantly. Funds settle to the fleet account with fees itemised, no envelopes of notes at day end.",
  },
];

const providers = [
  "EcoCash",
  "OneMoney",
  "InnBucks",
  "Omari",
  "Paynow",
  "POS2U",
  "Visa",
  "Mastercard",
  "ZIPIT",
];

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-20 pt-32 sm:pt-40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_9%,transparent),transparent)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <Badge className="mb-5">
                <Wallet className="size-3" />
                Digital fare collection for Zimbabwe
              </Badge>
            </motion.div>
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]"
            >
              The kombi runs the same.
              <br />
              <span className="text-primary">The cash disappears.</span>
            </motion.h1>
            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
            >
              SmartPilater puts a beautiful, offline-first payment terminal in
              every kombi. Conductors tap a fare, passengers scan and pay, owners
              watch every dollar land in real time.
            </motion.p>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Button size="lg" asChild>
                <Link href="/terminal">
                  Try the terminal
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">
                  <Gauge className="size-4" />
                  View fleet dashboard
                </Link>
              </Button>
            </motion.div>
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
              className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
            >
              {["Works offline", "Prints verified receipts", "Settles daily"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-success" />
                    {item}
                  </li>
                ),
              )}
            </motion.ul>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.21, 0.6, 0.35, 1] }}
            className="animate-float-slow"
          >
            <TerminalMock />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-card/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 py-10 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={i}
              className="px-4 py-2 text-center"
            >
              <p className="text-3xl font-semibold tracking-tight text-primary tabular">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="product" className="px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything a rank needs, nothing it does not
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              One terminal in the kombi, one dashboard for the fleet, one
              settlement to the bank.
            </p>
          </motion.div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={i % 3}
                className="group rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-[17px] font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border/60 bg-card/50 px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="text-center text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Three steps. Zero new habits.
          </motion.h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={i}
                className="relative"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-soft">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payments */}
      <section id="payments" className="px-5 py-24">
        <div className="mx-auto max-w-6xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
          >
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Every wallet your passengers already carry
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Providers plug into an adapter layer, so new rails ship without
              touching the terminal.
            </p>
          </motion.div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {providers.map((name, i) => (
              <motion.span
                key={name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={i * 0.5}
                className="rounded-full border border-border/70 bg-card px-5 py-2.5 text-sm font-medium shadow-soft"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="fleet" className="px-5 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-lifted sm:px-16"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_100%_at_50%_0%,rgb(255_255_255/0.14),transparent)]"
          />
          <h2 className="relative text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Put your fleet on SmartPilater
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
            From a single kombi on Seke Road to a national operation, onboarding
            takes a day, not a quarter.
          </p>
          <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild className="bg-white text-primary hover:bg-white/90">
              <Link href="/dashboard">
                Open the dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            >
              <Link href="/terminal">See the terminal</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SmartPilater. Built for the people who
            move Zimbabwe.
          </p>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <Link href="/verify" className="transition-colors hover:text-foreground">
              Verify a ticket
            </Link>
            <Link href="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
