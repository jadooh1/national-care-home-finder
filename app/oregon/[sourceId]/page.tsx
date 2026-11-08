"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

export default function OregonPublicProfilePage() {
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
        <div style={{ maxWidth: 800, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <Link href="/oregon" style={{ color: C.teal, fontWeight: 600 }}>← Oregon directory</Link>
        </div>
      </header>
      <div style={{ maxWidth: 800, margin: "auto", padding: "32px 5% 60px" }}>
        {loading ? <p>Loading this Oregon adult foster home…</p> : <ProfileState result={result} />}
      </div>
    </main>
  );
}

async function queryPublicProfile(args: OregonPublicProfileQuery) {
  const { data, error } = await supabase.from(args.view).select(args.columns).eq("source_id", args.sourceId).maybeSingle();
  return { data, error: error?.message ?? "" };
}

function ProfileState({ result }: { result: OregonPublicProfileLoad }) {
  if (result.state === "withheld") return <p>Oregon adult foster homes are not published in this directory.</p>;
  if (result.state === "unavailable") return <p>This Oregon adult foster home cannot be loaded.</p>;
  if (result.state === "missing") return <p>This Oregon adult foster home is not in the directory.</p>;
  const row = result.row;
  return (
    <article style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
      <p style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 700, color: C.teal }}>OREGON ADULT FOSTER HOME</p>
      <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.15, margin: "8px 0 16px" }}>{row.facility_name}</h1>
      <p style={{ margin: "8px 0" }}>{row.city}, {row.county} County</p>
      <p style={{ margin: "8px 0" }}>{row.license_type}</p>
      <p style={{ margin: "8px 0" }}>License status: {row.status}</p>
      <p style={{ margin: "8px 0" }}>{row.licensed_beds} licensed beds</p>
      <p style={{ lineHeight: 1.7 }}>{OREGON_BEDS_NOTE}</p>
      <p style={{ lineHeight: 1.7 }}>{OREGON_ZERO_BED_NOTE}</p>
      <p style={{ lineHeight: 1.7 }}>{OREGON_LOCATION_NOTE}</p>
      <p style={{ lineHeight: 1.7 }}>{OREGON_FRESHNESS_NOTE}</p>
      <p style={{ marginTop: 16 }}><a href={row.official_profile_url}>Official ODHS profile</a></p>
    </article>
  );
}
