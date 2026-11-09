import type { Locale } from "../locale";
import { HOMEPAGE_DIRECTORY_NOTE } from "../family-journey";
import { OREGON_PUBLIC_HOMEPAGE_NOTE } from "../oregon-public-directory";

type HomeCopy = {
  pageTitle: string;
  eyebrow: string;
  heading: string;
  lead: string;
  facilityLabel: string;
  facilityPlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  searchButton: string;
  exploreCare: string;
  helpingHeading: string;
  cards: readonly { title: string; text: string }[];
  statesHeading: string;
  statesLead: string;
  searchStatesLabel: string;
  searchStatesPlaceholder: string;
  noteWithoutOregon: string;
  noteWithOregon: string;
  brand: string;
  footerLead: string;
  footerDisclaimer: string;
};

export const copy: Record<Locale, HomeCopy> = {
  en: {
    pageTitle: "National Care Home Finder",
    eyebrow: "RESIDENTIAL CARE DIRECTORY",
    heading: "Find the right care home for your loved one.",
    lead: "Explore residential care options across the United States. Understand care types, discover official licensing resources, and make informed decisions.",
    facilityLabel: "Facility name, ZIP, or license",
    facilityPlaceholder: "e.g. 759392",
    cityLabel: "City",
    cityPlaceholder: "e.g. Puyallup",
    searchButton: "Search Washington homes",
    exploreCare: "Explore Care Options",
    helpingHeading: "Helping families make informed care decisions",
    cards: [
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
    ],
    statesHeading: "Explore care options by state",
    statesLead: "Select a state to begin exploring residential care options and official licensing resources.",
    searchStatesLabel: "Search states",
    searchStatesPlaceholder: "Search for a state...",
    noteWithoutOregon: HOMEPAGE_DIRECTORY_NOTE,
    noteWithOregon: OREGON_PUBLIC_HOMEPAGE_NOTE,
    brand: "National Care Home Finder",
    footerLead: "Helping families explore residential care options across America.",
    footerDisclaimer: "Independent informational directory. Verify all facility details with official state sources.",
  },
  es: {
    pageTitle: "Buscador Nacional de Hogares de Cuidado",
    eyebrow: "DIRECTORIO DE CUIDADO RESIDENCIAL",
    heading: "Encuentre el hogar de cuidado adecuado para su ser querido.",
    lead: "Explore opciones de cuidado residencial en los Estados Unidos. Comprenda los tipos de cuidado, descubra recursos oficiales de licencias y tome decisiones informadas.",
    facilityLabel: "Nombre del establecimiento, ZIP o licencia",
    facilityPlaceholder: "p. ej. 759392",
    cityLabel: "Ciudad",
    cityPlaceholder: "p. ej. Puyallup",
    searchButton: "Buscar hogares de Washington",
    exploreCare: "Explorar opciones de cuidado",
    helpingHeading: "Ayudamos a las familias a tomar decisiones de cuidado informadas",
    cards: [
      {
        title: "Explorar tipos de cuidado",
        text: "Infórmese sobre hogares de cuidado residencial, vida asistida y otros entornos de cuidado específicos de cada estado.",
      },
      {
        title: "Recursos oficiales",
        text: "Use la información estatal de licencias y regulación para apoyar su investigación.",
      },
      {
        title: "Compare sus opciones",
        text: "Prepare preguntas sobre servicios, costos, personal y necesidades individuales de cuidado.",
      },
    ],
    statesHeading: "Explore opciones de cuidado por estado",
    statesLead: "Seleccione un estado para comenzar a explorar opciones de cuidado residencial y recursos oficiales de licencias.",
    searchStatesLabel: "Buscar estados",
    searchStatesPlaceholder: "Buscar un estado...",
    noteWithoutOregon: "Los nombres, las direcciones y los números de licencia de los hogares familiares para adultos de Washington se pueden abrir desde el enlace de Washington. No se muestran vacantes, precios ni la situación vigente de la licencia. Los nombres de los demás estados son solo etiquetas.",
    noteWithOregon: "Los nombres, las direcciones y los números de licencia de los hogares familiares para adultos de Washington se pueden abrir desde el enlace de Washington. Los nombres, las ciudades y los condados de los hogares de acogida para adultos de Oregon se pueden abrir desde el enlace de Oregon. Los listados de Oregon no incluyen direcciones ni números de licencia. Las camas licenciadas no son vacantes. Quedan fuera 20 hogares de acogida para adultos de Oregon abiertos registrados con 0 camas licenciadas. No se muestran vacantes, precios ni la situación vigente de la licencia. Los nombres de los demás estados son solo etiquetas.",
    brand: "National Care Home Finder",
    footerLead: "Ayudamos a las familias a explorar opciones de cuidado residencial en toda América.",
    footerDisclaimer: "Directorio informativo independiente. Verifique todos los datos del establecimiento con las fuentes oficiales del estado.",
  },
};
