export const HOMEPAGE_DIRECTORY_NOTE = "Washington adult family home names, addresses, and license numbers can be opened from the Washington link. Vacancies, prices, and current license standing are not displayed. Other state names are labels only.";

export const DENSITY_BANDS = [
  { label: "20+", min: 20, color: "#dc2626" },
  { label: "10–19", min: 10, color: "#f97316" },
  { label: "5–9", min: 5, color: "#eab308" },
  { label: "1–4", min: 1, color: "#16835b" },
] as const;

export function densityColor(neighbors: number): string {
  return DENSITY_BANDS.find(band => neighbors >= band.min)?.color ?? DENSITY_BANDS[DENSITY_BANDS.length - 1].color;
}

export function facilityProfilePath(license: string | null | undefined): string | null {
  const value = license?.trim() ?? "";
  if (!/^\d{1,20}$/.test(value)) return null;
  return `/washington/${value}`;
}

export function stateFilterStatus(matchCount: number): string {
  return matchCount === 0 ? "No matching states found." : "";
}

export function mapResultSummary(input: { zip: string; loading: boolean; error: string; count: number }): string {
  if (input.loading) return `ZIP ${input.zip} — Loading facilities…`;
  if (input.error) return `ZIP ${input.zip} — Data unavailable`;
  return `ZIP ${input.zip} — ${input.count.toLocaleString()} mapped AFHs`;
}

export function invalidZipMessage(currentZip: string): string {
  return `Enter a five-digit ZIP code. The map is still showing ZIP ${currentZip}.`;
}
