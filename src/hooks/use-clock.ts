"use client";

import * as React from "react";

/** Minute-accurate clock for the terminal header. Null until mounted so
 *  SSR output never disagrees with the client. */
export function useClock(): Date | null {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  return now;
}
