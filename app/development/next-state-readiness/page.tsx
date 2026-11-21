import Link from "next/link";
import { buildNextStateLaunchReadinessReport } from "../../../lib/next-state-launch-readiness";
import { OHIO_TIER1_COUNTS } from "../../../lib/ohio-tier1-eligibility";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function NextStateReadinessPage() {
  const report = buildNextStateLaunchReadinessReport();
  const selected = report.selected;

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <Link href="/development/ohio-tier1" style={{ color: C.teal, fontWeight: 600 }}>
            Ohio Tier 1 preview →
          </Link>
        </div>
      </header>

      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "clamp(28px, 6vw, 48px) 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>UNPUBLISHED DEVELOPMENT REVIEW</p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", lineHeight: 1.14, margin: "12px 0" }}>
            Next-state launch readiness
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            Observed {report.observedOn}. Alternate track while Florida awaits AHCA. Does not publish any state,
            change Oregon, enable owner claims, or write Supabase. Robots disallow `/development`.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        <section style={{ background: "#fff7e8", border: "1px solid #f0d2a0", borderRadius: 12, padding: 18, color: C.warn }}>
          <strong>Public launch: {report.stopGoPublic}.</strong> Development ranking: {report.stopGoDevelopmentPreview}.
          Selected alternate: {report.selection.state}. Ohio offline Tier 1:{" "}
          {OHIO_TIER1_COUNTS.tier1OfflineEligible.toLocaleString()} /{" "}
          {OHIO_TIER1_COUNTS.denominatorRowsL12.toLocaleString()}. Publication eligible:{" "}
          {OHIO_TIER1_COUNTS.publicationEligible}. Final public visibility:{" "}
          {String(report.finalPublicVisibility)}.
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Why {selected.state}</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>{report.selection.why}</p>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Score {selected.totalScore}/12 · {selected.facilityType} · {selected.rosterRows.toLocaleString()} roster rows
          </p>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Ranked candidates</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", color: C.muted }}>
                  <th style={{ padding: "8px 6px" }}>Rank</th>
                  <th style={{ padding: "8px 6px" }}>State</th>
                  <th style={{ padding: "8px 6px" }}>Tier1 structural</th>
                  <th style={{ padding: "8px 6px" }}>Incl. links</th>
                  <th style={{ padding: "8px 6px" }}>Rows</th>
                  <th style={{ padding: "8px 6px" }}>Blockers</th>
                </tr>
              </thead>
              <tbody>
                {report.ranking.map((row) => (
                  <tr key={row.state} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "8px 6px" }}>{row.rank}</td>
                    <td style={{ padding: "8px 6px" }}>{row.state}</td>
                    <td style={{ padding: "8px 6px" }}>{row.tier1StructuralScore}</td>
                    <td style={{ padding: "8px 6px" }}>{row.totalScore}</td>
                    <td style={{ padding: "8px 6px" }}>{row.rosterRows.toLocaleString()}</td>
                    <td style={{ padding: "8px 6px" }}>{row.remainingBlockers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Excluded from ranking</h2>
          <ul style={{ color: C.muted, lineHeight: 1.7 }}>
            {report.excluded.map((e) => (
              <li key={e.state}>
                <strong>{e.state}:</strong> {e.reason}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
