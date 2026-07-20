/**
 * NFC/RFID card reader bridge for terminal hardware.
 *
 * Mounted Android POS units (the built-in-reader devices, not just phones)
 * expose their NFC reader through a WebView bridge, the same convention as
 * the printer in `lib/receipts/escpos.ts`: the native host injects
 * `window.SmartPilaterNFC` and this module is the only thing that touches
 * it. On a bare Android Chrome browser with no native host, Web NFC (Chrome
 * for Android, HTTPS only) is used as a fallback. Desktop/demo browsers have
 * neither, so callers must offer a manual "simulate tap" path.
 */

export interface NfcTapResult {
  /** Card UID as reported by the reader, e.g. "04:A2:1B:3C". */
  cardId: string;
}

declare global {
  interface Window {
    /** Injected by the Android kiosk shell when an NFC/RFID reader is attached. */
    SmartPilaterNFC?: {
      /** Resolves once a card is tapped, or rejects after the host's own timeout. */
      readCard(): Promise<{ cardId: string }>;
    };
  }
}

export function isNfcHostAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(window.SmartPilaterNFC);
}

export function isWebNfcAvailable(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

export function isNfcSupported(): boolean {
  return isNfcHostAvailable() || isWebNfcAvailable();
}

/**
 * Waits for a single card tap. Prefers the native host bridge (dedicated
 * NFC/RFID readers can read transit cards Web NFC can't); falls back to Web
 * NFC for bank-card-only taps on a bare Android browser.
 */
export async function readNfcCard(signal?: AbortSignal): Promise<NfcTapResult> {
  if (isNfcHostAvailable()) {
    const { cardId } = await window.SmartPilaterNFC!.readCard();
    return { cardId };
  }
  if (isWebNfcAvailable()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reader = new (window as any).NDEFReader();
    await reader.scan({ signal });
    return new Promise((resolve, reject) => {
      signal?.addEventListener("abort", () => reject(new Error("Tap cancelled")));
      reader.addEventListener(
        "reading",
        (event: { serialNumber: string }) => {
          resolve({ cardId: event.serialNumber || "UNKNOWN" });
        },
        { once: true },
      );
      reader.addEventListener(
        "readingerror",
        () => reject(new Error("Could not read the card. Try again.")),
        { once: true },
      );
    });
  }
  throw new Error("No NFC/RFID reader available on this device.");
}
