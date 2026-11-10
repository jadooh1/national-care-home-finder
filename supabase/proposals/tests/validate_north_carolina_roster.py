#!/usr/bin/env python3
"""Validate the North Carolina roster pilot on disposable PostgreSQL.

PGHOST must be localhost. This script does not connect to Supabase.
"""

import csv
import os
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / "scripts" / "nationwide"))

from north_carolina_development_adapter import execute, execute_rollback  # noqa: E402
from north_carolina_roster import (  # noqa: E402
    AUTHORITY,
    PILOT_BATCH,
    combine,
    map_source,
    summary,
)

PROPOSAL = REPO / "supabase" / "proposals" / "20261110090000_nationwide_roster_development.sql"
BATCH = REPO / "supabase" / "proposals" / "20261110120000_nationwide_roster_ingestion_batch.sql"
BATCH_ROLLBACK = REPO / "supabase" / "proposals" / "20261110120000_nationwide_roster_ingestion_batch_ROLLBACK.sql"
ROLLBACK = REPO / "supabase" / "proposals" / "20261110110000_north_carolina_roster_ingestion_ROLLBACK.sql"
DATABASE = "north_carolina_roster_pilot"
PSQL = os.environ.get("PSQL", "psql")
HEADER = [
    "License #",
    "DBA Name",
    "Site Address",
    "Site City",
    "Site State",
    "Site Zip",
    "Facility Address",
    "Facility Address 2",
    "Facility City",
    "Facility State",
    "Facility Zip",
]


def refuse_remote():
    host = os.environ.get("PGHOST", "")
    lowered = host.lower()
    if host not in {"localhost", "127.0.0.1", "::1"} or "supabase" in lowered or "pooler" in lowered:
        raise RuntimeError("Refusing to run outside a local disposable database")


def psql(database, sql):
    refuse_remote()
    completed = subprocess.run(
        [PSQL, "-d", database, "-X", "-v", "ON_ERROR_STOP=1", "-f", "-"],
        input=sql,
        text=True,
        capture_output=True,
        check=False,
    )
    output = completed.stdout + completed.stderr
    if completed.returncode != 0:
        raise RuntimeError(output)
    return output


def require_ok(database, sql, marker):
    output = psql(database, sql)
    if marker not in output:
        raise RuntimeError(output)
    return output


def write_csv(rows):
    handle = tempfile.NamedTemporaryFile("w", newline="", suffix=".csv", delete=False, encoding="utf-8")
    csv.writer(handle).writerows(rows)
    handle.close()
    return handle.name


def apply_schema():
    fixture = """
create view public.wa_dshs_listed_facilities as select 0::integer as preserved_count where false;
create view public.wa_afh_map_facilities as select 0::integer as preserved_count where false;
create view public.or_odhs_listed_afh as select 0::integer as preserved_count where false;
create schema if not exists nchf_nc_fixture;
create table nchf_nc_fixture.preserved (name text primary key, definition text not null);
insert into nchf_nc_fixture.preserved(name, definition)
select cls.relname, pg_get_viewdef(cls.oid, true)
from pg_class as cls
join pg_namespace as namespace on namespace.oid = cls.relnamespace
where namespace.nspname = 'public'
  and cls.relname in ('wa_dshs_listed_facilities', 'wa_afh_map_facilities', 'or_odhs_listed_afh');
"""
    proposal = PROPOSAL.read_text(encoding="utf-8")
    require_ok(
        DATABASE,
        "select set_config('nchf.nationwide_roster_authorization', 'authorize-development-nationwide-roster', false);\n"
        + fixture
        + proposal,
        "COMMIT",
    )


def views_unchanged():
    require_ok(
        DATABASE,
        """
        do $views$
        declare
          relation_name text;
          preserved text;
          current_definition text;
        begin
          foreach relation_name in array ARRAY['wa_dshs_listed_facilities', 'wa_afh_map_facilities', 'or_odhs_listed_afh']
          loop
            select definition into preserved from nchf_nc_fixture.preserved where name = relation_name;
            select pg_get_viewdef(format('public.%I', relation_name)::regclass, true) into current_definition;
            if preserved is distinct from current_definition then
              raise exception 'FAIL % definition changed', relation_name;
            end if;
          end loop;
        end
        $views$;
        select 'VIEWS_UNCHANGED';
        """,
        "VIEWS_UNCHANGED",
    )


def count_sql(where):
    output = psql(DATABASE, f"select count(*) from public.nationwide_roster where {where};")
    for line in output.splitlines():
        stripped = line.strip()
        if stripped.isdigit():
            return int(stripped)
    raise RuntimeError(output)


def assert_pilot_shape():
    output = psql(
        DATABASE,
        """
        select count(*) from public.nationwide_roster
          where state_name = 'North Carolina' and publication = 'public';
        select count(*) from public.nationwide_roster
          where state_name = 'North Carolina'
            and publication = 'unpublished'
            and official_export_date is null
            and original_status is null
            and disclosure_verified = false
            and disclosure_kind = 'generic-search'
            and freshness_verified = false
            and coordinate_source = 'absent';
        select count(*) from information_schema.role_table_grants
          where table_schema = 'public'
            and table_name = 'nationwide_roster'
            and grantee <> current_user;
        """,
    )
    numbers = [int(line.strip()) for line in output.splitlines() if line.strip().isdigit()]
    if numbers[0] != 0 or numbers[2] != 0:
        raise RuntimeError(output)
    return numbers[1]


def apply_batch():
    proposal = BATCH.read_text(encoding="utf-8")
    refused = subprocess.run(
        [PSQL, "-d", DATABASE, "-X", "-v", "ON_ERROR_STOP=1", "-f", "-"],
        input=proposal,
        text=True,
        capture_output=True,
        check=False,
    )
    if refused.returncode == 0 or "later development-only authorization" not in (refused.stdout + refused.stderr):
        raise RuntimeError(refused.stdout + refused.stderr)
    require_ok(
        DATABASE,
        "select set_config('nchf.nationwide_roster_batch_authorization', 'authorize-development-nationwide-roster-batch', false);\n"
        + proposal,
        "COMMIT",
    )


def use_disposable_adapter():
    os.environ["NCHF_NC_DEVELOPMENT_EXECUTION"] = "authorize-development-north-carolina-roster-execution"
    os.environ["NCHF_NC_EXECUTION_TARGET"] = "disposable"


def main():
    for path in (PROPOSAL, BATCH, BATCH_ROLLBACK, ROLLBACK):
        if not path.is_file():
            print(f"Missing {path}", file=sys.stderr)
            return 2
    try:
        refuse_remote()
        psql("postgres", "select current_setting('server_version_num');")
        psql("postgres", f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE); CREATE DATABASE {DATABASE};")
        proposal = PROPOSAL.read_text(encoding="utf-8")
        code = subprocess.run(
            [PSQL, "-d", DATABASE, "-X", "-v", "ON_ERROR_STOP=1", "-f", "-"],
            input=proposal,
            text=True,
            capture_output=True,
            check=False,
        )
        if code.returncode == 0 or "later development-only authorization" not in (code.stdout + code.stderr):
            print(code.stdout + code.stderr, file=sys.stderr)
            return 1
        apply_schema()
        apply_batch()
        views_unchanged()
        use_disposable_adapter()
        psql(
            DATABASE,
            """
            insert into public.nationwide_roster (
              state_name, license_identifier, identifier_type, issuing_authority, facility_name, ingestion_batch_id
            ) values
              ('North Carolina', 'HAL-800-001', 'license', 'Example other authority', 'Example other home', 'other-north-carolina-batch'),
              ('Washington', 'WA-EXAMPLE-900', 'license', 'Example Washington authority', 'Example Washington home', null),
              ('Oregon', 'OR-EXAMPLE-900', 'license', 'Example Oregon authority', 'Example Oregon home', null);
            """,
        )
        adult = write_csv(
            [
                HEADER,
                ["HAL-900-001", "Example Adult Home", "1 Example Street", "Raleigh", "NC", "27601", "PO Box 1", "", "Raleigh", "NC", "27602"],
            ]
        )
        family = write_csv(
            [
                HEADER,
                ["FCL-900-001", "Example Family Home", "2 Example Street", "Raleigh", "NC", "27603", "9 Example Drive", "", "Richmond", "VA", "23219"],
            ]
        )
        mapped = combine([map_source(adult, "adult"), map_source(family, "family")])
        if summary(mapped)["accepted"] != 2 or summary(mapped)["publication_public"] != 0:
            raise RuntimeError("synthetic mapping was not accepted as unpublished")
        first = execute(adult, family, DATABASE)
        if first["inserted"] != 2 or first["already_present"] != 0 or first["conflicts"] != 0:
            raise RuntimeError(str(first))
        if first["batch_id"] != PILOT_BATCH:
            raise RuntimeError(str(first))
        second = execute(adult, family, DATABASE)
        if second["inserted"] != 0 or second["already_present"] != 2 or second["conflicts"] != 0:
            raise RuntimeError(str(second))
        changed = write_csv(
            [
                HEADER,
                ["HAL-900-001", "Changed Example Home", "1 Example Street", "Raleigh", "NC", "27601", "PO Box 1", "", "Raleigh", "NC", "27602"],
                ["FCL-900-001", "Example Family Home", "2 Example Street", "Raleigh", "NC", "27603", "9 Example Drive", "", "Richmond", "VA", "23219"],
            ]
        )
        header_only = write_csv([HEADER])
        conflict = execute(changed, header_only, DATABASE)
        if conflict["conflicts"] != 1 or conflict["inserted"] != 0:
            raise RuntimeError(str(conflict))
        if count_sql("facility_name = 'Example Adult Home'") != 1:
            raise RuntimeError("conflict changed an existing row")
        if count_sql(f"ingestion_batch_id = '{PILOT_BATCH}'") != 2:
            raise RuntimeError("pilot batch was not recorded")
        if assert_pilot_shape() != 2:
            raise RuntimeError("synthetic rows were not stored unpublished")
        execute_rollback(DATABASE)
        if count_sql(f"ingestion_batch_id = '{PILOT_BATCH}'") != 0:
            raise RuntimeError("rollback left a pilot batch row")
        if count_sql("state_name = 'North Carolina'") != 1:
            raise RuntimeError("rollback removed an unrelated North Carolina row")
        if count_sql("state_name = 'Washington'") != 1 or count_sql("state_name = 'Oregon'") != 1:
            raise RuntimeError("rollback changed another state")
        views_unchanged()
        bare = subprocess.run(
            [PSQL, "-d", DATABASE, "-X", "-v", "ON_ERROR_STOP=1", "-f", str(ROLLBACK)],
            text=True,
            capture_output=True,
            check=False,
        )
        if bare.returncode == 0 or "later development-only authorization" not in (bare.stdout + bare.stderr):
            print(bare.stdout + bare.stderr, file=sys.stderr)
            return 1
        adult_official = os.environ.get("NCHF_NC_ADULT_XLSX", "")
        family_official = os.environ.get("NCHF_NC_FAMILY_XLSX", "")
        if adult_official and family_official:
            official = combine([map_source(adult_official, "adult"), map_source(family_official, "family")])
            totals = summary(official)
            if totals != {
                "accepted": 1086,
                "rejected": 2,
                "rejected_reasons": {"not-a-facility-record": 2},
                "adult_care_homes": 566,
                "family_care_homes": 520,
                "mailing_addresses_retained": totals["mailing_addresses_retained"],
                "mailing_addresses_omitted_as_identical": totals["mailing_addresses_omitted_as_identical"],
                "unresolved_official_export_date": 1086,
                "unresolved_original_status": 1086,
                "unresolved_facility_specific_disclosure": 1086,
                "publication_unpublished": 1086,
                "publication_public": 0,
            }:
                raise RuntimeError(str(totals))
            loaded = execute(adult_official, family_official, DATABASE)
            if loaded["inserted"] != 1086 or loaded["conflicts"] != 0 or loaded["summary"]["mailing_addresses_retained"] != 902:
                raise RuntimeError(str({key: loaded[key] for key in ("inserted", "conflicts", "summary")}))
            repeated = execute(adult_official, family_official, DATABASE)
            if repeated["inserted"] != 0 or repeated["already_present"] != 1086 or repeated["conflicts"] != 0:
                raise RuntimeError(str(repeated))
            if assert_pilot_shape() != 1086:
                raise RuntimeError("official rows were not stored unpublished")
            if count_sql("state_name = 'Washington'") != 1 or count_sql("state_name = 'Oregon'") != 1:
                raise RuntimeError("official load changed another state")
            if count_sql("ingestion_batch_id = 'other-north-carolina-batch'") != 1:
                raise RuntimeError("official load changed an unrelated North Carolina row")
            views_unchanged()
            execute_rollback(DATABASE)
            if (
                count_sql(f"ingestion_batch_id = '{PILOT_BATCH}'") != 0
                or count_sql("state_name = 'North Carolina'") != 1
                or count_sql("state_name = 'Washington'") != 1
                or count_sql("state_name = 'Oregon'") != 1
            ):
                raise RuntimeError("official rollback did not preserve unrelated rows")
            refused_column = subprocess.run(
                [PSQL, "-d", DATABASE, "-X", "-v", "ON_ERROR_STOP=1", "-f", "-"],
                input=(
                    "select set_config('nchf.nationwide_roster_batch_rollback_authorization', "
                    "'authorize-development-nationwide-roster-batch-rollback', false);\n"
                    + BATCH_ROLLBACK.read_text(encoding="utf-8")
                ),
                text=True,
                capture_output=True,
                check=False,
            )
            if refused_column.returncode == 0 or "a batch identifier is present" not in (
                refused_column.stdout + refused_column.stderr
            ):
                raise RuntimeError(refused_column.stdout + refused_column.stderr)
            print(
                "NC_OFFICIAL_READY",
                totals["accepted"],
                totals["rejected"],
                totals["mailing_addresses_retained"],
                totals["mailing_addresses_omitted_as_identical"],
            )
        if AUTHORITY.split(",")[0] != "North Carolina Department of Health and Human Services":
            raise RuntimeError("issuing authority changed")
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 1
    finally:
        try:
            refuse_remote()
            psql("postgres", f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE);")
        except RuntimeError as error:
            print(error, file=sys.stderr)
            return 1
    print("NORTH_CAROLINA_ROSTER_PILOT_READY")
    return 0


if __name__ == "__main__":
    sys.exit(main())
