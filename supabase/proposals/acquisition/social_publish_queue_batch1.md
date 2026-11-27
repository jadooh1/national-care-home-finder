# Social publish queue — Batch 1 (Facebook + LinkedIn)

**Branding:** National Care Home Finder — *Find. Compare. Choose with Confidence.*  
**Status:** Content approved. **Publish blocked — genuine auth blocker** (see `HUMAN_ESCALATIONS.md`).  
**Auth probes:** 2026-11-27 login walls; re-check after user “auth completed” still logged out in agent Chrome. Cookie jar has only anonymous FB/LI cookies (no `c_user`/`xs`, no `li_at`). Evidence: `/opt/cursor/artifacts/social-linkedin-still-logged-out.png`.  
**Deferred:** Nextdoor. **Forbidden:** boosts, paid ads, subscriptions.

## Immediate — Post A (both channels)

```
Looking for a Washington adult family home?

National Care Home Finder lists 6,278 licensed AFHs with city and county filters, a short comparison list, and links to official DSHS resources.

Start here: https://www.nationalcarehomefinder.com/washington

Independent informational directory — verify details with official state sources. Recorded licensed capacity is not a vacancy count.

National Care Home Finder is an independent informational directory — not a government agency and not affiliated with or endorsed by Washington DSHS.
```

Optional media: `https://www.nationalcarehomefinder.com/home/washington.webp` or `/home/mark.webp`

| Channel | Auth | Publish | Post URL |
|---------|------|---------|----------|
| Facebook Page | BLOCKED_LOGIN_WALL | not published | — |
| LinkedIn Company | BLOCKED_LOGIN_WALL | not published | — |

After auth: publish Post A, then B1 (Tacoma) per `batch1_execution_plan.md`. Full copy remains in `family_organic_social_batch1.md`.
