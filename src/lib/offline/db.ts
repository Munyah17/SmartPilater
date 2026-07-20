import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Ticket } from "@/types/domain";

/**
 * IndexedDB layer for offline-first terminals.
 *
 * Every ticket issued on a terminal is written here first, then pushed to
 * Supabase by the sync engine. If the kombi drives through a dead zone the
 * terminal keeps selling; the queue drains automatically on reconnect
 * (Background Sync where available, interval fallback otherwise).
 */

interface SmartPilaterDB extends DBSchema {
  tickets: {
    key: string;
    value: Ticket;
    indexes: { "by-sync": string; "by-issued": string };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = "smartpilater-terminal";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SmartPilaterDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SmartPilaterDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SmartPilaterDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const tickets = db.createObjectStore("tickets", { keyPath: "id" });
        tickets.createIndex("by-sync", "syncState");
        tickets.createIndex("by-issued", "issuedAt");
        db.createObjectStore("meta", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

export async function saveTicket(ticket: Ticket): Promise<void> {
  const db = await getDB();
  await db.put("tickets", ticket);
}

export async function listQueuedTickets(): Promise<Ticket[]> {
  const db = await getDB();
  return db.getAllFromIndex("tickets", "by-sync", "queued");
}

export async function listRecentTickets(limit = 50): Promise<Ticket[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("tickets", "by-issued");
  return all.reverse().slice(0, limit);
}

export async function markSynced(ticketId: string): Promise<void> {
  const db = await getDB();
  const ticket = await db.get("tickets", ticketId);
  if (ticket) {
    await db.put("tickets", { ...ticket, syncState: "synced" });
  }
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put("meta", { key, value });
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDB();
  const row = await db.get("meta", key);
  return row?.value ?? null;
}
