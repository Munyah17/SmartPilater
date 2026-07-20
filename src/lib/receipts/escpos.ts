import type { Ticket } from "@/types/domain";
import { formatDate, formatMoney, formatTime, shortRef } from "@/lib/format";

/**
 * ESC/POS receipt builder for 58mm thermal printers.
 *
 * Mounted Android terminals expose their printer either through a WebView
 * bridge (window.SmartPilaterPrinter.print(base64)) or a Bluetooth ESC/POS
 * socket. This module renders a ticket into raw ESC/POS bytes; transport
 * is the host app's concern.
 */

const ESC = 0x1b;
const GS = 0x1d;

class EscPosBuilder {
  private chunks: number[] = [];

  raw(...bytes: number[]) {
    this.chunks.push(...bytes);
    return this;
  }

  init() {
    return this.raw(ESC, 0x40);
  }

  align(mode: "left" | "center" | "right") {
    return this.raw(ESC, 0x61, { left: 0, center: 1, right: 2 }[mode]);
  }

  bold(on: boolean) {
    return this.raw(ESC, 0x45, on ? 1 : 0);
  }

  size(width: 1 | 2, height: 1 | 2) {
    return this.raw(GS, 0x21, ((width - 1) << 4) | (height - 1));
  }

  text(value: string) {
    for (const ch of value) {
      const code = ch.charCodeAt(0);
      this.chunks.push(code < 256 ? code : 0x3f); // "?" for non-latin
    }
    return this;
  }

  line(value = "") {
    return this.text(value).raw(0x0a);
  }

  divider() {
    return this.line("-".repeat(32));
  }

  /** QR model 2, sized for 58mm paper. */
  qr(payload: string) {
    const data = [...payload].map((c) => c.charCodeAt(0));
    const len = data.length + 3;
    this.raw(GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 50, 0); // model 2
    this.raw(GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, 6); // module size
    this.raw(GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 48); // error correction L
    this.raw(GS, 0x28, 0x6b, len & 0xff, (len >> 8) & 0xff, 0x31, 0x50, 0x30, ...data);
    this.raw(GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30); // print
    return this;
  }

  cut() {
    return this.raw(GS, 0x56, 0x42, 0x10);
  }

  build(): Uint8Array {
    return Uint8Array.from(this.chunks);
  }
}

export interface ReceiptContext {
  companyName: string;
  vehicleReg: string;
  routeName: string;
  verifyBaseUrl: string;
  footer?: string;
}

export function buildReceipt(ticket: Ticket, ctx: ReceiptContext): Uint8Array {
  const issued = new Date(ticket.issuedAt);
  return new EscPosBuilder()
    .init()
    .align("center")
    .bold(true)
    .size(2, 2)
    .line(ctx.companyName)
    .size(1, 1)
    .bold(false)
    .line("Digital fare receipt")
    .divider()
    .align("left")
    .line(`Vehicle   ${ctx.vehicleReg}`)
    .line(`Route     ${ctx.routeName}`)
    .line(`To        ${ticket.destination}`)
    .line(`Date      ${formatDate(issued)}`)
    .line(`Time      ${formatTime(issued)}`)
    .divider()
    .align("center")
    .bold(true)
    .size(2, 2)
    .line(formatMoney(ticket.amountCents))
    .size(1, 1)
    .bold(false)
    .line(`Ref ${shortRef(ticket.id)} · ${ticket.provider.toUpperCase()}`)
    .divider()
    .qr(`${ctx.verifyBaseUrl}/verify/${ticket.id}`)
    .line("Scan to verify this ticket")
    .line(ctx.footer ?? "Fambai zvakanaka. Thank you!")
    .raw(0x0a, 0x0a)
    .cut()
    .build();
}

declare global {
  interface Window {
    /** Injected by the Android kiosk shell when a printer is attached. */
    SmartPilaterPrinter?: { print: (base64: string) => void };
  }
}

/** Hand the rendered receipt to whichever transport the host exposes. */
export function printReceipt(ticket: Ticket, ctx: ReceiptContext): boolean {
  const bytes = buildReceipt(ticket, ctx);
  if (typeof window !== "undefined" && window.SmartPilaterPrinter) {
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    window.SmartPilaterPrinter.print(btoa(binary));
    return true;
  }
  // No physical printer (browser demo): succeed silently so the flow
  // continues; the on-screen receipt is the source of truth here.
  return false;
}
