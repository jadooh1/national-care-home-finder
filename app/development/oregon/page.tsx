"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import {
  loadOregonDevelopmentDirectory,
  oregonDirectoryTarget,
  type OregonDirectoryLoad,
} from "../../../lib/oregon-development-directory";

const C = { navy: "#123c59", teal: "#176b53", pale: "#f4f8fb", muted: "#536b7c", border: "#dbe5eb" };
const fieldStyle: React.CSSProperties = {
  boxSizing: "border-box", width: "100%", minWidth: 0, padding: "13px 14px",
  border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 16, background: "#fff", color: C.navy,
};

export default function OregonDevelopmentDirectoryPage() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<OregonDirectoryLoad>({ state: "withheld" });
  const target = oregonDirectoryTarget(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      if (target !== "development") {
        if (!cancelled) {
          setResult({ state: "withheld" });
          setLoading(false);
        }
        return;
      }
      const session = await supabase.auth.getSession();
      const outcome = await loadOregonDevelopmentDirectory({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        signedIn: Boolean(session.data.session),
        filters: { name, city, county, page },
        query: async (rpc, args) => {
          const { data, error } = await supabase.rpc(rpc, args);
          return { data, error: error?.message ?? "" };
        },
      });
      if (!cancelled) {
        setResult(outcome);
        setLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [target, name, city, county, page]);

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <Link href="/" style={{ color: C.teal, fontWeight: 600 }}>← All states</Link>
        </div>
      </header>
      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "48px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>DEVELOPMENT DIRECTORY</p>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.14, margin: "12px 0" }}>Oregon adult foster homes</h1>
          <p style={{ maxWidth: 780, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            These are Oregon adult foster homes from the ODHS provider list. They are not Washington adult family homes, and this page is not part of the public directory.
          </p>
        </div>
      </section>
      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px" }}>
        {target === "development" && (
          <form onSubmit={event => event.preventDefault()} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
            <input aria-label="Facility name" placeholder="Facility name" value={name} onChange={event => { setName(event.target.value); setPage(0); setLoading(true); }} style={fieldStyle} />
            <input aria-label="City" placeholder="City" value={city} onChange={event => { setCity(event.target.value); setPage(0); setLoading(true); }} style={fieldStyle} />
            <input aria-label="County" placeholder="County" value={county} onChange={event => { setCounty(event.target.value); setPage(0); setLoading(true); }} style={fieldStyle} />
          </form>
        )}
        {loading ? <p>Loading the development directory…</p> : <DirectoryState result={result} page={page} />}
        {!loading && result.state === "ready" && (result.rows.length > 0 || page > 0) && (
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button type="button" disabled={page === 0} onClick={() => setPage(current => Math.max(current - 1, 0))} style={fieldStyle}>Previous</button>
            <button type="button" disabled={!result.hasMore} onClick={() => setPage(current => current + 1)} style={fieldStyle}>Next</button>
          </div>
        )}
      </div>
    </main>
  );
}

function DirectoryState({ result, page }: { result: OregonDirectoryLoad; page: number }) {
  if (result.state === "withheld") {
    return <p>Oregon adult foster homes are not published in this directory.</p>;
  }
  if (result.state === "signed_out") {
    return <p>Sign in through the <Link href="/owner">owner portal</Link> to review this development directory.</p>;
  }
  if (result.state === "forbidden") {
    return <p>Administrator access is required for this development directory.</p>;
  }
  if (result.state === "unavailable") {
    return <p>The development directory cannot be loaded.</p>;
  }
  if (result.rows.length === 0) {
    return <p>{page > 0 ? "No further Oregon adult foster homes match these filters." : "No Oregon adult foster homes match these filters."}</p>;
  }
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
      {result.rows.map(row => (
        <li key={row.source_id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <strong>{row.facility_name}</strong>
          <p style={{ margin: "8px 0", color: C.muted }}>{row.city}, {row.county} County</p>
          <p style={{ margin: "8px 0" }}>{row.license_type} · {row.status} · {row.licensed_beds} licensed beds</p>
          <a href={row.official_profile_url}>Official ODHS profile</a>
        </li>
      ))}
    </ul>
  );
}
