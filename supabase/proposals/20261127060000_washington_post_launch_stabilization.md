# Washington post-launch stabilization and growth readiness

## Phase closure — launch acceptance

**Status:** Washington launch-complete **GO** (human acknowledged).

Acceptance phase is **closed**. Do not re-run S5-A, S5-B, S6, or other completed
gates unless a regression is evidenced.

### Preserved evidence baseline

| Item | Reference |
| --- | --- |
| Launch decision | GO — Owner B recovery completed; final S5-B PASS |
| Final S5-B agent | `bc-ca9aaf77-1bb8-5ece-bbca-48e797c86baf` |
| Prior S6 (retained) | `bc-d36dd5b8-af9d-5065-afde-52e00438b92d` |
| Show/Hide production | PR #234 → `main` (password visibility) |
| Recovery handoff production | PR #236 → `main` @ `289a80a7fcea1ab2d251426abec964eb830a0eb1` |
| Live site | `https://www.nationalcarehomefinder.com` |
| Production Auth | `yiehgstweswxjakbcdzc.supabase.co` |
| Authoritative roster | **6,278** WA homes (Design 2 preserved) |

### Security baseline (do not regress)

- Design 2 owner/family surfaces unchanged by growth work unless explicitly approved.
- Auth: recovery → `/auth/callback` → `/owner/reset-password`; Site URL www + callback allowlist verified.
- Show/Hide Password on owner credential fields (including reset form).
- State-publication restrictions: only Washington public; no other-state expansion without approval.
- Billing / premium: **OFF** on production (`developmentBillingAllowed` false; no Stripe; entitlement count expected 0).
- Private prefixes remain noindex: `/owner`, `/admin`, `/auth`, `/development`, `/oregon`.
- Do not request or embed service-role keys in the app; least-privilege Runtime Secrets only.

---

## Post-launch workstreams (actionable)

Priority order: stabilize production → make discovery trustworthy → measure → acquire
owners and families → marketing readiness (still unpaid / unapproved ads).

### 1. Production monitoring

| Action | Owner | Notes |
| --- | --- | --- |
| Confirm Vercel production deployment health for `main` tip | Agent / human | Track deploy SHA (`289a80a` recovery; later tips as shipped) |
| Watch Auth callback / reset-password error rates qualitatively after real recoveries | Human | No new recovery spam; investigate only on reported failures |
| Add lightweight uptime check (optional, later) | Needs approval | External ping of `/` + `/washington` — no paid plan without approval |
| Error reporting (Sentry etc.) | Needs approval | Not in-repo today; do not add paid SaaS without approval |
| Regression rule | All | Re-open S5/S6 only with concrete Auth/UI failure evidence |

### 2. SEO

| Action | Owner | Notes |
| --- | --- | --- |
| Confirm `robots.ts` / `sitemap.ts` serve on www production | Agent | Indexing gated by `publicIndexingAllowed` + canonical host |
| Spot-check canonical + titles on `/`, `/washington`, sample facility profiles | Agent | Uses `lib/public-metadata.ts` / `lib/public-indexing.ts` |
| Keep owner/admin/auth noindex | Preserve | `PRIVATE_INDEX_PREFIXES` |
| Fix only evidenced SEO bugs | Agent | No redesign of Design 2 |

### 3. Google indexing

| Action | Owner | Notes |
| --- | --- | --- |
| Confirm Google Search Console property for `https://www.nationalcarehomefinder.com` | **Human** | No GSC automation in-repo |
| Submit / inspect sitemap URL once GSC is connected | **Human** | Typically `https://www.nationalcarehomefinder.com/sitemap.xml` |
| Request indexing for key landing URLs if needed | **Human** | Homepage, `/washington`, 1–2 representative profiles |
| Monitor coverage / excluded pages | **Human** | Escalate only real coverage regressions |

### 4. Analytics readiness

| Action | Owner | Notes |
| --- | --- | --- |
| Current code: `measurementIdReady` returns **null** on production hosts | Baseline | GA does **not** fire on www/apex by design today |
| Decide whether to enable production GA | **Human approval** | Would require code change to allow prod hosts + `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| Until approved: keep measurement off on production | Agent | Do not silently enable tracking |
| Visitor feedback remains development-gated | Preserve | Tied to `developmentBillingAllowed` |

### 5. Owner acquisition (organic / product)

| Action | Owner | Notes |
| --- | --- | --- |
| Keep claim CTA path healthy: profile → `ownerClaimHref` → `/owner` | Agent | Entry already on WA facility pages |
| Deep-link returning owners: `/owner?mode=login` | Preserve | From #232/#234 |
| Recovery entry: `/owner?mode=recover` | Preserve | Post-#236 |
| Admin claim review capacity | Human/ops | Process claims without changing RLS |
| Lightweight owner outreach copy (email/script) | Needs approval | No paid ads; no mass email infra without approval |
| Track claim funnel qualitatively (counts via admin) | Human | Avoid new telemetry until analytics approved |

### 6. Family acquisition (organic / product)

| Action | Owner | Notes |
| --- | --- | --- |
| Homepage → Washington directory/map journey | Preserve | `lib/family-journey.ts`, WA public pages |
| Directory search, shortlist, visit checklist, compare | Preserve | Existing family tools |
| Content quality: cities/counties/demographics/opportunity | Agent | Fix bugs only; no new states |
| Shareable profile URLs for families | Preserve | Canonical www profiles |
| Organic social / community posts | Needs approval | Unpaid only unless ads approved |

### 7. Marketing readiness (no spend)

| Action | Owner | Notes |
| --- | --- | --- |
| Message house: Find / Compare / Choose with Confidence | Preserve | Brand on homepage |
| Asset list: homepage, WA directory, map, sample profile, owner portal | Agent | For future campaigns |
| Paid advertising | **Blocked** | Requires explicit approval; do not launch |
| Billing / premium checkout | **Blocked** | Production billing stays OFF |
| Other-state publication | **Blocked** | Requires explicit approval |

---

## Explicit non-goals (without new approval)

- Repeating closed acceptance tests without regression evidence
- Activating billing, Stripe, or premium subscriptions on production
- Launching paid ads or incurring ad spend
- Expanding public directories beyond Washington
- Embedding privileged Supabase keys in the client or CI

## Next agent posture

Treat Washington as **live**. Prefer observation + small hardening PRs over large
feature work. Escalate only genuine production incidents, Auth regressions, or
decisions that spend money / change publication / enable analytics or ads.
