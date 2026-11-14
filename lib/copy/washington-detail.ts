import type { Locale } from "../locale";

type MapCopy = {
  title: string;
  eyebrow: string;
  intro: string;
  zipLabel: string;
  zipPlaceholder: string;
  analyze: string;
  mappedAfhs: string;
  knownBeds: string;
  missingCapacity: (count: number) => string;
  notAvailableBeds: string;
  highDensityHomes: string;
  highDensityDetail: string;
  mapSectionAria: string;
  facilityLocations: string;
  concentration: string;
  locationDots: string;
  mapAria: string;
  densityLead: string;
  locationLegend: string;
  clusterNote: string;
  noneFound: string;
  listAria: string;
  facilitiesInZip: (zip: string) => string;
  licenseLabel: (license: string) => string;
  disclaimer: string;
  unavailable: string;
  tooMany: string;
  notAvailable: string;
  popupCapacity: (value: string) => string;
  popupNearby: (count: number) => string;
  viewProfile: string;
};

type CitiesCopy = {
  title: string;
  eyebrow: string;
  intro: string;
  loading: string;
  unavailable: string;
  totalsAria: string;
  countyCityGroups: string;
  countiesRepresented: string;
  listedAfhs: string;
  recordedBeds: string;
  countySelectionAria: string;
  selectCounty: string;
  allCounties: string;
  countyOption: (name: string) => string;
  countyHelp: string;
  compareAria: string;
  compareTitle: string;
  firstCity: string;
  secondCity: string;
  chooseCity: string;
  indicator: string;
  adultFamilyHomes: string;
  recordedLicensedBeds: string;
  homesWithCapacity: string;
  directoryAria: string;
  listingsTitle: string;
  searchCity: string;
  searchPlaceholder: string;
  sortCities: string;
  sortAfhs: string;
  sortBeds: string;
  sortCity: string;
  showing: (shown: string, total: string) => string;
  colCity: string;
  colCounty: string;
  colAfhs: string;
  colBeds: string;
  colHomes: string;
  colFind: string;
  directoryLink: string;
  source: string;
};

type CountiesCopy = {
  title: string;
  eyebrow: string;
  intro: string;
  loading: string;
  unavailable: string;
  countiesWithAfhs: string;
  listedAfhs: string;
  recordedBeds: string;
  compareTitle: string;
  firstCounty: string;
  secondCounty: string;
  chooseCounty: string;
  countyOption: (name: string) => string;
  indicator: string;
  adultFamilyHomes: string;
  recordedLicensedBeds: string;
  homesWithCapacity: string;
  citiesRepresented: string;
  allTitle: string;
  searchCounty: string;
  searchPlaceholder: string;
  sortCounties: string;
  sortAfhs: string;
  sortBeds: string;
  sortCities: string;
  sortName: string;
  showing: (shown: number, total: number) => string;
  colCounty: string;
  colAfhs: string;
  colBeds: string;
  colHomes: string;
  colCities: string;
  source: string;
  demographicsLink: string;
};

type DemographicsCopy = {
  title: string;
  eyebrow: string;
  intro: string;
  zipLabel: string;
  zipPlaceholder: string;
  analyze: string;
  openMap: string;
  loading: string;
  invalidZip: string;
  unavailable: string;
  incomplete: string;
  noMatch: (zip: string) => string;
  overview: (zip: string) => string;
  totalPopulation: string;
  age6069: string;
  age70plus: string;
  adultFamilyHomes: string;
  knownBeds: string;
  medianIncome: string;
  households100k: string;
  incomeMoe: string;
  notAvailable: string;
  olderAdults: string;
  ages: (label: string) => string;
  source: (period: string) => string;
  interpretingTitle: string;
  interpretingSupply: (afhs: string, beds: string, homes: string) => string;
  interpretingContext: string;
  compareTitle: string;
  sortBy: string;
  sortSenior: string;
  sortAfh: string;
  sortBeds: string;
  colZip: string;
  colResidents: string;
  colAfhs: string;
  colBeds: string;
  colExplore: string;
  analyzeRow: string;
  footer: string;
};

type OpportunityCopy = {
  title: string;
  eyebrow: string;
  intro: string;
  loading: string;
  unavailable: string;
  incomplete: string;
  zipsCovered: string;
  recordedListings: string;
  recordedBeds: string;
  compareTitle: string;
  firstZip: string;
  secondZip: string;
  chooseZip: string;
  firstZipHeader: string;
  secondZipHeader: string;
  indicator: string;
  age70: string;
  age85: string;
  medianIncome: string;
  incomeMoe: string;
  households100k: string;
  notAvailable: string;
  compareNote: string;
  browseTitle: string;
  searchZip: string;
  searchPlaceholder: string;
  sortZips: string;
  sortSenior: string;
  sortIncome: string;
  sortHighIncome: string;
  sortFewest: string;
  sortMost: string;
  sortZip: string;
  showing: (shown: number, total: number) => string;
  colZip: string;
  colAge: string;
  colIncome: string;
  colHighIncome: string;
  colAfhs: string;
  colBeds: string;
  colDetails: string;
  overviewLink: string;
  interpretTitle: string;
  seniorLabel: string;
  seniorBody: string;
  incomeLabel: string;
  incomeBody: string;
  supplyLabel: string;
  supplyBody: string;
  coverageLabel: string;
  coverageBody: (count: string) => string;
  interpretClose: string;
};

type ProfileCopy = {
  title: string;
  loadingTitle: string;
  eyebrow: string;
  intro: string;
  back: string;
  loadingInfo: string;
  unavailable: string;
  retry: string;
  notFoundTitle: string;
  notFoundBody: string;
  searchDirectory: string;
  detailsTitle: string;
  facilityName: string;
  address: string;
  county: string;
  licenseNumber: string;
  recordedCapacity: string;
  notAvailable: string;
  countyValue: (name: string) => string;
  capacityValue: (count: number) => string;
  googleMaps: string;
  dshsSource: string;
  ownerTitle: string;
  ownerNote: string;
  published: {
    description: string;
    services: string;
    amenities: string;
  };
  verifyTitle: string;
  verifyLead: string;
  verifyNot: string;
  verifyTail: string;
  dshsLocator: string;
  disclosure: string;
  questionsTitle: string;
  questions: readonly [string, string, string, string];
  footer: string;
};

export const copy: Record<Locale, {
  map: MapCopy;
  cities: CitiesCopy;
  counties: CountiesCopy;
  demographics: DemographicsCopy;
  opportunity: OpportunityCopy;
  profile: ProfileCopy;
}> = {
  en: {
    map: {
      title: "Adult Family Home Map",
      eyebrow: "WASHINGTON MARKET INTELLIGENCE",
      intro: "Explore care-home locations, recorded licensed capacity and neighborhood-level concentration. These indicators describe supply, not vacancies or proven unmet demand.",
      zipLabel: "Washington ZIP code",
      zipPlaceholder: "e.g. 98056",
      analyze: "Analyze ZIP",
      mappedAfhs: "Mapped AFHs",
      knownBeds: "Known licensed beds",
      missingCapacity: (count) => `${count} home(s) missing capacity`,
      notAvailableBeds: "Not available beds",
      highDensityHomes: "Homes in high-density clusters",
      highDensityDetail: "20+ AFHs within 1 mile",
      mapSectionAria: "Interactive AFH facility map",
      facilityLocations: "Facility locations",
      concentration: "Concentration",
      locationDots: "Location dots",
      mapAria: "Map of care homes; click a dot for the home profile",
      densityLead: "AFHs within 1 mile of each marker:",
      locationLegend: "All dots show facility locations. Click a dot to view licensed capacity and the home profile.",
      clusterNote: "Counts include the selected facility and may include homes just outside the ZIP boundary. This is a preliminary one-mile clustering heuristic, not a population-adjusted density or investment score.",
      noneFound: "No mapped facilities were found for this ZIP code in the current directory.",
      listAria: "Facilities in this ZIP",
      facilitiesInZip: (zip) => `Facilities in ZIP ${zip}`,
      licenseLabel: (license) => `License ${license}`,
      disclaimer: "Facility information is from a Washington DSHS locator download matched to state GIS data. Recorded capacity is not vacancy availability. Map coordinates, licensing information and care suitability should be independently confirmed. This directory does not recommend or certify providers. Base map © OpenStreetMap contributors.",
      unavailable: "Unable to retrieve facility map data. Check access to the wa_afh_map_facilities view.",
      tooMany: "Too many results to display completely. Please contact the site administrator.",
      notAvailable: "Not available",
      popupCapacity: (value) => `Recorded licensed capacity: ${value}`,
      popupNearby: (count) => `AFHs within 1 mile: ${count} (including this home)`,
      viewProfile: "View home profile →",
    },
    cities: {
      title: "Compare Adult Family Homes by City",
      eyebrow: "WASHINGTON MARKET INTELLIGENCE · PHASE 7",
      intro: "Explore listed AFH supply and recorded licensed capacity by city and county. Counts do not represent vacancies, occupancy, current license standing, or proven demand.",
      loading: "Loading city market data…",
      unavailable: "City market data could not be loaded. Check access to wa_city_market_summary.",
      totalsAria: "Statewide totals",
      countyCityGroups: "County-city groups",
      countiesRepresented: "Counties represented",
      listedAfhs: "Listed AFHs",
      recordedBeds: "Recorded licensed beds",
      countySelectionAria: "County selection",
      selectCounty: "Select a county",
      allCounties: "All Washington counties",
      countyOption: (name) => `${name} County`,
      countyHelp: "Select a county to compare its cities. The statewide view includes county-city combinations, which are kept separate when a city name occurs across counties.",
      compareAria: "Compare two cities",
      compareTitle: "Compare two cities",
      firstCity: "First city",
      secondCity: "Second city",
      chooseCity: "Choose a city",
      indicator: "Indicator",
      adultFamilyHomes: "Adult Family Homes",
      recordedLicensedBeds: "Recorded licensed beds",
      homesWithCapacity: "Homes with recorded capacity",
      directoryAria: "City market directory",
      listingsTitle: "City market listings",
      searchCity: "Search city",
      searchPlaceholder: "e.g. Bremerton",
      sortCities: "Sort cities",
      sortAfhs: "Most AFHs",
      sortBeds: "Most recorded beds",
      sortCity: "City A–Z",
      showing: (shown, total) => `Showing ${shown} of ${total} county-city groups.`,
      colCity: "City",
      colCounty: "County",
      colAfhs: "AFHs",
      colBeds: "Recorded beds",
      colHomes: "Homes with capacity",
      colFind: "Find homes",
      directoryLink: "Directory ↗",
      source: "Source: Washington DSHS-matched directory records and existing geographic county assignments. The same city name may appear in different county groups. Geographic labels and counts are not a substitute for verifying the latest licensing and facility details with Washington DSHS. No ZIP-based demographics are assigned to city boundaries here.",
    },
    counties: {
      title: "Compare Adult Family Homes by County",
      eyebrow: "WASHINGTON MARKET INTELLIGENCE · PHASE 6",
      intro: "Compare DSHS-matched Adult Family Home listings and recorded licensed capacity across Washington counties. Figures describe listed supply, not vacancies, affordability, quality, or proven demand.",
      loading: "Loading county market data…",
      unavailable: "County comparison data could not be loaded. Check the database view and read permissions.",
      countiesWithAfhs: "Counties with listed AFHs",
      listedAfhs: "Listed Adult Family Homes",
      recordedBeds: "Recorded licensed beds",
      compareTitle: "Compare two counties",
      firstCounty: "First county",
      secondCounty: "Second county",
      chooseCounty: "Choose a county",
      countyOption: (name) => `${name} County`,
      indicator: "Indicator",
      adultFamilyHomes: "Adult Family Homes",
      recordedLicensedBeds: "Recorded licensed beds",
      homesWithCapacity: "Homes with recorded capacity",
      citiesRepresented: "Cities represented",
      allTitle: "All counties with listed homes",
      searchCounty: "Search county",
      searchPlaceholder: "e.g. Kitsap",
      sortCounties: "Sort counties",
      sortAfhs: "Most AFHs",
      sortBeds: "Most recorded beds",
      sortCities: "Most cities represented",
      sortName: "County name A–Z",
      showing: (shown, total) => `Showing ${shown} of ${total} counties with listed homes.`,
      colCounty: "County",
      colAfhs: "AFHs",
      colBeds: "Recorded beds",
      colHomes: "Homes with capacity",
      colCities: "Cities",
      source: "Source: County and city summaries are calculated from the stored geographic text in public.wa_dshs_listed_facilities, not geographic boundary calculations. Counts are not a real-time licensing verification. Recorded capacity does not measure occupancy or vacancies. A county missing from this comparison has no listings in the current matched directory; that is not proof that it has no operating care homes. Population and household income are not aggregated here because ZIP-code Census estimates can cross county boundaries.",
      demographicsLink: "Explore ZIP demographics and household income →",
    },
    demographics: {
      title: "Aging Population Dashboard",
      eyebrow: "WASHINGTON MARKET INTELLIGENCE · PHASE 4B",
      intro: "Compare Census older-adult population estimates with recorded Adult Family Home supply. A population-to-bed comparison is a screening indicator, not a forecast of demand, vacancies, occupancy or investment returns.",
      zipLabel: "Washington ZIP code",
      zipPlaceholder: "e.g. 98038",
      analyze: "Analyze ZIP",
      openMap: "Open map ↗",
      loading: "Loading Census and care home data…",
      invalidZip: "Enter a valid five-digit ZIP code.",
      unavailable: "Demographic data is unavailable. Check that the public ZIP market view is created and readable.",
      incomplete: "The ZIP comparison list is incomplete, so it is hidden.",
      noMatch: (zip) => `No matched AFH and ACS data for ZIP ${zip}. Select a ZIP code in the comparison table below.`,
      overview: (zip) => `ZIP ${zip} overview`,
      totalPopulation: "Total population",
      age6069: "Residents aged 60–69",
      age70plus: "Residents aged 70+",
      adultFamilyHomes: "Adult Family Homes",
      knownBeds: "Known licensed beds",
      medianIncome: "Median household income",
      households100k: "Households earning $100,000+",
      incomeMoe: "Median income margin of error",
      notAvailable: "Not available",
      olderAdults: "Estimated older-adult population",
      ages: (label) => `Ages ${label}`,
      source: (period) => `Source: U.S. Census ACS ${period} 5-year B01001 ZCTA estimates. ZCTAs are not identical to USPS ZIP-code boundaries. Estimates have sampling uncertainty; margins of error are not shown.`,
      interpretingTitle: "Interpreting these numbers",
      interpretingSupply: (afhs, beds, homes) => `This ZIP has ${afhs} listed AFHs. ${beds} is the sum of recorded licensed capacities from ${homes} homes with known capacity; it does not measure vacant beds.`,
      interpretingContext: "Older adults are not automatically AFH customers. To evaluate market opportunity, also research household income, disability and care needs, referral patterns, occupancy, prices, workforce availability, competing care options, and local regulations.",
      compareTitle: "Compare Washington ZIP codes",
      sortBy: "Sort by",
      sortSenior: "Residents aged 70+",
      sortAfh: "Number of AFHs",
      sortBeds: "Known licensed beds",
      colZip: "ZIP",
      colResidents: "Residents 70+",
      colAfhs: "AFHs",
      colBeds: "Known beds",
      colExplore: "Explore",
      analyzeRow: "Analyze",
      footer: "Independent market research. AFH data is drawn from DSHS-matched facilities and Washington GIS; Census data is from ACS 2020–2024 five-year estimates. Reported bed capacity is not confirmed availability. Care-home records may change and should be checked against current state sources.",
    },
    opportunity: {
      title: "Explore AFH Market Indicators by ZIP Code",
      eyebrow: "WASHINGTON MARKET INTELLIGENCE · PHASE 8",
      intro: "Compare older-adult population estimates, household income, and recorded Adult Family Home supply. These indicators do not establish care demand, ability to pay, vacancies, profitability, or licensing status.",
      loading: "Loading ZIP-code market data…",
      unavailable: "The ZIP-market data could not be loaded. Please check Supabase view access.",
      incomplete: "The ZIP-market list is incomplete, so statewide totals are hidden.",
      zipsCovered: "ZIP codes covered",
      recordedListings: "Recorded AFH listings",
      recordedBeds: "Recorded licensed beds",
      compareTitle: "Compare two ZIP codes",
      firstZip: "First ZIP code",
      secondZip: "Second ZIP code",
      chooseZip: "Choose ZIP code",
      firstZipHeader: "First ZIP",
      secondZipHeader: "Second ZIP",
      indicator: "Indicator",
      age70: "Estimated residents age 70+",
      age85: "Estimated residents age 85+",
      medianIncome: "Median household income",
      incomeMoe: "Median income margin of error",
      households100k: "Households earning $100,000+",
      notAvailable: "Not available",
      compareNote: "Comparisons are descriptive only. ZIP boundaries can cross city or county boundaries. The household-income measures describe all households, not specifically prospective AFH clients.",
      browseTitle: "Browse and compare Washington ZIP codes",
      searchZip: "Search ZIP code",
      searchPlaceholder: "e.g. 98038",
      sortZips: "Sort ZIP codes",
      sortSenior: "Most residents age 70+",
      sortIncome: "Highest median household income",
      sortHighIncome: "Highest share of $100K+ households",
      sortFewest: "Fewest recorded AFHs",
      sortMost: "Most recorded AFHs",
      sortZip: "ZIP code A–Z",
      showing: (shown, total) => `Showing ${shown} of ${total} ZIP codes`,
      colZip: "ZIP code",
      colAge: "Age 70+ (est.)",
      colIncome: "Median household income",
      colHighIncome: "$100K+ households",
      colAfhs: "AFHs",
      colBeds: "Recorded beds",
      colDetails: "Details",
      overviewLink: "ZIP overview ↗",
      interpretTitle: "How to interpret these indicators",
      seniorLabel: "Senior population:",
      seniorBody: "ACS/Census-based estimates by ZIP code, not a count of people seeking residential care.",
      incomeLabel: "Household income:",
      incomeBody: "reflects households generally, not verified private-pay capacity among older adults. Income estimates have margins of error; *$250,000+ may indicate a top-coded value.",
      supplyLabel: "Existing AFHs and beds:",
      supplyBody: "recorded supply from matched directory records, not confirmed currently operating homes, availability, occupancy, or quality.",
      coverageLabel: "Coverage:",
      coverageBody: (count) => `only ${count} ZIP codes represented in the existing market dataset. This is not complete coverage of every Washington ZIP code. Census reporting periods may differ across measures.`,
      interpretClose: "Use these indicators to identify locations for further research, then verify licensing, zoning, property suitability, rates, and referral demand independently.",
    },
    profile: {
      title: "Facility profile",
      loadingTitle: "Loading facility profile…",
      eyebrow: "WASHINGTON · ADULT FAMILY HOME",
      intro: "Directory information is provided for research, not as an endorsement or confirmation of current licensing, vacancies, pricing, or services.",
      back: "← Back to Washington listings",
      loadingInfo: "Loading facility information…",
      unavailable: "Unable to load this facility right now. Please try again later.",
      retry: "Retry",
      notFoundTitle: "Facility not found",
      notFoundBody: "This license number does not match a listing in the current Washington directory.",
      searchDirectory: "Search the directory",
      detailsTitle: "Facility information",
      facilityName: "Facility name",
      address: "Address",
      county: "County",
      licenseNumber: "License number",
      recordedCapacity: "Recorded licensed capacity",
      notAvailable: "Not available",
      countyValue: (name) => `${name} County`,
      capacityValue: (count) => `${count} residents`,
      googleMaps: "View location in Google Maps ↗",
      dshsSource: "Name, address, license number, and capacity come from the Washington DSHS locator download.",
      ownerTitle: "Information published by the facility",
      ownerNote: "An administrator published this owner-provided text separately. It does not change the official DSHS licensing record.",
      published: {
        description: "Description",
        services: "Services",
        amenities: "Amenities",
      },
      verifyTitle: "Verify before choosing care",
      verifyLead: "This facility was matched by license number against a Washington DSHS locator download. That match does ",
      verifyNot: "not",
      verifyTail: " independently establish its current license standing or quality of care.",
      dshsLocator: "Check the official Washington DSHS locator ↗",
      disclosure: "View Official Disclosure of Services (DSHS)",
      questionsTitle: "Questions to ask the home",
      questions: [
        "Are you currently accepting residents?",
        "What are your monthly rates and additional fees?",
        "Which care needs can your staff support?",
        "May I schedule a tour and review inspection history?",
      ],
      footer: "Independent informational directory based on a DSHS locator download from November 9, 2026. Official name, address, license number, and capacity are not edited by facility owners. Owner-provided description, services, and amenities appear only after a separate administrator publication. Withdrawn owner text is removed from the public profile. Contact details, prices, vacancies, and current license standing have not been independently verified. Listings are not recommendations.",
    },
  },
  es: {
    map: {
      title: "Mapa de hogares AFH",
      eyebrow: "INTELIGENCIA DE MERCADO DE WASHINGTON",
      intro: "Explore las ubicaciones de los hogares de cuidado, la capacidad licenciada registrada y la concentración a nivel de vecindario. Estos indicadores describen la oferta, no las vacantes ni una demanda no cubierta comprobada.",
      zipLabel: "Código ZIP de Washington",
      zipPlaceholder: "p. ej. 98056",
      analyze: "Analizar ZIP",
      mappedAfhs: "Hogares AFH en el mapa",
      knownBeds: "Camas licenciadas conocidas",
      missingCapacity: (count) => count === 1 ? `${count} hogar sin capacidad registrada` : `${count} hogares sin capacidad registrada`,
      notAvailableBeds: "Camas no disponibles",
      highDensityHomes: "Hogares en grupos de alta densidad",
      highDensityDetail: "20+ hogares AFH en un radio de 1 milla",
      mapSectionAria: "Mapa interactivo de establecimientos AFH",
      facilityLocations: "Ubicaciones de los establecimientos",
      concentration: "Concentración",
      locationDots: "Puntos de ubicación",
      mapAria: "Mapa de hogares de cuidado; haga clic en un punto para ver el perfil del hogar",
      densityLead: "Hogares AFH en un radio de 1 milla de cada marcador:",
      locationLegend: "Todos los puntos muestran las ubicaciones de los establecimientos. Haga clic en un punto para ver la capacidad licenciada y el perfil del hogar.",
      clusterNote: "Los conteos incluyen el establecimiento seleccionado y pueden incluir hogares justo fuera del límite del ZIP. Esta es una heurística preliminar de agrupación de una milla, no una densidad ajustada por población ni una puntuación de inversión.",
      noneFound: "No se encontraron establecimientos en el mapa para este código ZIP en el directorio actual.",
      listAria: "Establecimientos en este ZIP",
      facilitiesInZip: (zip) => `Establecimientos en el ZIP ${zip}`,
      licenseLabel: (license) => `Licencia ${license}`,
      disclaimer: "La información de los establecimientos proviene de una descarga del localizador de DSHS de Washington emparejada con datos GIS del estado. La capacidad registrada no es disponibilidad de vacantes. Las coordenadas del mapa, la información de licencia y la idoneidad del cuidado deben confirmarse de forma independiente. Este directorio no recomienda ni certifica proveedores. Mapa base © colaboradores de OpenStreetMap.",
      unavailable: "No se pudieron obtener los datos del mapa de establecimientos. Verifique el acceso a la vista wa_afh_map_facilities.",
      tooMany: "Hay demasiados resultados para mostrarlos por completo. Comuníquese con el administrador del sitio.",
      notAvailable: "No disponible",
      popupCapacity: (value) => `Capacidad licenciada registrada: ${value}`,
      popupNearby: (count) => `Hogares AFH en un radio de 1 milla: ${count} (incluido este hogar)`,
      viewProfile: "Ver perfil del hogar →",
    },
    cities: {
      title: "Comparar hogares AFH por ciudad",
      eyebrow: "INTELIGENCIA DE MERCADO DE WASHINGTON · FASE 7",
      intro: "Explore la oferta listada de hogares AFH y la capacidad licenciada registrada por ciudad y condado. Los conteos no representan vacantes, ocupación, vigencia actual de la licencia ni demanda comprobada.",
      loading: "Cargando datos de mercado por ciudad…",
      unavailable: "No se pudieron cargar los datos de mercado por ciudad. Verifique el acceso a wa_city_market_summary.",
      totalsAria: "Totales de todo el estado",
      countyCityGroups: "Grupos de condado y ciudad",
      countiesRepresented: "Condados representados",
      listedAfhs: "Hogares AFH listados",
      recordedBeds: "Camas licenciadas registradas",
      countySelectionAria: "Selección de condado",
      selectCounty: "Seleccione un condado",
      allCounties: "Todos los condados de Washington",
      countyOption: (name) => `Condado de ${name}`,
      countyHelp: "Seleccione un condado para comparar sus ciudades. La vista de todo el estado incluye combinaciones de condado y ciudad, que se mantienen separadas cuando un nombre de ciudad aparece en varios condados.",
      compareAria: "Comparar dos ciudades",
      compareTitle: "Comparar dos ciudades",
      firstCity: "Primera ciudad",
      secondCity: "Segunda ciudad",
      chooseCity: "Elija una ciudad",
      indicator: "Indicador",
      adultFamilyHomes: "Hogares AFH",
      recordedLicensedBeds: "Camas licenciadas registradas",
      homesWithCapacity: "Hogares con capacidad registrada",
      directoryAria: "Directorio de mercado por ciudad",
      listingsTitle: "Listados de mercado por ciudad",
      searchCity: "Buscar ciudad",
      searchPlaceholder: "p. ej. Bremerton",
      sortCities: "Ordenar ciudades",
      sortAfhs: "Más hogares AFH",
      sortBeds: "Más camas registradas",
      sortCity: "Ciudad A–Z",
      showing: (shown, total) => `Se muestran ${shown} de ${total} grupos de condado y ciudad.`,
      colCity: "Ciudad",
      colCounty: "Condado",
      colAfhs: "Hogares AFH",
      colBeds: "Camas registradas",
      colHomes: "Hogares con capacidad",
      colFind: "Buscar hogares",
      directoryLink: "Directorio ↗",
      source: "Fuente: registros del directorio emparejados con DSHS de Washington y las asignaciones geográficas de condado existentes. El mismo nombre de ciudad puede aparecer en distintos grupos de condado. Las etiquetas geográficas y los conteos no sustituyen la verificación de los datos más recientes de licencia y del establecimiento con DSHS de Washington. Aquí no se asignan datos demográficos basados en ZIP a los límites de las ciudades.",
    },
    counties: {
      title: "Comparar hogares AFH por condado",
      eyebrow: "INTELIGENCIA DE MERCADO DE WASHINGTON · FASE 6",
      intro: "Compare los listados de hogares AFH emparejados con DSHS y la capacidad licenciada registrada en los condados de Washington. Las cifras describen la oferta listada, no las vacantes, la asequibilidad, la calidad ni la demanda comprobada.",
      loading: "Cargando datos de mercado por condado…",
      unavailable: "No se pudieron cargar los datos de comparación por condado. Verifique la vista de la base de datos y los permisos de lectura.",
      countiesWithAfhs: "Condados con hogares AFH listados",
      listedAfhs: "Hogares AFH listados",
      recordedBeds: "Camas licenciadas registradas",
      compareTitle: "Comparar dos condados",
      firstCounty: "Primer condado",
      secondCounty: "Segundo condado",
      chooseCounty: "Elija un condado",
      countyOption: (name) => `Condado de ${name}`,
      indicator: "Indicador",
      adultFamilyHomes: "Hogares AFH",
      recordedLicensedBeds: "Camas licenciadas registradas",
      homesWithCapacity: "Hogares con capacidad registrada",
      citiesRepresented: "Ciudades representadas",
      allTitle: "Todos los condados con hogares listados",
      searchCounty: "Buscar condado",
      searchPlaceholder: "p. ej. Kitsap",
      sortCounties: "Ordenar condados",
      sortAfhs: "Más hogares AFH",
      sortBeds: "Más camas registradas",
      sortCities: "Más ciudades representadas",
      sortName: "Nombre del condado A–Z",
      showing: (shown, total) => `Se muestran ${shown} de ${total} condados con hogares listados.`,
      colCounty: "Condado",
      colAfhs: "Hogares AFH",
      colBeds: "Camas registradas",
      colHomes: "Hogares con capacidad",
      colCities: "Ciudades",
      source: "Fuente: Los resúmenes por condado y por ciudad se calculan a partir del texto geográfico almacenado en public.wa_dshs_listed_facilities, no mediante cálculos de límites geográficos. Los conteos no son una verificación de licencias en tiempo real. La capacidad registrada no mide la ocupación ni las vacantes. Un condado que no aparece en esta comparación no tiene listados en el directorio emparejado actual; eso no prueba que no tenga hogares de cuidado en funcionamiento. Aquí no se agregan la población ni el ingreso de los hogares porque las estimaciones del Censo por código ZIP pueden cruzar los límites de los condados.",
      demographicsLink: "Explorar la demografía por ZIP y los ingresos de los hogares →",
    },
    demographics: {
      title: "Panel de población de edad avanzada",
      eyebrow: "INTELIGENCIA DE MERCADO DE WASHINGTON · FASE 4B",
      intro: "Compare las estimaciones de población adulta mayor del Censo con la oferta registrada de hogares AFH. Una comparación de población y camas es un indicador de revisión, no un pronóstico de demanda, vacantes, ocupación ni rendimientos de inversión.",
      zipLabel: "Código ZIP de Washington",
      zipPlaceholder: "p. ej. 98038",
      analyze: "Analizar ZIP",
      openMap: "Abrir mapa ↗",
      loading: "Cargando datos del Censo y de hogares de cuidado…",
      invalidZip: "Ingrese un código ZIP válido de cinco dígitos.",
      unavailable: "Los datos demográficos no están disponibles. Verifique que la vista pública de mercado por ZIP esté creada y se pueda leer.",
      incomplete: "La lista de comparación por ZIP está incompleta, por lo que permanece oculta.",
      noMatch: (zip) => `No hay datos coincidentes de hogares AFH y de la ACS para el ZIP ${zip}. Seleccione un código ZIP en la tabla de comparación de abajo.`,
      overview: (zip) => `Resumen del ZIP ${zip}`,
      totalPopulation: "Población total",
      age6069: "Residentes de 60–69 años",
      age70plus: "Residentes de 70 años o más",
      adultFamilyHomes: "Hogares AFH",
      knownBeds: "Camas licenciadas conocidas",
      medianIncome: "Ingreso medio del hogar",
      households100k: "Hogares con ingresos de $100,000+",
      incomeMoe: "Margen de error del ingreso medio",
      notAvailable: "No disponible",
      olderAdults: "Población estimada de adultos mayores",
      ages: (label) => `Edades ${label}`,
      source: (period) => `Fuente: estimaciones ZCTA B01001 a 5 años de la ACS del U.S. Census ${period}. Las ZCTA no son idénticas a los límites de códigos ZIP del USPS. Las estimaciones tienen incertidumbre de muestreo; no se muestran los márgenes de error.`,
      interpretingTitle: "Cómo interpretar estas cifras",
      interpretingSupply: (afhs, beds, homes) => `Este ZIP tiene ${afhs} hogares AFH listados. ${beds} es la suma de las capacidades licenciadas registradas de ${homes} hogares con capacidad conocida; no mide las camas vacantes.`,
      interpretingContext: "Los adultos mayores no son automáticamente clientes de hogares AFH. Para evaluar la oportunidad de mercado, investigue también el ingreso de los hogares, la discapacidad y las necesidades de cuidado, los patrones de referencia, la ocupación, los precios, la disponibilidad de personal, las opciones de cuidado que compiten y las normas locales.",
      compareTitle: "Comparar códigos ZIP de Washington",
      sortBy: "Ordenar por",
      sortSenior: "Residentes de 70 años o más",
      sortAfh: "Número de hogares AFH",
      sortBeds: "Camas licenciadas conocidas",
      colZip: "ZIP",
      colResidents: "Residentes de 70+",
      colAfhs: "Hogares AFH",
      colBeds: "Camas conocidas",
      colExplore: "Explorar",
      analyzeRow: "Analizar",
      footer: "Investigación de mercado independiente. Los datos de hogares AFH provienen de establecimientos emparejados con DSHS y del GIS de Washington; los datos del Censo provienen de las estimaciones a cinco años de la ACS 2020–2024. La capacidad de camas informada no es disponibilidad confirmada. Los registros de hogares de cuidado pueden cambiar y deben verificarse con las fuentes estatales vigentes.",
    },
    opportunity: {
      title: "Explorar indicadores de mercado AFH por código ZIP",
      eyebrow: "INTELIGENCIA DE MERCADO DE WASHINGTON · FASE 8",
      intro: "Compare las estimaciones de población adulta mayor, el ingreso de los hogares y la oferta registrada de hogares AFH. Estos indicadores no establecen la demanda de cuidado, la capacidad de pago, las vacantes, la rentabilidad ni el estado de la licencia.",
      loading: "Cargando datos de mercado por código ZIP…",
      unavailable: "No se pudieron cargar los datos de mercado por ZIP. Verifique el acceso a la vista de Supabase.",
      incomplete: "La lista de mercado por ZIP está incompleta, por lo que los totales estatales permanecen ocultos.",
      zipsCovered: "Códigos ZIP incluidos",
      recordedListings: "Listados de hogares AFH registrados",
      recordedBeds: "Camas licenciadas registradas",
      compareTitle: "Comparar dos códigos ZIP",
      firstZip: "Primer código ZIP",
      secondZip: "Segundo código ZIP",
      chooseZip: "Elija un código ZIP",
      firstZipHeader: "Primer ZIP",
      secondZipHeader: "Segundo ZIP",
      indicator: "Indicador",
      age70: "Residentes estimados de 70 años o más",
      age85: "Residentes estimados de 85 años o más",
      medianIncome: "Ingreso medio del hogar",
      incomeMoe: "Margen de error del ingreso medio",
      households100k: "Hogares con ingresos de $100,000+",
      notAvailable: "No disponible",
      compareNote: "Las comparaciones son solo descriptivas. Los límites del ZIP pueden cruzar límites de ciudad o de condado. Las medidas de ingreso de los hogares describen a todos los hogares, no específicamente a posibles clientes de hogares AFH.",
      browseTitle: "Explorar y comparar códigos ZIP de Washington",
      searchZip: "Buscar código ZIP",
      searchPlaceholder: "p. ej. 98038",
      sortZips: "Ordenar códigos ZIP",
      sortSenior: "Más residentes de 70 años o más",
      sortIncome: "Mayor ingreso medio del hogar",
      sortHighIncome: "Mayor proporción de hogares de $100K+",
      sortFewest: "Menos hogares AFH registrados",
      sortMost: "Más hogares AFH registrados",
      sortZip: "Código ZIP A–Z",
      showing: (shown, total) => `Se muestran ${shown} de ${total} códigos ZIP`,
      colZip: "Código ZIP",
      colAge: "Edad 70+ (estim.)",
      colIncome: "Ingreso medio del hogar",
      colHighIncome: "Hogares de $100K+",
      colAfhs: "Hogares AFH",
      colBeds: "Camas registradas",
      colDetails: "Detalles",
      overviewLink: "Resumen del ZIP ↗",
      interpretTitle: "Cómo interpretar estos indicadores",
      seniorLabel: "Población de adultos mayores:",
      seniorBody: "estimaciones basadas en la ACS y el Censo por código ZIP, no un conteo de personas que buscan cuidado residencial.",
      incomeLabel: "Ingreso de los hogares:",
      incomeBody: "refleja a los hogares en general, no una capacidad de pago privado verificada entre los adultos mayores. Las estimaciones de ingreso tienen márgenes de error; *$250,000+ puede indicar un valor con tope superior.",
      supplyLabel: "Hogares AFH y camas existentes:",
      supplyBody: "oferta registrada a partir de registros emparejados del directorio, no hogares confirmados en funcionamiento actual, disponibilidad, ocupación ni calidad.",
      coverageLabel: "Cobertura:",
      coverageBody: (count) => `solo ${count} códigos ZIP representados en el conjunto de datos de mercado existente. Esta no es una cobertura completa de cada código ZIP de Washington. Los períodos de informe del Censo pueden diferir entre medidas.`,
      interpretClose: "Use estos indicadores para identificar lugares que merecen más investigación y luego verifique de forma independiente la licencia, la zonificación, la idoneidad de la propiedad, las tarifas y la demanda de referencias.",
    },
    profile: {
      title: "Perfil del establecimiento",
      loadingTitle: "Cargando perfil del establecimiento…",
      eyebrow: "WASHINGTON · HOGAR AFH",
      intro: "La información del directorio se ofrece para investigación, no como un respaldo ni como confirmación de la licencia vigente, las vacantes, los precios o los servicios.",
      back: "← Volver a los listados de Washington",
      loadingInfo: "Cargando información del establecimiento…",
      unavailable: "No se puede cargar este establecimiento en este momento. Inténtelo de nuevo más tarde.",
      retry: "Reintentar",
      notFoundTitle: "Establecimiento no encontrado",
      notFoundBody: "Este número de licencia no coincide con un listado del directorio actual de Washington.",
      searchDirectory: "Buscar en el directorio",
      detailsTitle: "Información del establecimiento",
      facilityName: "Nombre del establecimiento",
      address: "Dirección",
      county: "Condado",
      licenseNumber: "Número de licencia",
      recordedCapacity: "Capacidad licenciada registrada",
      notAvailable: "No disponible",
      countyValue: (name) => `Condado de ${name}`,
      capacityValue: (count) => `${count} residentes`,
      googleMaps: "Ver la ubicación en Google Maps ↗",
      dshsSource: "El nombre, la dirección, el número de licencia y la capacidad provienen de la descarga del localizador de DSHS de Washington.",
      ownerTitle: "Información publicada por el establecimiento",
      ownerNote: "Un administrador publicó por separado este texto proporcionado por el propietario. No modifica el registro oficial de licencias de DSHS.",
      published: {
        description: "Descripción",
        services: "Servicios",
        amenities: "Comodidades",
      },
      verifyTitle: "Verifique antes de elegir el cuidado",
      verifyLead: "Este establecimiento se comparó por número de licencia con una descarga del localizador de DSHS de Washington. Esa coincidencia ",
      verifyNot: "no",
      verifyTail: " establece de forma independiente su situación actual de licencia ni la calidad del cuidado.",
      dshsLocator: "Consultar el localizador oficial de DSHS de Washington ↗",
      disclosure: "Ver la divulgación oficial de servicios (DSHS)",
      questionsTitle: "Preguntas para el hogar",
      questions: [
        "¿Aceptan residentes en este momento?",
        "¿Cuáles son las tarifas mensuales y los cargos adicionales?",
        "¿Qué necesidades de cuidado puede atender el personal?",
        "¿Puedo programar una visita y revisar el historial de inspecciones?",
      ],
      footer: "Directorio informativo independiente basado en una descarga del localizador de DSHS del 9 de noviembre de 2026. El nombre oficial, la dirección, el número de licencia y la capacidad no los editan los propietarios del establecimiento. La descripción, los servicios y las comodidades proporcionados por el propietario aparecen solo después de una publicación separada del administrador. El texto del propietario que se retira se elimina del perfil público. Los datos de contacto, los precios, las vacantes y la vigencia actual de la licencia no se han verificado de forma independiente. Los listados no son recomendaciones.",
    },
  },
};
