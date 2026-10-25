"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../../lib/supabase";

type Home = {
  id: string;
  canonical_name: string;
  address_line1: string | null;
  city: string | null;
  county: string | null;
  state_code: string;
  postal_code: string | null;
  license_number: string | null;
  licensed_capacity: number | null;
  latitude: number;
  longitude: number;
};

type DisplayMode = "density" | "locations";
const navy = "#123c59";
const teal = "#176b53";
const border = "#dbe5eb";
const PAGE_SIZE = 800;
const MAX_PAGES = 20;
const FIELD_LIST = "id,canonical_name,address_line1,city,county,state_code,postal_code,license_number,licensed_capacity,latitude,longitude";
const mileRadius = 1;

function distanceInMiles(a: Home, b: Home): number {
  const radians = Math.PI / 180;
  const latDiff = (b.latitude - a.latitude) * radians;
  const lonDiff = (b.longitude - a.longitude) * radians;
  const sinLat = Math.sin(latDiff / 2);
  const sinLon = Math.sin(lonDiff / 2);
  const h = sinLat * sinLat + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * sinLon * sinLon;
  return 3958.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function densityColor(neighbors: number): string {
  if (neighbors >= 20) return "#dc2626"; // 20+ homes within 1 mile
  if (neighbors >= 10) return "#f97316"; // 10–19
  if (neighbors >= 5) return "#eab308";  // 5–9
  return "#16835b"; // 1–4
}

function prettyName(name: string): string {
  return name.replace(/^\s*!+\s*/, "").trim() || name;
}

function makePopup(home: Home, count: number): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.lineHeight = "1.65";
  const heading = document.createElement("strong");
  heading.textContent = prettyName(home.canonical_name);
  wrap.appendChild(heading);
  const address = document.createElement("div");
  address.textContent = [home.address_line1, home.city, home.state_code, home.postal_code].filter(Boolean).join(", ");
  wrap.appendChild(address);
  const capacity = document.createElement("div");
  capacity.textContent = `Recorded licensed capacity: ${home.licensed_capacity ?? "Not available"}`;
  wrap.appendChild(capacity);
  const concentration = document.createElement("div");
  concentration.textContent = `AFHs within 1 mile: ${count} (including this home)`;
  wrap.appendChild(concentration);
  if (home.license_number) {
    const link = document.createElement("a");
    link.href = `/washington/${encodeURIComponent(home.license_number)}`;
    link.textContent = "View home profile →";
    link.style.color = teal;
    link.style.fontWeight = "700";
    wrap.appendChild(link);
  }
  return wrap;
}

export default function WashingtonMarketMapPage() {
  const [zipInput, setZipInput] = useState("98056");
  const [zip, setZip] = useState("98056");
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<DisplayMode>("density");
  const [mapReady, setMapReady] = useState(false);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      setHomes([]);
      const result: Home[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const { data, error: queryError } = await supabase
          .from("wa_afh_map_facilities")
          .select(FIELD_LIST)
          .eq("postal_code", zip)
          .order("license_number", { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (cancelled) return;
        if (queryError) {
          setError("Unable to retrieve facility map data. Check access to the wa_afh_map_facilities view.");
          setLoading(false);
          return;
        }
        const batch = (data ?? []) as unknown as Home[];
        result.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        if (page === MAX_PAGES - 1) {
          setError("Too many results to display completely. Please contact the site administrator.");
          setLoading(false);
          return;
        }
      }
      setHomes(result.filter(h => Number.isFinite(Number(h.latitude)) && Number.isFinite(Number(h.longitude))));
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [zip]);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      const L = await import("leaflet");
      if (cancelled || !mapDivRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapDivRef.current, { scrollWheelZoom: false }).setView([47.60, -122.25], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
      setTimeout(() => { if (!cancelled) map.invalidateSize(); }, 100);
    }
    void initialize();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  const neighbors = useMemo(() => homes.map((a) => homes.reduce((n, b) => n + (distanceInMiles(a, b) <= mileRadius ? 1 : 0), 0)), [homes]);
  const knownCapacity = useMemo(() => homes.reduce((n, h) => n + (h.licensed_capacity ?? 0), 0), [homes]);
  const missingCapacity = useMemo(() => homes.filter(h => h.licensed_capacity === null).length, [homes]);
  const highConcentration = useMemo(() => neighbors.filter(n => n >= 20).length, [neighbors]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapRef.current || !layerRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    layer.clearLayers();
    if (homes.length === 0) return;
    homes.forEach((home, index) => {
      const dotColor = mode === "density" ? densityColor(neighbors[index]) : teal;
      const marker = L.circleMarker([Number(home.latitude), Number(home.longitude)], {
        radius: 7, color: "#ffffff", weight: 1.5, fillColor: dotColor, fillOpacity: 0.94,
      }).addTo(layer);
      marker.bindPopup(makePopup(home, neighbors[index]), { maxWidth: 280 });
    });
    const bounds = L.latLngBounds(homes.map(h => [Number(h.latitude), Number(h.longitude)] as [number, number]));
    map.fitBounds(bounds.pad(0.22), { maxZoom: 14, animate: false });
    map.invalidateSize();
  }, [mapReady, homes, neighbors, mode]);

  const search = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = zipInput.trim();
    if (!/^\d{5}$/.test(cleaned)) {
      setError("Please enter a valid five-digit ZIP code.");
      return;
    }
    if (cleaned === zip) { setError(""); return; }
    setZip(cleaned);
  }, [zipInput, zip]);

  const statBox: React.CSSProperties = { flex: "1 1 180px", background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: 18 };
  return (
    <main style={{ minHeight: "100vh", background: "#f4f8fb", color: navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ padding: "17px 5%", background: "white", borderBottom: `1px solid ${border}` }}>
        <nav style={{ maxWidth: 1160, margin: "auto", display: "flex", gap: 20, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ fontWeight: 800, textDecoration: "none", color: navy }}>National Care Home Finder</Link>
          <Link href="/washington" style={{ color: teal, fontWeight: 700 }}>← Washington directory</Link>
        </nav>
      </header>
      <section style={{ background: `linear-gradient(125deg, ${navy}, ${teal})`, color: "white", padding: "38px 5%" }}>
        <div style={{ maxWidth: 1160, margin: "auto" }}>
          <p style={{ letterSpacing: 2, fontSize: 12, fontWeight: 700 }}>WASHINGTON MARKET INTELLIGENCE</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 43px)", margin: "10px 0" }}>Adult Family Home Map</h1>
          <p style={{ maxWidth: 800, lineHeight: 1.65 }}>Explore care-home locations, recorded licensed capacity and neighborhood-level concentration. These indicators describe supply, not vacancies or proven unmet demand.</p>
        </div>
      </section>
      <div style={{ maxWidth: 1160, margin: "auto", padding: "26px 5% 65px" }}>
        <form onSubmit={search} style={{ background: "white", border: `1px solid ${border}`, borderRadius: 14, padding: 20, display: "flex", alignItems: "end", gap: 12, flexWrap: "wrap" }}>
          <label htmlFor="market-zip" style={{ display: "grid", gap: 8, fontWeight: 700, flex: "1 1 210px" }}>
            Washington ZIP code
            <input id="market-zip" type="text" inputMode="numeric" maxLength={5} value={zipInput} onChange={e => setZipInput(e.target.value)} placeholder="e.g. 98056" style={{ fontSize: 17, padding: "12px 14px", border: `1px solid ${border}`, borderRadius: 8, color: navy }} />
          </label>
          <button type="submit" style={{ border: 0, color: "white", background: teal, borderRadius: 9, padding: "14px 22px", fontWeight: 700, cursor: "pointer", fontSize: 16 }}>Analyze ZIP</button>
        </form>
        <div aria-live="polite" style={{ margin: "18px 0" }}>
          <strong>ZIP {zip}</strong> {loading ? "— Loading facilities…" : error ? "— Data unavailable" : `— ${homes.length.toLocaleString()} mapped AFHs`}
          {error && <p role="alert" style={{ color: "#a62a2a" }}>{error}</p>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 13, marginBottom: 20 }}>
          <div style={statBox}><span style={{ color: "#536b7c", fontSize: 13 }}>Mapped AFHs</span><div style={{ fontSize: 29, fontWeight: 800 }}>{loading || error ? "—" : homes.length.toLocaleString()}</div></div>
          <div style={statBox}><span style={{ color: "#536b7c", fontSize: 13 }}>Known licensed beds</span><div style={{ fontSize: 29, fontWeight: 800 }}>{loading || error ? "—" : knownCapacity.toLocaleString()}</div><small>{!loading && !error && missingCapacity > 0 ? `${missingCapacity} home(s) missing capacity` : "Not available beds"}</small></div>
          <div style={statBox}><span style={{ color: "#536b7c", fontSize: 13 }}>Homes in high-density clusters</span><div style={{ fontSize: 29, fontWeight: 800 }}>{loading || error ? "—" : highConcentration.toLocaleString()}</div><small>20+ AFHs within 1 mile</small></div>
        </div>
        <section aria-label="Interactive AFH facility map" style={{ border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden", background: "white" }}>
          <div style={{ padding: "17px 18px", display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Facility locations</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <button onClick={() => setMode("density")} aria-pressed={mode === "density"} style={{ borderRadius: 7, padding: "10px 12px", background: mode === "density" ? teal : "white", color: mode === "density" ? "white" : teal, border: `1px solid ${teal}`, fontWeight: 700, cursor: "pointer" }}>Concentration</button>
              <button onClick={() => setMode("locations")} aria-pressed={mode === "locations"} style={{ borderRadius: 7, padding: "10px 12px", background: mode === "locations" ? teal : "white", color: mode === "locations" ? "white" : teal, border: `1px solid ${teal}`, fontWeight: 700, cursor: "pointer" }}>Location dots</button>
            </div>
          </div>
          <div ref={mapDivRef} style={{ height: "min(65vh, 590px)", minHeight: 390, width: "100%", zIndex: 0 }} aria-label="Map of care homes; click a dot for the home profile" />
          <div style={{ padding: 16, fontSize: 13, color: "#425b6d", lineHeight: 1.8 }}>
            {mode === "density" ? <span><strong>AFHs within 1 mile of each marker:</strong> <span style={{ color: "#dc2626" }}>●</span> 20+ &nbsp; <span style={{ color: "#f97316" }}>●</span> 10–19 &nbsp; <span style={{ color: "#c69a06" }}>●</span> 5–9 &nbsp; <span style={{ color: "#16835b" }}>●</span> 1–4</span> : <span>All dots show facility locations. Click a dot to view licensed capacity and the home profile.</span>}
            <div>Counts include the selected facility and may include homes just outside the ZIP boundary. This is a preliminary one-mile clustering heuristic, not a population-adjusted density or investment score.</div>
          </div>
        </section>
        {!loading && !error && homes.length === 0 && <p style={{ marginTop: 18 }}>No mapped facilities were found for this ZIP code in the current directory.</p>}
        <p style={{ color: "#536b7c", fontSize: 13, lineHeight: 1.8, marginTop: 23 }}>Facility information is from a Washington DSHS locator download matched to state GIS data. Recorded capacity is not vacancy availability. Map coordinates, licensing information and care suitability should be independently confirmed. This directory does not recommend or certify providers. Base map © OpenStreetMap contributors.</p>
      </div>
    </main>
  );
}
