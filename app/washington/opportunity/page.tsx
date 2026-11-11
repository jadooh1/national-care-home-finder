"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { WashingtonPublicHeader } from "../../../components/washington-public";
import { useLanguage, usePageTitle } from "../../../components/language";
import { supabase } from "../../../lib/supabase";
import { WASHINGTON_MARKET_MAX_PAGES, WASHINGTON_MARKET_PAGE_SIZE, collectWashingtonMarketPages, washingtonMarketPageBounds, type WashingtonMarketPage } from "../../../lib/family-journey";
import { copy } from "../../../lib/copy/washington-detail";
import type { Locale } from "../../../lib/locale";

type ZipMarket = {
  zip_code: string;
  total_afhs: number;
  known_licensed_beds: number;
  age_70_plus: number | null;
  age_85_plus: number | null;
  median_household_income: number | null;
  median_income_margin_error: number | null;
  households_100k_plus_pct: number | null;
  total_households: number | null;
  census_period: string | null;
  income_census_period: string | null;
};

type SortKey = "senior" | "income" | "highIncome" | "fewestHomes" | "mostHomes" | "zip";
const navy = "#123c59";
const green = "#176b53";
const border = "#dbe5eb";
const card: React.CSSProperties = { background: "white", border: `1px solid ${border}`, borderRadius: 14, padding: 20 };
const input: React.CSSProperties = { boxSizing: "border-box", width: "100%", background: "white", color: navy, border: `1px solid ${border}`, borderRadius: 9, padding: "12px 13px", fontSize: 16 };
const measure = (n: number | null | undefined) => n == null ? Number.NEGATIVE_INFINITY : Number(n);

export default function WashingtonOpportunityPage() {
  const locale: Locale = useLanguage().locale;
  const text = copy[locale].opportunity;
  usePageTitle(text.title);
  const fmt = (n: number | null | undefined) => n == null ? text.notAvailable : Number(n).toLocaleString(locale === "es" ? "es" : "en-US");
  const dollars = (n: number | null | undefined) => n == null ? text.notAvailable : n >= 250001 ? "$250,000+*" : `$${fmt(n)}`;
  const pct = (n: number | null | undefined) => n == null ? text.notAvailable : `${Number(n).toFixed(2)}%`;
  const [rows, setRows] = useState<ZipMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"" | "unavailable" | "incomplete">("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("senior");
  const [first, setFirst] = useState("98038");
  const [second, setSecond] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setError("");
      setRows([]);
      const pages: WashingtonMarketPage<ZipMarket>[] = [];
      for (let page = 0; page < WASHINGTON_MARKET_MAX_PAGES; page++) {
        const [from, to] = washingtonMarketPageBounds(page);
        const { data, error: queryError } = await supabase
          .from("wa_zip_market_income")
          .select("zip_code,total_afhs,known_licensed_beds,age_70_plus,age_85_plus,median_household_income,median_income_margin_error,households_100k_plus_pct,total_households,census_period,income_census_period")
          .order("zip_code", { ascending: true })
          .range(from, to);
        if (!active) return;
        if (queryError) {
          pages.push({ ok: false });
          break;
        }
        const batch = ((data ?? []) as ZipMarket[]).map(r => ({
          ...r,
          total_afhs: Number(r.total_afhs) || 0,
          known_licensed_beds: Number(r.known_licensed_beds) || 0,
        }));
        pages.push({ ok: true, rows: batch });
        if (batch.length < WASHINGTON_MARKET_PAGE_SIZE) break;
      }
      const collected = collectWashingtonMarketPages(pages);
      if (!active) return;
      if (collected.status === "complete") setRows(collected.rows);
      else {
        setRows([]);
        setError(collected.status);
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  const displayed = useMemo(() => {
    const term = search.trim();
    const subset = rows.filter(r => !term || r.zip_code.includes(term));
    return [...subset].sort((a, b) => {
      let result = 0;
      if (sort === "senior") result = measure(b.age_70_plus) - measure(a.age_70_plus);
      if (sort === "income") result = measure(b.median_household_income) - measure(a.median_household_income);
      if (sort === "highIncome") result = measure(b.households_100k_plus_pct) - measure(a.households_100k_plus_pct);
      if (sort === "fewestHomes") result = a.total_afhs - b.total_afhs;
      if (sort === "mostHomes") result = b.total_afhs - a.total_afhs;
      return result || a.zip_code.localeCompare(b.zip_code);
    });
  }, [rows, search, sort]);

  const selected1 = rows.find(r => r.zip_code === first);
  const selected2 = rows.find(r => r.zip_code === second);
  const sumHomes = rows.reduce((n, r) => n + r.total_afhs, 0);
  const sumBeds = rows.reduce((n, r) => n + r.known_licensed_beds, 0);
  const metrics: { label: string; render: (r: ZipMarket) => string }[] = [
    { label: text.age70, render: r => fmt(r.age_70_plus) },
    { label: text.age85, render: r => fmt(r.age_85_plus) },
    { label: text.medianIncome, render: r => dollars(r.median_household_income) },
    { label: text.incomeMoe, render: r => r.median_income_margin_error == null ? text.notAvailable : `±$${fmt(r.median_income_margin_error)}` },
    { label: text.households100k, render: r => pct(r.households_100k_plus_pct) },
    { label: text.recordedListings, render: r => fmt(r.total_afhs) },
    { label: text.recordedBeds, render: r => fmt(r.known_licensed_beds) },
  ];

  return <main style={{ minHeight: "100vh", background: "#f4f8fb", color: navy, fontFamily: "Arial, sans-serif" }}>
    <WashingtonPublicHeader current="opportunity" />
    <section style={{ background: `linear-gradient(120deg,${navy},${green})`, padding: "44px 5%", color: "white" }}>
      <div style={{ maxWidth: 1150, margin: "auto" }}>
        <div style={{ fontSize: 12, letterSpacing: 1.6, fontWeight: 800 }}>{text.eyebrow}</div>
        <h1 style={{ fontSize: "clamp(28px,4vw,44px)", margin: "13px 0" }}>{text.title}</h1>
        <p style={{ lineHeight: 1.7, maxWidth: 890 }}>{text.intro}</p>
      </div>
    </section>
    <div style={{ maxWidth: 1150, margin: "auto", padding: "28px 5% 60px" }}>
      {loading && <p role="status">{text.loading}</p>}
      {error && <p role="alert" style={{ color: "#b42318" }}>{error === "incomplete" ? text.incomplete : text.unavailable}</p>}
      {!loading && !error && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
          {[[text.zipsCovered, fmt(rows.length)], [text.recordedListings, fmt(sumHomes)], [text.recordedBeds, fmt(sumBeds)]].map(([name, value]) =>
            <div key={name} style={card}><div style={{ color: "#536b7c", fontSize: 13 }}>{name}</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 7 }}>{value}</div></div>
          )}
        </div>
        <section style={{ ...card, marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>{text.compareTitle}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
            <label>{text.firstZip}<select aria-label={text.firstZip} value={first} onChange={e => setFirst(e.target.value)} style={{ ...input, marginTop: 6 }}><option value="">{text.chooseZip}</option>{rows.map(r => <option key={r.zip_code} value={r.zip_code}>{r.zip_code}</option>)}</select></label>
            <label>{text.secondZip}<select aria-label={text.secondZip} value={second} onChange={e => setSecond(e.target.value)} style={{ ...input, marginTop: 6 }}><option value="">{text.chooseZip}</option>{rows.map(r => <option key={r.zip_code} value={r.zip_code}>{r.zip_code}</option>)}</select></label>
          </div>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500, textAlign: "left" }}>
              <thead><tr><th style={{ padding: 10 }}>{text.indicator}</th><th style={{ padding: 10 }}>{first || text.firstZipHeader}</th><th style={{ padding: 10 }}>{second || text.secondZipHeader}</th></tr></thead>
              <tbody>{metrics.map(m => <tr key={m.label} style={{ borderTop: `1px solid ${border}` }}><td style={{ padding: 10 }}>{m.label}</td><td style={{ padding: 10 }}>{selected1 ? m.render(selected1) : "—"}</td><td style={{ padding: 10 }}>{selected2 ? m.render(selected2) : "—"}</td></tr>)}</tbody>
            </table>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#536b7c" }}>{text.compareNote}</p>
        </section>
        <section style={{ ...card, marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>{text.browseTitle}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
            <label>{text.searchZip}<input type="search" value={search} onChange={e => setSearch(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))} placeholder={text.searchPlaceholder} style={{ ...input, marginTop: 6 }}/></label>
            <label>{text.sortZips}<select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ ...input, marginTop: 6 }}>
              <option value="senior">{text.sortSenior}</option><option value="income">{text.sortIncome}</option><option value="highIncome">{text.sortHighIncome}</option><option value="fewestHomes">{text.sortFewest}</option><option value="mostHomes">{text.sortMost}</option><option value="zip">{text.sortZip}</option>
            </select></label>
          </div>
          <p aria-live="polite" style={{ color: "#536b7c" }}>{text.showing(displayed.length, rows.length)}</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 790, textAlign: "left", fontSize: 14 }}>
              <thead><tr style={{ background: "#edf4f7" }}>{[text.colZip, text.colAge, text.colIncome, text.colHighIncome, text.colAfhs, text.colBeds, text.colDetails].map(heading => <th key={heading} style={{ padding: 11 }}>{heading}</th>)}</tr></thead>
              <tbody>{displayed.map(r => <tr key={r.zip_code} style={{ borderBottom: `1px solid ${border}` }}><td style={{ padding: 11, fontWeight: 700 }}>{r.zip_code}</td><td style={{ padding: 11 }}>{fmt(r.age_70_plus)}</td><td style={{ padding: 11 }}>{dollars(r.median_household_income)}</td><td style={{ padding: 11 }}>{pct(r.households_100k_plus_pct)}</td><td style={{ padding: 11 }}>{fmt(r.total_afhs)}</td><td style={{ padding: 11 }}>{fmt(r.known_licensed_beds)}</td><td style={{ padding: 11 }}><Link href={`/washington/demographics?zip=${encodeURIComponent(r.zip_code)}`} style={{ color: green }}>{text.overviewLink}</Link></td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section style={{ ...card, marginTop: 20, lineHeight: 1.7 }}>
          <h2 style={{ marginTop: 0 }}>{text.interpretTitle}</h2>
          <p><strong>{text.seniorLabel}</strong> {text.seniorBody}</p>
          <p><strong>{text.incomeLabel}</strong> {text.incomeBody}</p>
          <p><strong>{text.supplyLabel}</strong> {text.supplyBody}</p>
          <p><strong>{text.coverageLabel}</strong> {text.coverageBody(fmt(rows.length))}</p>
          <p>{text.interpretClose}</p>
        </section>
      </>}
    </div>
  </main>;
}
