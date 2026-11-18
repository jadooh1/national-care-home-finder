#!/usr/bin/env python3
"""Validate the nationwide roster proposal on a disposable local database.

PGHOST must be localhost. This script does not connect to Supabase.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "proposals" / "tests" / "nationwide_roster_fixture.sql"
PROPOSAL = ROOT / "proposals" / "20261110090000_nationwide_roster_development.sql"
ROLLBACK = ROOT / "proposals" / "20261110090000_nationwide_roster_development_ROLLBACK.sql"
CHECKS = ROOT / "proposals" / "tests" / "nationwide_roster_checks.sql"
DATABASE = "nationwide_roster_proposal"
PSQL = os.environ.get("PSQL", "psql")

APPLY = """
select set_config('nchf.nationwide_roster_authorization', 'authorize-development-nationwide-roster', false);
"""
EMPTY_ROLLBACK = """
select set_config('nchf.nationwide_roster_rollback_authorization', 'authorize-development-nationwide-roster-rollback', false);
"""
POPULATED_ROLLBACK = """
select set_config('nchf.nationwide_roster_rollback_authorization', 'authorize-development-nationwide-roster-rollback', false);
select set_config('nchf.nationwide_roster_populated_rollback_authorization', 'authorize-development-nationwide-roster-populated-rollback', false);
"""
SAMPLE_ROW = """
insert into public.nationwide_roster (
  state_name, certification_identifier, identifier_type, issuing_authority, facility_name
) values (
  'Iowa', 'C-100', 'certification', 'Example agency', 'Example facility'
);
"""


def refuse_remote():
    host = os.environ.get("PGHOST", "")
    lowered = host.lower()
    if host not in {"localhost", "127.0.0.1", "::1"} or "supabase" in lowered or "pooler" in lowered:
        raise RuntimeError("Refusing to run outside a local disposable database")


def psql(database, sql):
    completed = subprocess.run(
        [PSQL, "-d", database, "-X", "-v", "ON_ERROR_STOP=1", "-f", "-"],
        input=sql,
        text=True,
        capture_output=True,
        check=False,
    )
    return completed.returncode, completed.stdout + completed.stderr


def admin(sql):
    code, output = psql("postgres", sql)
    if code != 0:
        raise RuntimeError(output)
    return output


def require_ok(database, sql, marker):
    code, output = psql(database, sql)
    if code != 0 or marker not in output:
        raise RuntimeError(output)
    return output


def views_unchanged(database):
    require_ok(
        database,
        """
        do $views$
        declare
          relation_name text;
        begin
          foreach relation_name in array ARRAY['wa_dshs_listed_facilities', 'wa_afh_map_facilities', 'or_odhs_listed_afh']
          loop
            if (select definition from nchf_roster_fixture.preserved where name = relation_name)
               is distinct from pg_get_viewdef(format('public.%I', relation_name)::regclass, true) then
              raise exception 'directory view changed';
            end if;
          end loop;
        end
        $views$;
        select 'VIEWS_UNCHANGED';
        """,
        "VIEWS_UNCHANGED",
    )


def main():
    for path in (FIXTURE, PROPOSAL, ROLLBACK, CHECKS):
        if not path.is_file():
            print(f"Missing {path}", file=sys.stderr)
            return 2
    try:
        refuse_remote()
        admin("select current_setting('server_version_num');")
        admin(f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE); CREATE DATABASE {DATABASE};")
        proposal = PROPOSAL.read_text(encoding="utf-8")
        rollback = ROLLBACK.read_text(encoding="utf-8")
        code, output = psql(DATABASE, proposal)
        if code == 0 or "later development-only authorization" not in output:
            print(output, file=sys.stderr)
            return 1
        require_ok(DATABASE, FIXTURE.read_text(encoding="utf-8") + APPLY + proposal, "COMMIT")
        require_ok(DATABASE, CHECKS.read_text(encoding="utf-8"), "NATIONWIDE_ROSTER_CHECKS_READY")
        require_ok(DATABASE, "select count(*) from public.nationwide_roster;", "0")
        views_unchanged(DATABASE)
        require_ok(DATABASE, EMPTY_ROLLBACK + rollback, "COMMIT")
        require_ok(DATABASE, "select to_regclass('public.nationwide_roster') is null;", "t")
        views_unchanged(DATABASE)
        require_ok(DATABASE, APPLY + proposal, "COMMIT")
        require_ok(DATABASE, SAMPLE_ROW + "select count(*) from public.nationwide_roster;", "1")
        code, output = psql(DATABASE, EMPTY_ROLLBACK + rollback)
        if code == 0 or "table has rows" not in output:
            print(output, file=sys.stderr)
            return 1
        require_ok(DATABASE, "select count(*) from public.nationwide_roster;", "1")
        views_unchanged(DATABASE)
        require_ok(DATABASE, POPULATED_ROLLBACK + rollback, "COMMIT")
        require_ok(DATABASE, "select to_regclass('public.nationwide_roster') is null;", "t")
        views_unchanged(DATABASE)
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 1
    finally:
        try:
            refuse_remote()
            admin(f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE);")
        except RuntimeError as error:
            print(error, file=sys.stderr)
            return 1
    print("NATIONWIDE_ROSTER_PROPOSAL_READY")
    return 0


if __name__ == "__main__":
    sys.exit(main())
