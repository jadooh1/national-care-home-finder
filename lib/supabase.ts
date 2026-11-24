import { createClient } from "@supabase/supabase-js";

/**
 * Non-routable placeholders used when public env is absent.
 * createClient throws on empty URL/key; that previously turned missing preview
 * env into HTTP 500 for every page that imports this module (Washington map,
 * Oregon, owner surfaces). Fail soft instead — queries still fail closed
 * against ci.invalid in listIndexableLicenses and directory loaders.
 */
const FALLBACK_SUPABASE_URL = "https://ci.invalid";
const FALLBACK_PUBLISHABLE_KEY = "ci-placeholder-not-a-credential";

const supabaseUrl =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim() || FALLBACK_SUPABASE_URL;

const supabasePublishableKey =
  (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim()
  || FALLBACK_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
