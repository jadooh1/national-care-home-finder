import type { Locale } from "../locale";

type WashingtonDirectoryCopy = {
  pageTitle: string;
  eyebrow: string;
  heading: string;
  lead: string;
  searchLabel: string;
  findHeading: string;
  nameLabel: string;
  namePlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  countyLabel: string;
  countyPlaceholder: string;
  clearFilters: string;
  officialLocator: string;
  toolsLabel: string;
  mapTitle: string;
  mapText: string;
  agingTitle: string;
  agingText: string;
  countiesTitle: string;
  countiesText: string;
  citiesTitle: string;
  citiesText: string;
  opportunityTitle: string;
  opportunityText: string;
  loadingListings: string;
  unableToDisplay: string;
  noMatches: string;
  showing: (start: number, end: number, total: number) => string;
  loadError: string;
  tryAnother: string;
  homeLabel: string;
  county: (name: string) => string;
  licenseLabel: string;
  notAvailable: string;
  recordedCapacity: (capacity: number) => string;
  verified: string;
  unverified: string;
  viewDetails: string;
  viewMap: string;
  checkDshs: string;
  pagesLabel: string;
  previous: string;
  pageStatus: (page: number, pages: number) => string;
  next: string;
  footer: string;
};

export const copy: Record<Locale, WashingtonDirectoryCopy> = {
  en: {
    pageTitle: "Washington adult family homes",
    eyebrow: "WASHINGTON DIRECTORY",
    heading: "Explore Adult Family Homes",
    lead: "Browse facilities appearing in a Washington DSHS locator download. A license-number match is not independent verification of current standing, vacancies, cost, or suitability.",
    searchLabel: "Search and filter facilities",
    findHeading: "Find care homes",
    nameLabel: "Name, ZIP, or license",
    namePlaceholder: "e.g. 759392",
    cityLabel: "City",
    cityPlaceholder: "e.g. Puyallup",
    countyLabel: "County",
    countyPlaceholder: "e.g. Pierce",
    clearFilters: "Clear filters",
    officialLocator: "Official Washington DSHS locator ↗",
    toolsLabel: "Market intelligence tools",
    mapTitle: "Explore AFH Market Map →",
    mapText: "View care home locations, recorded licensed beds, and neighborhood concentration.",
    agingTitle: "Aging Population Dashboard →",
    agingText: "Compare older-adult population estimates with AFH counts and licensed capacity by ZIP code.",
    countiesTitle: "Compare Counties →",
    countiesText: "Compare Adult Family Home counts, recorded licensed beds, and cities across Washington counties.",
    citiesTitle: "Compare Cities →",
    citiesText: "Explore Adult Family Home counts and recorded licensed beds across Washington cities.",
    opportunityTitle: "Explore Market Opportunities →",
    opportunityText: "Compare senior population, household income, AFH supply, and recorded licensed beds across Washington ZIP codes.",
    loadingListings: "Loading listings…",
    unableToDisplay: "Unable to display listings",
    noMatches: "No matches found",
    showing(start, end, total) {
      return `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()} listings`;
    },
    loadError: "Unable to load listings. Please try again later.",
    tryAnother: "Try another city, county, name, ZIP code, or license number.",
    homeLabel: "Adult family home",
    county(name) {
      return `${name} County`;
    },
    licenseLabel: "License:",
    notAvailable: "Not available",
    recordedCapacity(capacity) {
      return `Recorded capacity: ${capacity}`;
    },
    verified: "Independently verified listing",
    unverified: "DSHS license-number match — not independently verified",
    viewDetails: "View details →",
    viewMap: "View location in Google Maps ↗",
    checkDshs: "Check DSHS ↗",
    pagesLabel: "Listing pages",
    previous: "← Previous",
    pageStatus(page, pages) {
      return `Page ${page} of ${pages}`;
    },
    next: "Next →",
    footer: "Independent informational directory using a DSHS locator list downloaded November 9, 2026. Information may be outdated; confirm current licensing and services directly with Washington DSHS. Listings are not recommendations.",
  },
  es: {
    pageTitle: "Hogares AFH de Washington",
    eyebrow: "DIRECTORIO DE WASHINGTON",
    heading: "Explore hogares AFH",
    lead: "Consulte los establecimientos que aparecen en una descarga del localizador de DSHS de Washington. Una coincidencia del número de licencia no es una verificación independiente de la situación actual, las vacantes, el costo o la idoneidad.",
    searchLabel: "Buscar y filtrar establecimientos",
    findHeading: "Encuentre hogares de cuidado",
    nameLabel: "Nombre, ZIP o licencia",
    namePlaceholder: "p. ej. 759392",
    cityLabel: "Ciudad",
    cityPlaceholder: "p. ej. Puyallup",
    countyLabel: "Condado",
    countyPlaceholder: "p. ej. Pierce",
    clearFilters: "Borrar filtros",
    officialLocator: "Localizador oficial de DSHS de Washington ↗",
    toolsLabel: "Herramientas de inteligencia de mercado",
    mapTitle: "Explore el mapa del mercado de AFH →",
    mapText: "Vea las ubicaciones de los hogares de cuidado, las camas licenciadas registradas y la concentración del vecindario.",
    agingTitle: "Panel de envejecimiento de la población →",
    agingText: "Compare las estimaciones de población de adultos mayores con los conteos de hogares AFH y la capacidad licenciada por código ZIP.",
    countiesTitle: "Compare condados →",
    countiesText: "Compare los conteos de hogares AFH, las camas licenciadas registradas y las ciudades en los condados de Washington.",
    citiesTitle: "Compare ciudades →",
    citiesText: "Explore los conteos de hogares AFH y las camas licenciadas registradas en las ciudades de Washington.",
    opportunityTitle: "Explore oportunidades de mercado →",
    opportunityText: "Compare la población de personas mayores, el ingreso de los hogares, la oferta de hogares AFH y las camas licenciadas registradas en los códigos ZIP de Washington.",
    loadingListings: "Cargando listados…",
    unableToDisplay: "No se pueden mostrar los listados",
    noMatches: "No se encontraron coincidencias",
    showing(start, end, total) {
      const format = (value: number) => value.toLocaleString("es");
      return `Mostrando ${format(start)}–${format(end)} de ${format(total)} listados`;
    },
    loadError: "No se pueden cargar los listados. Inténtelo de nuevo más tarde.",
    tryAnother: "Pruebe con otra ciudad, otro condado, otro nombre, otro código ZIP u otro número de licencia.",
    homeLabel: "Hogar AFH",
    county(name) {
      return `Condado de ${name}`;
    },
    licenseLabel: "Licencia:",
    notAvailable: "No disponible",
    recordedCapacity(capacity) {
      return `Capacidad registrada: ${capacity}`;
    },
    verified: "Listado verificado de forma independiente",
    unverified: "Coincidencia del número de licencia de DSHS — no verificado de forma independiente",
    viewDetails: "Ver detalles →",
    viewMap: "Ver la ubicación en Google Maps ↗",
    checkDshs: "Consultar DSHS ↗",
    pagesLabel: "Páginas de listados",
    previous: "← Anterior",
    pageStatus(page, pages) {
      return `Página ${page} de ${pages}`;
    },
    next: "Siguiente →",
    footer: "Directorio informativo independiente que usa una lista del localizador de DSHS descargada el November 9, 2026. La información puede estar desactualizada; confirme las licencias y los servicios actuales directamente con el DSHS de Washington. Los listados no son recomendaciones.",
  },
};
