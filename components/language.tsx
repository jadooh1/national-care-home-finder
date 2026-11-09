"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LANGUAGE_COOKIE, LANGUAGE_STORAGE_KEY, navigationCopy, parseLocale, type Locale } from "../lib/locale";

type LanguageValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageValue | null>(null);

function persistLocale(locale: Locale) {
  document.documentElement.lang = locale;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  } catch {
    /* Storage can be unavailable. The cookie still covers the next request. */
  }
  document.cookie = `${LANGUAGE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    let stored = initialLocale;
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved) stored = parseLocale(saved);
    } catch {
      stored = initialLocale;
    }
    setLocaleState(stored);
    persistLocale(stored);
  }, [initialLocale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    persistLocale(next);
  }

  return <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("LanguageProvider is missing");
  return value;
}

export function usePageTitle(title: string) {
  useEffect(() => {
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const node = document.querySelector("title");
    if (!node) return;
    const observer = new MutationObserver(apply);
    observer.observe(node, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [title]);
}

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();
  const copy = navigationCopy[locale];
  return (
    <div className="wa-lang" role="group" aria-label={copy.language}>
      <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>{copy.english}</button>
      <button type="button" aria-pressed={locale === "es"} onClick={() => setLocale("es")}>{copy.spanish}</button>
    </div>
  );
}
