import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CaliforniaTier2MapClient } from "../../../components/california-tier2-map-client";
import {
  CALIFORNIA_TIER2_MAP_SCOPE,
  searchCaliforniaTier2MapPoints,
} from "../../../lib/california-tier2-map";
import {
  CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE,
  CALIFORNIA_TIER2_RELEASE_CONTROLS,
  californiaTier2PublicMapAuthorized,
  californiaTier2PublicationReadiness,
} from "../../../lib/california-tier2-release";
import { californiaTier1SurfaceAccess } from "../../../lib/california-tier1-release";
import { CALIFORNIA_SOURCE_LABEL } from "../../../lib/state-directory";

/** Request-level gate must run on every request (no static prerender bypass). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "California RCFE and ARF map",
  description:
    "Map California Residential Care Facilities for the Elderly and Adult Residential Facilities with verified official coordinates. Approved licensed capacity is not a vacancy.",
};

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
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
    zip?: string;
    status?: string;
  }>;
};

function pct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export default async function CaliforniaPublicMapPage({ searchParams }: PageProps) {
  if (!californiaTier2PublicMapAuthorized()) notFound();

  const h = await headers();
  const requestHost = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const access = californiaTier1SurfaceAccess({
    vercelEnv: process.env.VERCEL_ENV,
    requestHost,
  });
  if (!access.allowed) notFound();

  const params = await searchParams;
  const result = searchCaliforniaTier2MapPoints({
    q: params.q,
    category: params.category,
    city: params.city,
    zip: params.zip,
    status: params.status,
  });
  const { coverage } = result;
  const m = coverage.matching;
  const readiness = californiaTier2PublicationReadiness();
  const disclosure = CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.pale,
        color: C.navy,
        fontFamily: "Arial, Helvetica, sans-serif",
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
            maxWidth: 1160,
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
            <Link href="/california" style={{ color: C.teal, fontWeight: 600 }}>
              California
            </Link>
            <Link href="/california/map" style={{ color: C.teal, fontWeight: 600 }} aria-current="page">
              California map
            </Link>
          </nav>
        </div>
      </header>

      <section
        style={{
          background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`,
          color: "white",
          padding: "38px 5%",
        }}
      >
        <div style={{ maxWidth: 1160, margin: "auto" }}>
          <p style={{ letterSpacing: 2, fontSize: 12, fontWeight: 700 }}>
            CALIFORNIA · TIER 2 MAP
          </p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 43px)", margin: "10px 0" }}>
            California facility map
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.65 }}>
            Verified official coordinates for {m.usableOfficialCoords.toLocaleString()} of{" "}
            {m.eligibleCount.toLocaleString()} directory facilities (source as-of{" "}
            {CALIFORNIA_SOURCE_LABEL}). Exact CDSS license-ID matches to the CCL ArcGIS
            layer, plus Phase-9 identity-verified leading-zero GIS representations.
            CDSS DownloadStateData remains authoritative. Approved licensed capacity is
            not a vacancy.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1160, margin: "auto", padding: "26px 5% 65px" }}>
        <section
          aria-label="Map coverage statistics"
          style={{
            background: "white",
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 18,
          }}
        >
          <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>{disclosure.title}</h2>
          <p style={{ color: C.muted, lineHeight: 1.65, marginTop: 0 }}>
            {disclosure.summary} Fabricated coordinates:{" "}
            {CALIFORNIA_TIER2_RELEASE_CONTROLS.fabricatedCoordinates}. Geocoded:{" "}
            {CALIFORNIA_TIER2_RELEASE_CONTROLS.geocoded ? "yes" : "no"}. Public map:{" "}
            {readiness.publicMap}.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {[
              ["Eligible roster", m.eligibleCount],
              ["Exact ID + valid coords", m.exactMatchWithValidCoords],
              ["Leading-zero identity verified", m.leadingZeroIdentityVerified ?? m.leadingZeroCollapsedUniqueWithValidCoords],
              ["Verified map points", m.usableOfficialCoords],
              ["Unverified omitted", (m.unmatched + (m.leadingZeroIdentityRejected ?? 0))],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  flex: "1 1 160px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 14,
                  background: C.pale,
                }}
              >
                <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>
                  {Number(value).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            Exact coverage {pct(m.exactValidCoverageRate)}. Verified official coverage{" "}
            {pct(m.usableOfficialCoordsRate)}. Unmatched and identity-rejected facilities
            are omitted — coordinates are never invented.
          </p>
        </section>

        <form
          method="get"
          style={{
            background: "white",
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 20,
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            marginBottom: 18,
          }}
        >
          <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
            Search
            <input name="q" defaultValue={params.q ?? ""} placeholder="Name, license, city…" style={fieldStyle} />
          </label>
          <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
            ZIP
            <input name="zip" defaultValue={params.zip ?? ""} inputMode="numeric" maxLength={5} placeholder="90210" style={fieldStyle} />
          </label>
          <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
            City
            <input name="city" defaultValue={params.city ?? ""} placeholder="Los Angeles" style={fieldStyle} />
          </label>
          <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
            Category
            <select name="category" defaultValue={params.category ?? ""} style={fieldStyle}>
              <option value="">All</option>
              <option value="RCFE">RCFE</option>
              <option value="ARF">ARF</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
            Status
            <select name="status" defaultValue={params.status ?? ""} style={fieldStyle}>
              <option value="">All</option>
              <option value="LICENSED">LICENSED</option>
              <option value="ON PROBATION">ON PROBATION</option>
            </select>
          </label>
          <div style={{ display: "flex", alignItems: "end", gap: 10 }}>
            <button
              type="submit"
              style={{
                border: 0,
                color: "white",
                background: C.teal,
                borderRadius: 9,
                padding: "14px 22px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Map facilities
            </button>
            <Link
              href="/california/map"
              style={{
                padding: "14px 16px",
                borderRadius: 9,
                border: `1px solid ${C.border}`,
                color: C.navy,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Clear
            </Link>
          </div>
        </form>

        <div aria-live="polite" style={{ marginBottom: 14, lineHeight: 1.6 }}>
          {result.filterActive ? (
            <strong>
              {result.totalMatched.toLocaleString()} verified points match this filter
              {result.truncated ? ` (showing first ${result.returned.toLocaleString()})` : ""}.
            </strong>
          ) : (
            <strong style={{ color: C.warn }}>
              Enter a ZIP, city, category, status, or search term to plot verified
              facilities. A statewide dump is withheld so the page stays responsive.
            </strong>
          )}
        </div>

        <CaliforniaTier2MapClient
          points={result.points}
          emptyMessage={
            result.filterActive
              ? "No verified coordinates match this filter."
              : "Apply a filter to load verified map points."
          }
        />

        <p style={{ marginTop: 22, color: C.muted, fontSize: 13, lineHeight: 1.8 }}>
          Official source layer:{" "}
          <a
            href={CALIFORNIA_TIER2_MAP_SCOPE.arcgisLayerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C.teal, fontWeight: 700 }}
          >
            CDSS CCL ArcGIS FeatureServer
          </a>
          . Facility profiles open on this site; CDSS FacDetail links remain the
          authoritative licensing disclosure.
        </p>
      </div>
    </main>
  );
}
