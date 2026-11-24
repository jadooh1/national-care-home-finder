import Link from "next/link";
import { notFound } from "next/navigation";
import {
  californiaTier1FullRosterListingPath,
  californiaTier1FullRosterLookup,
  loadCaliforniaTier1FullRosterManifest,
} from "../../../../lib/california-tier1-full-roster";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

type PageProps = {
  params: Promise<{ facilityNumber: string }>;
};

export default async function CaliforniaTier1FullRosterFacilityDetailPage({
  params,
}: PageProps) {
  const { facilityNumber } = await params;
  const lookup = californiaTier1FullRosterLookup(facilityNumber);
  const manifest = loadCaliforniaTier1FullRosterManifest();

  if (!lookup.ok) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: C.pale,
          color: C.navy,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <header
          style={{
            background: "#fff",
            borderBottom: `1px solid ${C.border}`,
            padding: "16px 5%",
          }}
        >
          <div
            style={{
              maxWidth: 900,
              margin: "auto",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
            <Link
              href={californiaTier1FullRosterListingPath()}
              style={{ color: C.teal, fontWeight: 600 }}
            >
              ← California development directory
            </Link>
          </div>
        </header>

        <section
          style={{
            background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`,
            color: "white",
            padding: "clamp(28px, 6vw, 48px) 5%",
          }}
        >
          <div style={{ maxWidth: 900, margin: "auto" }}>
            <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>
              UNPUBLISHED DEVELOPMENT REVIEW
            </p>
            <h1
              style={{
                fontSize: "clamp(26px, 5vw, 40px)",
                lineHeight: 1.14,
                margin: "12px 0",
              }}
            >
              Facility not available
            </h1>
            <p style={{ maxWidth: 720, lineHeight: 1.7, opacity: 0.95 }}>
              Requested identifier {facilityNumber || "(empty)"} cannot be shown.
              California remains unpublished. Fail closed.
            </p>
          </div>
        </section>

        <div style={{ maxWidth: 900, margin: "auto", padding: "28px 5% 60px" }}>
          <section
            role="alert"
            style={{
              background: "#fdecec",
              border: "1px solid #f0b4b4",
              borderRadius: 12,
              padding: 18,
              color: "#8b1e1e",
            }}
          >
            <strong>Blocked.</strong> Reasons: {lookup.reasons.join(", ")}.
          </section>
          <p style={{ color: C.muted, marginTop: 18, lineHeight: 1.6 }}>
            Development roster only ({manifest.listableCount.toLocaleString()}{" "}
            listable as-of {manifest.sourceAsOfIso}). Residual exclusions,
            invalid identifiers, and IDs outside the listable roster never
            resolve. This is not a public California directory.
          </p>
        </div>
      </main>
    );
  }

  const facility = lookup.facility;
  if (!facility.facilityNumber || facility.facilityNumber.includes("/")) {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.pale,
        color: C.navy,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "#fff",
          borderBottom: `1px solid ${C.border}`,
          padding: "16px 5%",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "auto",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <nav
            aria-label="Development navigation"
            style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
          >
            <Link
              href={californiaTier1FullRosterListingPath()}
              style={{ color: C.teal, fontWeight: 600 }}
            >
              ← California development directory
            </Link>
          </nav>
        </div>
      </header>

      <section
        style={{
          background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`,
          color: "white",
          padding: "clamp(28px, 6vw, 48px) 5%",
        }}
      >
        <div style={{ maxWidth: 900, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>
            UNPUBLISHED DEVELOPMENT REVIEW
          </p>
          <h1
            style={{
              fontSize: "clamp(26px, 5vw, 40px)",
              lineHeight: 1.14,
              margin: "12px 0",
            }}
          >
            {facility.facilityName}
          </h1>
          <p style={{ maxWidth: 720, lineHeight: 1.7, opacity: 0.95 }}>
            License {facility.facilityNumber}
            {facility.leadingZero ? " (leading zero preserved)" : ""}.
            Development roster only — not a public California listing.
          </p>
        </div>
      </section>

      <div
        style={{
          maxWidth: 900,
          margin: "auto",
          padding: "28px 5% 60px",
          display: "grid",
          gap: 18,
        }}
      >
        <section
          role="status"
          style={{
            background: "#fff7e8",
            border: "1px solid #f0d2a0",
            borderRadius: 12,
            padding: 18,
            color: C.warn,
          }}
        >
          <strong>Public California: STOP.</strong> This detail page is
          development-only under /development/california. It does not publish
          California.
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Official facility information</h2>
          <dl style={{ display: "grid", gap: 12, margin: 0, lineHeight: 1.6 }}>
            <div>
              <dt style={{ color: C.muted, fontSize: 13 }}>Facility Number</dt>
              <dd style={{ margin: "2px 0 0", fontWeight: 700 }}>
                {facility.facilityNumber}
              </dd>
            </div>
            <div>
              <dt style={{ color: C.muted, fontSize: 13 }}>Category / type</dt>
              <dd style={{ margin: "2px 0 0" }}>
                {facility.category} · {facility.facilityType}
              </dd>
            </div>
            <div>
              <dt style={{ color: C.muted, fontSize: 13 }}>
                Download status
              </dt>
              <dd style={{ margin: "2px 0 0" }}>{facility.downloadStatus}</dd>
            </div>
            <div>
              <dt style={{ color: C.muted, fontSize: 13 }}>Address</dt>
              <dd style={{ margin: "2px 0 0" }}>
                {[facility.addressLine1, facility.city, facility.postalCode]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt style={{ color: C.muted, fontSize: 13 }}>
                License first date
              </dt>
              <dd style={{ margin: "2px 0 0" }}>
                {facility.licenseFirstDate || "—"}
              </dd>
            </div>
            <div>
              <dt style={{ color: C.muted, fontSize: 13 }}>
                Approved licensed capacity
              </dt>
              <dd style={{ margin: "2px 0 0" }}>
                {facility.approvedLicensedCapacity ?? "—"}
                {facility.pendingIncrease
                  ? " (approved capacity only — not a proposed increase)"
                  : ""}
              </dd>
            </div>
            <div>
              <dt style={{ color: C.muted, fontSize: 13 }}>
                Pending Increase flag
              </dt>
              <dd style={{ margin: "2px 0 0" }}>
                {facility.pendingIncrease
                  ? "Yes — informational only; eligibility mapping remains inactive."
                  : "No"}
              </dd>
            </div>
            <div>
              <dt style={{ color: C.muted, fontSize: 13 }}>Source as-of</dt>
              <dd style={{ margin: "2px 0 0" }}>{facility.sourceAsOfIso}</dd>
            </div>
          </dl>
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Official CDSS facility detail</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Opens the official FacDetail rewrite page in a new tab. No invented
            profile URL.
          </p>
          <a
            href={facility.disclosureUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              minHeight: 44,
              lineHeight: "44px",
              color: C.teal,
              fontWeight: 700,
            }}
          >
            Official CDSS facility detail for {facility.facilityNumber}
          </a>
        </section>
      </div>
    </main>
  );
}
