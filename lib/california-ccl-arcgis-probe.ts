/** Read-only official California CCL ArcGIS reconnaissance. No persistence or publication. */
export const CALIFORNIA_CCL_LAYER_URL =
  "https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0";

export const CALIFORNIA_CCL_REQUIRED_FIELDS = [
  "FAC_NBR", "PROGRAM_TYPE", "FAC_TYPE_DESC", "STATUS", "NAME",
  "RES_STREET_ADDR", "RES_CITY", "RES_STATE", "RES_ZIP_CODE",
  "FAC_LATITUDE", "FAC_LONGITUDE", "CAPACITY",
] as const;

export type ArcgisLayerMetadata = {
  type?: string;
  geometryType?: string;
  maxRecordCount?: number;
  fields?: Array<{ name: string; type: string; domain?: unknown }>;
  error?: unknown;
};

export function assessCaliforniaCclLayer(metadata: ArcgisLayerMetadata) {
  const fields = new Map((metadata.fields ?? []).map(field => [field.name, field]));
  const missingFields = CALIFORNIA_CCL_REQUIRED_FIELDS.filter(name => !fields.has(name));
  const status = fields.get("STATUS");
  const programType = fields.get("PROGRAM_TYPE");
  return {
    layerIsPoint: metadata.geometryType === "esriGeometryPoint",
    requiredFieldsPresent: missingFields.length === 0,
    missingFields,
    maxRecordCount: metadata.maxRecordCount ?? null,
    statusDomainDocumented: !!status?.domain,
    programTypeDomainDocumented: !!programType?.domain,
    statusCodesAccepted: false as const,
    sourceFreshnessVerified: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
  };
}

export type CaliforniaCclGisAttributeRow = {
  FAC_NBR?: string | number | null;
  PROGRAM_TYPE?: string | null;
  FAC_TYPE_DESC?: string | null;
  STATUS?: number | null;
  NAME?: string | null;
  RES_STREET_ADDR?: string | null;
  RES_CITY?: string | null;
  RES_STATE?: string | null;
  RES_ZIP_CODE?: string | null;
  FAC_LATITUDE?: string | null;
  FAC_LONGITUDE?: string | null;
  CAPACITY?: number | null;
};

const PAGE_OUT_FIELDS = CALIFORNIA_CCL_REQUIRED_FIELDS.join(",");

export async function probeCaliforniaCclLayer(fetcher: typeof fetch = fetch) {
  const metadataResponse = await fetcher(`${CALIFORNIA_CCL_LAYER_URL}?f=json`);
  if (!metadataResponse.ok) throw new Error(`ArcGIS metadata HTTP ${metadataResponse.status}`);
  const metadata = (await metadataResponse.json()) as ArcgisLayerMetadata;
  if (metadata.error) throw new Error("ArcGIS metadata returned an error");
  const assessment = assessCaliforniaCclLayer(metadata);
  if (!assessment.layerIsPoint || !assessment.requiredFieldsPresent) {
    return { assessment, count: null, note: "Layer schema does not meet read-only probe requirements" };
  }
  const params = new URLSearchParams({ where: "1=1", returnCountOnly: "true", f: "json" });
  const countResponse = await fetcher(`${CALIFORNIA_CCL_LAYER_URL}/query?${params}`);
  if (!countResponse.ok) throw new Error(`ArcGIS count HTTP ${countResponse.status}`);
  const result = (await countResponse.json()) as { count?: unknown; error?: unknown };
  if (result.error || !Number.isSafeInteger(result.count) || (result.count as number) < 0) {
    throw new Error("ArcGIS count missing, invalid, or an error");
  }
  return { assessment, count: result.count as number, note: "Count is for all CCL facility types, not verified RCFE/ARF; status codes remain unaccepted" };
}

/**
 * Read-only paginated attribute fetch. Does not persist rows, interpret STATUS, or publish California.
 * Callers must supply pageSize at or below the layer maxRecordCount.
 */
export async function fetchCaliforniaCclGisPages(
  options: {
    pageSize: number;
    maxPages?: number;
    fetcher?: typeof fetch;
  },
): Promise<{ rows: CaliforniaCclGisAttributeRow[]; pages: number; complete: boolean }> {
  const fetcher = options.fetcher ?? fetch;
  if (!Number.isSafeInteger(options.pageSize) || options.pageSize < 1) {
    throw new Error("pageSize must be a positive integer");
  }
  const rows: CaliforniaCclGisAttributeRow[] = [];
  let offset = 0;
  let pages = 0;
  const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY;
  while (pages < maxPages) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: PAGE_OUT_FIELDS,
      returnGeometry: "false",
      resultOffset: String(offset),
      resultRecordCount: String(options.pageSize),
      orderByFields: "ObjectId ASC",
      f: "json",
    });
    const response = await fetcher(`${CALIFORNIA_CCL_LAYER_URL}/query?${params}`);
    if (!response.ok) throw new Error(`ArcGIS page HTTP ${response.status}`);
    const payload = (await response.json()) as {
      features?: Array<{ attributes?: CaliforniaCclGisAttributeRow }>;
      exceededTransferLimit?: boolean;
      error?: unknown;
    };
    if (payload.error) throw new Error("ArcGIS page returned an error");
    const features = payload.features ?? [];
    pages += 1;
    for (const feature of features) {
      if (feature.attributes) rows.push(feature.attributes);
    }
    if (features.length === 0 || payload.exceededTransferLimit !== true) {
      return { rows, pages, complete: true };
    }
    offset += features.length;
  }
  return { rows, pages, complete: false };
}
