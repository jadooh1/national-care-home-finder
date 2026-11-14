export const CLAIMED_OWNER_CONTENT_VIEW = "wa_afh_claimed_owner_content";

export function manageableOwnerContentView(supabaseUrl: string): string {
  void supabaseUrl;
  return CLAIMED_OWNER_CONTENT_VIEW;
}

export function publishedContentOutcome(queryFailed: boolean, rowCount: number): "unavailable" | "empty" | "listed" {
  if (queryFailed) return "unavailable";
  return rowCount === 0 ? "empty" : "listed";
}

export function ownerListingRefreshError(input: { publishedFailed: boolean; facilitiesFailed: boolean }): "published" | "facilities" | "" {
  if (input.facilitiesFailed) return "facilities";
  if (input.publishedFailed) return "published";
  return "";
}
