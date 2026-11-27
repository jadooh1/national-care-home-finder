# Washington SEO Phase 2 — supabaseUrl Preview failure

## Reconciliation

Validation previously reported development Supabase host **PASS** because the Preview JavaScript contained the literal hostname `ajjsyloyihcqdomywhik.supabase.co`. That string comes from source constants (`DEVELOPMENT_SUPABASE_HOST` / directory helpers), not from an inlined `NEXT_PUBLIC_SUPABASE_URL` value.

The same Preview threw `Uncaught Error: supabaseUrl is required` from `lib/supabase.ts` during module evaluation. Home stayed up because `app/page.tsx` only reads the env string and never calls `createClient`. Every Washington route that imports `lib/supabase` crashed (SSR HTTP 500 + client Application error).

## Origin

| Layer | Finding |
|---|---|
| Preview environment configuration | Confirmed primary cause: this Preview build did not inline a real `https://…supabase.co` URL (unlike Production, which inlines the production project URL). |
| Next.js build-time `NEXT_PUBLIC_*` | Empty/missing Preview env is compiled into the client as an empty value; `createClient` then throws at import time. |
| SSR imports | Phase 2 server pages render client children that import `lib/supabase`; import-time throw becomes HTTP 500 even when roster loaders return `{ ok: false }`. |
| Supabase client initialization | Confirmed code defect: eager `createClient(process.env…!)` with no guard. |

## Comparison with last working surfaces

- Production (`www.nationalcarehomefinder.com`) and the project alias still serve the pre–Phase 2 client directory shell (`Loading listings`, no SSR profile links) and **do** inline a real Supabase project URL — so `createClient` succeeds there.
- The failed immutable Preview for Phase 2 (`development` @ `6952235`) did not inline a Supabase project URL and crashed Washington routes.

## Fix in this change

1. Harden `lib/supabase.ts` so missing/invalid public env yields a non-routable placeholder client instead of throwing during import.
2. Add regression tests that use a realistic development URL shape and publishable-key shape (not live credentials), and that prove hardcoded host constants are not treated as env proof.

## Configuration approval still required

Code hardening stops the 500 crash. Checks 1–10 still need a Preview build that receives development public env so SSR HTML can include roster facts.

Escalate for human approval (no values in chat):

- Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Project: Vercel project for National Care Home Finder; Supabase project ref `ajjsyloyihcqdomywhik` (development)
- Scope: **Preview** (and **Development** if used for `vercel dev`). Do not change Production values or the production Supabase project.

After those Preview env values are confirmed present, rebuild the corrective Preview and re-run checks 1–10 including initial HTML without JavaScript.
