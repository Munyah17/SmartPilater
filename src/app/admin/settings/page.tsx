"use client";

import * as React from "react";
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

export default function AdminSettingsPage() {
  const [feePercent, setFeePercent] = React.useState("2.0");
  const [autoApprove, setAutoApprove] = React.useState(false);
  const [requireZig, setRequireZig] = React.useState(true);
  const [publicPay, setPublicPay] = React.useState(true);

  return (
    <>
      <PageHeader
        title="Platform settings"
        description="Defaults applied to every new fleet company. Existing fleets keep their negotiated terms."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commercials</CardTitle>
            <CardDescription>Default platform fee for new fleets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fee">Platform fee (% of gross)</Label>
              <Input
                id="fee"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={feePercent}
                onChange={(e) => setFeePercent(e.target.value)}
                className="max-w-32"
              />
              <p className="text-xs text-muted-foreground">
                Charged per paid ticket, deducted at settlement. Per-fleet overrides
                live on the fleet company record.
              </p>
            </div>
            <Button
              onClick={() =>
                toast.success(`Default platform fee set to ${feePercent}%`)
              }
            >
              Save commercials
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy</CardTitle>
            <CardDescription>Platform-wide behaviour switches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              {
                label: "Public self-service pay",
                description:
                  "Passengers can pay by QR sticker or USSD push without a conductor. Flat full-route fares only.",
                checked: publicPay,
                onChange: setPublicPay,
              },
              {
                label: "ZiG acceptance available",
                description:
                  "Fleets may choose ZWG as their transacting currency (required for parastatals; legally every operator must accept ZiG).",
                checked: requireZig,
                onChange: setRequireZig,
              },
              {
                label: "Auto-approve new fleets",
                description:
                  "Skip manual review for new fleet company sign-ups. Keep off while KYC is manual.",
                checked: autoApprove,
                onChange: setAutoApprove,
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
      </div>
    </>
  );
}
