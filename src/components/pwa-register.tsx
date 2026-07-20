"use client";

import * as React from "react";
import { drainQueue } from "@/lib/offline/sync";

/** Registers the service worker and wires Background Sync messages. */
export function PwaRegister() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failing (unsupported browser) never blocks the app.
    });
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "DRAIN_QUEUE") void drainQueue();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  return null;
}
