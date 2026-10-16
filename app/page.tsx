const states = [

  "Alabama", "Alaska", "Arizona", "Arkansas", "California",

  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",

  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas",

  "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",

  "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana",

  "Nebraska", "Nevada", "New Hampshire", "New Jersey",

  "New Mexico", "New York", "North Carolina", "North Dakota",

  "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",

  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",

  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin",

  "Wyoming"

];

export default function Home() {

  return (

    <main style={{

      fontFamily: "Arial, sans-serif",

      color: "#18332f",

      background: "#f7faf8",

      minHeight: "100vh"

    }}>

      <header style={{

        padding: "24px 7%",

        background: "white",

        borderBottom: "1px solid #e1e9e5"

      }}>

        <div style={{fontSize: 23, fontWeight: 700}}>

          National Care Home Finder

        </div>

        <p style={{color: "#62736d", marginBottom: 0}}>

          Find residential care options across America

        </p>

      </header>

      <section style={{

        padding: "76px 7% 60px",

        background: "#e8f3ed"

      }}>

        <p style={{

          color: "#28745d",

          fontWeight: 700,

          letterSpacing: 2

        }}>

          CARE SEARCH, MADE CLEARER

        </p>

        <h1 style={{

          fontSize: "clamp(36px, 5vw, 58px)",

          maxWidth: 760,

          lineHeight: 1.1,

          marginBottom: 20

        }}>

          Find the right care home for your family.

        </h1>

        <p style={{

          maxWidth: 650,

          fontSize: 18,

          lineHeight: 1.7,

          color: "#526760"

        }}>

          Explore residential care options, understand care types,

          and find official licensing information to help guide

          your search.

        </p>

        <div style={{

          display: "flex",

          gap: 12,

          flexWrap: "wrap",

          marginTop: 28

        }}>

          <a href="#states" style={{

            background: "#176b53",

            color: "white",

            padding: "15px 22px",

            borderRadius: 8,

            textDecoration: "none",

            fontWeight: 700

          }}>

            Explore by state

          </a>

          <a href="#about" style={{

            border: "1px solid #176b53",

            color: "#176b53",

            padding: "15px 22px",

            borderRadius: 8,

            textDecoration: "none",

            fontWeight: 700

          }}>

            How it works

          </a>

        </div>

      </section>

      <section id="states" style={{padding: "48px 7%"}}>

        <h2 style={{fontSize: 30}}>Explore care options by state</h2>

        <p style={{color: "#62736d", lineHeight: 1.7}}>

          Choose a state to begin exploring its residential care

          categories and official licensing resources.

        </p>

        <div style={{

          display: "grid",

          gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",

          gap: 12,

          marginTop: 24

        }}>

          {states.map((state) => (

            <div key={state} style={{

              background: "white",

              padding: 16,

              border: "1px solid #e1e9e5",

              borderRadius: 8

            }}>

              {state}

            </div>

          ))}

        </div>

        <p style={{

          marginTop: 20,

          color: "#62736d",

          fontSize: 14

        }}>

          State links and verified facility listings are being

          prepared. Listings are not yet available for search.

        </p>

      </section>

      <section id="about" style={{

        padding: "36px 7%",

        background: "white"

      }}>

        <h2>Make informed care decisions</h2>

        <p style={{

          maxWidth: 760,

          color: "#526760",

          lineHeight: 1.8

        }}>

          Our goal is to help families discover care options using

          clearly identified sources. Licensing details, availability,

          prices, and care services will be displayed only when

          supported by reliable information.

        </p>

      </section>

      <footer style={{

        padding: "24px 7%",

        borderTop: "1px solid #e1e9e5",

        color: "#62736d",

        fontSize: 14

      }}>

        © {new Date().getFullYear()} National Care Home Finder.

        Verify licensing and care details with the relevant authority.

      </footer>

    </main>

  );

}
