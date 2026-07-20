import { listQueuedTickets, markSynced, setMeta } from "./db";

/**
 * Sync engine: drains the offline ticket queue to the backend.
 *
 * Strategy
 *  1. Tickets are idempotent by id, so replays are safe (the server upserts).
 *  2. Exponential backoff between failed attempts, capped at two minutes.
 *  3. Triggered by: reconnect events, visibility changes, a steady interval,
 *     and the service worker's Background Sync when the tab is closed.
 *
 * In demo mode (no Supabase configured) the push is a no-op that succeeds,
 * so the queue visibly drains the moment connectivity returns.
 */

type PushFn = (payload: unknown) => Promise<void>;

let pushImpl: PushFn = async () => {
  // Demo mode: pretend the round trip took a moment.
  await new Promise((r) => setTimeout(r, 300));
};

export function configurePush(fn: PushFn) {
  pushImpl = fn;
}

let syncing = false;
let backoffMs = 2_000;

export async function drainQueue(): Promise<{ synced: number; remaining: number }> {
  if (syncing) return { synced: 0, remaining: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const queued = await listQueuedTickets();
    return { synced: 0, remaining: queued.length };
  }

  syncing = true;
  let synced = 0;
  try {
    const queued = await listQueuedTickets();
    for (const ticket of queued) {
      await pushImpl(ticket);
      await markSynced(ticket.id);
      synced++;
    }
    backoffMs = 2_000;
    await setMeta("lastSyncAt", new Date().toISOString());
    const remaining = (await listQueuedTickets()).length;
    return { synced, remaining };
  } catch {
    // Leave unsynced rows queued; retry with backoff.
    backoffMs = Math.min(backoffMs * 2, 120_000);
    setTimeout(() => void drainQueue(), backoffMs);
    const remaining = (await listQueuedTickets()).length;
    return { synced, remaining };
  } finally {
    syncing = false;
  }
}

/** Wire the browser-level triggers once per terminal session. */
export function startSyncLoop(): () => void {
  const onOnline = () => void drainQueue();
  const onVisible = () => {
    if (document.visibilityState === "visible") void drainQueue();
  };
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisible);
  const interval = setInterval(() => void drainQueue(), 45_000);
  void drainQueue();

  return () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisible);
    clearInterval(interval);
  };
}
