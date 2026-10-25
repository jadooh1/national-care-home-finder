"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

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
const fmt = (n: number | null | undefined) => n == null ? "Not available" : Number(n).toLocaleString("en-US");
const dollars = (n: number | null | undefined) => n == null ? "Not available" : n >= 250001 ? "$250,000+*" : `$${fmt(n)}`;
const pct = (n: number | null | undefined) => n == null ? "Not available" : `${Number(n).toFixed(2)}%`;
const measure = (n: number | null | undefined) => n == null ? Number.NEGATIVE_INFINITY : Number(n);

export default function WashingtonOpportunityPage() {
  const [rows, setRows] = useState<ZipMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("senior");
  const [first, setFirst] = useState("98038");
  const [second, setSecond] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error: queryError } = await supabase
        .from("wa_zip_market_income")
        .select("zip_code,total_afhs,known_licensed_beds,age_70_plus,age_85_plus,median_household_income,median_income_margin_error,households_100k_plus_pct,total_households,census_period,income_census_period")
        .order("zip_code", { ascending: true })
        .range(0, 499);
      if (!active) return;
      if (queryError) {
        setError("The ZIP-market data could not be loaded. Please check Supabase view access.");
      } else {
        setRows(((data ?? []) as ZipMarket[]).map(r => ({
          ...r,
          total_afhs: Number(r.total_afhs) || 0,
          known_licensed_beds: Number(r.known_licensed_beds) || 0,
        })));
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
    { label: "Estimated residents age 70+", render: r => fmt(r.age_70_plus) },
    { label: "Estimated residents age 85+", render: r => fmt(r.age_85_plus) },
    { label: "Median household income", render: r => dollars(r.median_household_income) },
    { label: "Median income margin of error", render: r => r.median_income_margin_error == null ? "Not available" : `±$${fmt(r.median_income_margin_error)}` },
    { label: "Households earning $100,000+", render: r => pct(r.households_100k_plus_pct) },
    { label: "Recorded AFH listings", render: r => fmt(r.total_afhs) },
    { label: "Recorded licensed beds", render: r => fmt(r.known_licensed_beds) },
  ];

  return <main style={{ minHeight: "100vh", background: "#f4f8fb", color: navy, fontFamily: "Arial, sans-serif" }}>
    <header style={{ background: "white", padding: "18px 5%", borderBottom: `1px solid ${border}` }}>
      <nav style={{ maxWidth: 1150, margin: "auto", display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <Link href="/" style={{ color: navy, textDecoration: "none", fontWeight: 800 }}>National Care Home Finder</Link>
        <Link href="/washington" style={{ color: green, fontWeight: 700 }}>← Washington directory</Link>
      </nav>
    </header>
    <section style={{ background: `linear-gradient(120deg,${navy},${green})`, padding: "44px 5%", color: "white" }}>
      <div style={{ maxWidth: 1150, margin: "auto" }}>
        <div style={{ fontSize: 12, letterSpacing: 1.6, fontWeight: 800 }}>WASHINGTON MARKET INTELLIGENCE · PHASE 8</div>
        <h1 style={{ fontSize: "clamp(28px,4vw,44px)", margin: "13px 0" }}>Explore AFH Market Indicators by ZIP Code</h1>
        <p style={{ lineHeight: 1.7, maxWidth: 890 }}>Compare older-adult population estimates, household income, and recorded Adult Family Home supply. These indicators do not establish care demand, ability to pay, vacancies, profitability, or licensing status.</p>
      </div>
    </section>
    <div style={{ maxWidth: 1150, margin: "auto", padding: "28px 5% 60px" }}>
      {loading && <p role="status">Loading ZIP-code market data…</p>}
      {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
      {!loading && !error && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
          {[["ZIP codes covered", fmt(rows.length)], ["Recorded AFH listings", fmt(sumHomes)], ["Recorded licensed beds", fmt(sumBeds)]].map(([name, value]) =>
            <div key={name} style={card}><div style={{ color: "#536b7c", fontSize: 13 }}>{name}</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 7 }}>{value}</div></div>
          )}
        </div>
        <section style={{ ...card, marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>Compare two ZIP codes</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
            <label>First ZIP code<select aria-label="First ZIP code" value={first} onChange={e => setFirst(e.target.value)} style={{ ...input, marginTop: 6 }}><option value="">Choose ZIP code</option>{rows.map(r => <option key={r.zip_code} value={r.zip_code}>{r.zip_code}</option>)}</select></label>
            <label>Second ZIP code<select aria-label="Second ZIP code" value={second} onChange={e => setSecond(e.target.value)} style={{ ...input, marginTop: 6 }}><option value="">Choose ZIP code</option>{rows.map(r => <option key={r.zip_code} value={r.zip_code}>{r.zip_code}</option>)}</select></label>
          </div>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500, textAlign: "left" }}>
              <thead><tr><th style={{ padding: 10 }}>Indicator</th><th style={{ padding: 10 }}>{first || "First ZIP"}</th><th style={{ padding: 10 }}>{second || "Second ZIP"}</th></tr></thead>
              <tbody>{metrics.map(m => <tr key={m.label} style={{ borderTop: `1px solid ${border}` }}><td style={{ padding: 10 }}>{m.label}</td><td style={{ padding: 10 }}>{selected1 ? m.render(selected1) : "—"}</td><td style={{ padding: 10 }}>{selected2 ? m.render(selected2) : "—"}</td></tr>)}</tbody>
            </table>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#536b7c" }}>Comparisons are descriptive only. ZIP boundaries can cross city or county boundaries. The household-income measures describe all households, not specifically prospective AFH clients.</p>
        </section>
        <section style={{ ...card, marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>Browse and compare Washington ZIP codes</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
            <label>Search ZIP code<input type="search" value={search} onChange={e => setSearch(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))} placeholder="e.g. 98038" style={{ ...input, marginTop: 6 }}/></label>
            <label>Sort ZIP codes<select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ ...input, marginTop: 6 }}>
              <option value="senior">Most residents age 70+</option><option value="income">Highest median household income</option><option value="highIncome">Highest share of $100K+ households</option><option value="fewestHomes">Fewest recorded AFHs</option><option value="mostHomes">Most recorded AFHs</option><option value="zip">ZIP code A–Z</option>
            </select></label>
          </div>
          <p aria-live="polite" style={{ color: "#536b7c" }}>Showing {displayed.length} of {rows.length} ZIP codes</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 790, textAlign: "left", fontSize: 14 }}>
              <thead><tr style={{ background: "#edf4f7" }}>{["ZIP code", "Age 70+ (est.)", "Median household income", "$100K+ households", "AFHs", "Recorded beds", "Details"].map(t => <th key={t} style={{ padding: 11 }}>{t}</th>)}</tr></thead>
              <tbody>{displayed.map(r => <tr key={r.zip_code} style={{ borderBottom: `1px solid ${border}` }}><td style={{ padding: 11, fontWeight: 700 }}>{r.zip_code}</td><td style={{ padding: 11 }}>{fmt(r.age_70_plus)}</td><td style={{ padding: 11 }}>{dollars(r.median_household_income)}</td><td style={{ padding: 11 }}>{pct(r.households_100k_plus_pct)}</td><td style={{ padding: 11 }}>{fmt(r.total_afhs)}</td><td style={{ padding: 11 }}>{fmt(r.known_licensed_beds)}</td><td style={{ padding: 11 }}><Link href={`/washington/demographics?zip=${encodeURIComponent(r.zip_code)}`} style={{ color: green }}>ZIP overview ↗</Link></td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section style={{ ...card, marginTop: 20, lineHeight: 1.7 }}>
          <h2 style={{ marginTop: 0 }}>How to interpret these indicators</h2>
          <p><strong>Senior population:</strong> ACS/Census-based estimates by ZIP code, not a count of people seeking residential care.</p>
          <p><strong>Household income:</strong> reflects households generally, not verified private-pay capacity among older adults. Income estimates have margins of error; *$250,000+ may indicate a top-coded value.</p>
          <p><strong>Existing AFHs and beds:</strong> recorded supply from matched directory records, not confirmed currently operating homes, availability, occupancy, or quality.</p>
          <p><strong>Coverage:</strong> only {fmt(rows.length)} ZIP codes represented in the existing market dataset. This is not complete coverage of every Washington ZIP code. Census reporting periods may differ across measures.</p>
          <p>Use these indicators to identify locations for further research, then verify licensing, zoning, property suitability, rates, and referral demand independently.</p>
        </section>
      </>}
    </div>
  </main>;
}
