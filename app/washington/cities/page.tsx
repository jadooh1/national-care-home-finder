import {
  loadWashingtonCityMarketSummaries,
  washingtonPublicRestConfig,
} from "../../../lib/washington-public-roster";
import WashingtonCitiesClient from "./washington-cities-client";

export const dynamic = "force-dynamic";

export default async function WashingtonCitiesPage() {
  const result = await loadWashingtonCityMarketSummaries(washingtonPublicRestConfig());
  return (
    <WashingtonCitiesClient
      initialRows={result.ok ? result.rows : []}
      initialError={!result.ok}
    />
  );
}
