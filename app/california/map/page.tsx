import { notFound } from "next/navigation";

/**
 * Public California map is not authorized on this release candidate.
 * Explicit route so `/california/map` is not captured by `[facilityNumber]`
 * as a soft "Facility not available" 200.
 */
export const dynamic = "force-dynamic";

export default function CaliforniaPublicMapUnauthorizedPage() {
  notFound();
}
