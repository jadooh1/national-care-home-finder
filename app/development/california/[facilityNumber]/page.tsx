import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE,
  californiaTier1DevListingPath,
  californiaTier1DevLookupFacility,
} from "../../../../lib/california-tier1-dev-directory";

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

export default async function CaliforniaTier1DevFacilityDetailPage({
  params,
}: PageProps) {
  const { facilityNumber } = await params;
  const lookup = californiaTier1DevLookupFacility(facilityNumber);

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
              href={californiaTier1DevListingPath()}
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
            Development fixtures only ({CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE.fixtureCount}{" "}
            records). Residual exclusions, invalid identifiers, and IDs outside the
            fixture set never resolve. This is not a public California directory.
          </p>
        </div>
      </main>
    );
  }

  const facility = lookup.facility;

  // Defense in depth: never render a public /california path.
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
              href={californiaTier1DevListingPath()}
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
            {facility.leadingZero ? " (leading zero preserved)" : ""}. Development
            fixture only — not a public California listing.
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
          <dl
            style={{
              display: "grid",
              gap: 12,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
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
              <dt style={{ color: C.muted, fontSize: 13 }}>CDSS status</dt>
              <dd style={{ margin: "2px 0 0" }}>{facility.apiStatus}</dd>
            </div>
            <div>
              <dt style={{ color: C.muted, fontSize: 13 }}>
                License first date
              </dt>
              <dd style={{ margin: "2px 0 0" }}>
                {facility.licenseFirstDate ?? "—"}
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
                Pending Increase
              </dt>
              <dd style={{ margin: "2px 0 0" }}>
                {facility.pendingIncrease
                  ? "Yes — status is informational; eligibility mapping remains inactive; proposed increase is not shown as capacity."
                  : "No"}
              </dd>
            </div>
            <div>
              <dt style={{ color: C.muted, fontSize: 13 }}>Source as-of</dt>
              <dd style={{ margin: "2px 0 0" }}>{facility.sourceAsOfIso}</dd>
            </div>
          </dl>
          <p style={{ color: C.muted, marginTop: 16, marginBottom: 0, lineHeight: 1.6 }}>
            {facility.fixtureNote}
          </p>
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
