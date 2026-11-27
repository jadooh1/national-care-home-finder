import {
  washingtonCountySearchText,
  washingtonDirectoryPage,
  washingtonSearchText,
} from "../../lib/family-journey";
import {
  loadWashingtonDirectorySlice,
  washingtonPublicRestConfig,
} from "../../lib/washington-public-roster";
import WashingtonDirectoryClient from "./washington-directory-client";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    city?: string;
    county?: string;
    page?: string;
  }>;
};

export default async function WashingtonDirectoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = washingtonSearchText(params.q);
  const city = washingtonSearchText(params.city);
  const county = washingtonCountySearchText(params.county);
  const page = washingtonDirectoryPage(params.page);
  const slice = await loadWashingtonDirectorySlice({
    q: search,
    city,
    county,
    page,
    config: washingtonPublicRestConfig(),
  });

  return (
    <WashingtonDirectoryClient
      initialSearch={search}
      initialCity={city}
      initialCounty={county}
      initialPage={page}
      initialFacilities={slice.ok ? slice.facilities : []}
      initialTotal={slice.ok ? slice.total : 0}
      initialError={!slice.ok}
    />
  );
}
