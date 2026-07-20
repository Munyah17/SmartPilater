"use client";

import * as React from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ExternalLink, Printer, QrCode } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { demoOrg, demoRoutes, demoVehicles } from "@/lib/demo-data";
import { formatFare } from "@/lib/format";

/**
 * Public pay QR stickers: one per vehicle. Passengers scan the sticker
 * inside the kombi and pay the flat full-route fare with no conductor
 * involved (EcoCash USSD push — works on any phone, no app needed).
 */
export default function PublicPayPage() {
  const [origin, setOrigin] = React.useState("");
  React.useEffect(() => setOrigin(window.location.origin), []);

  const vehicles = demoVehicles.filter((v) => v.active);

  return (
    <>
      <PageHeader
        title="Public pay QRs"
        description="Print one sticker per kombi. Passengers scan it and pay the flat full-route fare — no conductor needed."
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print stickers
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="size-4 text-primary" />
            How it works
          </CardTitle>
          <CardDescription>
            Self-service tickets always charge the fare to the route&apos;s final
            destination — everyone pays the same. Early drop-offs and custom fares
            stay with your signed-in conductors and drivers on the terminal, where
            the discount is attributable to a person.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle) => {
          const route = demoRoutes.find((r) => r.id === vehicle.routeId);
          if (!route) return null;
          const url = `${origin || "https://smartpilater.app"}/pay/${vehicle.id}`;
          return (
            <Card key={vehicle.id} className="print:break-inside-avoid">
              <CardHeader className="pb-3 text-center">
                <CardTitle className="text-xl">{vehicle.registration}</CardTitle>
                <CardDescription>
                  {route.name} · flat fare{" "}
                  <span className="font-semibold text-primary">
                    {formatFare(route.publicFareCents, demoOrg.currency)}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="rounded-2xl border border-border/70 bg-white p-4">
                  <QRCodeSVG value={url} size={168} level="M" />
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Scan · Pay · Ride — powered by SmartPilater
                </p>
                <Button asChild variant="ghost" size="sm" className="mt-2">
                  <Link href={`/pay/${vehicle.id}`} target="_blank">
                    <ExternalLink className="size-3.5" />
                    Preview passenger page
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
