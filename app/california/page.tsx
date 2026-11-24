import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  californiaTier1FullRosterDetailPath,
  californiaTier1FullRosterListingPath,
  buildCaliforniaTier1FullRosterPreview,
} from "../../lib/california-tier1-full-roster";
import { californiaTier1SurfaceAccess } from "../../lib/california-tier1-release";
import {
  CALIFORNIA_LISTED_COUNT,
  CALIFORNIA_SOURCE_LABEL,
} from "../../lib/state-directory";
import { CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE } from "../../lib/california-tier2-release";

/** Request-level gate must run on every request (no static prerender bypass). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "California RCFE and ARF directory",
  description:
    "Search California Residential Care Facilities for the Elderly and Adult Residential Facilities. Approved licensed capacity is not a vacancy.",
};

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
};

const fieldStyle: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  minWidth: 0,
  padding: "13px 14px",
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  fontSize: 16,
  background: "#fff",
  color: C.navy,
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    page?: string;
  }>;
};

export default async function CaliforniaDirectoryPage({ searchParams }: PageProps) {
  const h = await headers();
  const requestHost = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const access = californiaTier1SurfaceAccess({
    vercelEnv: process.env.VERCEL_ENV,
    requestHost,
  });
  if (!access.allowed) notFound();

  const params = await searchParams;
  const pageNumber = Number(params.page) || 1;
  const roster = buildCaliforniaTier1FullRosterPreview({
    q: params.q,
    category: params.category,
    city: params.city,
    page: pageNumber,
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.pale,
        color: C.navy,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "#fff",
          borderBottom: `1px solid ${C.border}`,
          padding: "16px 5%",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "auto",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Link href="/" style={{ color: C.navy, textDecoration: "none", fontWeight: 700, fontSize: 19 }}>
            National Care Home Finder
          </Link>
          <nav aria-label="Primary" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/washington" style={{ color: C.teal, fontWeight: 600 }}>
              Washington
            </Link>
            <Link href="/washington/map" style={{ color: C.teal, fontWeight: 600 }}>
              Washington map
            </Link>
            <Link href="/california" style={{ color: C.teal, fontWeight: 600 }} aria-current="page">
              California
            </Link>
            <Link href="/california/map" style={{ color: C.teal, fontWeight: 600 }}>
              California map
            </Link>
          </nav>
        </div>
      </header>

      <section
        style={{
          background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`,
          color: "white",
          padding: "clamp(28px, 6vw, 48px) 5%",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700, margin: 0 }}>
            CALIFORNIA
          </p>
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 44px)",
              lineHeight: 1.14,
              margin: "12px 0",
            }}
          >
            Residential Care Facilities for the Elderly and Adult Residential Facilities
          </h1>
          <p style={{ maxWidth: 760, lineHeight: 1.7, opacity: 0.95, margin: 0 }}>
            Search {CALIFORNIA_LISTED_COUNT.toLocaleString()} licensed RCFE and ARF
            facilities from the official CDSS DownloadStateData roster (source as-of{" "}
            {CALIFORNIA_SOURCE_LABEL}). Approved licensed capacity is not a vacancy.
          </p>
        </div>
      </section>

      <div
        style={{
          maxWidth: 1100,
          margin: "auto",
          padding: "28px 5% 60px",
          display: "grid",
          gap: 18,
        }}
      >
        {!roster.arithmeticOk ? (
          <section
            role="alert"
            style={{
              background: "#fdecec",
              border: "1px solid #f0b4b4",
              borderRadius: 12,
              padding: 18,
              color: "#8b1e1e",
            }}
          >
            <strong>Directory arithmetic failed.</strong> Fail closed.
          </section>
        ) : null}

        <section
          aria-label="California map coverage disclosure"
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 20 }}>
            {CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE.title}
          </h2>
          <p style={{ color: C.muted, lineHeight: 1.7 }}>
            {CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE.summary}
          </p>
          <p style={{ marginBottom: 0 }}>
            <Link href="/california/map" style={{ color: C.teal, fontWeight: 700 }}>
              Open the California map →
            </Link>
          </p>
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Search California facilities</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            {roster.search.scopeNote} Official CDSS facility pages open in a new tab.
          </p>
          <form
            method="get"
            role="search"
            aria-label="California facility search"
            action={californiaTier1FullRosterListingPath()}
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              alignItems: "end",
              marginBottom: 18,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Search</span>
              <input
                type="search"
                name="q"
                defaultValue={roster.search.query}
                placeholder="Name, license, city, or ZIP"
                autoComplete="off"
                style={fieldStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>City</span>
              <input
                type="search"
                name="city"
                defaultValue={roster.search.city}
                placeholder="City"
                autoComplete="off"
                style={fieldStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Category</span>
              <select
                name="category"
                defaultValue={roster.search.category}
                style={fieldStyle}
              >
                <option value="">All</option>
                <option value="RCFE">RCFE</option>
                <option value="ARF">ARF</option>
              </select>
            </label>
            <button
              type="submit"
              style={{
                minHeight: 48,
                border: "none",
                borderRadius: 10,
                background: C.teal,
                color: "#fff",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Search
            </button>
          </form>

          <p role="status" aria-live="polite" style={{ color: C.muted, marginTop: 0 }}>
            Showing page {roster.search.page} of {roster.search.pageCount} (
            {roster.search.results.length} on this page;{" "}
            {roster.search.total.toLocaleString()} matches of{" "}
            {roster.search.listableCount.toLocaleString()} eligible).
          </p>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 14,
            }}
          >
            {roster.search.results.map((facility) => {
              const detailPath = californiaTier1FullRosterDetailPath(
                facility.facilityNumber,
              );
              return (
                <li
                  key={facility.facilityNumber}
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 12,
                  }}
                >
                  <h3 style={{ margin: "0 0 6px", fontSize: 17 }}>
                    {detailPath ? (
                      <Link
                        href={detailPath}
                        style={{ color: C.navy, textDecoration: "none" }}
                      >
                        {facility.facilityName}
                      </Link>
                    ) : (
                      facility.facilityName
                    )}
                  </h3>
                  <p style={{ margin: "0 0 8px", color: C.muted, lineHeight: 1.6 }}>
                    {facility.category} · {facility.facilityType} · License{" "}
                    {facility.facilityNumber}
                    {facility.leadingZero ? " (leading zero preserved)" : ""} ·
                    Status {facility.downloadStatus}
                    {facility.pendingIncrease
                      ? " · Pending Increase (approved licensed capacity shown)"
                      : ""}{" "}
                    · {facility.city ?? "—"}, {facility.postalCode ?? "—"} · License
                    first date {facility.licenseFirstDate || "—"} · Approved licensed
                    capacity {facility.approvedLicensedCapacity ?? "—"} · Source as-of{" "}
                    {facility.sourceAsOfIso}
                  </p>
                  <p style={{ margin: 0, display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {detailPath ? (
                      <Link href={detailPath} style={{ color: C.teal, fontWeight: 600 }}>
                        Facility profile →
                      </Link>
                    ) : null}
                    <a
                      href={facility.disclosureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: C.teal, fontWeight: 600 }}
                    >
                      Official CDSS disclosure ↗
                    </a>
                  </p>
                </li>
              );
            })}
          </ul>

          {roster.search.pageCount > 1 ? (
            <nav
              aria-label="Search results pages"
              style={{
                marginTop: 22,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {roster.search.page > 1 ? (
                <Link
                  href={californiaTier1FullRosterListingPath({
                    q: roster.search.query,
                    category: roster.search.category,
                    city: roster.search.city,
                    page: roster.search.page - 1,
                  })}
                  style={{ color: C.teal, fontWeight: 700 }}
                >
                  ← Previous
                </Link>
              ) : (
                <span style={{ color: C.muted }}>← Previous</span>
              )}
              <span style={{ color: C.muted }}>
                Page {roster.search.page} of {roster.search.pageCount}
              </span>
              {roster.search.page < roster.search.pageCount ? (
                <Link
                  href={californiaTier1FullRosterListingPath({
                    q: roster.search.query,
                    category: roster.search.category,
                    city: roster.search.city,
                    page: roster.search.page + 1,
                  })}
                  style={{ color: C.teal, fontWeight: 700 }}
                >
                  Next →
                </Link>
              ) : (
                <span style={{ color: C.muted }}>Next →</span>
              )}
            </nav>
          ) : null}
        </section>

        <p style={{ color: C.muted, lineHeight: 1.6, margin: 0 }}>
          Independent informational directory. Verify all facility details with
          official CDSS sources. California maps and owner-claim features are not
          available.
        </p>
      </div>
    </main>
  );
}
