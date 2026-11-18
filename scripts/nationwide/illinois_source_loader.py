"""Dry-run-first Illinois source-record load.

The transaction is prepared here and is not executed by this module. A later
development authorization must pass an explicit database runner. There is no
default connection.
"""

from __future__ import annotations

import json

from illinois_roster import (
    CITY,
    COUNTY,
    FACILITY_ID,
    FACILITY_NAME,
    ILLINOIS_BATCH_ID,
    LICENSEE_ID,
    SOURCE_RECORD_COLUMNS,
    SOURCE_SHA256,
    STATE,
    STREET,
    UNITS,
    ZIP,
    illinois_source_batch,
    map_source,
    matches_baseline,
    read_xlsx,
    sha256_file,
)
from roster_ingestion import assert_authorized_target

EXPECTED_EXTRACTION_DATE = "2026-10-28"
EXPECTED_ROWS = 502
EXPECTED_FLAGS = 17
LOAD_AUTHORIZATION = "authorize-development-illinois-source-load"
EXPECTED_BASELINES = {
    "north_carolina_batch": 1086,
    "delaware_batch": 39,
    "public_roster_rows": 0,
    "washington_listed": 6278,
    "washington_map": 6278,
    "oregon_listed": 1584,
}
REQUIRED_ATTRIBUTES = (
    FACILITY_ID,
    LICENSEE_ID,
    FACILITY_NAME,
    STREET,
    CITY,
    STATE,
    ZIP,
    COUNTY,
    UNITS,
)


def validate_source_batch(rows, baselines, existing_batch_count) -> None:
    if baselines != EXPECTED_BASELINES:
        raise RuntimeError("illinois source load refused: baseline counts do not match")
    if existing_batch_count != 0:
        raise RuntimeError("illinois source load refused: the batch is already present")
    if len(rows) != EXPECTED_ROWS:
        raise RuntimeError("illinois source load refused: the batch does not contain 502 rows")
    seen = set()
    flags = 0
    for row in rows:
        if tuple(row) != SOURCE_RECORD_COLUMNS:
            raise RuntimeError("illinois source load refused: a row does not match the source-record table")
        if row["publication"] != "unpublished":
            raise RuntimeError("illinois source load refused: a row would be published")
        if row["original_status"] is not None or row["normalized_status"] is not None:
            raise RuntimeError("illinois source load refused: license status must stay null")
        if row["extraction_date"] != EXPECTED_EXTRACTION_DATE or row["ingestion_batch_id"] != ILLINOIS_BATCH_ID:
            raise RuntimeError("illinois source load refused: extraction date or batch id does not match")
        if row["source_sha256"] != SOURCE_SHA256:
            raise RuntimeError("illinois source load refused: the source checksum does not match")
        facility_id = row["facility_identifier"]
        if facility_id in seen:
            raise RuntimeError("illinois source load refused: a facility identifier is duplicated")
        seen.add(facility_id)
        attributes = row["source_attributes"]
        if any(name not in attributes or not str(attributes[name]).strip() for name in REQUIRED_ATTRIBUTES):
            raise RuntimeError("illinois source load refused: an official source field is missing")
        if row["review_flags"]:
            flags += 1
    if flags != EXPECTED_FLAGS:
        raise RuntimeError("illinois source load refused: expiration flags are not 17")


def dry_run(path: str, baselines, existing_batch_count: int = 0) -> dict[str, object]:
    """Validate the official workbook without opening a database connection."""
    digest = sha256_file(path)
    if digest != SOURCE_SHA256:
        raise RuntimeError("illinois source load refused: the workbook checksum does not match")
    mapped = map_source(read_xlsx(path))
    if mapped["extract_date"] != EXPECTED_EXTRACTION_DATE or not matches_baseline(mapped, digest):
        raise RuntimeError("illinois source load refused: the workbook does not match the verified baseline")
    rows = illinois_source_batch(mapped, digest)
    validate_source_batch(rows, baselines, existing_batch_count)
    return {
        "ready": True,
        "rows": len(rows),
        "expiration_flags": EXPECTED_FLAGS,
        "extraction_date": EXPECTED_EXTRACTION_DATE,
        "batch_id": ILLINOIS_BATCH_ID,
        "publication": "unpublished",
        "existing_batch_count": existing_batch_count,
    }


def _literal(value) -> str:
    if value is None:
        return "null"
    if isinstance(value, list):
        if not value:
            return "ARRAY[]::text[]"
        items = ", ".join("'" + str(item).replace("'", "''") + "'" for item in value)
        return f"ARRAY[{items}]::text[]"
    if isinstance(value, dict):
        encoded = json.dumps(value, ensure_ascii=True, separators=(",", ":")).replace("'", "''")
        return f"'{encoded}'::jsonb"
    return "'" + str(value).replace("'", "''") + "'"


def transaction_sql(rows, baselines, existing_batch_count: int = 0) -> str:
    validate_source_batch(rows, baselines, existing_batch_count)
    columns = ", ".join(SOURCE_RECORD_COLUMNS)
    values = []
    for row in rows:
        rendered = []
        for column in SOURCE_RECORD_COLUMNS:
            value = row[column]
            if column in {"extraction_date", "source_effective_date", "source_expiration_date"} and value is not None:
                rendered.append("date " + _literal(value))
            else:
                rendered.append(_literal(value))
        values.append("(" + ", ".join(rendered) + ")")
    joined = ",\n".join(values)
    return f"""begin;
select set_config('nchf.illinois_source_load_authorization', '{LOAD_AUTHORIZATION}', true);
do $guard$
begin
  if current_setting('nchf.illinois_source_load_authorization', true)
     is distinct from '{LOAD_AUTHORIZATION}' then
    raise exception 'illinois source load refused: later development-only authorization is required';
  end if;
  if to_regclass('public.nationwide_source_record') is null then
    raise exception 'illinois source load refused: nationwide_source_record is not present';
  end if;
  if (select count(*) from public.nationwide_roster
      where ingestion_batch_id = 'north-carolina-dhhs-roster-pilot-20261110') is distinct from 1086 then
    raise exception 'illinois source load refused: North Carolina baseline changed';
  end if;
  if (select count(*) from public.nationwide_roster
      where ingestion_batch_id = 'delaware-dhcq-assisted-living-pilot-20261110') is distinct from 39 then
    raise exception 'illinois source load refused: Delaware baseline changed';
  end if;
  if (select count(*) from public.nationwide_roster where publication = 'public') is distinct from 0 then
    raise exception 'illinois source load refused: a roster row is public';
  end if;
  if (select count(*) from public.wa_dshs_listed_facilities) is distinct from 6278 then
    raise exception 'illinois source load refused: Washington directory baseline changed';
  end if;
  if (select count(*) from public.wa_afh_map_facilities) is distinct from 6278 then
    raise exception 'illinois source load refused: Washington map baseline changed';
  end if;
  if (select count(*) from public.or_odhs_listed_afh) is distinct from 1584 then
    raise exception 'illinois source load refused: Oregon directory baseline changed';
  end if;
  if (select count(*) from public.nationwide_source_record
      where ingestion_batch_id = '{ILLINOIS_BATCH_ID}') is distinct from 0 then
    raise exception 'illinois source load refused: the batch is already present';
  end if;
end
$guard$;
insert into public.nationwide_source_record ({columns})
values
{joined};
do $post$
declare
  loaded bigint;
  flagged bigint;
begin
  select count(*) into loaded
  from public.nationwide_source_record
  where ingestion_batch_id = '{ILLINOIS_BATCH_ID}';
  select count(*) into flagged
  from public.nationwide_source_record
  where ingestion_batch_id = '{ILLINOIS_BATCH_ID}'
    and 'expiration-precedes-extract' = any(review_flags);
  if loaded is distinct from 502
     or flagged is distinct from 17
     or exists (
       select 1
       from public.nationwide_source_record
       where ingestion_batch_id = '{ILLINOIS_BATCH_ID}'
         and (
           publication is distinct from 'unpublished'
           or original_status is not null
           or normalized_status is not null
           or extraction_date is distinct from date '2026-10-28'
           or source_sha256 is distinct from '{SOURCE_SHA256}'
         )
     ) then
    raise exception 'illinois source load refused: post-load checks failed';
  end if;
end
$post$;
commit;
"""


def assert_execution_target() -> None:
    assert_authorized_target(
        "NCHF_IL_EXECUTION_TARGET",
        "NCHF_IL_DEVELOPMENT_EXECUTION",
        LOAD_AUTHORIZATION,
    )


def execute(path: str, database: str, baselines, runner) -> str:
    """Run only when a later authorization supplies the database runner."""
    assert_execution_target()
    if runner is None or database != "postgres":
        raise RuntimeError("illinois source load refused: no development runner was supplied")
    report = dry_run(path, baselines, 0)
    if report["rows"] != EXPECTED_ROWS:
        raise RuntimeError("illinois source load refused: dry-run did not accept 502 rows")
    mapped = map_source(read_xlsx(path))
    sql = transaction_sql(illinois_source_batch(mapped, SOURCE_SHA256), baselines, 0)
    if "insert into public.nationwide_roster" in sql.lower():
        raise RuntimeError("illinois source load refused: the national roster would change")
    return runner(database, sql, assert_execution_target)
