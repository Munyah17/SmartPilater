"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QrCode, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Manual entry point for inspectors without a scanner. */
export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = React.useState("");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-8 shadow-soft"
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <QrCode className="size-7" />
        </div>
        <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight">
          Verify a ticket
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Scan the QR on any SmartPilater receipt, or enter the ticket code
          printed under it.
        </p>
        <form
          className="mt-7 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) {
              router.push(`/verify/${encodeURIComponent(code.trim())}`);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="code">Ticket code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. tkt-0-8-2-4051"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={!code.trim()}>
            <Search className="size-4" />
            Check ticket
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
