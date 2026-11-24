import { redirect } from "next/navigation";

/**
 * Tier 2 map is publicly authorized at /california/map.
 * Keep this development path from exposing a separate surface.
 */
export const dynamic = "force-dynamic";

export default function CaliforniaDevelopmentMapRedirectPage() {
  redirect("/california/map");
}
