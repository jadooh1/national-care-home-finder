export const LANGUAGE_COOKIE = "nchf-language";
export const LANGUAGE_STORAGE_KEY = "nchf-language";

export type Locale = "en" | "es";

export function parseLocale(value: string | null | undefined): Locale {
  return value === "es" ? "es" : "en";
}

export const navigationCopy: Record<Locale, {
  language: string;
  english: string;
  spanish: string;
  summary: string;
  navLabel: string;
  directory: string;
  map: string;
  cities: string;
  counties: string;
  aging: string;
  market: string;
}> = {
  en: {
    language: "Language",
    english: "English",
    spanish: "Español",
    summary: "Washington",
    navLabel: "Washington",
    directory: "Directory",
    map: "Map",
    cities: "Cities",
    counties: "Counties",
    aging: "Aging",
    market: "Market",
  },
  es: {
    language: "Idioma",
    english: "English",
    spanish: "Español",
    summary: "Washington",
    navLabel: "Washington",
    directory: "Directorio",
    map: "Mapa",
    cities: "Ciudades",
    counties: "Condados",
    aging: "Envejecimiento",
    market: "Mercado",
  },
};

export function localizedStateStatus(locale: Locale, matchCount: number): string {
  if (matchCount !== 0) return "";
  return locale === "es" ? "No se encontraron estados coincidentes." : "No matching states found.";
}

export function localizedMapSummary(locale: Locale, input: { zip: string; loading: boolean; error: string; count: number }): string {
  const number = input.count.toLocaleString(locale === "es" ? "es" : "en");
  if (locale === "es") {
    if (input.loading) return `ZIP ${input.zip} — Cargando hogares…`;
    if (input.error) return `ZIP ${input.zip} — Datos no disponibles`;
    return `ZIP ${input.zip} — ${number} hogares AFH en el mapa`;
  }
  if (input.loading) return `ZIP ${input.zip} — Loading facilities…`;
  if (input.error) return `ZIP ${input.zip} — Data unavailable`;
  return `ZIP ${input.zip} — ${number} mapped AFHs`;
}

export function localizedInvalidZip(locale: Locale, currentZip: string): string {
  if (locale === "es") return `Ingrese un código ZIP de cinco dígitos. El mapa sigue mostrando el ZIP ${currentZip}.`;
  return `Enter a five-digit ZIP code. The map is still showing ZIP ${currentZip}.`;
}

export function localizedOregonCareType(locale: Locale, value: string): string {
  if (locale === "es" && value === "Oregon adult foster home") return "Hogar de acogida para adultos de Oregon";
  return value;
}

export function localizedOregonLicenseStatus(locale: Locale, value: string): string {
  if (locale === "es" && value === "Open") return "Abierta";
  return value;
}

export function localizedPasswordProblem(locale: Locale, password: string, confirmation: string): string | null {
  let english: string | null = null;
  if (password.length < 12 || password.length > 72) english = "Use 12 to 72 characters.";
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) english = "Use at least one letter and one number.";
  else if (password !== confirmation) english = "Those passwords do not match.";
  if (!english || locale === "en") return english;
  if (english === "Use 12 to 72 characters.") return "Use de 12 a 72 caracteres.";
  if (english === "Use at least one letter and one number.") return "Use al menos una letra y un número.";
  return "Las contraseñas no coinciden.";
}
