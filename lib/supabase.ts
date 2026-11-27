import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser/public Supabase client.
 * Authorization remains RLS; this module only constructs the shared client.
 *
 * Next.js replaces direct `process.env.NEXT_PUBLIC_*` reads with string literals
 * at build time for client bundles. Reads like `source.NEXT_PUBLIC_*` (when
 * `source` is a parameter defaulting to `process.env`) are NOT inlined, so the
 * browser sees empty values at runtime and would fall back to the placeholder
 * even when Preview/Production env is correctly configured.
 *
 * Keep the module-scope direct reads below so client builds receive the real
 * public URL/key. Tests may still pass an explicit `source` override.
 */

export const PUBLIC_SUPABASE_PLACEHOLDER_URL = "https://ci.invalid";
export const PUBLIC_SUPABASE_PLACEHOLDER_KEY = "ci-placeholder-not-a-credential";

/** Direct reads — required for Next.js client inlining. */
const BUILD_PUBLIC_SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const BUILD_PUBLIC_SUPABASE_PUBLISHABLE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
).trim();

export type PublicSupabaseEnv = {
  supabaseUrl: string;
  publishableKey: string;
};

export function readPublicSupabaseEnv(
  source?: Record<string, string | undefined>,
): PublicSupabaseEnv {
  if (!source) {
    return {
      supabaseUrl: BUILD_PUBLIC_SUPABASE_URL,
      publishableKey: BUILD_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    };
  }
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
  source?: Record<string, string | undefined>,
): SupabaseClient {
  const env = readPublicSupabaseEnv(source);
  if (isPublicSupabaseConfigured(env)) {
    return createClient(env.supabaseUrl, env.publishableKey);
  }
  return createClient(PUBLIC_SUPABASE_PLACEHOLDER_URL, PUBLIC_SUPABASE_PLACEHOLDER_KEY);
}

export const supabase = createPublicSupabaseClient();
