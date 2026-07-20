"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { demoFares, demoOrg } from "@/lib/demo-data";
import { formatFare } from "@/lib/format";
import type { Currency } from "@/types/domain";

const orgSchema = z.object({
  tradingName: z.string().min(2, "Trading name is required"),
  phone: z.string().min(9, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email"),
  city: z.string().min(2, "City is required"),
  receiptFooter: z.string().max(60, "Keep the footer under 60 characters"),
  successTimeoutSeconds: z.number().int().min(3).max(30),
});

type OrgForm = z.infer<typeof orgSchema>;

export default function SettingsPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      tradingName: demoOrg.tradingName,
      phone: demoOrg.phone,
      email: demoOrg.email,
      city: demoOrg.city,
      receiptFooter: "Fambai zvakanaka. Thank you!",
      successTimeoutSeconds: 8,
    },
  });

  const [kioskMode, setKioskMode] = React.useState(true);
  const [offlineSelling, setOfflineSelling] = React.useState(true);
  const [autoPrint, setAutoPrint] = React.useState(true);
  const [enabledCurrencies, setEnabledCurrencies] = React.useState<Currency[]>(
    demoOrg.enabledCurrencies,
  );
  const [defaultCurrency, setDefaultCurrency] = React.useState<Currency>(
    demoOrg.currency,
  );

  const toggleCurrency = (id: Currency, on: boolean) => {
    if (!on && enabledCurrencies.length === 1) {
      toast.error("At least one currency must stay accepted");
      return;
    }
    const next = on
      ? [...enabledCurrencies, id]
      : enabledCurrencies.filter((c) => c !== id);
    setEnabledCurrencies(next);
    // The default drives self-service pay (passengers never choose) — if it
    // was just switched off, fall back to whatever is still enabled.
    if (!on && defaultCurrency === id) {
      setDefaultCurrency(next[0]);
    }
    toast.success(`${id === "USD" ? "US Dollar" : "ZiG (ZWG)"} ${on ? "enabled" : "disabled"}`, {
      description: on
        ? "Your conductors can now accept this currency."
        : "Conductors can no longer charge fares in this currency.",
    });
  };

  const onSubmit = async (values: OrgForm) => {
    // Persists via Supabase once configured; demo mode just confirms.
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Settings saved", {
      description: `${values.tradingName} · receipts end with “${values.receiptFooter}”.`,
    });
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Organisation profile, terminal behaviour and fare configuration."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organisation</CardTitle>
            <CardDescription>
              Shown on receipts, settlements and the verification page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tradingName">Trading name</Label>
                <Input id="tradingName" {...register("tradingName")} />
                {errors.tradingName && (
                  <p className="text-xs text-destructive">{errors.tradingName.message}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register("phone")} />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("city")} />
                  {errors.city && (
                    <p className="text-xs text-destructive">{errors.city.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Receipt footer</Label>
                <Input id="receiptFooter" {...register("receiptFooter")} />
                {errors.receiptFooter && (
                  <p className="text-xs text-destructive">
                    {errors.receiptFooter.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="successTimeoutSeconds">
                  Return to fares after success (seconds)
                </Label>
                <Input
                  id="successTimeoutSeconds"
                  type="number"
                  min={3}
                  max={30}
                  {...register("successTimeoutSeconds", { valueAsNumber: true })}
                />
                {errors.successTimeoutSeconds && (
                  <p className="text-xs text-destructive">
                    {errors.successTimeoutSeconds.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Accepted currencies</CardTitle>
              <CardDescription>
                You choose what your fleet accepts — never the passenger. Most
                operators run USD only; parastatals must also accept ZiG. Turn
                on both if your conductors should be able to take either.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  {
                    id: "USD" as const,
                    label: "US Dollar",
                    hint: "Street standard — most fleets",
                  },
                  {
                    id: "ZWG" as const,
                    label: "ZiG (ZWG)",
                    hint: "Legally required acceptance",
                  },
                ]
              ).map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {option.label}
                      {defaultCurrency === option.id && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{option.hint}</p>
                  </div>
                  <Switch
                    checked={enabledCurrencies.includes(option.id)}
                    onCheckedChange={(v) => toggleCurrency(option.id, v)}
                  />
                </div>
              ))}
              <Separator />
              <div className="space-y-2">
                <Label>Default currency</Label>
                <p className="text-xs text-muted-foreground">
                  Used for self-service public pay, where the passenger never
                  picks — they pay whatever the route requires. Conductors with
                  more than one currency enabled can still choose per sale.
                </p>
                <div className="flex gap-2 pt-1">
                  {enabledCurrencies.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDefaultCurrency(id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        defaultCurrency === id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/70 text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {id === "USD" ? "US Dollar" : "ZiG (ZWG)"}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Terminal behaviour</CardTitle>
              <CardDescription>
                Applied to every terminal in the fleet on next sync.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                {
                  label: "Kiosk mode",
                  description: "Locks terminals to SmartPilater; no home screen access.",
                  checked: kioskMode,
                  onChange: setKioskMode,
                },
                {
                  label: "Offline selling",
                  description: "Keep issuing tickets in dead zones and sync later.",
                  checked: offlineSelling,
                  onChange: setOfflineSelling,
                },
                {
                  label: "Auto-print receipts",
                  description: "Print immediately on payment success.",
                  checked: autoPrint,
                  onChange: setAutoPrint,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={item.checked}
                    onCheckedChange={(v) => {
                      item.onChange(v);
                      toast.success(`${item.label} ${v ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick fares</CardTitle>
              <CardDescription>
                The presets conductors see on the terminal home screen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {demoFares.map((fare) => (
                  <li
                    key={fare.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{fare.label}</p>
                      <p className="text-xs text-muted-foreground">{fare.description}</p>
                    </div>
                    <span className="text-lg font-semibold text-primary tabular">
                      {formatFare(fare.amountCents)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Fare editing goes live with the Supabase connection; presets sync
                to terminals over the air.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
