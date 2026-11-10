"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { WashingtonPublicHeader } from "../../../components/washington-public";
import { useLanguage, usePageTitle } from "../../../components/language";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../../lib/supabase";
import { copy } from "../../../lib/copy/washington-detail";
import { DENSITY_BANDS, densityColor, facilityProfilePath, invalidZipMessage, mapResultSummary, washingtonMapPostalOrFilter } from "../../../lib/family-journey";
import { localizedInvalidZip, localizedMapSummary, type Locale } from "../../../lib/locale";

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

function prettyName(name: string): string {
  return name.replace(/^\s*!+\s*/, "").trim() || name;
}

function makePopup(home: Home, count: number, text: (typeof copy.en)["map"]): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.lineHeight = "1.65";
  const heading = document.createElement("strong");
  heading.textContent = prettyName(home.canonical_name);
  wrap.appendChild(heading);
  const address = document.createElement("div");
  address.textContent = [home.address_line1, home.city, home.state_code, home.postal_code].filter(Boolean).join(", ");
  wrap.appendChild(address);
  const capacity = document.createElement("div");
  capacity.textContent = text.popupCapacity(home.licensed_capacity == null ? text.notAvailable : String(home.licensed_capacity));
  wrap.appendChild(capacity);
  const concentration = document.createElement("div");
  concentration.textContent = text.popupNearby(count);
  wrap.appendChild(concentration);
  if (home.license_number) {
    const path = facilityProfilePath(home.license_number);
    if (path) {
      const link = document.createElement("a");
      link.href = path;
      link.textContent = text.viewProfile;
      link.style.color = teal;
      link.style.fontWeight = "700";
      wrap.appendChild(link);
    }
  }
  return wrap;
}

export default function WashingtonMarketMapPage() {
  const locale: Locale = useLanguage().locale;
  const text = copy[locale].map;
  usePageTitle(text.title);
  const localeRef = useRef<Locale>(locale);
  localeRef.current = locale;
  const [zipInput, setZipInput] = useState("98056");
  const [zip, setZip] = useState("98056");
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"" | "unavailable" | "tooMany">("");
  const [mode, setMode] = useState<DisplayMode>("density");
  const [zipInvalid, setZipInvalid] = useState(false);
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
          .or(washingtonMapPostalOrFilter(zip))
          .order("license_number", { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (cancelled) return;
        if (queryError) {
          setError("unavailable");
          setLoading(false);
          return;
        }
        const batch = (data ?? []) as unknown as Home[];
        result.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        if (page === MAX_PAGES - 1) {
          setError("tooMany");
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
      marker.bindPopup(() => makePopup(home, neighbors[index], copy[localeRef.current].map), { maxWidth: 280 });
    });
    const bounds = L.latLngBounds(homes.map(h => [Number(h.latitude), Number(h.longitude)] as [number, number]));
    map.fitBounds(bounds.pad(0.22), { maxZoom: 14, animate: false });
    map.invalidateSize();
  }, [mapReady, homes, neighbors, mode]);

  const search = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = zipInput.trim();
    if (!/^\d{5}$/.test(cleaned)) {
      setZipInvalid(true);
      return;
    }
    setZipInvalid(false);
    if (cleaned === zip) return;
    setZip(cleaned);
  }, [zipInput, zip]);

  const statBox: React.CSSProperties = { flex: "1 1 180px", background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: 18 };
  const formatCount = (value: number) => locale === "es" ? value.toLocaleString("es") : value.toLocaleString();
  const summary = locale === "en"
    ? mapResultSummary({ zip, loading, error, count: homes.length })
    : localizedMapSummary(locale, { zip, loading, error, count: homes.length });
  return (
    <main style={{ minHeight: "100vh", background: "#f4f8fb", color: navy, fontFamily: "Arial, sans-serif" }}>
      <WashingtonPublicHeader current="map" />
      <section style={{ background: `linear-gradient(125deg, ${navy}, ${teal})`, color: "white", padding: "38px 5%" }}>
        <div style={{ maxWidth: 1160, margin: "auto" }}>
          <p style={{ letterSpacing: 2, fontSize: 12, fontWeight: 700 }}>{text.eyebrow}</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 43px)", margin: "10px 0" }}>{text.title}</h1>
          <p style={{ maxWidth: 800, lineHeight: 1.65 }}>{text.intro}</p>
        </div>
      </section>
      <div style={{ maxWidth: 1160, margin: "auto", padding: "26px 5% 65px" }}>
        <form onSubmit={search} style={{ background: "white", border: `1px solid ${border}`, borderRadius: 14, padding: 20, display: "flex", alignItems: "end", gap: 12, flexWrap: "wrap" }}>
          <label htmlFor="market-zip" style={{ display: "grid", gap: 8, fontWeight: 700, flex: "1 1 210px" }}>
            {text.zipLabel}
            <input id="market-zip" type="text" inputMode="numeric" maxLength={5} value={zipInput} onChange={e => setZipInput(e.target.value)} placeholder={text.zipPlaceholder} style={{ fontSize: 17, padding: "12px 14px", border: `1px solid ${border}`, borderRadius: 8, color: navy }} />
          </label>
          <button type="submit" style={{ border: 0, color: "white", background: teal, borderRadius: 9, padding: "14px 22px", fontWeight: 700, cursor: "pointer", fontSize: 16 }}>{text.analyze}</button>
        </form>
        <div aria-live="polite" style={{ margin: "18px 0" }}>
          <strong>{summary}</strong>
          {zipInvalid && <p role="alert" style={{ color: "#a62a2a" }}>{locale === "en" ? invalidZipMessage(zip) : localizedInvalidZip(locale, zip)}</p>}
          {error && <p role="alert" style={{ color: "#a62a2a" }}>{error === "tooMany" ? text.tooMany : text.unavailable}</p>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 13, marginBottom: 20 }}>
          <div style={statBox}><span style={{ color: "#536b7c", fontSize: 13 }}>{text.mappedAfhs}</span><div style={{ fontSize: 29, fontWeight: 800 }}>{loading || error ? "—" : formatCount(homes.length)}</div></div>
          <div style={statBox}><span style={{ color: "#536b7c", fontSize: 13 }}>{text.knownBeds}</span><div style={{ fontSize: 29, fontWeight: 800 }}>{loading || error ? "—" : formatCount(knownCapacity)}</div><small>{!loading && !error && missingCapacity > 0 ? text.missingCapacity(missingCapacity) : text.notAvailableBeds}</small></div>
          <div style={statBox}><span style={{ color: "#536b7c", fontSize: 13 }}>{text.highDensityHomes}</span><div style={{ fontSize: 29, fontWeight: 800 }}>{loading || error ? "—" : formatCount(highConcentration)}</div><small>{text.highDensityDetail}</small></div>
        </div>
        <section aria-label={text.mapSectionAria} style={{ border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden", background: "white" }}>
          <div style={{ padding: "17px 18px", display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>{text.facilityLocations}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <button onClick={() => setMode("density")} aria-pressed={mode === "density"} style={{ borderRadius: 7, padding: "10px 12px", background: mode === "density" ? teal : "white", color: mode === "density" ? "white" : teal, border: `1px solid ${teal}`, fontWeight: 700, cursor: "pointer" }}>{text.concentration}</button>
              <button onClick={() => setMode("locations")} aria-pressed={mode === "locations"} style={{ borderRadius: 7, padding: "10px 12px", background: mode === "locations" ? teal : "white", color: mode === "locations" ? "white" : teal, border: `1px solid ${teal}`, fontWeight: 700, cursor: "pointer" }}>{text.locationDots}</button>
            </div>
          </div>
          <div ref={mapDivRef} style={{ height: "min(65vh, 590px)", minHeight: 390, width: "100%", zIndex: 0 }} aria-label={text.mapAria} />
          <div style={{ padding: 16, fontSize: 13, color: "#425b6d", lineHeight: 1.8 }}>
            {mode === "density" ? <span><strong>{text.densityLead}</strong> {DENSITY_BANDS.map(band => <span key={band.label}> <span style={{ color: band.color }}>●</span> {band.label}</span>)}</span> : <span>{text.locationLegend}</span>}
            <div>{text.clusterNote}</div>
          </div>
        </section>
        {!loading && !error && homes.length === 0 && <p style={{ marginTop: 18 }}>{text.noneFound}</p>}
        {!loading && !error && homes.length > 0 && <section aria-label={text.listAria} style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 22 }}>{text.facilitiesInZip(zip)}</h2>
          <ul style={{ lineHeight: 1.7, paddingLeft: 20 }}>
            {homes.map(home => {
              const profile = facilityProfilePath(home.license_number);
              const label = prettyName(home.canonical_name);
              return <li key={home.id}>{profile ? <Link href={profile} style={{ color: teal, fontWeight: 700 }}>{label}</Link> : label}{[home.city, home.license_number].filter(Boolean).length > 0 ? ` — ${[home.city, home.license_number ? text.licenseLabel(home.license_number) : ""].filter(Boolean).join(", ")}` : ""}</li>;
            })}
          </ul>
        </section>}
        <p style={{ color: "#536b7c", fontSize: 13, lineHeight: 1.8, marginTop: 23 }}>{text.disclaimer}</p>
      </div>
    </main>
  );
}
