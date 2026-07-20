import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client.
 *
 * Returns null when the environment variables are absent so the app can run
 * in demo mode (in-memory data) without crashing. Screens check
 * `isSupabaseConfigured()` and fall back to the demo repositories.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
