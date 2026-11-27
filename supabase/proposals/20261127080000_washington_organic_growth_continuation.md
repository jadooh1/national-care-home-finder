# Washington organic growth continuation (unpaid)

## Context

After production SEO/GSC readiness (#239 → `main` @ `07f9c80`), continue unpaid
Washington acquisition prep. Design 2 and the **6,278**-home roster stay intact.
GA, billing, paid ads, and other-state publication stay **disabled**.

## Completed autonomously

- Favicon, OG/Twitter, canonical www, sitemap priorities, bilingual owner CTA — live.
- GSC HTML-tag hook ready (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`); meta absent until human sets env.
- Production verification recorded in `20261127070000_washington_seo_gsc_organic_readiness.md`.
- Post-launch stabilization plan (`20261127060000_…`) retained on `main` for ops parity.

## Escalation (human Google account only)

1. Search Console property for `https://www.nationalcarehomefinder.com`
2. HTML-tag token → Vercel `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` → redeploy → Verify
3. Submit sitemap `https://www.nationalcarehomefinder.com/sitemap.xml`
4. Optional URL Inspection for `/`, `/washington`, `/washington/map`, one profile

## Continue next (no spend)

| Workstream | Action | Gate |
| --- | --- | --- |
| Indexing | After GSC verify, watch coverage; fix only evidenced exclusions | Human GSC |
| Families | Keep directory/map/cities/counties/profile share paths healthy | Agent bugfix only |
| Owners | Claim CTA + `/owner?mode=login` / recover; process claims in admin | Ops |
| Messaging | Use Find / Compare / Choose with Confidence; EN/ES owner CTA copy | Preserve |
| Outreach drafts | Community/aging-services intro templates | Human approve before send |
| Structured data | Optional JSON-LD on WA profiles | Needs explicit approval |
| Measurement | Production GA remains off | Needs explicit approval |

## Non-goals

- Re-running closed S5-A / S5-B / S6
- Enabling GA4, billing, Stripe, or paid ads
- Publishing additional states
- Redesigning Design 2
