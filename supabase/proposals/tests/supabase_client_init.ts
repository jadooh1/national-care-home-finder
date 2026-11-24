import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("supabase client falls back instead of throwing on missing public env", () => {
  const source = readFileSync("lib/supabase.ts", "utf8");
  assert.match(source, /FALLBACK_SUPABASE_URL/);
  assert.match(source, /ci\.invalid/);
  assert.match(source, /trim\(\) \|\| FALLBACK_SUPABASE_URL/);
  assert.equal(source.includes("process.env.NEXT_PUBLIC_SUPABASE_URL!"), false);
  assert.equal(source.includes("process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!"), false);
});
