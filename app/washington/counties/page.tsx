"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type CountyMarket = {
  county_name: string;
  total_afhs: number;
  cities_represented: number;
  homes_with_capacity: number;
  known_licensed_beds: number;
};

type SortKey = "total_afhs" | "known_licensed_beds" | "cities_represented" | "county_name";
const navy = "#123c59";
const green = "#176b53";
const border = "#dbe5eb";
const fmt = (value: number) => Number(value).toLocaleString();
const card: React.CSSProperties = { background: "#fff", border: `1px solid ${border}`, padding: 20, borderRadius: 14 };

export default function WashingtonCountyComparisonPage() {
  const [rows, setRows] = useState<CountyMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("total_afhs");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error: queryError } = await supabase
        .from("wa_county_market_summary")
        .select("county_name,total_afhs,cities_represented,homes_with_capacity,known_licensed_beds")
        .order("county_name", { ascending: true })
        .limit(100);
      if (!active) return;
      if (queryError) setError("County comparison data could not be loaded. Check the database view and read permissions.");
      else setRows((data ?? []) as CountyMarket[]);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  const sorted = useMemo(() => rows.filter(r => r.county_name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => sortBy === "county_name"
      ? a.county_name.localeCompare(b.county_name)
      : Number(b[sortBy]) - Number(a[sortBy]) || a.county_name.localeCompare(b.county_name)), [rows, search, sortBy]);
  const county1 = rows.find(r => r.county_name === first);
  const county2 = rows.find(r => r.county_name === second);
  const totalHomes = rows.reduce((sum, r) => sum + Number(r.total_afhs), 0);
  const totalBeds = rows.reduce((sum, r) => sum + Number(r.known_licensed_beds), 0);

  return <main style={{ background: "#f4f8fb", minHeight: "100vh", color: navy, fontFamily: "Arial, sans-serif" }}>
    <header style={{ background: "white", borderBottom: `1px solid ${border}`, padding: "18px 5%" }}>
      <nav style={{ maxWidth: 1140, margin: "auto", display: "flex", gap: 18, justifyContent: "space-between", flexWrap: "wrap" }}>
        <Link href="/" style={{ color: navy, textDecoration: "none", fontWeight: 800 }}>National Care Home Finder</Link>
        <Link href="/washington" style={{ color: green, fontWeight: 700 }}>← Washington directory</Link>
      </nav>
    </header>
    <section style={{ color: "#fff", background: `linear-gradient(120deg,${navy},${green})`, padding: "44px 5%" }}>
      <div style={{ maxWidth: 1140, margin: "auto" }}>
        <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>WASHINGTON MARKET INTELLIGENCE · PHASE 6</p>
        <h1 style={{ fontSize: "clamp(28px,5vw,44px)", margin: "10px 0" }}>Compare Adult Family Homes by County</h1>
        <p style={{ lineHeight: 1.7, maxWidth: 820 }}>Compare DSHS-matched Adult Family Home listings and recorded licensed capacity across Washington counties. Figures describe listed supply, not vacancies, affordability, quality, or proven demand.</p>
      </div>
    </section>
    <div style={{ maxWidth: 1140, margin: "auto", padding: "28px 5% 65px" }}>
      {loading && <p role="status">Loading county market data…</p>}
      {error && <p role="alert" style={{ color: "#a62a2a" }}>{error}</p>}
      {!loading && !error && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
          {[["Counties with listed AFHs",fmt(rows.length)],["Listed Adult Family Homes",fmt(totalHomes)],["Recorded licensed beds",fmt(totalBeds)]].map(([label,value]) =>
            <div key={label} style={card}><div style={{ fontSize: 13, color: "#536b7c" }}>{label}</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{value}</div></div>)}
        </div>
        <section style={{ ...card, marginTop: 22 }}>
          <h2 style={{ marginTop: 0 }}>Compare two counties</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
            {([{ label: "First county", value: first, onChange: setFirst }, { label: "Second county", value: second, onChange: setSecond }]).map(item =>
              <label key={item.label} style={{ display: "grid", gap: 7, fontWeight: 700 }}>{item.label}
                <select aria-label={item.label} value={item.value} onChange={e => item.onChange(e.target.value)} style={{ padding: 12, border: `1px solid ${border}`, borderRadius: 9, fontSize: 16, color: navy, background: "white" }}>
                  <option value="">Choose a county</option>
                  {rows.map(r => <option key={r.county_name} value={r.county_name}>{r.county_name} County</option>)}
                </select>
              </label>)}
          </div>
          {(county1 || county2) && <div style={{ overflowX: "auto", marginTop: 18 }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 470, textAlign: "left" }}>
            <thead><tr><th style={{ padding: 10 }}>Indicator</th><th style={{ padding: 10 }}>{county1 ? `${county1.county_name} County` : "First county"}</th><th style={{ padding: 10 }}>{county2 ? `${county2.county_name} County` : "Second county"}</th></tr></thead>
            <tbody>{([ ["Adult Family Homes", "total_afhs"], ["Recorded licensed beds", "known_licensed_beds"], ["Homes with recorded capacity", "homes_with_capacity"], ["Cities represented", "cities_represented"] ] as [string, keyof CountyMarket][]).map(([label,key]) =>
              <tr key={key}><th style={{ padding: 10, borderTop: `1px solid ${border}` }}>{label}</th><td style={{ padding: 10, borderTop: `1px solid ${border}` }}>{county1 ? fmt(Number(county1[key])) : "—"}</td><td style={{ padding: 10, borderTop: `1px solid ${border}` }}>{county2 ? fmt(Number(county2[key])) : "—"}</td></tr>)}</tbody>
          </table></div>}
        </section>
        <section style={{ ...card, marginTop: 22 }}>
          <h2 style={{ marginTop: 0 }}>All counties with listed homes</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "end", marginBottom: 16 }}>
            <label style={{ display: "grid", flex: "1 1 210px", gap: 7, fontWeight: 700 }}>Search county
              <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. Kitsap" style={{ fontSize: 16, padding: 11, border: `1px solid ${border}`, borderRadius: 8 }}/>
            </label>
            <label style={{ display: "grid", flex: "1 1 210px", gap: 7, fontWeight: 700 }}>Sort counties
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} style={{ padding: 11, fontSize: 16, border: `1px solid ${border}`, borderRadius: 8 }}>
                <option value="total_afhs">Most AFHs</option>
                <option value="known_licensed_beds">Most recorded beds</option>
                <option value="cities_represented">Most cities represented</option>
                <option value="county_name">County name A–Z</option>
              </select>
            </label>
          </div>
          <p aria-live="polite" style={{ color: "#536b7c" }}>Showing {sorted.length} of {rows.length} counties with listed homes.</p>
          <div style={{ overflowX: "auto" }}><table style={{ borderCollapse: "collapse", width: "100%", minWidth: 590, textAlign: "left" }}>
            <thead><tr>{["County","AFHs","Recorded beds","Homes with capacity","Cities"].map(h => <th key={h} style={{ padding: 11, borderBottom: `2px solid ${border}` }}>{h}</th>)}</tr></thead>
            <tbody>{sorted.map(r => <tr key={r.county_name}>
              <th scope="row" style={{ padding: 11, borderBottom: `1px solid ${border}` }}>{r.county_name} County</th>
              <td style={{ padding: 11, borderBottom: `1px solid ${border}` }}>{fmt(Number(r.total_afhs))}</td>
              <td style={{ padding: 11, borderBottom: `1px solid ${border}` }}>{fmt(Number(r.known_licensed_beds))}</td>
              <td style={{ padding: 11, borderBottom: `1px solid ${border}` }}>{fmt(Number(r.homes_with_capacity))}</td>
              <td style={{ padding: 11, borderBottom: `1px solid ${border}` }}>{fmt(Number(r.cities_represented))}</td>
            </tr>)}</tbody>
          </table></div>
        </section>
      </>}
      <p style={{ marginTop: 25, fontSize: 13, color: "#536b7c", lineHeight: 1.7 }}>Source: Washington DSHS-matched facility listings; county assignments derived from geographic points and Washington county boundaries. Counts are not a real-time licensing verification. Recorded capacity does not measure occupancy or vacancies. A county missing from this comparison has no listings in the current matched directory; that is not proof that it has no operating care homes. Population and household income are not aggregated here because ZIP-code Census estimates can cross county boundaries.</p>
      <div style={{ marginTop: 12 }}><Link href="/washington/demographics" style={{ color: green, fontWeight: 700 }}>Explore ZIP demographics and household income →</Link></div>
    </div>
  </main>;
}
