"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguageSelector, useLanguage, usePageTitle } from "../components/language";
import { copy } from "../lib/copy/home";
import { HOMEPAGE_DIRECTORY_NOTE } from "../lib/family-journey";
import { localizedStateStatus, navigationCopy } from "../lib/locale";
import { homepageDirectoryNote, oregonPublicDirectoryAvailable } from "../lib/oregon-public-directory";
import { STATE_NAMES, directoryHref } from "../lib/state-directory";
import "./home.css";

const featured = ["Washington", "Oregon", "California", "Texas", "Florida"];
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export default function Home() {
  const { locale } = useLanguage();
  const t = copy[locale];
  const nav = navigationCopy[locale];
  const es = locale === "es";
  usePageTitle(t.pageTitle);
  const [search, setSearch] = useState("");
  const [all, setAll] = useState(false);
  const states = all ? STATE_NAMES.filter(state => state.toLowerCase().includes(search.trim().toLowerCase())) : featured;
  const oregonAvailable = oregonPublicDirectoryAvailable(projectUrl);

  return (
    <div className="home">
      <header className="home-header">
        <Link className="home-brand" href="/">
          <img src="/home/mark.webp" alt="" width="80" height="62" />
          <span>National<br />Care Home Finder<small>{es ? "Busque. Compare. Elija con confianza." : "Find. Compare. Choose with Confidence."}</small></span>
        </Link>
        <nav aria-label={es ? "Principal" : "Main"}>
          <Link aria-current="page" href="/">{es ? "Inicio" : "Home"}</Link>
          <details name="home-nav"><summary>{es ? "Buscar un hogar" : "Find a Care Home"}</summary><div>
            <Link href="/washington">{nav.directory}</Link><Link href="/washington/map">{nav.map}</Link>
          </div></details>
          <Link href="/owner">{es ? "Propietarios" : "For Owners"}</Link>
          <details name="home-nav"><summary>{es ? "Recursos" : "Resources"}</summary><div>
            <Link href="/washington/cities">{nav.cities}</Link><Link href="/washington/counties">{nav.counties}</Link>
            <Link href="/washington/demographics">{nav.aging}</Link><Link href="/washington/opportunity">{nav.market}</Link>
          </div></details>
          <a href="#about">{es ? "Acerca de" : "About Us"}</a>
        </nav>
        <div className="home-actions"><LanguageSelector /><Link className="sign" href="/owner">{es ? "Ingresar" : "Sign In"}</Link></div>
      </header>
      <main>
        <section className="home-hero">
          <div className="portrait" aria-hidden="true" />
          <div className="hero-intro"><h1>{t.heading}</h1><p>{t.lead}</p></div>
          <form action="/washington" method="get" className="home-form">
            <div><span>{es ? "Estado" : "State"}</span><strong>Washington</strong></div>
            <label>{t.cityLabel}<input name="city" type="search" placeholder={t.cityPlaceholder} /></label>
            <label>{t.facilityLabel}<input name="q" type="search" placeholder={t.facilityPlaceholder} /></label>
            <button type="submit">{t.searchButton}</button>
          </form>
          <div className="benefits">{[nav.directory, es ? "Recursos de licencias" : "Licensing resources", es ? "Mapa de hogares" : "Care home map"].map((text, i) => <span key={text}><b aria-hidden="true">{["⌂","✓","⌖"][i]}</b>{text}</span>)}</div>
        </section>
        <section id="states" className="home-explore">
          <div>
            <div className="state-heading"><h2>{es ? "Explore por estado" : "Explore by State"}</h2>
              <button type="button" aria-expanded={all} aria-controls="home-states" onClick={() => {setAll(!all); setSearch("");}}>
                {all ? (es ? "Ver destacados" : "View featured states") : (es ? "Ver todos los estados" : "View all states")} →
              </button>
            </div>
            <p>{t.statesLead}</p>
            {all && <input className="state-filter" type="search" aria-label={t.searchStatesLabel} placeholder={t.searchStatesPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />}
            <div id="home-states" className="state-grid">
              {states.map(state => {
                const href = directoryHref(state, projectUrl);
                return <article key={state}>
                  {featured.includes(state) && <img src={`/home/${state.toLowerCase()}.webp`} alt="" width="201" height="112" />}
                  <div><h3>{state}</h3>
                    {href ? <Link href={href}>{es ? "Buscar" : "Search"} {state === "Washington" ? "WA" : state === "California" ? "CA" : "OR"} →</Link> : <small>{es ? "Sin publicar" : "Unpublished"}</small>}
                  </div>
                </article>;
              })}
            </div>
            <p aria-live="polite">{localizedStateStatus(locale, states.length)}</p>
          </div>
          <aside id="about"><h2>{es ? "¿Por qué elegir" : "Why Choose"}<br />National Care Home Finder?</h2>
            <ul>{t.cards.map(card => <li key={card.title}>{card.title}</li>)}</ul>
            <Link href="/washington">{es ? "Comenzar" : "Get started today"} →</Link>
          </aside>
        </section>
      </main>
      <footer>
        <strong>{t.brand}</strong>
        <span>{t.footerLead}</span>
        <Link className="owner-cta" href="/owner?mode=login">{t.ownerCta}</Link>
        <small>{t.footerDisclaimer}</small>
      </footer>
      <p className="coverage">{es ? (oregonAvailable ? t.noteWithOregon : t.noteWithoutOregon) : (homepageDirectoryNote(oregonAvailable) ?? HOMEPAGE_DIRECTORY_NOTE)}</p>
    </div>
  );
}
