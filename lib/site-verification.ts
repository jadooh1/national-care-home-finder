/**
 * Google Search Console HTML-tag verification.
 * Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the console-provided token only.
 * This does not enable GA4 — production analytics stay gated in lib/analytics.ts.
 */
export function googleSiteVerificationToken(
  configured: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
): string | undefined {
  const token = configured?.trim() ?? "";
  if (!token) return undefined;
  // Console tokens are short opaque strings; reject accidental measurement IDs.
  if (/^G-/i.test(token)) return undefined;
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(token)) return undefined;
  return token;
}
