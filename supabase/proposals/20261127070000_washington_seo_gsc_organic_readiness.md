# Washington technical SEO, GSC, and organic acquisition readiness

## Scope

Post-launch hardening for Washington discovery and organic growth. Does **not**
enable production GA4, billing, paid ads, or new-state publication.

## Autonomous deliverables (this change)

1. **Favicon / brand icon** — public metadata points to `/home/mark.webp` (fixes missing favicon.ico 404 for crawlers/browsers that honor `icons`).
2. **Open Graph / Twitter cards** — public WA pages and facility profiles share title, description, and `/home/washington.webp`.
3. **Optional GSC HTML-tag hook** — `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` injects `verification.google` when set; rejects `G-…` measurement IDs so analytics stay separate.
4. **Sitemap hints** — weekly `changeFrequency` + priority (home 1.0, `/washington` 0.9, other WA hubs 0.8, profiles 0.6).
5. **Organic owner CTA** — homepage footer link to `/owner?mode=login` (EN/ES), Design 2 layout preserved.
6. **Production analytics** — still disabled on www/apex via `measurementIdReady`.

## Live baseline already verified (no retest of S5/S6)

| Check | Result |
| --- | --- |
| `robots.txt` | Allow `/`; disallow private prefixes; sitemap URL present |
| `sitemap.xml` | ~6,287 URLs including WA hubs + ~6,278 profiles |
| Homepage / WA | `index, follow` + canonical www |
| `/owner` | `noindex, nofollow` |
| Launch acceptance | CLOSED GO |

California public hub URLs may appear on production `main` from prior authorized Tier work; this change does not expand states on `development`.

## Human-required: Google Search Console

Agents cannot complete Search Console ownership without your Google account.

### Steps

1. Open [Google Search Console](https://search.google.com/search-console) → **Add property** → URL prefix  
   `https://www.nationalcarehomefinder.com`
2. Choose **HTML tag** verification.
3. Copy the `content=` token (not a `G-` Analytics ID).
4. In Vercel production env for the live project, set:  
   `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<token>`
5. Redeploy production (or approve agent production deploy of this branch).
6. Click **Verify** in Search Console.
7. **Sitemaps** → submit:  
   `https://www.nationalcarehomefinder.com/sitemap.xml`
8. Optional URL inspection (request indexing) for:
   - `https://www.nationalcarehomefinder.com/`
   - `https://www.nationalcarehomefinder.com/washington`
   - `https://www.nationalcarehomefinder.com/washington/map`
   - One representative facility profile from the sitemap

### Alternative verification

DNS TXT on `nationalcarehomefinder.com` — also human-only; no app change required.

## Organic acquisition playbook (unpaid)

### Families

| Channel | Asset |
| --- | --- |
| Primary landing | `/` → Search Washington homes |
| Directory | `/washington` |
| Map | `/washington/map` |
| Cities / counties | `/washington/cities`, `/washington/counties` |
| Share | Facility profile URLs `/washington/{license}` (OG ready after deploy) |

### Owners

| Channel | Asset |
| --- | --- |
| Portal | `/owner?mode=login` |
| Recover | `/owner?mode=recover` |
| Claim | Facility page “Claim this facility” → owner claim deep-link |
| Homepage | Footer owner CTA (this change) |

### Marketing prep (no spend)

- Message: Find. Compare. Choose with Confidence.
- Do not launch paid search/social until explicitly approved.
- Do not enable production GA until explicitly approved (separate from GSC verification).

## Explicit non-goals

- Re-running S5-A / S5-B / S6
- Billing / premium activation
- Paid advertising
- Production GA4 enablement
- Publishing additional states

## Production verification (2026-11-27)

Shipped via PR #239 squash-merge → `main` @ `07f9c80`. Vercel production status **success**.

| Check | Live result |
| --- | --- |
| Favicon | `rel="icon"` → `/home/mark.webp` (HTTP 200, image/webp) |
| Open Graph / Twitter | Present on `/`, `/washington`, `/washington/100702` with `/home/washington.webp` |
| Canonical | www host on homepage, directory, and sample profile |
| Sitemap | 6,287 URLs; weekly changefreq; priorities 1.0 / 0.9 / 0.8 / 0.6; **6,278** WA profiles |
| Robots | Sitemap line present; private prefixes disallowed |
| GSC meta hook | Absent until `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is set (expected) |
| Owner CTA EN | Footer → `/owner?mode=login` |
| Owner CTA ES | With `nchf-language=es`: Propietarios — inicie sesión o reclame su listado |
| Production GA | No gtag / measurement scripts |
| Design 2 | `home-hero` / brand mark preserved |

Google Search Console ownership and sitemap submission remain **human-only**.

