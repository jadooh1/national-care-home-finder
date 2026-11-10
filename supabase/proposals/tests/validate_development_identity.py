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

from roster_ingestion import (  # noqa: E402
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


def ensure_postgres_login():
    password = os.environ.get("PGPASSWORD", "").replace("'", "''")
    psql(
        "postgres",
        f"""
        do $$
        begin
          if not exists (select 1 from pg_roles where rolname = 'postgres') then
            create role postgres login superuser;
          else
            alter role postgres with login superuser;
          end if;
        end
        $$;
        alter role postgres with password '{password}';
        """,
    )


def main():
    refuse_remote()
    ensure_postgres_login()
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
    psql(
        "postgres",
        """
        delete from public.nationwide_roster;
        insert into public.nationwide_roster (
          state_name, license_identifier, identifier_type, issuing_authority, facility_name
        )
        select 'North Carolina', 'NC-' || i, 'license', 'fixture', 'fixture'
        from generate_series(1, 1086) as series(i);
        insert into public.nationwide_roster (
          state_name, license_identifier, identifier_type, issuing_authority, facility_name
        )
        select 'Delaware', 'DE-' || i, 'license', 'fixture', 'fixture'
        from generate_series(1, 39) as series(i);
        drop view public.wa_dshs_listed_facilities;
        drop view public.wa_afh_map_facilities;
        drop view public.or_odhs_listed_afh;
        create view public.wa_dshs_listed_facilities as select generate_series(1, 6278) as id;
        create view public.wa_afh_map_facilities as select generate_series(1, 6278) as id;
        create view public.or_odhs_listed_afh as select generate_series(1, 1584) as id;
        """,
    )
    verify_development_session("postgres")
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
