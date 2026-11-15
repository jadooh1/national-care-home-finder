"use client";

import type { WashingtonShortlistItem } from "../lib/washington-shortlist";

type Props = { items: readonly WashingtonShortlistItem[]; locale: "en" | "es" };

const labels = {
  en: {
    button: "Print comparison summary", title: "Washington adult family home comparison",
    intro: "Selected homes from National Care Home Finder. This is a planning worksheet, not a recommendation or proof of current licensing.",
    name: "Home", address: "Address", license: "License number", capacity: "Recorded licensed capacity",
    status: "Directory verification status", verified: "Independently verified listing",
    unverified: "DSHS license-number match — not independently verified",
    missing: "Not available", note: "Confirm directly with each home and Washington DSHS: current license standing, vacancies, pricing, services, staffing, and suitability. Recorded licensed capacity is not vacancy availability.",
    source: "Source: National Care Home Finder Washington directory; official records may have changed.",
  },
  es: {
    button: "Imprimir resumen comparativo", title: "Comparación de hogares AFH de Washington",
    intro: "Hogares seleccionados de National Care Home Finder. Esta hoja es informativa; no constituye una recomendación ni confirma la licencia actual.",
    name: "Hogar", address: "Dirección", license: "Número de licencia", capacity: "Capacidad licenciada registrada",
    status: "Estado de verificación del directorio", verified: "Listado verificado de forma independiente",
    unverified: "Coincidencia del número de licencia de DSHS — no verificado de forma independiente",
    missing: "No disponible", note: "Confirme directamente con cada hogar y con DSHS de Washington: licencia actual, vacantes, precios, servicios, personal e idoneidad. La capacidad registrada no indica vacantes disponibles.",
    source: "Fuente: directorio de Washington de National Care Home Finder; los registros oficiales pueden haber cambiado.",
  },
};

export function WashingtonPrintComparison({ items, locale }: Props) {
  if (!items.length) return null;
  const t = labels[locale];
  return (
    <>
      <button type="button" className="nchf-print-trigger" onClick={() => window.print()}
        style={{ background: "#176b53", color: "white", border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
        {t.button}
      </button>
      <section className="nchf-print-sheet" aria-label={t.title}>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
        <table>
          <thead><tr><th scope="col">{t.name}</th><th scope="col">{t.address}</th><th scope="col">{t.license}</th><th scope="col">{t.capacity}</th><th scope="col">{t.status}</th></tr></thead>
          <tbody>{items.map(item => (
            <tr key={item.license}>
              <th scope="row">{item.name}</th>
              <td>{[item.addressLine, item.city, item.stateCode, item.postalCode].filter(Boolean).join(", ") || t.missing}</td>
              <td>{item.license}</td>
              <td>{item.licensedCapacity ?? t.missing}</td>
              <td>{item.recordStatus === "verified" ? t.verified : t.unverified}</td>
            </tr>
          ))}</tbody>
        </table>
        <p><strong>{t.note}</strong></p>
        <p>{t.source}</p>
      </section>
      <style jsx global>{`
        .nchf-print-sheet { display: none; }
        @media print {
          body * { visibility: hidden !important; }
          .nchf-print-sheet, .nchf-print-sheet * { visibility: visible !important; }
          .nchf-print-sheet { display: block !important; position: absolute; top: 0; left: 0; width: 100%; padding: 0; color: #111; font: 11pt Arial, sans-serif; }
          .nchf-print-sheet h1 { font-size: 18pt; }
          .nchf-print-sheet table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .nchf-print-sheet th, .nchf-print-sheet td { border: 1px solid #555; padding: 8px; overflow-wrap: anywhere; text-align: left; vertical-align: top; }
          .nchf-print-sheet tr { break-inside: avoid; }
          @page { size: landscape; margin: 12mm; }
        }
      `}</style>
    </>
  );
}
