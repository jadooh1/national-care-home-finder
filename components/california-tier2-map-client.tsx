"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CaliforniaTier2MapPoint } from "../lib/california-tier2-map";

const navy = "#123c59";
const teal = "#176b53";
const border = "#dbe5eb";

type Props = {
  points: readonly CaliforniaTier2MapPoint[];
  emptyMessage: string;
};

function makePopup(point: CaliforniaTier2MapPoint): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.lineHeight = "1.65";
  wrap.style.maxWidth = "260px";

  const heading = document.createElement("strong");
  heading.textContent = point.name;
  wrap.appendChild(heading);

  const meta = document.createElement("div");
  meta.textContent = [
    point.category,
    point.status,
    point.city,
    point.postalCode,
    point.facilityNumber,
  ]
    .filter(Boolean)
    .join(" · ");
  wrap.appendChild(meta);

  if (point.capacity) {
    const cap = document.createElement("div");
    cap.textContent = `Recorded capacity: ${point.capacity} (not a vacancy)`;
    wrap.appendChild(cap);
  }

  const match = document.createElement("div");
  match.style.fontSize = "12px";
  match.style.color = "#536b7c";
  match.textContent = point.matchKind === "exact"
    ? "Coordinate match: exact license ID"
    : "Coordinate match: unique leading-zero GIS representation";
  wrap.appendChild(match);

  if (point.profilePath) {
    const profile = document.createElement("a");
    profile.href = point.profilePath;
    profile.textContent = "Development profile";
    profile.style.color = teal;
    profile.style.fontWeight = "700";
    profile.style.display = "block";
    wrap.appendChild(profile);
  }

  if (point.disclosureUrl) {
    const disclosure = document.createElement("a");
    disclosure.href = point.disclosureUrl;
    disclosure.textContent = "Official CDSS facility detail";
    disclosure.target = "_blank";
    disclosure.rel = "noopener noreferrer";
    disclosure.style.color = teal;
    disclosure.style.fontWeight = "700";
    disclosure.style.display = "block";
    wrap.appendChild(disclosure);
  }

  return wrap;
}

export function CaliforniaTier2MapClient({ points, emptyMessage }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      const L = await import("leaflet");
      if (cancelled || !mapDivRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapDivRef.current, { scrollWheelZoom: false }).setView(
        [36.7, -119.7],
        6,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
      setTimeout(() => {
        if (!cancelled) map.invalidateSize();
      }, 100);
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

  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapRef.current || !layerRef.current) {
      return;
    }
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    layer.clearLayers();
    if (points.length === 0) {
      map.setView([36.7, -119.7], 6);
      return;
    }
    for (const point of points) {
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 7,
        color: "#ffffff",
        weight: 1.5,
        fillColor: point.category === "RCFE" ? teal : navy,
        fillOpacity: 0.94,
      }).addTo(layer);
      marker.bindPopup(() => makePopup(point), { maxWidth: 280 });
    }
    const bounds = L.latLngBounds(
      points.map((p) => [p.latitude, p.longitude] as [number, number]),
    );
    map.fitBounds(bounds.pad(0.22), { maxZoom: 14, animate: false });
    map.invalidateSize();
  }, [mapReady, points]);

  return (
    <section
      aria-label="California development map"
      style={{
        border: `1px solid ${border}`,
        borderRadius: 14,
        overflow: "hidden",
        background: "white",
      }}
    >
      <div
        ref={mapDivRef}
        style={{ height: "min(65vh, 590px)", minHeight: 390, width: "100%", zIndex: 0 }}
        aria-label="Interactive map of verified California facility coordinates"
      />
      <div style={{ padding: 16, fontSize: 13, color: "#425b6d", lineHeight: 1.8 }}>
        <span>
          <strong style={{ color: teal }}>●</strong> RCFE{" "}
          <strong style={{ color: navy }}>●</strong> ARF
        </span>
        {points.length === 0 ? <div>{emptyMessage}</div> : null}
        {points.length > 0 ? (
          <div style={{ marginTop: 8 }}>
            Showing {points.length.toLocaleString()} mapped facilities. Coordinates
            come from official CDSS CCL ArcGIS matches only — never invent or
            geocode locations.
          </div>
        ) : null}
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, maxHeight: 220, overflow: "auto" }}>
          {points.slice(0, 40).map((point) => (
            <li key={point.facilityNumber}>
              {point.profilePath ? (
                <Link href={point.profilePath} style={{ color: teal, fontWeight: 700 }}>
                  {point.name}
                </Link>
              ) : (
                point.name
              )}
              {" — "}
              {[point.city, point.facilityNumber, point.category].filter(Boolean).join(", ")}
              {point.disclosureUrl ? (
                <>
                  {" · "}
                  <a
                    href={point.disclosureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: teal, fontWeight: 700 }}
                  >
                    CDSS
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
