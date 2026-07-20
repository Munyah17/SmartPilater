"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  BusFront,
  CarFront,
  Gauge,
  MonitorSmartphone,
  QrCode,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    const supabase = createClient();
    if (!supabase) {
      toast.info("Supabase is not connected yet", {
        description: "Use the demo entrances below while the backend is configured.",
      });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error("Sign in failed", { description: error.message });
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.21, 0.6, 0.35, 1] }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <BusFront className="size-5" />
          </div>
          <div className="leading-tight">
            <span className="block text-lg font-semibold tracking-tight">
              SmartPilater
            </span>
            <span className="block text-xs text-muted-foreground">
              Seke 1 &amp; 2 paElo
            </span>
          </div>
        </Link>

        <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your fleet console or terminal.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ops@sekeexpress.co.zw"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {!configured && (
            <>
              <div className="my-6 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs font-medium text-muted-foreground">
                  demo mode
                </span>
                <Separator className="flex-1" />
              </div>
              <div className="space-y-2.5">
                <Button variant="outline" className="w-full" size="lg" asChild>
                  <Link href="/admin">
                    <ShieldCheck className="size-4" />
                    Enter as super admin
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" size="lg" asChild>
                  <Link href="/dashboard">
                    <Gauge className="size-4" />
                    Enter as fleet owner
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" size="lg" asChild>
                  <Link href="/conductor">
                    <Ticket className="size-4" />
                    Enter as conductor
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" size="lg" asChild>
                  <Link href="/driver">
                    <CarFront className="size-4" />
                    Enter as driver
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" size="lg" asChild>
                  <Link href="/terminal">
                    <MonitorSmartphone className="size-4" />
                    Open a terminal
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full" size="lg" asChild>
                  <Link href="/pay">
                    <QrCode className="size-4" />
                    Pay as a passenger (no login)
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Access is provisioned by your fleet administrator.
        </p>
      </motion.div>
    </div>
  );
}
