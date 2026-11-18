const LICENSE = /^\d{1,20}$/;

export const CLAIM_LICENSE_STORAGE_KEY = "nchf-owner-claim-license";

export type ClaimStatusKind = "pending" | "approved" | "rejected";

type ClaimLike = {
  facility_id: string;
  verification_status: string;
};

type ClaimLicenseStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function claimLicenseQuery(value: string | null | undefined): string | null {
  if (!value || !LICENSE.test(value)) return null;
  return value;
}

export function ownerClaimHref(license: string | null | undefined): string {
  const valid = claimLicenseQuery(license);
  return valid ? `/owner/dashboard?license=${valid}` : "/owner/dashboard";
}

export function ownerSignInHref(license: string | null | undefined): string {
  const valid = claimLicenseQuery(license);
  return valid ? `/owner?license=${valid}` : "/owner";
}

export function claimStatusKind(status: string): ClaimStatusKind | null {
  if (status === "pending" || status === "approved" || status === "rejected") return status;
  return null;
}

export function duplicateClaimBlocks(claims: readonly ClaimLike[], facilityId: string): boolean {
  return claims.some(claim => claim.facility_id === facilityId && claim.verification_status !== "rejected");
}

export function writeClaimLicense(storage: ClaimLicenseStorage, license: string | null | undefined): void {
  const valid = claimLicenseQuery(license);
  if (valid) storage.setItem(CLAIM_LICENSE_STORAGE_KEY, valid);
  else storage.removeItem(CLAIM_LICENSE_STORAGE_KEY);
}

export function readClaimLicense(storage: Pick<ClaimLicenseStorage, "getItem">): string | null {
  return claimLicenseQuery(storage.getItem(CLAIM_LICENSE_STORAGE_KEY));
}

export function browserClaimStorage(): ClaimLicenseStorage | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}
