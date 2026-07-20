"use client";

import * as React from "react";

/**
 * Live connectivity signal for the terminal status bar and offline badges.
 * Starts as online during SSR and corrects itself on mount.
 */
export function useNetworkStatus(): boolean {
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  return online;
}
