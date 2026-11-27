"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { VisitorFeedback } from "../../../components/visitor-feedback";
import { WashingtonPublicHeader, WelcomeScene } from "../../../components/washington-public";
import { useLanguage, usePageTitle } from "../../../components/language";
import { browserClaimStorage, ownerClaimHref, writeClaimLicense } from "../../../lib/owner-claim";
import { PREMIUM_OWNER_CONTENT_VIEW } from "../../../lib/premium-owner-content";
import { WASHINGTON_DSHS_LOCATOR, washingtonDisclosureUrl } from "../../../lib/state-directory";
import { supabase } from "../../../lib/supabase";
import { copy } from "../../../lib/copy/washington-detail";
import { recordedCapacityText, washingtonDirectoryReturnPath } from "../../../lib/family-journey";
import { scrollToVisitChecklist, visitChecklistPrintCss } from "../../../lib/washington-visit-checklist";
import type { Locale } from "../../../lib/locale";
import {
  WASHINGTON_RESERVED_E2E_FACILITY_ID,
  type WashingtonListedFacility,
} from "../../../lib/washington-public-roster";

type Facility = WashingtonListedFacility;
type PublishedContent = { field_name: string; published_value: string; published_at: string };
const publishedFields = ["description", "services", "amenities"] as const;
type PublishedField = (typeof publishedFields)[number];

function isPublishedField(field: string): field is PublishedField {
  return (publishedFields as readonly string[]).includes(field);
}

const C = { navy: "#123c59", teal: "#176b53", pale: "#f4f8fb", muted: "#536b7c", border: "#dbe5eb" };
const card: React.CSSProperties = { background: "white", border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 5px 16px rgba(18,60,89,.045)" };
const linkStyle: React.CSSProperties = { color: C.teal, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 };
function displayName(name: string) { return name.replace(/^\s*!+\s*/, "").trim() || name; }

export default function WashingtonFacilityProfileClient({
  license,
  initialFacility,
}: {
  license: string;
  initialFacility: WashingtonListedFacility | null;
}) {
  const locale: Locale = useLanguage().locale;
  const text = copy[locale].profile;
  const [facility, setFacility] = useState<Facility | null>(initialFacility);
  const [published, setPublished] = useState<PublishedContent[]>([]);
  const [loading, setLoading] = useState(initialFacility === null);
  const [error, setError] = useState<"" | "unavailable">("");
  const [notFound, setNotFound] = useState(false);
  const [directoryPath, setDirectoryPath] = useState("/washington");

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    setDirectoryPath(washingtonDirectoryReturnPath(from) ?? "/washington");
  }, []);

  useLayoutEffect(() => {
    scrollToVisitChecklist(
      { loading, hasFacility: facility !== null, hash: window.location.hash },
      document,
      () => window.scrollTo(0, 0),
    );
  }, [facility, loading]);

  useEffect(() => {
    let cancelled = false;
    setError("");
    setNotFound(false);
    setPublished([]);
    setFacility(initialFacility);
    if (!/^\d{1,20}$/.test(license)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    async function load() {
      let home = initialFacility;
      if (!home) {
        setLoading(true);
        const { data, error: queryError } = await supabase
          .from("wa_dshs_listed_facilities")
          .select("id,canonical_name,address_line1,city,county,state_code,postal_code,license_number,licensed_capacity,record_status")
          .eq("license_number", license)
          .neq("id", WASHINGTON_RESERVED_E2E_FACILITY_ID)
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (queryError) {
          setError("unavailable");
          setLoading(false);
          return;
        }
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        home = data as Facility;
        setFacility(home);
      }
      let ownerText: PublishedContent[] = [];
      try {
        const content = await supabase
          .from(PREMIUM_OWNER_CONTENT_VIEW)
          .select("field_name,published_value,published_at")
          .eq("facility_id", home.id);
        if (!content.error) {
          ownerText = ((content.data ?? []) as PublishedContent[]).filter(row => isPublishedField(row.field_name));
        }
      } catch {
        ownerText = [];
      }
      if (cancelled) return;
      setPublished(ownerText);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [license, initialFacility]);

  const address = facility ? [facility.address_line1, facility.city, facility.state_code, facility.postal_code].filter(Boolean).join(", ") : "";
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const heading = facility ? displayName(facility.canonical_name) : loading ? text.loadingTitle : text.title;
  usePageTitle(heading);

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <div className="print-omit"><WashingtonPublicHeader current="profile" /></div>
      <section className="print-omit" style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, padding: "45px 5%", color: "white" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>{text.eyebrow}</p>
            <h1 style={{ fontSize: "clamp(29px, 5vw, 44px)", lineHeight: 1.15, margin: "12px 0" }}>
              {heading}
            </h1>
            <p style={{ opacity: 0.95, lineHeight: 1.6, maxWidth: 740 }}>{text.intro}</p>
          </div>
          <div style={{ width: 148, flex: "0 0 auto" }}>
            <WelcomeScene />
          </div>
        </div>
      </section>
      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 64px" }}>
        <Link className="print-omit" href={directoryPath} style={linkStyle}>{text.back}</Link>
        <div className="print-omit" aria-live="polite" style={{ marginTop: 21 }}>
          {loading && <section style={card}><p>{text.loadingInfo}</p></section>}
          {!loading && error && <section style={card}><p role="alert" style={{ color: "#a62a2a" }}>{text.unavailable}</p><button onClick={() => window.location.reload()} style={{ padding: "10px 14px", cursor: "pointer" }}>{text.retry}</button></section>}
          {!loading && notFound && <section style={card}><h2>{text.notFoundTitle}</h2><p>{text.notFoundBody}</p><Link href={directoryPath} style={linkStyle}>{text.searchDirectory}</Link></section>}
        </div>
        {!loading && facility && (
          <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 310px), 1fr))", gap: 22, marginTop: 22, alignItems: "start" }}>
            <section className="print-omit" style={card} aria-labelledby="details-heading">
              <h2 id="details-heading" style={{ margin: "0 0 16px", fontSize: 23 }}>{text.detailsTitle}</h2>
              <dl style={{ margin: 0, lineHeight: 1.7 }}>
                <dt style={{ fontWeight: 700, marginTop: 12 }}>{text.facilityName}</dt><dd style={{ margin: "0 0 7px" }}>{displayName(facility.canonical_name)}</dd>
                <dt style={{ fontWeight: 700, marginTop: 12 }}>{text.address}</dt><dd style={{ margin: "0 0 7px" }}>{address || text.notAvailable}</dd>
                <dt style={{ fontWeight: 700, marginTop: 12 }}>{text.county}</dt><dd style={{ margin: "0 0 7px" }}>{facility.county ? text.countyValue(facility.county) : text.notAvailable}</dd>
                <dt style={{ fontWeight: 700, marginTop: 12 }}>{text.licenseNumber}</dt><dd style={{ margin: "0 0 7px" }}>{facility.license_number ?? text.notAvailable}</dd>
                <dt style={{ fontWeight: 700, marginTop: 12 }}>{text.recordedCapacity}</dt><dd style={{ margin: "0 0 7px" }}>{facility.licensed_capacity === null ? text.notAvailable : recordedCapacityText(facility.licensed_capacity, text.notAvailable)}</dd>
                <dt style={{ fontWeight: 700, marginTop: 12 }}>{text.recordStatus}</dt><dd style={{ margin: "0 0 7px" }}>{text.recordStatusValue(facility.record_status)}</dd>
              </dl>
              {address && <p style={{ marginTop: 20 }}><a href={mapUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>{text.googleMaps}</a></p>}
              <p style={{ color: C.muted, lineHeight: 1.6 }}>{text.dshsSource}</p>
            </section>
            {published.length > 0 && (
              <section className="print-omit" style={card} aria-labelledby="owner-content-heading">
                <h2 id="owner-content-heading" style={{ margin: "0 0 10px", fontSize: 23 }}>{text.ownerTitle}</h2>
                <p style={{ color: C.muted, lineHeight: 1.7, marginTop: 0 }}>{text.ownerNote}</p>
                {published.map(item => (
                  <div key={item.field_name}>
                    <h3 style={{ margin: "16px 0 6px", fontSize: 18 }}>{isPublishedField(item.field_name) ? text.published[item.field_name] : item.field_name}</h3>
                    <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7, margin: 0 }}>{item.published_value}</p>
                  </div>
                ))}
              </section>
            )}
            <div style={{ display: "grid", gap: 22 }}>
              <section className="print-omit" style={card} aria-labelledby="verify-heading">
                <h2 id="verify-heading" style={{ margin: "0 0 10px", fontSize: 23 }}>{text.verifyTitle}</h2>
                <p style={{ color: C.muted, lineHeight: 1.7, marginTop: 0 }}>{text.verifyLead}<strong>{text.verifyNot}</strong>{text.verifyTail}</p>
                <a href={WASHINGTON_DSHS_LOCATOR} target="_blank" rel="noopener noreferrer" style={linkStyle}>{text.dshsLocator}</a>
                {facility.license_number && washingtonDisclosureUrl(facility.license_number) && (
                  <p style={{ marginTop: 12 }}>
                    <a href={washingtonDisclosureUrl(facility.license_number) ?? undefined} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                      {text.disclosure}
                    </a>
                  </p>
                )}
              </section>
              <section id="visit-sheet" style={card} aria-labelledby="visit-heading">
                <style>{visitChecklistPrintCss}</style>
                <div className="print-only">
                  <h1 style={{ fontSize: 24, lineHeight: 1.3, margin: "0 0 12px" }}>{displayName(facility.canonical_name)}</h1>
                  <p style={{ margin: "0 0 8px" }}><strong>{text.address}:</strong> {address || text.notAvailable}</p>
                  <p style={{ margin: "0 0 16px" }}><strong>{text.licenseNumber}:</strong> {facility.license_number ?? text.notAvailable}</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <h2 id="visit-heading" style={{ margin: 0, fontSize: 23, scrollMarginTop: 24 }}>{text.visitTitle}</h2>
                  <button type="button" className="no-print" onClick={() => window.print()} style={{ background: "white", color: C.navy, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", minHeight: 44, fontWeight: 700, cursor: "pointer" }}>{text.printChecklist}</button>
                </div>
                <p style={{ color: C.muted, lineHeight: 1.7 }}>{text.visitNote}</p>
                <p className="no-print" style={{ lineHeight: 1.7 }}>{text.contactAbsent}</p>
                {facility.license_number && washingtonDisclosureUrl(facility.license_number) && (
                  <p className="no-print" style={{ marginTop: 0 }}>
                    <a href={washingtonDisclosureUrl(facility.license_number) ?? undefined} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, display: "inline-flex", alignItems: "center", minHeight: 44 }}>{text.contactAction}</a>
                  </p>
                )}
                <ol style={{ lineHeight: 1.7, paddingLeft: 22, marginBottom: 0 }}>
                  {text.visitQuestions.map(question => <li key={question} style={{ marginTop: 8 }}>{question}</li>)}
                </ol>
                <p className="print-only" style={{ marginTop: 16, lineHeight: 1.6 }}>{text.printReminder}</p>
              </section>
            </div>
          </div>
          <section className="print-omit" style={{ ...card, marginTop: 22 }} aria-labelledby="claim-heading">
            <h2 id="claim-heading" style={{ margin: "0 0 8px", fontSize: 23 }}>{text.claimTitle}</h2>
            <p style={{ color: C.muted, lineHeight: 1.7, marginTop: 0 }}>{text.claimBody}</p>
            <p style={{ lineHeight: 1.6 }}>{text.claimReview}</p>
            <Link
              href={ownerClaimHref(facility.license_number)}
              onClick={() => {
                const storage = browserClaimStorage();
                if (storage) writeClaimLicense(storage, facility.license_number);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 44,
                width: "min(100%, 320px)",
                padding: "12px 18px",
                background: C.teal,
                color: "white",
                borderRadius: 9,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              {text.claimAction}
            </Link>
          </section>
          </>
        )}
        {/^\d{1,20}$/.test(license) && <div className="print-omit"><VisitorFeedback pagePath={`/washington/${license}`} /></div>}
        <footer className="print-omit" style={{ borderTop: `1px solid ${C.border}`, marginTop: 42, paddingTop: 19, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{text.footer}</footer>
      </div>
    </main>
  );
}
