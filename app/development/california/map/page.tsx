import type { CSSProperties } from "react";
import Link from "next/link";
import { CaliforniaTier2MapClient } from "../../../../components/california-tier2-map-client";
import {
  CALIFORNIA_TIER2_MAP_SCOPE,
  searchCaliforniaTier2MapPoints,
} from "../../../../lib/california-tier2-map";
import {
  CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE,
  CALIFORNIA_TIER2_RELEASE_BASELINE,
  californiaTier2PublicationReadiness,
} from "../../../../lib/california-tier2-release";

export const dynamic = "force-dynamic";

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

export default async function CaliforniaTier2DevelopmentMapPage({
  searchParams,
}: PageProps) {
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
      <section
        style={{
          background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`,
          color: "white",
          padding: "38px 5%",
        }}
      >
        <div style={{ maxWidth: 1160, margin: "auto" }}>
          <p style={{ letterSpacing: 2, fontSize: 12, fontWeight: 700 }}>
            DEVELOPMENT ONLY · CALIFORNIA TIER 2
          </p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 43px)", margin: "10px 0" }}>
            California map (verified ArcGIS coordinates)
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.65 }}>
            Interactive development map for the {m.eligibleCount.toLocaleString()}{" "}
            eligible CDSS Tier 1 facilities. Coordinates come only from exact
            license-ID matches to the official CDSS CCL ArcGIS layer, plus
            leading-zero GIS collapses independently corroborated by Phase 9
            identity checks. CDSS DownloadStateData remains authoritative.
            Public California maps stay disabled.
          </p>
          <p style={{ marginTop: 14 }}>
            <Link href="/california" style={{ color: "white", fontWeight: 700 }}>
              ← Public California directory
            </Link>
            {" · "}
            <Link href="/development/california" style={{ color: "white", fontWeight: 700 }}>
              Development review
            </Link>
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
          <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Map coverage</h2>
          <p style={{ color: C.muted, lineHeight: 1.65, marginTop: 0 }}>
            {disclosure.summary} Baseline {CALIFORNIA_TIER2_RELEASE_BASELINE}.
            Observed {coverage.observedOn}. ArcGIS rows fetched{" "}
            {coverage.source.gisRowsFetched.toLocaleString()}. Fabricated
            coordinates: {coverage.source.fabricatedCoordinates}. Geocoded:{" "}
            {coverage.source.geocoded ? "yes" : "no"}. Public map authorized:{" "}
            {disclosure.publicMapAuthorized ? "yes" : "no"}. Readiness: development{" "}
            {readiness.developmentMap}; public map {readiness.publicMap}.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {[
              ["Eligible roster", m.eligibleCount],
              ["Exact ID + valid coords", m.exactMatchWithValidCoords],
              ["Leading-zero identity verified", m.leadingZeroIdentityVerified ?? m.leadingZeroCollapsedUniqueWithValidCoords],
              ["Leading-zero identity rejected", m.leadingZeroIdentityRejected ?? 0],
              ["Verified official coords", m.usableOfficialCoords],
              ["Unmatched", m.unmatched],
              ["Ambiguous rejected", m.ambiguousRejected],
              ["Invalid / missing coords", m.gisCoordsMissingOrInvalid],
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
            Exact coverage {pct(m.exactValidCoverageRate)}. Verified official
            coverage {pct(m.usableOfficialCoordsRate)} (exact + Phase-9-verified
            leading-zero). Unmatched and identity-rejected facilities are omitted
            — coordinates are never invented.
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
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Name, license, city…"
              style={fieldStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
            ZIP
            <input
              name="zip"
              defaultValue={params.zip ?? ""}
              inputMode="numeric"
              maxLength={5}
              placeholder="90210"
              style={fieldStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
            City
            <input
              name="city"
              defaultValue={params.city ?? ""}
              placeholder="Los Angeles"
              style={fieldStyle}
            />
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
              href="/development/california/map"
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
              {result.totalMatched.toLocaleString()} verified points match this
              filter
              {result.truncated
                ? ` (showing first ${result.returned.toLocaleString()})`
                : ""}
              .
            </strong>
          ) : (
            <strong style={{ color: C.warn }}>
              Enter a ZIP, city, category, status, or search term to plot
              verified facilities. Statewide dump is withheld so the development
              page stays responsive.
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

        <section style={{ marginTop: 22, color: C.muted, fontSize: 13, lineHeight: 1.8 }}>
          <h2 style={{ color: C.navy, fontSize: 18 }}>Remaining blockers</h2>
          <ul>
            {coverage.remainingBlockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            Source layer:{" "}
            <a
              href={CALIFORNIA_TIER2_MAP_SCOPE.arcgisLayerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.teal, fontWeight: 700 }}
            >
              CDSS CCL ArcGIS FeatureServer
            </a>
            . Match engine: {CALIFORNIA_TIER2_MAP_SCOPE.matchEngine}.
          </p>
        </section>
      </div>
    </main>
  );
}
