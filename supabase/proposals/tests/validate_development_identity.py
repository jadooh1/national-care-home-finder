#!/usr/bin/env python3
"""Validate the development identity preflight on disposable PostgreSQL.

PGHOST must be localhost. This script does not connect to Supabase.
"""

import os
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / "scripts" / "nationwide"))

from delaware_roster import rollback as rollback_delaware  # noqa: E402
from north_carolina_roster import PILOT as NORTH_CAROLINA_PILOT  # noqa: E402
from north_carolina_roster import ingest as ingest_north_carolina  # noqa: E402
from roster_ingestion import (  # noqa: E402
    APPROVED_BASELINE_PATH,
    candidate_baseline,
    load_approved_baseline,
    preflight_before_write,
    verify_development_session,
)

PROPOSAL = REPO / "supabase" / "proposals" / "20261110090000_nationwide_roster_development.sql"
BATCH = REPO / "supabase" / "proposals" / "20261110120000_nationwide_roster_ingestion_batch.sql"
PSQL = os.environ.get("PSQL", "psql")


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


def scalar(database, sql):
    output = psql(database, sql)
    for line in output.splitlines():
        text = line.strip()
        if text.isdigit():
            return int(text)
    raise RuntimeError(output)


def expect(message, call):
    try:
        call()
    except RuntimeError as error:
        if message not in str(error):
            raise RuntimeError(str(error)) from error
        return
    raise RuntimeError(f"identity preflight accepted a database that should fail: {message}")


def sql_quote(value):
    return str(value).replace("'", "''")


def matching_roster_sql(baseline):
    statements = ["delete from public.nationwide_roster;"]
    for batch in baseline["roster"]["batches"]:
        prefix = "".join(word[0] for word in batch["state_name"].split()).upper()
        statements.append(
            f"""
            insert into public.nationwide_roster (
              state_name, license_identifier, identifier_type, issuing_authority,
              facility_name, ingestion_batch_id, publication, disclosure_url, disclosure_kind,
              coordinate_source
            )
            select
              '{sql_quote(batch["state_name"])}',
              '{prefix}-' || i,
              '{sql_quote(batch["identifier_type"])}',
              '{sql_quote(batch["issuing_authority"])}',
              'fixture',
              '{sql_quote(batch["ingestion_batch_id"])}',
              '{sql_quote(batch["publication"])}',
              '{sql_quote(batch["source_url"])}',
              'generic-search',
              'absent'
            from generate_series(1, {int(batch["count"])}) as series(i);
            """
        )
    for directory in baseline["protected_directories"]:
        relation = directory["relation"]
        statements.append(f"drop view if exists {relation};")
        statements.append(
            f"create view {relation} as select generate_series(1, {int(directory['count'])}) as id;"
        )
    return "\n".join(statements)


def apply_roster():
    psql(
        "postgres",
        "select set_config('nchf.nationwide_roster_authorization', 'authorize-development-nationwide-roster', false);\n"
        + PROPOSAL.read_text(encoding="utf-8"),
    )
    psql(
        "postgres",
        "select set_config('nchf.nationwide_roster_batch_authorization', 'authorize-development-nationwide-roster-batch', false);\n"
        + BATCH.read_text(encoding="utf-8"),
    )


def main():
    refuse_remote()
    psql("postgres", "create role postgres login superuser;")
    psql("postgres", "create database identity_decoy;")
    os.environ["PGUSER"] = "postgres"
    expect("project identity", lambda: verify_development_session("identity_decoy"))
    expect("migration", lambda: verify_development_session("postgres"))
    apply_roster()
    psql(
        "postgres",
        """
        create schema supabase_migrations;
        create table supabase_migrations.schema_migrations (
          version text primary key,
          name text not null
        );
        insert into supabase_migrations.schema_migrations(version, name)
        values ('20261108221940', 'development_oregon_directory');
        """,
    )
    psql(
        "postgres",
        """
        insert into public.nationwide_roster (
          state_name, license_identifier, identifier_type, issuing_authority, facility_name
        ) values ('North Carolina', 'NC-1', 'license', 'fixture', 'fixture');
        create view public.wa_dshs_listed_facilities as select 1 as id;
        create view public.wa_afh_map_facilities as select 1 as id;
        create view public.or_odhs_listed_afh as select 1 as id;
        create table public.identity_canary (id integer primary key);
        insert into public.identity_canary(id) values (1);
        """,
    )
    expect("baseline", lambda: verify_development_session("postgres"))
    if scalar("postgres", "select count(*) from public.nationwide_roster") != 1:
        raise RuntimeError("baseline rejection changed the roster")
    approved = APPROVED_BASELINE_PATH.read_bytes()
    baseline = load_approved_baseline()
    psql("postgres", matching_roster_sql(baseline))
    verify_development_session("postgres")
    north_carolina = baseline["roster"]["batches"][0]
    psql(
        "postgres",
        f"""
        insert into public.nationwide_roster (
          state_name, license_identifier, identifier_type, issuing_authority,
          facility_name, ingestion_batch_id, publication
        ) values (
          '{sql_quote(north_carolina["state_name"])}',
          'NC-extra',
          'license',
          '{sql_quote(north_carolina["issuing_authority"])}',
          'fixture',
          '{sql_quote(north_carolina["ingestion_batch_id"])}',
          'unpublished'
        );
        """,
    )
    expect("unauthorized addition", lambda: verify_development_session("postgres"))
    psql("postgres", "delete from public.nationwide_roster where license_identifier = 'NC-extra';")
    psql("postgres", "delete from public.nationwide_roster where state_name = 'Delaware' and license_identifier = 'D-1';")
    expect("unauthorized deletion", lambda: verify_development_session("postgres"))
    psql("postgres", matching_roster_sql(baseline))
    psql(
        "postgres",
        """
        update public.nationwide_roster
        set publication = 'development'
        where license_identifier = 'NC-1';
        """,
    )
    expect("publication change", lambda: verify_development_session("postgres"))
    psql("postgres", matching_roster_sql(baseline))
    psql(
        "postgres",
        """
        insert into public.nationwide_roster (
          state_name, license_identifier, identifier_type, issuing_authority,
          facility_name, ingestion_batch_id, publication
        ) values (
          'Illinois', 'IL-1', 'license', 'Example Authority', 'fixture',
          'illinois-candidate-20261110', 'unpublished'
        );
        """,
    )
    expect("unexpected batch", lambda: verify_development_session("postgres"))
    candidate = candidate_baseline(baseline, {
        "state_name": "Illinois",
        "ingestion_batch_id": "illinois-candidate-20261110",
        "issuing_authority": "Example Authority",
        "source_url": "https://example.test/illinois",
        "identifier_type": "license",
        "publication": "unpublished",
        "count": 1,
    })
    verify_development_session("postgres", baseline=candidate)
    if APPROVED_BASELINE_PATH.read_bytes() != approved:
        raise RuntimeError("new-state preparation wrote the approved manifest")
    psql("postgres", "delete from public.nationwide_roster where state_name = 'Illinois';")
    protected = baseline["protected_directories"][0]
    psql(
        "postgres",
        f"create or replace view {protected['relation']} as select generate_series(1, {int(protected['count']) - 1}) as id;",
    )
    expect("protected directory", lambda: verify_development_session("postgres"))
    psql("postgres", matching_roster_sql(baseline))
    verify_development_session("postgres")
    psql(
        "postgres",
        f"""
        update public.nationwide_roster
        set facility_name = 'Baseline Fixture',
          source_record_id = 'adult-care-home:NC-1',
          original_category = 'Adult Care Home',
          disclosure_url = '{sql_quote(NORTH_CAROLINA_PILOT.disclosure_url)}',
          disclosure_kind = 'generic-search',
          coordinate_source = 'absent',
          publication = 'unpublished'
        where license_identifier = 'NC-1';
        """,
    )
    repeated = ingest_north_carolina(
        "postgres",
        [{
            "license_identifier": "NC-1",
            "source_record_id": "adult-care-home:NC-1",
            "facility_name": "Baseline Fixture",
            "physical_address": "",
            "original_category": "Adult Care Home",
            "official_export_date": None,
            "original_status": None,
            "disclosure_url": NORTH_CAROLINA_PILOT.disclosure_url,
            "disclosure_kind": "generic-search",
            "disclosure_verified": False,
            "freshness_verified": False,
            "coordinate_source": "absent",
            "publication": "unpublished",
        }],
    )
    if repeated["inserted"] != 0 or repeated["already_present"] != 1:
        raise RuntimeError(f"repeated import changed the baseline: {repeated}")
    verify_development_session("postgres")
    rollback_delaware("postgres")
    if scalar("postgres", "select count(*) from public.nationwide_roster where state_name = 'North Carolina'") != 1086:
        raise RuntimeError("Delaware rollback changed North Carolina")
    expect("unauthorized deletion", lambda: verify_development_session("postgres"))
    psql("postgres", matching_roster_sql(baseline))
    verify_development_session("postgres")
    if APPROVED_BASELINE_PATH.read_bytes() != approved:
        raise RuntimeError("import or rollback wrote the approved manifest")
    if scalar("postgres", "select count(*) from public.identity_canary") != 1:
        raise RuntimeError("session check wrote outside the roster baseline")
    os.environ["PGUSER"] = "proposal_test"
    expect("project identity", lambda: verify_development_session("postgres"))
    os.environ["PGUSER"] = "postgres"
    os.environ["NCHF_NC_EXECUTION_TARGET"] = "development"
    os.environ.pop("NCHF_NC_DEVELOPMENT_EXECUTION", None)
    expect("explicit authorization is required", lambda: preflight_before_write("postgres", refuse_remote))
    os.environ["NCHF_NC_DEVELOPMENT_EXECUTION"] = "authorize-development-north-carolina-roster-execution"
    expect(
        "database target does not match development",
        lambda: preflight_before_write("postgres", refuse_remote),
    )
    if scalar("postgres", "select count(*) from public.nationwide_roster") != 1125:
        raise RuntimeError("rejected development target changed the roster")
    if scalar("postgres", "select count(*) from public.nationwide_roster where publication = 'public'") != 0:
        raise RuntimeError("rejected development target published a row")
    print("DEVELOPMENT_IDENTITY_READY")


if __name__ == "__main__":
    main()
