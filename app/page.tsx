"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage, usePageTitle } from "../components/language";
import { WashingtonPublicHeader, WelcomeScene } from "../components/washington-public";
import { copy } from "../lib/copy/home";
import { HOMEPAGE_DIRECTORY_NOTE, stateFilterStatus } from "../lib/family-journey";
import { localizedStateStatus } from "../lib/locale";
import { homepageDirectoryNote, oregonPublicDirectoryAvailable } from "../lib/oregon-public-directory";

const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California",
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin",
  "Wyoming",
];

export default function Home() {
  const { locale } = useLanguage();
  const t = copy[locale];
  usePageTitle(t.pageTitle);
  const [search, setSearch] = useState("");
  const oregonAvailable = oregonPublicDirectoryAvailable(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

  const filteredStates = useMemo(
    () =>
      states.filter((state) =>
        state.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [search]
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f9fc",
        color: "#17324d",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <WashingtonPublicHeader />

      <section
        style={{
          background: "linear-gradient(135deg, #123c59, #176b53)",
          color: "white",
          padding: "72px 7%",
        }}
      >
        <div className="wa-hero-split" style={{ maxWidth: 1100, margin: "auto" }}>
          <div>
            <p style={{ fontWeight: 700, letterSpacing: 2 }}>
              {t.eyebrow}
            </p>
            <h1
              style={{
                fontSize: "clamp(34px, 5vw, 58px)",
                lineHeight: 1.15,
                margin: "22px 0",
              }}
            >
              {t.heading}
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.7 }}>
              {t.lead}
            </p>
            <form
              action="/washington"
              method="get"
              style={{
                marginTop: 28,
                background: "#ffffff",
                color: "#123c59",
                borderRadius: 16,
                padding: 18,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
                gap: 14,
                textAlign: "left",
                boxShadow: "0 14px 36px rgba(0,0,0,.18)",
              }}
            >
              <div>
                <label htmlFor="home-facility-query" style={{ display: "block", fontWeight: 700, marginBottom: 7 }}>
                  {t.facilityLabel}
                </label>
                <input
                  id="home-facility-query"
                  name="q"
                  type="search"
                  placeholder={t.facilityPlaceholder}
                  style={{ boxSizing: "border-box", width: "100%", padding: "14px 12px", border: "1px solid #dbe5eb", borderRadius: 10, fontSize: 16, color: "#123c59" }}
                />
              </div>
              <div>
                <label htmlFor="home-city-query" style={{ display: "block", fontWeight: 700, marginBottom: 7 }}>
                  {t.cityLabel}
                </label>
                <input
                  id="home-city-query"
                  name="city"
                  type="search"
                  placeholder={t.cityPlaceholder}
                  style={{ boxSizing: "border-box", width: "100%", padding: "14px 12px", border: "1px solid #dbe5eb", borderRadius: 10, fontSize: 16, color: "#123c59" }}
                />
              </div>
              <button
                type="submit"
                style={{ gridColumn: "1 / -1", background: "#176b53", color: "#ffffff", border: 0, borderRadius: 10, padding: "15px 18px", fontWeight: 800, fontSize: 17, cursor: "pointer" }}
              >
                {t.searchButton}
              </button>
            </form>
            <a
              href="#states"
              style={{
                display: "inline-block",
                background: "#ffffff",
                color: "#123c59",
                padding: "15px 26px",
                borderRadius: 9,
                marginTop: 18,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {t.exploreCare}
            </a>
          </div>
          <WelcomeScene />
        </div>
      </section>

      <section
        style={{
          maxWidth: 1150,
          margin: "auto",
          padding: "65px 7%",
        }}
      >
        <h2 style={{ fontSize: 30, textAlign: "center" }}>
          {t.helpingHeading}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 20,
            marginTop: 35,
          }}
        >
          {t.cards.map((item) => (
            <article
              key={item.title}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 25,
              }}
            >
              <h3 style={{ fontSize: 21 }}>{item.title}</h3>
              <p style={{ lineHeight: 1.7, color: "#526776" }}>
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="states"
        style={{
          background: "#ffffff",
          padding: "65px 7%",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <div style={{ maxWidth: 1150, margin: "auto" }}>
          <h2 style={{ fontSize: 32 }}>
            {t.statesHeading}
          </h2>
          <p style={{ color: "#526776", lineHeight: 1.7 }}>
            {t.statesLead}
          </p>

          <input
            type="search"
            aria-label={t.searchStatesLabel}
            placeholder={t.searchStatesPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: "100%",
              maxWidth: 480,
              padding: 16,
              border: "1px solid #cbd5e1",
              borderRadius: 9,
              fontSize: 16,
              margin: "20px 0 30px",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 13,
            }}
          >
            {filteredStates.map((state) => (
              <div
                key={state}
                style={{
                  background: "#f7f9fc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 9,
                  padding: "16px 18px",
                  fontWeight: 600,
                }}
              >
                {state === "Washington" ? (
  <Link
    href="/washington"
    style={{
      color: "#176b53",
      textDecoration: "underline",
      textUnderlineOffset: 3,
      display: "block",
    }}
  >
    {state}
  </Link>
) : state === "Oregon" && oregonAvailable ? (
  <Link
    href="/oregon"
    style={{
      color: "#176b53",
      textDecoration: "underline",
      textUnderlineOffset: 3,
      display: "block",
    }}
  >
    {state}
  </Link>
) : (
  state
)}
              </div>
            ))}
          </div>

          <p aria-live="polite">{locale === "es" ? localizedStateStatus(locale, filteredStates.length) : stateFilterStatus(filteredStates.length)}</p>

          <p
            style={{
              color: "#64748b",
              marginTop: 30,
              lineHeight: 1.7,
            }}
          >
            {locale === "es"
              ? (oregonAvailable ? t.noteWithOregon : t.noteWithoutOregon)
              : (homepageDirectoryNote(oregonAvailable) ?? HOMEPAGE_DIRECTORY_NOTE)}
          </p>
        </div>
      </section>

      <footer
        style={{
          background: "#123c59",
          color: "white",
          textAlign: "center",
          padding: "30px 7%",
          lineHeight: 1.8,
        }}
      >
        <strong>{t.brand}</strong>
        <p>
          {t.footerLead}
        </p>
        <small>
          {t.footerDisclaimer}
        </small>
      </footer>
    </main>
  );
}
