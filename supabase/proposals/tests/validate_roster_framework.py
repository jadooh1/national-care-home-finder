#!/usr/bin/env python3
"""Validate the shared roster engine with both pilots on disposable PostgreSQL.

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

from delaware_development_adapter import execute as execute_delaware  # noqa: E402
from delaware_development_adapter import execute_rollback as rollback_delaware  # noqa: E402
from delaware_roster import PILOT_BATCH as DELAWARE_BATCH  # noqa: E402
from north_carolina_development_adapter import execute as execute_north_carolina  # noqa: E402
from north_carolina_development_adapter import execute_rollback as rollback_north_carolina  # noqa: E402
from north_carolina_roster import PILOT_BATCH as NORTH_CAROLINA_BATCH  # noqa: E402

PROPOSAL = REPO / "supabase" / "proposals" / "20261110090000_nationwide_roster_development.sql"
BATCH = REPO / "supabase" / "proposals" / "20261110120000_nationwide_roster_ingestion_batch.sql"
DATABASE = "roster_framework_pilot"
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


def scalar(sql):
    output = psql(DATABASE, sql)
    for line in output.splitlines():
        text = line.strip()
        if text.isdigit():
            return int(text)
    raise RuntimeError(output)


def write_csv(rows):
    handle = tempfile.NamedTemporaryFile("w", newline="", suffix=".csv", delete=False, encoding="utf-8")
    csv.writer(handle).writerows(rows)
    handle.close()
    return handle.name


def authorize():
    os.environ["NCHF_NC_EXECUTION_TARGET"] = "disposable"
    os.environ["NCHF_NC_DEVELOPMENT_EXECUTION"] = "authorize-development-north-carolina-roster-execution"
    os.environ["NCHF_DE_EXECUTION_TARGET"] = "disposable"
    os.environ["NCHF_DE_DEVELOPMENT_EXECUTION"] = "authorize-development-delaware-roster-execution"


def reject_unauthorized_targets():
    saved = {key: os.environ.get(key) for key in (
        "PGHOST",
        "PGUSER",
        "NCHF_NC_EXECUTION_TARGET",
        "NCHF_NC_DEVELOPMENT_EXECUTION",
        "NCHF_DE_EXECUTION_TARGET",
        "NCHF_DE_DEVELOPMENT_EXECUTION",
    )}
    os.environ["PGHOST"] = "aws-0-us-west-1.pooler.supabase.com"
    os.environ["PGUSER"] = "postgres.yiehgstweswxjakbcdzc"
    os.environ["NCHF_NC_EXECUTION_TARGET"] = "development"
    os.environ["NCHF_NC_DEVELOPMENT_EXECUTION"] = "authorize-development-north-carolina-roster-execution"
    os.environ["NCHF_DE_EXECUTION_TARGET"] = "development"
    os.environ["NCHF_DE_DEVELOPMENT_EXECUTION"] = "authorize-development-delaware-roster-execution"
    from north_carolina_development_adapter import assert_execution_target as nc_target
    from delaware_development_adapter import assert_execution_target as de_target
    try:
        try:
            nc_target()
        except RuntimeError:
            pass
        else:
            raise RuntimeError("unauthorized North Carolina target was accepted")
        try:
            de_target()
        except RuntimeError:
            pass
        else:
            raise RuntimeError("unauthorized Delaware target was accepted")
    finally:
        for key, value in saved.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


def apply_schema():
    fixture = """
create view public.wa_dshs_listed_facilities as select 0::integer as preserved_count where false;
create view public.wa_afh_map_facilities as select 0::integer as preserved_count where false;
create view public.or_odhs_listed_afh as select 0::integer as preserved_count where false;
"""
    proposal = PROPOSAL.read_text(encoding="utf-8")
    require_ok(
        DATABASE,
        "select set_config('nchf.nationwide_roster_authorization', 'authorize-development-nationwide-roster', false);\n"
        + fixture
        + proposal,
        "COMMIT",
    )
    require_ok(
        DATABASE,
        "select set_config('nchf.nationwide_roster_batch_authorization', 'authorize-development-nationwide-roster-batch', false);\n"
        + BATCH.read_text(encoding="utf-8"),
        "COMMIT",
    )


def synthetic_sources():
    adult = write_csv([
        HEADER,
        ["HAL-910-001", "Framework Adult", "1 Framework Street", "Raleigh", "NC", "27601", "PO Box 1", "", "Raleigh", "NC", "27602"],
    ])
    family = write_csv([
        HEADER,
        ["FCL-910-001", "Framework Family", "2 Framework Street", "Raleigh", "NC", "27603", "2 Framework Street", "", "Raleigh", "NC", "27603"],
    ])
    listing = tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8")
    listing.write(
        '<div class="wp-block-esab-accordion-child">'
        '<span class="esab__heading_tag">Framework Assisted Living</span>'
        "<table><tr><td>License #</td><td>91001</td></tr>"
        "<tr><td>Address</td><td>3 Framework Street, Dover, DE 19901</td></tr></table></div>"
    )
    listing.close()
    return adult, family, listing.name


def main():
    refuse_remote()
    reject_unauthorized_targets()
    authorize()
    psql("postgres", f"drop database if exists {DATABASE}; create database {DATABASE};")
    apply_schema()
    adult, family, listing = synthetic_sources()
    first_nc = execute_north_carolina(adult, family, DATABASE)
    first_de = execute_delaware(listing, DATABASE)
    if first_nc["inserted"] != 2 or first_de["inserted"] != 1:
        raise RuntimeError(f"synthetic insert failed: {first_nc} {first_de}")
    repeat_nc = execute_north_carolina(adult, family, DATABASE)
    repeat_de = execute_delaware(listing, DATABASE)
    if repeat_nc["inserted"] != 0 or repeat_nc["already_present"] != 2:
        raise RuntimeError(f"North Carolina repeat failed: {repeat_nc}")
    if repeat_de["inserted"] != 0 or repeat_de["already_present"] != 1:
        raise RuntimeError(f"Delaware repeat failed: {repeat_de}")
    conflict = write_csv([
        HEADER,
        ["HAL-910-001", "Changed Name", "1 Framework Street", "Raleigh", "NC", "27601", "PO Box 1", "", "Raleigh", "NC", "27602"],
    ])
    unchanged = write_csv([
        HEADER,
        ["FCL-910-001", "Framework Family", "2 Framework Street", "Raleigh", "NC", "27603", "2 Framework Street", "", "Raleigh", "NC", "27603"],
    ])
    conflicted = execute_north_carolina(conflict, unchanged, DATABASE)
    if conflicted["conflicts"] != 1 or conflicted["inserted"] != 0:
        raise RuntimeError(f"conflict was not isolated: {conflicted}")
    if scalar("select count(*) from public.nationwide_roster where facility_name = 'Framework Adult'") != 1:
        raise RuntimeError("conflict changed the stored North Carolina row")
    rollback_delaware(DATABASE)
    if scalar(f"select count(*) from public.nationwide_roster where ingestion_batch_id = '{DELAWARE_BATCH}'") != 0:
        raise RuntimeError("Delaware rollback removed the wrong rows or left its batch")
    if scalar(f"select count(*) from public.nationwide_roster where ingestion_batch_id = '{NORTH_CAROLINA_BATCH}'") != 2:
        raise RuntimeError("Delaware rollback changed the North Carolina batch")
    rollback_north_carolina(DATABASE)
    if scalar("select count(*) from public.nationwide_roster") != 0:
        raise RuntimeError("North Carolina rollback left synthetic rows")
    if scalar("select count(*) from public.nationwide_roster where publication = 'public'") != 0:
        raise RuntimeError("a public row was written")
    official_nc = os.environ.get("NCHF_NC_ADULT_XLSX"), os.environ.get("NCHF_NC_FAMILY_XLSX")
    official_de = os.environ.get("NCHF_DE_HTML")
    if all(official_nc) and official_de:
        loaded_nc = execute_north_carolina(*official_nc, DATABASE)
        loaded_de = execute_delaware(official_de, DATABASE)
        if loaded_nc["summary"]["accepted"] != 1086 or loaded_nc["inserted"] != 1086:
            raise RuntimeError(f"official North Carolina load failed: {loaded_nc['summary']} {loaded_nc}")
        if loaded_de["summary"]["accepted"] != 39 or loaded_de["inserted"] != 39 or loaded_de["summary"]["physical_addresses"] != 0:
            raise RuntimeError(f"official Delaware load failed: {loaded_de['summary']} {loaded_de}")
        repeated = execute_delaware(official_de, DATABASE)
        if repeated["already_present"] != 39 or repeated["inserted"] != 0:
            raise RuntimeError(f"official Delaware repeat failed: {repeated}")
        rollback_delaware(DATABASE)
        if scalar(f"select count(*) from public.nationwide_roster where state_name = 'North Carolina'") != 1086:
            raise RuntimeError("official Delaware rollback changed North Carolina")
        rollback_north_carolina(DATABASE)
        if scalar("select count(*) from public.nationwide_roster") != 0:
            raise RuntimeError("official rollback left rows")
        print("ROSTER_FRAMEWORK_OFFICIAL_READY 1086 39")
    print("ROSTER_FRAMEWORK_READY")


if __name__ == "__main__":
    main()
