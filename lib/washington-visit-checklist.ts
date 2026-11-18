export const visitChecklistPrintCss = `
.print-only { display: none; }
@media print {
  @page { margin: 0.6in; }
  html, body, main { background: #fff !important; height: auto !important; }
  main { min-height: 0 !important; }
  .print-omit, .no-print { display: none !important; }
  .print-only { display: block !important; }
  #visit-sheet { position: static !important; width: auto !important; max-width: 100% !important; margin: 0 !important; break-inside: avoid; border: 0 !important; box-shadow: none !important; background: #fff !important; color: #000 !important; }
  #visit-sheet a { color: #000 !important; }
}
`;

type ChecklistScrollState = {
  loading: boolean;
  hasFacility: boolean;
  hash: string;
};

type ChecklistHeading = {
  scrollIntoView(options: { block: "start" }): void;
};

export function scrollToVisitChecklist(
  state: ChecklistScrollState,
  doc: { getElementById(id: string): ChecklistHeading | null },
  scrollToTop: () => void,
): "checklist" | "top" | "unchanged" {
  if (state.loading || state.hash !== "#visit-heading") return "unchanged";
  if (!state.hasFacility) {
    scrollToTop();
    return "top";
  }
  const heading = doc.getElementById("visit-heading");
  if (!heading) {
    scrollToTop();
    return "top";
  }
  heading.scrollIntoView({ block: "start" });
  return "checklist";
}
