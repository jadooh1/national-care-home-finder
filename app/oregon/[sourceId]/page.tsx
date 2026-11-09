"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LanguageSelector, useLanguage, usePageTitle } from "../../../components/language";
import { copy } from "../../../lib/copy/oregon";
import { supabase } from "../../../lib/supabase";
import {
  loadOregonPublicProfile,
  OREGON_BEDS_NOTE,
  OREGON_FRESHNESS_NOTE,
  OREGON_LOCATION_NOTE,
  OREGON_ZERO_BED_NOTE,
  type OregonPublicProfileLoad,
  type OregonPublicProfileQuery,
} from "../../../lib/oregon-public-directory";

const C = { navy: "#123c59", teal: "#176b53", pale: "#f4f8fb", muted: "#536b7c", border: "#dbe5eb" };
const languageStyle = `
.wa-lang { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 12px; }
.wa-lang button { min-height: 44px; padding: 8px 12px; border-radius: 999px; font-weight: 800; border: 1px solid #dbe5eb; background: #ffffff; color: #123c59; cursor: pointer; font-family: inherit; }
.wa-lang button[aria-pressed="true"] { background: #123c59; color: #ffffff; border-color: #123c59; }
`;

export default function OregonPublicProfilePage() {
  const { locale } = useLanguage();
  const t = copy[locale];
  usePageTitle(t.pageTitle);
  const params = useParams();
  const sourceId = typeof params.sourceId === "string" ? params.sourceId : "";
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<OregonPublicProfileLoad>({ state: "withheld" });

  useEffect(() => {
    let cancelled = false;
    loadOregonPublicProfile({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      sourceId,
      query: queryPublicProfile,
    }).then(outcome => {
      if (!cancelled) {
        setResult(outcome);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [sourceId]);

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <style>{languageStyle}</style>
        <div style={{ maxWidth: 800, margin: "auto" }}>
          <LanguageSelector />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 19 }}>{t.brand}</strong>
            <Link href="/oregon" style={{ color: C.teal, fontWeight: 600 }}>{t.backToDirectory}</Link>
          </div>
        </div>
      </header>
      <div style={{ maxWidth: 800, margin: "auto", padding: "32px 5% 60px" }}>
        {loading ? <p>{t.loadingProfile}</p> : <ProfileState result={result} />}
      </div>
    </main>
  );
}

async function queryPublicProfile(args: OregonPublicProfileQuery) {
  const { data, error } = await supabase.from(args.view).select(args.columns).eq("source_id", args.sourceId).maybeSingle();
  return { data, error: error?.message ?? "" };
}

function ProfileState({ result }: { result: OregonPublicProfileLoad }) {
  const { locale } = useLanguage();
  const t = copy[locale];
  if (result.state === "withheld") return <p>{t.withheld}</p>;
  if (result.state === "unavailable") return <p>{t.profileUnavailable}</p>;
  if (result.state === "missing") return <p>{t.missing}</p>;
  const row = result.row;
  return (
    <article style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
      <p style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 700, color: C.teal }}>{t.profileEyebrow}</p>
      <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.15, margin: "8px 0 16px" }}>{row.facility_name}</h1>
      <p style={{ margin: "8px 0" }}>{row.city}, {t.countyLine(row.county)}</p>
      <p style={{ margin: "8px 0" }}>{t.careType(row.license_type)}</p>
      <p style={{ margin: "8px 0" }}>{t.licenseStatus(row.status)}</p>
      <p style={{ margin: "8px 0" }}>{t.licensedBeds(row.licensed_beds)}</p>
      <p style={{ lineHeight: 1.7 }}>{locale === "es" ? t.bedsNote : OREGON_BEDS_NOTE}</p>
      <p style={{ lineHeight: 1.7 }}>{locale === "es" ? t.zeroBedNote : OREGON_ZERO_BED_NOTE}</p>
      <p style={{ lineHeight: 1.7 }}>{locale === "es" ? t.locationNote : OREGON_LOCATION_NOTE}</p>
      <p style={{ lineHeight: 1.7 }}>{locale === "es" ? t.freshnessNote : OREGON_FRESHNESS_NOTE}</p>
      <p style={{ marginTop: 16 }}><a href={row.official_profile_url}>{t.officialProfile}</a></p>
    </article>
  );
}
