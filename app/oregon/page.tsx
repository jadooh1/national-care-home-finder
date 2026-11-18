"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LanguageSelector, useLanguage, usePageTitle } from "../../components/language";
import { copy } from "../../lib/copy/oregon";
import { supabase } from "../../lib/supabase";
import {
  loadOregonPublicDirectory,
  OREGON_BEDS_NOTE,
  OREGON_FRESHNESS_NOTE,
  OREGON_LOCATION_NOTE,
  OREGON_ZERO_BED_NOTE,
  oregonPublicDirectoryAvailable,
  type OregonPublicDirectoryLoad,
  type OregonPublicQuery,
} from "../../lib/oregon-public-directory";
import { OREGON_ODHS_PROVIDER_SEARCH } from "../../lib/state-directory";

const C = { navy: "#123c59", teal: "#176b53", pale: "#f4f8fb", muted: "#536b7c", border: "#dbe5eb" };
const fieldStyle: React.CSSProperties = {
  boxSizing: "border-box", width: "100%", minWidth: 0, padding: "13px 14px",
  border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 16, background: "#fff", color: C.navy,
};

const languageStyle = `
.wa-lang { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 12px; }
.wa-lang button { min-height: 44px; padding: 8px 12px; border-radius: 999px; font-weight: 800; border: 1px solid #dbe5eb; background: #ffffff; color: #123c59; cursor: pointer; font-family: inherit; }
.wa-lang button[aria-pressed="true"] { background: #123c59; color: #ffffff; border-color: #123c59; }
`;

export default function OregonPublicDirectoryPage() {
  const { locale } = useLanguage();
  const t = copy[locale];
  usePageTitle(t.pageTitle);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<OregonPublicDirectoryLoad>({ state: "withheld" });
  const available = oregonPublicDirectoryAvailable(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const outcome = await loadOregonPublicDirectory({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        filters: { name, city, county, page },
        query: queryPublicDirectory,
      });
      if (!cancelled) {
        setResult(outcome);
        setLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [name, city, county, page]);

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <style>{languageStyle}</style>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <LanguageSelector />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 19 }}>{t.brand}</strong>
            <Link href="/" style={{ color: C.teal, fontWeight: 600 }}>{t.allStates}</Link>
          </div>
        </div>
      </header>
      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "48px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>{t.eyebrow}</p>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.14, margin: "12px 0" }}>{t.heading}</h1>
          <p style={{ maxWidth: 780, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            {t.intro} {locale === "es" ? t.freshnessNote : OREGON_FRESHNESS_NOTE}
          </p>
        </div>
      </section>
      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px" }}>
        <p style={{ lineHeight: 1.7, color: C.muted }}>{locale === "es" ? t.bedsNote : OREGON_BEDS_NOTE} {locale === "es" ? t.zeroBedNote : OREGON_ZERO_BED_NOTE} {locale === "es" ? t.locationNote : OREGON_LOCATION_NOTE}</p>
        <p><a href={OREGON_ODHS_PROVIDER_SEARCH}>{t.officialSource}</a></p>
        {available && (
          <form onSubmit={event => event.preventDefault()} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, margin: "20px 0" }}>
            <input aria-label={t.facilityName} placeholder={t.facilityName} value={name} onChange={event => { setName(event.target.value); setPage(0); setLoading(true); }} style={fieldStyle} />
            <input aria-label={t.city} placeholder={t.city} value={city} onChange={event => { setCity(event.target.value); setPage(0); setLoading(true); }} style={fieldStyle} />
            <input aria-label={t.county} placeholder={t.county} value={county} onChange={event => { setCounty(event.target.value); setPage(0); setLoading(true); }} style={fieldStyle} />
          </form>
        )}
        {loading ? <p>{t.loadingDirectory}</p> : <DirectoryState result={result} page={page} />}
        {!loading && result.state === "ready" && (result.rows.length > 0 || page > 0) && (
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button type="button" disabled={page === 0} onClick={() => setPage(current => Math.max(current - 1, 0))} style={fieldStyle}>{t.previous}</button>
            <button type="button" disabled={!result.hasMore} onClick={() => setPage(current => current + 1)} style={fieldStyle}>{t.next}</button>
          </div>
        )}
      </div>
    </main>
  );
}

async function queryPublicDirectory(args: OregonPublicQuery) {
  let request = supabase.from(args.view).select(args.columns, { count: "exact" });
  if (args.name) request = request.ilike("facility_name", `%${args.name}%`);
  if (args.city) request = request.ilike("city", `%${args.city}%`);
  if (args.county) request = request.ilike("county", `%${args.county}%`);
  const { data, error, count } = await request.order("facility_name", { ascending: true }).order("source_id", { ascending: true }).range(args.from, args.to);
  return { data, error: error?.message ?? "", count };
}

function DirectoryState({ result, page }: { result: OregonPublicDirectoryLoad; page: number }) {
  const { locale } = useLanguage();
  const t = copy[locale];
  if (result.state === "withheld") return <p>{t.withheld}</p>;
  if (result.state === "unavailable") return <p>{t.directoryUnavailable}</p>;
  if (result.rows.length === 0) {
    return <p>{page > 0 ? t.noFurther : t.noMatch}</p>;
  }
  return (
    <>
      <p style={{ color: C.muted }}>{t.resultCount(result.total)}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
        {result.rows.map(row => (
          <li key={row.source_id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
            <strong>{row.facility_name}</strong>
            <p style={{ margin: "8px 0", color: C.muted }}>{row.city}, {t.countyLine(row.county)}</p>
            <p style={{ margin: "8px 0" }}>{t.summaryLine(row.license_type, row.status, row.licensed_beds)}</p>
            <p style={{ margin: "8px 0" }}><Link href={`/oregon/${encodeURIComponent(row.source_id)}`}>{t.directoryProfile}</Link></p>
            <a href={row.official_profile_url}>{t.officialProfile}</a>
          </li>
        ))}
      </ul>
    </>
  );
}
