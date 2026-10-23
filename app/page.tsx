"use client";

import { useMemo, useState } from "react";

const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California",
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin",
  "Wyoming",
];

export default function Home() {
  const [search, setSearch] = useState("");

  const filteredStates = useMemo(
    () =>
      states.filter((state) =>
        state.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [search]
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f9fc",
        color: "#17324d",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "22px 6%",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <strong style={{ fontSize: 22 }}>
            National Care Home Finder
          </strong>
          <a href="#states" style={{ color: "#176b53" }}>
            Explore by State
          </a>
        </div>
      </header>

      <section
        style={{
          background: "linear-gradient(135deg, #123c59, #176b53)",
          color: "white",
          padding: "85px 7%",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 850, margin: "auto" }}>
          <p style={{ fontWeight: 700, letterSpacing: 2 }}>
            RESIDENTIAL CARE DIRECTORY
          </p>
          <h1
            style={{
              fontSize: "clamp(34px, 5vw, 58px)",
              lineHeight: 1.15,
              margin: "22px 0",
            }}
          >
            Find the right care home for your loved one.
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.7 }}>
            Explore residential care options across the United
            States. Understand care types, discover official
            licensing resources, and make informed decisions.
          </p>
          <a
            href="#states"
            style={{
              display: "inline-block",
              background: "#ffffff",
              color: "#123c59",
              padding: "15px 26px",
              borderRadius: 9,
              marginTop: 25,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Explore Care Options
          </a>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1150,
          margin: "auto",
          padding: "65px 7%",
        }}
      >
        <h2 style={{ fontSize: 30, textAlign: "center" }}>
          Helping families make informed care decisions
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 20,
            marginTop: 35,
          }}
        >
          {[
            {
              title: "Explore Care Types",
              text: "Learn about residential care homes, assisted living, and other state-specific care settings.",
            },
            {
              title: "Official Resources",
              text: "Use state licensing and regulatory information to support your research.",
            },
            {
              title: "Compare Your Options",
              text: "Prepare questions about services, costs, staffing, and individual care needs.",
            },
          ].map((item) => (
            <article
              key={item.title}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 25,
              }}
            >
              <h3 style={{ fontSize: 21 }}>{item.title}</h3>
              <p style={{ lineHeight: 1.7, color: "#526776" }}>
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="states"
        style={{
          background: "#ffffff",
          padding: "65px 7%",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <div style={{ maxWidth: 1150, margin: "auto" }}>
          <h2 style={{ fontSize: 32 }}>
            Explore care options by state
          </h2>
          <p style={{ color: "#526776", lineHeight: 1.7 }}>
            Select a state to begin exploring residential care
            options and official licensing resources.
          </p>

          <input
            type="search"
            aria-label="Search states"
            placeholder="Search for a state..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: "100%",
              maxWidth: 480,
              padding: 16,
              border: "1px solid #cbd5e1",
              borderRadius: 9,
              fontSize: 16,
              margin: "20px 0 30px",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 13,
            }}
          >
            {filteredStates.map((state) => (
              <div
                key={state}
                style={{
                  background: "#f7f9fc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 9,
                  padding: "16px 18px",
                  fontWeight: 600,
                }}
              >
                {state}
              </div>
            ))}
          </div>

          {filteredStates.length === 0 && (
            <p>No matching states found.</p>
          )}

          <p
            style={{
              color: "#64748b",
              marginTop: 30,
              lineHeight: 1.7,
            }}
          >
            State-specific listings and official source links
            are being prepared. Facility availability,
            licensing status, and prices are not yet displayed.
          </p>
        </div>
      </section>

      <footer
        style={{
          background: "#123c59",
          color: "white",
          textAlign: "center",
          padding: "30px 7%",
          lineHeight: 1.8,
        }}
      >
        <strong>National Care Home Finder</strong>
        <p>
          Helping families explore residential care options
          across America.
        </p>
        <small>
          Independent informational directory. Verify all
          facility details with official state sources.
        </small>
      </footer>
    </main>
  );
}
