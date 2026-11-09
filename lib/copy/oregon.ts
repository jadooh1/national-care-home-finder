import { localizedOregonCareType, localizedOregonLicenseStatus, type Locale } from "../locale";
import {
  OREGON_BEDS_NOTE,
  OREGON_FRESHNESS_NOTE,
  OREGON_LOCATION_NOTE,
  OREGON_ZERO_BED_NOTE,
} from "../oregon-public-directory";

type OregonCopy = {
  pageTitle: string;
  brand: string;
  allStates: string;
  eyebrow: string;
  heading: string;
  intro: string;
  bedsNote: string;
  zeroBedNote: string;
  locationNote: string;
  freshnessNote: string;
  facilityName: string;
  city: string;
  county: string;
  loadingDirectory: string;
  previous: string;
  next: string;
  withheld: string;
  directoryUnavailable: string;
  noFurther: string;
  noMatch: string;
  resultCount: (total: number) => string;
  countyLine: (name: string) => string;
  careType: (licenseType: string) => string;
  summaryLine: (licenseType: string, status: string, beds: number) => string;
  directoryProfile: string;
  officialProfile: string;
  backToDirectory: string;
  loadingProfile: string;
  profileUnavailable: string;
  missing: string;
  profileEyebrow: string;
  licenseStatus: (status: string) => string;
  licensedBeds: (beds: number) => string;
};

function spanishBeds(beds: number): string {
  return beds === 1 ? `${beds} cama licenciada` : `${beds} camas licenciadas`;
}

export const copy: Record<Locale, OregonCopy> = {
  en: {
    pageTitle: "Oregon adult foster homes",
    brand: "National Care Home Finder",
    allStates: "← All states",
    eyebrow: "OREGON DIRECTORY",
    heading: "Oregon adult foster homes",
    intro: "These are Oregon adult foster homes. They are not Washington adult family homes.",
    bedsNote: OREGON_BEDS_NOTE,
    zeroBedNote: OREGON_ZERO_BED_NOTE,
    locationNote: OREGON_LOCATION_NOTE,
    freshnessNote: OREGON_FRESHNESS_NOTE,
    facilityName: "Facility name",
    city: "City",
    county: "County",
    loadingDirectory: "Loading Oregon adult foster homes…",
    previous: "Previous",
    next: "Next",
    withheld: "Oregon adult foster homes are not published in this directory.",
    directoryUnavailable: "The Oregon directory cannot be loaded.",
    noFurther: "No further Oregon adult foster homes match these filters.",
    noMatch: "No Oregon adult foster homes match these filters.",
    resultCount(total) {
      return `${total.toLocaleString()} Oregon adult foster homes`;
    },
    countyLine(name) {
      return `${name} County`;
    },
    careType(licenseType) {
      return localizedOregonCareType("en", licenseType);
    },
    summaryLine(licenseType, status, beds) {
      return `${localizedOregonCareType("en", licenseType)} · License status: ${localizedOregonLicenseStatus("en", status)} · ${beds} licensed beds`;
    },
    directoryProfile: "Directory profile",
    officialProfile: "Official ODHS profile",
    backToDirectory: "← Oregon directory",
    loadingProfile: "Loading this Oregon adult foster home…",
    profileUnavailable: "This Oregon adult foster home cannot be loaded.",
    missing: "This Oregon adult foster home is not in the directory.",
    profileEyebrow: "OREGON ADULT FOSTER HOME",
    licenseStatus(status) {
      return `License status: ${localizedOregonLicenseStatus("en", status)}`;
    },
    licensedBeds(beds) {
      return `${beds} licensed beds`;
    },
  },
  es: {
    pageTitle: "Hogares de acogida para adultos de Oregon",
    brand: "National Care Home Finder",
    allStates: "← Todos los estados",
    eyebrow: "DIRECTORIO DE OREGON",
    heading: "Hogares de acogida para adultos de Oregon",
    intro: "Estos son hogares de acogida para adultos de Oregon. No son hogares familiares para adultos de Washington.",
    bedsNote: "Las camas licenciadas son el tamaño autorizado del hogar, de 1 a 5. No son vacantes.",
    zeroBedNote: "Quedan fuera de este directorio 20 hogares de acogida para adultos de Oregon abiertos registrados con 0 camas licenciadas.",
    locationNote: "Este directorio no tiene dirección ni ubicación en el mapa. El perfil oficial de ODHS es donde se confirma la ubicación.",
    freshnessNote: "Estos listados provienen de una exportación de proveedores de ODHS. Este directorio no es una verificación en vivo de vacantes ni de licencias.",
    facilityName: "Nombre del establecimiento",
    city: "Ciudad",
    county: "Condado",
    loadingDirectory: "Cargando hogares de acogida para adultos de Oregon…",
    previous: "Anterior",
    next: "Siguiente",
    withheld: "Los hogares de acogida para adultos de Oregon no están publicados en este directorio.",
    directoryUnavailable: "No se puede cargar el directorio de Oregon.",
    noFurther: "No hay más hogares de acogida para adultos de Oregon que coincidan con estos filtros.",
    noMatch: "Ningún hogar de acogida para adultos de Oregon coincide con estos filtros.",
    resultCount(total) {
      return `${total.toLocaleString("es")} hogares de acogida para adultos de Oregon`;
    },
    countyLine(name) {
      return `Condado de ${name}`;
    },
    careType(licenseType) {
      return localizedOregonCareType("es", licenseType);
    },
    summaryLine(licenseType, status, beds) {
      return `${localizedOregonCareType("es", licenseType)} · Estado de la licencia: ${localizedOregonLicenseStatus("es", status)} · ${spanishBeds(beds)}`;
    },
    directoryProfile: "Perfil del directorio",
    officialProfile: "Perfil oficial de ODHS",
    backToDirectory: "← Directorio de Oregon",
    loadingProfile: "Cargando este hogar de acogida para adultos de Oregon…",
    profileUnavailable: "No se puede cargar este hogar de acogida para adultos de Oregon.",
    missing: "Este hogar de acogida para adultos de Oregon no está en el directorio.",
    profileEyebrow: "HOGAR DE ACOGIDA PARA ADULTOS DE OREGON",
    licenseStatus(status) {
      return `Estado de la licencia: ${localizedOregonLicenseStatus("es", status)}`;
    },
    licensedBeds(beds) {
      return spanishBeds(beds);
    },
  },
};
