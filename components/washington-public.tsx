"use client";

import Link from "next/link";
import { LanguageSelector, useLanguage } from "./language";
import { navigationCopy } from "../lib/locale";

export function WashingtonPublicHeader({ current }: { current?: "directory" | "map" | "cities" | "counties" | "demographics" | "opportunity" | "profile" }) {
  const { locale } = useLanguage();
  const copy = navigationCopy[locale];
  const links = [
    { id: "directory", href: "/washington", label: copy.directory },
    { id: "map", href: "/washington/map", label: copy.map },
    { id: "cities", href: "/washington/cities", label: copy.cities },
    { id: "counties", href: "/washington/counties", label: copy.counties },
    { id: "demographics", href: "/washington/demographics", label: copy.aging },
    { id: "opportunity", href: "/washington/opportunity", label: copy.market },
  ] as const;
  return (
    <header style={{ position: "relative", zIndex: 20, background: "#ffffff", color: "#123c59", borderBottom: "1px solid #dbe5eb", padding: "14px 5%" }}>
      <style>{`
        .wa-brand { color: #123c59; font-weight: 800; font-size: 19px; line-height: 1.3; text-decoration: none; }
        .wa-bar { max-width: 1160px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 12px 22px; flex-wrap: wrap; }
        .wa-lang { display: flex; gap: 6px; align-items: center; }
        .wa-lang button { min-height: 40px; padding: 8px 12px; border-radius: 999px; border: 1px solid #dbe5eb; background: #ffffff; color: #123c59; font-weight: 800; cursor: pointer; }
        .wa-lang button[aria-pressed="true"] { background: #123c59; color: #ffffff; border-color: #123c59; }
        .wa-menu summary { display: none; }
        .wa-nav { display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin: 0; padding: 0; }
        .wa-nav a { color: #176b53; font-weight: 700; text-decoration: none; padding: 6px 2px; }
        .wa-nav a[aria-current="page"] { color: #123c59; text-decoration: underline; text-underline-offset: 4px; }
        .wa-menu::details-content,
        .wa-menu:not([open])::details-content { display: block !important; content-visibility: visible !important; height: auto !important; overflow: visible !important; }
        .wa-menu:not([open]) .wa-nav { display: flex; }
        .wa-hero-split { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(200px, 0.8fr); gap: 32px; align-items: center; }
        .wa-welcome { width: 100%; height: auto; display: block; }
        a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, summary:focus-visible {
          outline: 2px solid #176b53;
          outline-offset: 3px;
        }
        @media (max-width: 760px) {
          .wa-brand { font-size: 16px; max-width: 100%; }
          .wa-bar { align-items: flex-start; }
          .wa-lang button { min-height: 44px; }
          .wa-menu { position: relative; margin-left: auto; }
          .wa-menu summary { display: list-item; cursor: pointer; font-weight: 800; color: #176b53; padding: 8px 2px; list-style-position: inside; }
          .wa-menu:not([open])::details-content { display: none !important; content-visibility: hidden !important; }
          .wa-menu:not([open]) .wa-nav { display: none; }
          .wa-menu[open] .wa-nav {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            position: absolute;
            top: calc(100% + 6px);
            right: 0;
            z-index: 30;
            min-width: 210px;
            padding: 12px;
            background: #ffffff;
            border: 1px solid #dbe5eb;
            border-radius: 12px;
            box-shadow: 0 12px 28px rgba(18, 60, 89, 0.12);
          }
          .wa-hero-split { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
      <div className="wa-bar">
        <Link href="/" className="wa-brand">National Care Home Finder</Link>
        <LanguageSelector />
        <details className="wa-menu">
          <summary>{copy.summary}</summary>
          <nav aria-label={copy.navLabel} className="wa-nav">
            {links.map((link) => (
              <Link key={link.id} href={link.href} aria-current={current === link.id ? "page" : undefined}>
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}

export function WelcomeScene() {
  return (
    <svg className="wa-welcome" viewBox="0 0 360 240" aria-hidden="true" focusable="false">
      <title>Decorative home and trees</title>
      <rect width="360" height="240" rx="28" fill="#e7f3f8" />
      <circle cx="292" cy="46" r="20" fill="#f2d48a" />
      <rect y="178" width="360" height="62" fill="#d5ebe3" />
      <rect x="40" y="134" width="12" height="50" rx="3" fill="#8a5a34" />
      <circle cx="46" cy="118" r="30" fill="#176b53" />
      <circle cx="26" cy="132" r="16" fill="#145844" />
      <rect x="302" y="126" width="12" height="56" rx="3" fill="#8a5a34" />
      <circle cx="308" cy="110" r="32" fill="#176b53" />
      <circle cx="284" cy="126" r="18" fill="#1d7a5e" />
      <polygon points="180,64 98,132 262,132" fill="#123c59" />
      <rect x="116" y="132" width="128" height="70" fill="#f7fbfd" />
      <rect x="166" y="156" width="28" height="46" rx="2" fill="#176b53" />
      <rect x="134" y="148" width="22" height="18" rx="2" fill="#d5ebe3" stroke="#123c59" strokeWidth="2" />
      <rect x="204" y="148" width="22" height="18" rx="2" fill="#d5ebe3" stroke="#123c59" strokeWidth="2" />
    </svg>
  );
}
