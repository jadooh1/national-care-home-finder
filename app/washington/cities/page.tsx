"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type CityMarket = {
  county_name: string;
  city_name: string;
  total_afhs: number;
  homes_with_capacity: number;
  known_licensed_beds: number;
};

type SortKey = "afhs" | "beds" | "city";
const navy = "#123c59";
const teal = "#176b53";
const border = "#dbe5eb";
const card: React.CSSProperties = { background: "#fff", border: `1px solid ${border}`, borderRadius: 14, padding: 20 };
const input: React.CSSProperties = { boxSizing: "border-box", width: "100%", padding: "12px", border: `1px solid ${border}`, borderRadius: 9, color: navy, background: "white", fontSize: 16 };
const fmt = (n: number) => n.toLocaleString("en-US");

export default function WashingtonCitiesPage() {
  const [data, setData] = useState<CityMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [county, setCounty] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("afhs");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      // Supabase REST default page size is 1,000. Fetch all 327 groups explicitly.
      const { data: rows, error: queryError } = await supabase
        .from("wa_city_market_summary")
        .select("county_name,city_name,total_afhs,homes_with_capacity,known_licensed_beds")
        .order("county_name", { ascending: true })
        .order("city_name", { ascending: true })
        .range(0, 999);
      if (!active) return;
      if (queryError) setError("City market data could not be loaded. Check access to wa_city_market_summary.");
      else setData((rows ?? []).map((r) => ({
        county_name: r.county_name as string,
        city_name: r.city_name as string,
        total_afhs: Number(r.total_afhs) || 0,
        homes_with_capacity: Number(r.homes_with_capacity) || 0,
        known_licensed_beds: Number(r.known_licensed_beds) || 0,
      })));
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const counties = useMemo(() => Array.from(new Set(data.map((r) => r.county_name))).sort((a,b)=>a.localeCompare(b)), [data]);
  const inCounty = useMemo(() => data.filter((r) => !county || r.county_name === county), [data, county]);
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = inCounty.filter((r) => !term || r.city_name.toLowerCase().includes(term) || r.county_name.toLowerCase().includes(term));
    return [...rows].sort((a,b) => sort === "beds" ? b.known_licensed_beds - a.known_licensed_beds || a.city_name.localeCompare(b.city_name)
      : sort === "afhs" ? b.total_afhs - a.total_afhs || a.city_name.localeCompare(b.city_name)
      : a.city_name.localeCompare(b.city_name) || a.county_name.localeCompare(b.county_name));
  }, [inCounty, search, sort]);
  const totalHomes = data.reduce((n, r) => n + r.total_afhs, 0);
  const totalBeds = data.reduce((n, r) => n + r.known_licensed_beds, 0);
  const cityKey = (r: CityMarket) => `${r.county_name}||${r.city_name}`;
  const selected1 = inCounty.find((r) => cityKey(r) === first);
  const selected2 = inCounty.find((r) => cityKey(r) === second);
  
const locationLabel = (r: CityMarket) =>
  county ? r.city_name : `${r.city_name} — ${r.county_name}`;

  const countyQuery = (r: CityMarket) => `/washington?${new URLSearchParams({ city: r.city_name, county: r.county_name })}`;

  return <main style={{minHeight:"100vh",background:"#f4f8fb",color:navy,fontFamily:"Arial, sans-serif"}}>
    <header style={{background:"white",padding:"18px 5%",borderBottom:`1px solid ${border}`,display:"flex",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
      <strong>National Care Home Finder</strong>
      <Link href="/washington" style={{color:teal,fontWeight:700}}>← Washington Directory</Link>
    </header>
    <section style={{padding:"44px 5%",background:`linear-gradient(125deg,${navy},${teal})`,color:"white"}}>
      <div style={{maxWidth:1150,margin:"auto"}}>
        <div style={{fontSize:12,fontWeight:800,letterSpacing:1.5}}>WASHINGTON MARKET INTELLIGENCE · PHASE 7</div>
        <h1 style={{fontSize:"clamp(29px,4vw,43px)",margin:"14px 0"}}>Compare Adult Family Homes by City</h1>
        <p style={{lineHeight:1.65,maxWidth:900}}>Explore listed AFH supply and recorded licensed capacity by city and county. Counts do not represent vacancies, occupancy, current license standing, or proven demand.</p>
      </div>
    </section>
    <div style={{maxWidth:1150,margin:"auto",padding:"28px 5% 70px"}}>
      {loading && <p role="status">Loading city market data…</p>}
      {error && <p role="alert" style={{color:"#a22"}}>{error}</p>}
      {!loading && !error && <>
        <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:20}} aria-label="Statewide totals">
          {[["County-city groups",data.length],["Counties represented",counties.length],["Listed AFHs",totalHomes],["Recorded licensed beds",totalBeds]].map(([label, value]) => <div key={String(label)} style={card}><div style={{fontSize:13,color:"#536b7c"}}>{label}</div><div style={{fontSize:29,fontWeight:800,marginTop:7}}>{fmt(Number(value))}</div></div>)}
        </section>
        <section style={{...card,marginBottom:20}} aria-label="County selection">
          <label htmlFor="county-select" style={{display:"block",fontWeight:700,marginBottom:8}}>Select a county</label>
          <select id="county-select" value={county} onChange={(e)=>{setCounty(e.target.value);setFirst("");setSecond("");setSearch("");}} style={input}>
            <option value="">All Washington counties</option>
            {counties.map((c)=><option key={c} value={c}>{c} County</option>)}
          </select>
          <p style={{fontSize:13,color:"#536b7c"}}>Select a county to compare its cities. The statewide view includes county-city combinations, which are kept separate when a city name occurs across counties.</p>
        </section>
        <section style={{...card,marginBottom:20}} aria-label="Compare two cities">
          <h2 style={{marginTop:0,fontSize:22}}>Compare two cities</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
            <div><label htmlFor="first-city" style={{display:"block",marginBottom:7}}>First city</label><select id="first-city" value={first} onChange={(e)=>setFirst(e.target.value)} style={input}><option value="">Choose a city</option>{inCounty.map((r)=><option key={cityKey(r)} value={cityKey(r)}>{locationLabel(r)}</option>)}</select></div>
            <div><label htmlFor="second-city" style={{display:"block",marginBottom:7}}>Second city</label><select id="second-city" value={second} onChange={(e)=>setSecond(e.target.value)} style={input}><option value="">Choose a city</option>{inCounty.map((r)=><option key={cityKey(r)} value={cityKey(r)}>{locationLabel(r)}</option>)}</select></div>
          </div>
          {selected1 && selected2 && <div style={{overflowX:"auto",marginTop:20}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:460,textAlign:"left"}}><thead><tr><th style={{padding:10}}>Indicator</th><th>{locationLabel(selected1)}</th><th>{locationLabel(selected2)}</th></tr></thead><tbody>{([
            ["Adult Family Homes","total_afhs"], ["Recorded licensed beds","known_licensed_beds"], ["Homes with recorded capacity","homes_with_capacity"]
          ] as const).map(([label,key])=><tr key={key} style={{borderTop:`1px solid ${border}`}}><td style={{padding:10}}>{label}</td><td>{fmt(selected1[key])}</td><td>{fmt(selected2[key])}</td></tr>)}</tbody></table></div>}
        </section>
        <section style={card} aria-label="City market directory">
          <h2 style={{marginTop:0,fontSize:22}}>City market listings</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:14}}>
            <div><label htmlFor="city-search" style={{display:"block",marginBottom:7}}>Search city</label><input id="city-search" type="search" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="e.g. Bremerton" style={input}/></div>
            <div><label htmlFor="city-sort" style={{display:"block",marginBottom:7}}>Sort cities</label><select id="city-sort" value={sort} onChange={(e)=>setSort(e.target.value as SortKey)} style={input}><option value="afhs">Most AFHs</option><option value="beds">Most recorded beds</option><option value="city">City A–Z</option></select></div>
          </div>
          <p aria-live="polite" style={{fontSize:13,color:"#536b7c"}}>Showing {fmt(shown.length)} of {fmt(inCounty.length)} county-city groups.</p>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",minWidth:690,borderCollapse:"collapse",textAlign:"left"}}><thead><tr style={{borderBottom:`2px solid ${border}`}}>{["City","County","AFHs","Recorded beds","Homes with capacity","Find homes"].map((h)=><th key={h} style={{padding:"12px 9px",fontSize:13}}>{h}</th>)}</tr></thead><tbody>{shown.map((r)=><tr key={cityKey(r)} style={{borderBottom:`1px solid ${border}`}}><td style={{padding:"12px 9px",fontWeight:700}}>{r.city_name}</td><td style={{padding:"12px 9px"}}>{r.county_name}</td><td style={{padding:"12px 9px"}}>{fmt(r.total_afhs)}</td><td style={{padding:"12px 9px"}}>{fmt(r.known_licensed_beds)}</td><td style={{padding:"12px 9px"}}>{fmt(r.homes_with_capacity)}</td><td style={{padding:"12px 9px"}}><Link href={countyQuery(r)} style={{color:teal}}>Directory ↗</Link></td></tr>)}</tbody></table></div>
        </section>
        <p style={{fontSize:13,color:"#536b7c",lineHeight:1.7,marginTop:18}}>Source: Washington DSHS-matched directory records and existing geographic county assignments. The same city name may appear in different county groups. Geographic labels and counts are not a substitute for verifying the latest licensing and facility details with Washington DSHS. No ZIP-based demographics are assigned to city boundaries here.</p>
      </>}
    </div>
  </main>;
}
