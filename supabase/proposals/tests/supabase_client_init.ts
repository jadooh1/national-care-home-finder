import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("supabase client falls back instead of throwing on missing public env", () => {
  const source = readFileSync("lib/supabase.ts", "utf8");
  assert.match(source, /PUBLIC_SUPABASE_PLACEHOLDER_URL/);
  assert.match(source, /ci\.invalid/);
  assert.match(source, /isPublicSupabaseConfigured/);
  assert.match(
    source,
    /createClient\(PUBLIC_SUPABASE_PLACEHOLDER_URL,\s*PUBLIC_SUPABASE_PLACEHOLDER_KEY\)/,
  );
  // Next.js client inlining requires direct process.env.NEXT_PUBLIC_* reads.
  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.equal(source.includes("process.env.NEXT_PUBLIC_SUPABASE_URL!"), false);
  assert.equal(source.includes("process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!"), false);
  assert.equal(source.includes("throw new Error"), false);
});
