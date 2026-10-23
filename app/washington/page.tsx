"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Facility = {
  id: string;
  canonical_name: string;
  address_line1: string | null;
  city: string | null;
  state_code: string;
  postal_code: string | null;
  license_number: string | null;
};

export default function WashingtonPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFacilities() {
      const { data, error } = await supabase
        .from("facilities")
        .select(
          "id,canonical_name,address_line1,city,state_code,postal_code,license_number"
        )
        .eq("state_code", "WA")
        .eq("facility_type", "AF")
        .eq("record_status", "verified")
        .order("canonical_name")
        .limit(100);

      if (error) {
        setError("Unable to load facility listings.");
      } else {
        setFacilities(data ?? []);
      }

      setLoading(false);
    }

    loadFacilities();
  }, []);

  const filteredFacilities = facilities.filter((facility) => {
    const text = [
      facility.canonical_name,
      facility.city,
      facility.postal_code,
      facility.license_number,
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase().trim());
  });

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <Link href="/">← Back to Home</Link>

      <h1>Washington Adult Family Homes</h1>

      <p>
        Search verified Adult Family Home listings in Washington.
        Facility licensing information should be confirmed with
        Washington State DSHS before making care decisions.
      </p>

      <input
        type="search"
        placeholder="Search by facility name, city, ZIP or license number"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{
          width: "100%",
          padding: 12,
          marginTop: 20,
          marginBottom: 20,
          border: "1px solid #ccc",
          borderRadius: 8,
        }}
      />

      {loading && <p>Loading facilities...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && filteredFacilities.length === 0 && (
        <p>
          No verified facilities are available for this search yet.
          Listings will appear after their records have been verified.
        </p>
      )}

      {filteredFacilities.map((facility) => (
        <article
          key={facility.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <h2>{facility.canonical_name}</h2>

          <p>
            {facility.address_line1}
            {facility.city ? `, ${facility.city}` : ""}
            {` ${facility.state_code}`}
            {facility.postal_code ? ` ${facility.postal_code}` : ""}
          </p>

          <p>License number: {facility.license_number ?? "Not available"}</p>
          <p>Listing status: Verified</p>
        </article>
      ))}
    </main>
  );
}
