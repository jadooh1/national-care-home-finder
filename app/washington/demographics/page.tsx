"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { WashingtonPublicHeader } from "../../../components/washington-public";
import { useLanguage, usePageTitle } from "../../../components/language";
import { supabase } from "../../../lib/supabase";
import { WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP, washingtonZipFromSearch } from "../../../lib/family-journey";
import { copy } from "../../../lib/copy/washington-detail";
import type { Locale } from "../../../lib/locale";

type Market = {
  zip_code: string;
  total_afhs: number;
  homes_with_capacity: number;
  known_licensed_beds: number;
  population_total: number | null;
  age_60_69: number | null;
  age_70_79: number | null;
  age_80_84: number | null;
  age_85_plus: number | null;
  age_70_plus: number | null;
  census_period: string | null;median_household_income: number | null;
median_income_margin_error: number | null;
total_households: number | null;
households_100k_plus: number | null;
households_100k_plus_pct: number | null;
income_census_period: string | null;
};

const navy = "#123c59";
const teal = "#176b53";
const border = "#dbe5eb";
const card: React.CSSProperties = { background: "white", border: `1px solid ${border}`, borderRadius: 14, padding: 20 };
const groups = [
  { key: "age_60_69", label: "60–69" },
  { key: "age_70_79", label: "70–79" },
  { key: "age_80_84", label: "80–84" },
  { key: "age_85_plus", label: "85+" },
] as const;
export default function WashingtonDemographicsPage() {
  const locale: Locale = useLanguage().locale;
  const text = copy[locale].demographics;
  usePageTitle(text.title);
  const fmt = (n: number | null | undefined) => n == null ? text.notAvailable : locale === "es" ? n.toLocaleString("es") : n.toLocaleString();
  const amount = (n: number) => locale === "es" ? n.toLocaleString("es") : n.toLocaleString();
  const [rows, setRows] = useState<Market[]>([]);
  const [zipInput, setZipInput] = useState("");
  const [zip, setZip] = useState<string | null>(null);
  const [sort, setSort] = useState<"senior" | "afh" | "beds">("senior");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"" | "invalid" | "unavailable">("");

  useEffect(() => {
    const resolved = washingtonZipFromSearch(new URLSearchParams(window.location.search).get("zip"), WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP);
    setZipInput(resolved);
    setZip(resolved);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error: queryError } = await supabase
        .from("wa_zip_market_income")
        .select("zip_code,total_afhs,homes_with_capacity,known_licensed_beds,population_total,age_60_69,age_70_79,age_80_84,age_85_plus,age_70_plus,census_period,median_household_income,median_income_margin_error,total_households,households_100k_plus,households_100k_plus_pct,income_census_period")
        .order("zip_code", { ascending: true })
        .range(0, 499);
      if (!active) return;
      if (queryError) setError("unavailable");
      else setRows((data ?? []) as Market[]);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  const current = rows.find(r => r.zip_code === zip) ?? null;
  const maxPopulation = Math.max(1, ...groups.map(g => current?.[g.key] ?? 0));
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const av = sort === "senior" ? (a.age_70_plus ?? -1) : sort === "afh" ? a.total_afhs : a.known_licensed_beds;
    const bv = sort === "senior" ? (b.age_70_plus ?? -1) : sort === "afh" ? b.total_afhs : b.known_licensed_beds;
    return bv - av || a.zip_code.localeCompare(b.zip_code);
  }), [rows, sort]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const candidate = zipInput.trim();
    if (!/^\d{5}$/.test(candidate)) { setError("invalid"); return; }
    setError(""); setZip(candidate);
  }

  return <main style={{ fontFamily: "Arial, sans-serif", background: "#f4f8fb", minHeight: "100vh", color: navy }}>
    <WashingtonPublicHeader current="demographics" />
    <section style={{ background: `linear-gradient(120deg, ${navy}, ${teal})`, color: "white", padding: "40px 5%" }}>
      <div style={{ maxWidth: 1140, margin: "auto" }}>
        <p style={{ letterSpacing: 2, fontSize: 12, fontWeight: 700 }}>{text.eyebrow}</p>
        <h1 style={{ fontSize: "clamp(28px,5vw,44px)", margin: "10px 0" }}>{text.title}</h1>
        <p style={{ lineHeight: 1.65, maxWidth: 800 }}>{text.intro}</p>
      </div>
    </section>
    <div style={{ maxWidth: 1140, margin: "auto", padding: "28px 5% 65px" }}>
      <form onSubmit={submit} style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
        <label style={{ display: "grid", gap: 8, flex: "1 1 240px", fontWeight: 700 }} htmlFor="zip-analysis">{text.zipLabel}
          <input id="zip-analysis" value={zipInput} onChange={e => setZipInput(e.target.value)} inputMode="numeric" maxLength={5} placeholder={text.zipPlaceholder} style={{ padding: 12, fontSize: 17, border: `1px solid ${border}`, borderRadius: 9, color: navy }}/>
        </label>
        <button type="submit" style={{ background: teal, color: "white", border: 0, borderRadius: 9, padding: "14px 22px", fontWeight: 700, cursor: "pointer" }}>{text.analyze}</button>
        {zip && <Link href={`/washington/map?zip=${encodeURIComponent(zip)}`} style={{ color: teal, fontWeight: 700, padding: "12px 0" }}>{text.openMap}</Link>}
      </form>
      {loading && <p role="status">{text.loading}</p>}
      {error && <p role="alert" style={{ color: "#a62a2a" }}>{error === "invalid" ? text.invalidZip : text.unavailable}</p>}
      {!loading && zip && !error && !current && <p role="status">{text.noMatch(zip)}</p>}
      {!loading && current && <>
        <h2 style={{ marginTop: 28 }}>{text.overview(current.zip_code)}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
          {[
            [text.totalPopulation,fmt(current.population_total)],
            [text.age6069,fmt(current.age_60_69)],
            [text.age70plus,fmt(current.age_70_plus)],
            [text.adultFamilyHomes,fmt(current.total_afhs)],
            [text.knownBeds,fmt(current.known_licensed_beds)],
    [text.medianIncome,
  current.median_household_income == null
    ? text.notAvailable
    : current.median_household_income >= 250001
      ? "$250,000+"
      : "$" + amount(current.median_household_income)],

[text.households100k,
  current.households_100k_plus_pct == null
    ? text.notAvailable
    : Number(current.households_100k_plus_pct).toFixed(2) + "%"],

[text.incomeMoe,
  current.median_income_margin_error == null
    ? text.notAvailable
    : "±$" + amount(current.median_income_margin_error)],
          ].map(([label,value]) => <div key={label} style={card}><div style={{ fontSize: 13, color: "#536b7c" }}>{label}</div><div style={{ fontSize: 27, fontWeight: 800, marginTop: 7 }}>{value}</div></div>)}
        </div>
        <section style={{ ...card, marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>{text.olderAdults}</h2>
          {groups.map(g => {
            const value = current[g.key];
            return <div key={g.key} style={{ margin: "14px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}><strong>{text.ages(g.label)}</strong><span>{fmt(value)}</span></div>
              <div style={{ height: 15, background: "#e9f0f3", borderRadius: 7, overflow: "hidden" }}><div style={{ height: "100%", background: teal, width: `${Math.max(0,(value ?? 0) / maxPopulation * 100)}%` }}/></div>
            </div>;
          })}
          <p style={{ fontSize: 13, color: "#536b7c", marginBottom: 0 }}>{text.source(current.census_period ?? "2020–2024")}</p>
        </section>
        <section style={{ ...card, marginTop: 18, lineHeight: 1.65 }}><h2 style={{ marginTop: 0 }}>{text.interpretingTitle}</h2>
          <p>{text.interpretingSupply(fmt(current.total_afhs), fmt(current.known_licensed_beds), fmt(current.homes_with_capacity))}</p>
          <p>{text.interpretingContext}</p>
        </section>
      </>}
      {!loading && rows.length > 0 && <section style={{ ...card, marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>{text.compareTitle}</h2>
        <label htmlFor="sort-by" style={{ fontWeight: 700, marginRight: 10 }}>{text.sortBy}</label>
        <select id="sort-by" value={sort} onChange={e => setSort(e.target.value as typeof sort)} style={{ padding: 10, border: `1px solid ${border}`, borderRadius: 8, marginBottom: 15 }}>
          <option value="senior">{text.sortSenior}</option><option value="afh">{text.sortAfh}</option><option value="beds">{text.sortBeds}</option>
        </select>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 540 }}><thead><tr>{[text.colZip,text.colResidents,text.colAfhs,text.colBeds,text.colExplore].map(h => <th key={h} style={{ padding: 10, borderBottom: `2px solid ${border}` }}>{h}</th>)}</tr></thead>
            <tbody>{sorted.map(r => <tr key={r.zip_code}><td style={{ padding: 10, borderBottom: `1px solid ${border}` }}>{r.zip_code}</td><td style={{ padding: 10, borderBottom: `1px solid ${border}` }}>{fmt(r.age_70_plus)}</td><td style={{ padding: 10, borderBottom: `1px solid ${border}` }}>{fmt(r.total_afhs)}</td><td style={{ padding: 10, borderBottom: `1px solid ${border}` }}>{fmt(r.known_licensed_beds)}</td><td style={{ padding: 10, borderBottom: `1px solid ${border}` }}><button onClick={() => { setZip(r.zip_code); setZipInput(r.zip_code); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ color: teal, background: "white", border: `1px solid ${teal}`, borderRadius: 6, padding: 8, cursor: "pointer" }}>{text.analyzeRow}</button></td></tr>)}</tbody>
          </table>
        </div>
      </section>}
      <footer style={{ marginTop: 25, color: "#536b7c", lineHeight: 1.75, fontSize: 13 }}>{text.footer}</footer>
    </div>
  </main>;
}
