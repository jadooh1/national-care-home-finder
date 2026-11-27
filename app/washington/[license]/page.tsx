import { notFound } from "next/navigation";
import { getWashingtonListedFacility } from "../../../lib/washington-public-roster";
import WashingtonFacilityProfileClient from "./washington-facility-profile-client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ license: string }>;
};

export default async function WashingtonFacilityProfilePage({ params }: PageProps) {
  const { license } = await params;
  const lookup = await getWashingtonListedFacility(license);
  if (lookup.status === "invalid" || lookup.status === "missing") notFound();

  return (
    <WashingtonFacilityProfileClient
      license={license.trim()}
      initialFacility={lookup.status === "ok" ? lookup.facility : null}
    />
  );
}
