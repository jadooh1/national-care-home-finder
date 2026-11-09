"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { WashingtonPublicHeader } from "../../../components/washington-public";
import { useLanguage, usePageTitle } from "../../../components/language";
import { supabase } from "../../../lib/supabase";
import { copy } from "../../../lib/copy/washington-detail";
import type { Locale } from "../../../lib/locale";

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
export default function WashingtonCitiesPage() {
  const locale: Locale = useLanguage().locale;
  const text = copy[locale].cities;
  usePageTitle(text.title);
  const fmt = (n: number) => n.toLocaleString(locale === "es" ? "es" : "en-US");
  const [data, setData] = useState<CityMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"" | "unavailable">("");
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
      if (queryError) setError("unavailable");
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
    <WashingtonPublicHeader current="cities" />
    <section style={{padding:"44px 5%",background:`linear-gradient(125deg,${navy},${teal})`,color:"white"}}>
      <div style={{maxWidth:1150,margin:"auto"}}>
        <div style={{fontSize:12,fontWeight:800,letterSpacing:1.5}}>{text.eyebrow}</div>
        <h1 style={{fontSize:"clamp(29px,4vw,43px)",margin:"14px 0"}}>{text.title}</h1>
        <p style={{lineHeight:1.65,maxWidth:900}}>{text.intro}</p>
      </div>
    </section>
    <div style={{maxWidth:1150,margin:"auto",padding:"28px 5% 70px"}}>
      {loading && <p role="status">{text.loading}</p>}
      {error && <p role="alert" style={{color:"#a22"}}>{text.unavailable}</p>}
      {!loading && !error && <>
        <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:20}} aria-label={text.totalsAria}>
          {[[text.countyCityGroups,data.length],[text.countiesRepresented,counties.length],[text.listedAfhs,totalHomes],[text.recordedBeds,totalBeds]].map(([label, value]) => <div key={String(label)} style={card}><div style={{fontSize:13,color:"#536b7c"}}>{label}</div><div style={{fontSize:29,fontWeight:800,marginTop:7}}>{fmt(Number(value))}</div></div>)}
        </section>
        <section style={{...card,marginBottom:20}} aria-label={text.countySelectionAria}>
          <label htmlFor="county-select" style={{display:"block",fontWeight:700,marginBottom:8}}>{text.selectCounty}</label>
          <select id="county-select" value={county} onChange={(e)=>{setCounty(e.target.value);setFirst("");setSecond("");setSearch("");}} style={input}>
            <option value="">{text.allCounties}</option>
            {counties.map((c)=><option key={c} value={c}>{text.countyOption(c)}</option>)}
          </select>
          <p style={{fontSize:13,color:"#536b7c"}}>{text.countyHelp}</p>
        </section>
        <section style={{...card,marginBottom:20}} aria-label={text.compareAria}>
          <h2 style={{marginTop:0,fontSize:22}}>{text.compareTitle}</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
            <div><label htmlFor="first-city" style={{display:"block",marginBottom:7}}>{text.firstCity}</label><select id="first-city" value={first} onChange={(e)=>setFirst(e.target.value)} style={input}><option value="">{text.chooseCity}</option>{inCounty.map((r)=><option key={cityKey(r)} value={cityKey(r)}>{locationLabel(r)}</option>)}</select></div>
            <div><label htmlFor="second-city" style={{display:"block",marginBottom:7}}>{text.secondCity}</label><select id="second-city" value={second} onChange={(e)=>setSecond(e.target.value)} style={input}><option value="">{text.chooseCity}</option>{inCounty.map((r)=><option key={cityKey(r)} value={cityKey(r)}>{locationLabel(r)}</option>)}</select></div>
          </div>
          {selected1 && selected2 && <div style={{overflowX:"auto",marginTop:20}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:460,textAlign:"left"}}><thead><tr><th style={{padding:10}}>{text.indicator}</th><th>{locationLabel(selected1)}</th><th>{locationLabel(selected2)}</th></tr></thead><tbody>{([
            [text.adultFamilyHomes,"total_afhs"], [text.recordedLicensedBeds,"known_licensed_beds"], [text.homesWithCapacity,"homes_with_capacity"]
          ] as [string, "total_afhs" | "known_licensed_beds" | "homes_with_capacity"][]).map(([label,key])=><tr key={key} style={{borderTop:`1px solid ${border}`}}><td style={{padding:10}}>{label}</td><td>{fmt(selected1[key])}</td><td>{fmt(selected2[key])}</td></tr>)}</tbody></table></div>}
        </section>
        <section style={card} aria-label={text.directoryAria}>
          <h2 style={{marginTop:0,fontSize:22}}>{text.listingsTitle}</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:14}}>
            <div><label htmlFor="city-search" style={{display:"block",marginBottom:7}}>{text.searchCity}</label><input id="city-search" type="search" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={text.searchPlaceholder} style={input}/></div>
            <div><label htmlFor="city-sort" style={{display:"block",marginBottom:7}}>{text.sortCities}</label><select id="city-sort" value={sort} onChange={(e)=>setSort(e.target.value as SortKey)} style={input}><option value="afhs">{text.sortAfhs}</option><option value="beds">{text.sortBeds}</option><option value="city">{text.sortCity}</option></select></div>
          </div>
          <p aria-live="polite" style={{fontSize:13,color:"#536b7c"}}>{text.showing(fmt(shown.length), fmt(inCounty.length))}</p>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",minWidth:690,borderCollapse:"collapse",textAlign:"left"}}><thead><tr style={{borderBottom:`2px solid ${border}`}}>{[text.colCity,text.colCounty,text.colAfhs,text.colBeds,text.colHomes,text.colFind].map((h)=><th key={h} style={{padding:"12px 9px",fontSize:13}}>{h}</th>)}</tr></thead><tbody>{shown.map((r)=><tr key={cityKey(r)} style={{borderBottom:`1px solid ${border}`}}><td style={{padding:"12px 9px",fontWeight:700}}>{r.city_name}</td><td style={{padding:"12px 9px"}}>{r.county_name}</td><td style={{padding:"12px 9px"}}>{fmt(r.total_afhs)}</td><td style={{padding:"12px 9px"}}>{fmt(r.known_licensed_beds)}</td><td style={{padding:"12px 9px"}}>{fmt(r.homes_with_capacity)}</td><td style={{padding:"12px 9px"}}><Link href={countyQuery(r)} style={{color:teal}}>{text.directoryLink}</Link></td></tr>)}</tbody></table></div>
        </section>
        <p style={{fontSize:13,color:"#536b7c",lineHeight:1.7,marginTop:18}}>{text.source}</p>
      </>}
    </div>
  </main>;
}
