import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser/public Supabase client.
 * Authorization remains RLS; this module only constructs the shared client.
 *
 * Next.js inlines NEXT_PUBLIC_* at build time. An empty Preview/Production env
 * used to throw "supabaseUrl is required" during module evaluation and take down
 * every route that imported this file (SSR 500 + client Application error).
 * Missing config now yields a non-routable placeholder client so pages can render
 * their existing error empty-states instead of crashing the tree.
 */

export const PUBLIC_SUPABASE_PLACEHOLDER_URL = "https://ci.invalid";
export const PUBLIC_SUPABASE_PLACEHOLDER_KEY = "ci-placeholder-not-a-credential";

export type PublicSupabaseEnv = {
  supabaseUrl: string;
  publishableKey: string;
};

export function readPublicSupabaseEnv(
  source: Record<string, string | undefined> = process.env,
): PublicSupabaseEnv {
  return {
    supabaseUrl: (source.NEXT_PUBLIC_SUPABASE_URL ?? "").trim(),
    publishableKey: (source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim(),
  };
}

export function isPublicSupabaseConfigured(env: PublicSupabaseEnv): boolean {
  if (!env.supabaseUrl || !env.publishableKey) return false;
  if (env.supabaseUrl === PUBLIC_SUPABASE_PLACEHOLDER_URL) return false;
  try {
    const url = new URL(env.supabaseUrl);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

/** Testable factory — production code uses the shared `supabase` export below. */
export function createPublicSupabaseClient(
  source: Record<string, string | undefined> = process.env,
): SupabaseClient {
  const env = readPublicSupabaseEnv(source);
  if (isPublicSupabaseConfigured(env)) {
    return createClient(env.supabaseUrl, env.publishableKey);
  }
  return createClient(PUBLIC_SUPABASE_PLACEHOLDER_URL, PUBLIC_SUPABASE_PLACEHOLDER_KEY);
}

export const supabase = createPublicSupabaseClient();
