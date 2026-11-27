import {
  loadWashingtonCountyMarketSummaries,
  washingtonPublicRestConfig,
} from "../../../lib/washington-public-roster";
import WashingtonCountiesClient from "./washington-counties-client";

export const dynamic = "force-dynamic";

export default async function WashingtonCountiesPage() {
  const result = await loadWashingtonCountyMarketSummaries(washingtonPublicRestConfig());
  return (
    <WashingtonCountiesClient
      initialRows={result.ok ? result.rows : []}
      initialError={!result.ok}
    />
  );
}
