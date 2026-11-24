import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  PUBLIC_PRODUCTION_HOSTS,
  normalizeHost,
} from "../../lib/public-indexing";

/** Request-level gate must run on every request (no static prerender bypass). */
export const dynamic = "force-dynamic";

/**
 * Oregon remains development-only. Production hosts and Vercel production
 * deployments must fail closed (HTTP 404), not merely withhold directory rows.
 */
export default async function OregonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const host = normalizeHost(h.get("x-forwarded-host") ?? h.get("host") ?? undefined);
  const vercelEnv = (process.env.VERCEL_ENV ?? "").trim().toLowerCase();
  const productionHost =
    host !== ""
    && (PUBLIC_PRODUCTION_HOSTS as readonly string[]).includes(host);
  if (vercelEnv === "production" || productionHost) {
    notFound();
  }
  return children;
}
