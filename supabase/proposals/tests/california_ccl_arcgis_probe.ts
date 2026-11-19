import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_CCL_REQUIRED_FIELDS,
  assessCaliforniaCclLayer,
  fetchCaliforniaCclGisPages,
  probeCaliforniaCclLayer,
} from "../../../lib/california-ccl-arcgis-probe.ts";

const metadata = {
  type: "Feature Layer",
  geometryType: "esriGeometryPoint",
  maxRecordCount: 1000,
  fields: CALIFORNIA_CCL_REQUIRED_FIELDS.map(name => ({
    name,
    type: name === "STATUS" || name === "FAC_NBR" ? "esriFieldTypeInteger" : "esriFieldTypeString",
  })),
};

test("point layer with required fields does not imply accepted status or publication", () => {
  const result = assessCaliforniaCclLayer(metadata);
  assert.equal(result.layerIsPoint, true);
  assert.equal(result.requiredFieldsPresent, true);
  assert.equal(result.statusDomainDocumented, false);
  assert.equal(result.statusCodesAccepted, false);
  assert.equal(result.sourceFreshnessVerified, false);
  assert.equal(result.publication, "unpublished");
  assert.equal(result.ownerClaimEligible, false);
});

test("missing identifier or non-point layer prevents a count query", async () => {
  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(JSON.stringify({
      ...metadata,
      geometryType: "esriGeometryPolygon",
      fields: metadata.fields.filter(field => field.name !== "FAC_NBR"),
    }), { status: 200 });
  };
  const result = await probeCaliforniaCclLayer(fetcher as typeof fetch);
  assert.equal(result.count, null);
  assert.deepEqual(result.assessment.missingFields, ["FAC_NBR"]);
  assert.equal(calls.length, 1);
});

test("read-only count is reported without treating it as RCFE or ARF", async () => {
  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(JSON.stringify(calls.length === 1 ? metadata : { count: 12345 }), { status: 200 });
  };
  const result = await probeCaliforniaCclLayer(fetcher as typeof fetch);
  assert.equal(result.count, 12345);
  assert.equal(result.assessment.publication, "unpublished");
  assert.match(result.note, /all CCL facility types/);
  assert.equal(calls.length, 2);
  assert.match(calls[1], /returnCountOnly=true/);
  assert.match(calls[1], /where=1%3D1/);
});

test("ArcGIS errors and invalid counts fail closed", async () => {
  const fetcher = async () => new Response(JSON.stringify({ error: { code: 400 } }), { status: 200 });
  await assert.rejects(probeCaliforniaCclLayer(fetcher as typeof fetch), /metadata returned an error/);
  let calls = 0;
  const invalidCount = async () => new Response(JSON.stringify(++calls === 1 ? metadata : { count: "unknown" }), { status: 200 });
  await assert.rejects(probeCaliforniaCclLayer(invalidCount as typeof fetch), /count missing/);
});

test("paginated attribute fetch stays read-only and stops when complete", async () => {
  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request) => {
    calls.push(String(url));
    const href = String(url);
    const offset = Number(new URL(href).searchParams.get("resultOffset") ?? "0");
    if (offset === 0) {
      return new Response(JSON.stringify({
        exceededTransferLimit: true,
        features: [{ attributes: { FAC_NBR: 100400070, STATUS: 3, FAC_TYPE_DESC: "RESIDENTIAL-ELDERLY", FAC_LATITUDE: "36.7", FAC_LONGITUDE: "-119.7" } }],
      }), { status: 200 });
    }
    return new Response(JSON.stringify({
      features: [{ attributes: { FAC_NBR: 100403816, STATUS: 3, FAC_TYPE_DESC: "ADULT RESIDENTIAL", FAC_LATITUDE: "36.8", FAC_LONGITUDE: "-119.8" } }],
    }), { status: 200 });
  };
  const result = await fetchCaliforniaCclGisPages({ pageSize: 1, fetcher: fetcher as typeof fetch });
  assert.equal(result.complete, true);
  assert.equal(result.pages, 2);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0]?.FAC_NBR, 100400070);
  assert.match(calls[0] ?? "", /returnGeometry=false/);
  assert.match(calls[0] ?? "", /orderByFields=ObjectId/);
});

test("paginated fetch fails closed on ArcGIS errors and rejects invalid page sizes", async () => {
  await assert.rejects(fetchCaliforniaCclGisPages({ pageSize: 0 }), /pageSize/);
  const fetcher = async () => new Response(JSON.stringify({ error: { code: 400 } }), { status: 200 });
  await assert.rejects(fetchCaliforniaCclGisPages({ pageSize: 10, fetcher: fetcher as typeof fetch }), /page returned an error/);
});
