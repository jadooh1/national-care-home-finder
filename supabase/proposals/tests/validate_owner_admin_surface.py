#!/usr/bin/env python3
"""Validate the owner/admin surface proposal on disposable local PostgreSQL.

The connection comes from PGHOST, PGPORT, PGUSER, and PGPASSWORD. Those values
must point at a local disposable server. This script does not connect to
Supabase or production, and it drops the temporary database before returning.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROPOSAL = ROOT / "proposals" / "20261108040000_owner_admin_surface.sql"
ROLLBACK = ROOT / "proposals" / "20261108040000_owner_admin_surface_ROLLBACK.sql"
FIXTURE = ROOT / "proposals" / "tests" / "owner_admin_surface_fixture.sql"
CHECKS = ROOT / "proposals" / "tests" / "owner_admin_surface_checks.sql"
DATABASE = "owner_admin_surface"


def refuse_remote():
    host = os.environ.get("PGHOST", "")
    if host not in {"localhost", "127.0.0.1", "::1"}:
        raise RuntimeError("Refusing to run outside a local disposable database")


def psql(database, sql):
    completed = subprocess.run(
        ["psql", "-d", database, "-X", "-v", "ON_ERROR_STOP=1", "-f", "-"],
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


def settings():
    return """
select set_config('nchf.owner_admin_surface_authorization', 'authorize-owner-admin-surface', true);
select set_config('nchf.owner_admin_surface_target', 'yiehgstweswxjakbcdzc', true);
"""


def main():
    for path in (PROPOSAL, ROLLBACK, FIXTURE, CHECKS):
        if not path.is_file():
            print(f"Missing {path}", file=sys.stderr)
            return 2
    try:
        refuse_remote()
        admin("select 1;")
        admin(f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE); CREATE DATABASE {DATABASE};")
        script = "\n".join([
            "begin;",
            FIXTURE.read_text(encoding="utf-8"),
            settings(),
            PROPOSAL.read_text(encoding="utf-8"),
            PROPOSAL.read_text(encoding="utf-8"),
            "savepoint before_use;",
            ROLLBACK.read_text(encoding="utf-8"),
            "rollback to savepoint before_use;",
            CHECKS.read_text(encoding="utf-8"),
            "rollback;",
        ])
        code, output = psql(DATABASE, script)
        if code != 0:
            print(output, file=sys.stderr)
            return 1
        wrong_target = "\n".join([
            "begin;",
            FIXTURE.read_text(encoding="utf-8"),
            "select set_config('nchf.owner_admin_surface_authorization', 'authorize-owner-admin-surface', true);",
            "select set_config('nchf.owner_admin_surface_target', 'ajjsyloyihcqdomywhik', true);",
            PROPOSAL.read_text(encoding="utf-8"),
            "rollback;",
        ])
        code, output = psql(DATABASE, wrong_target)
        if code == 0 or "owner admin surface target is not the reviewed production project" not in output:
            print(output, file=sys.stderr)
            return 1
        admin("DROP DATABASE IF EXISTS eligibility_dry_run WITH (FORCE); CREATE DATABASE eligibility_dry_run;")
        classifier = """
create table public.facilities (
  id uuid primary key,
  canonical_name text not null,
  facility_type text not null,
  state_code text not null,
  license_number text,
  record_status text not null,
  presence text
);
insert into public.facilities values
  ('00000000-0000-4000-8000-000000000011', 'Unique', 'AF', 'WA', '100', 'unverified', null),
  ('00000000-0000-4000-8000-000000000012', 'Outside', 'AF', 'WA', '200', 'unverified', null),
  ('00000000-0000-4000-8000-000000000013', 'Shared A', 'AF', 'WA', '300', 'unverified', null),
  ('00000000-0000-4000-8000-000000000014', 'Shared B', 'AF', 'WA', '300', 'unverified', null);
create view public.wa_dshs_listed_facilities as
select id from public.facilities where id <> '00000000-0000-4000-8000-000000000012';
"""
        code, output = psql("eligibility_dry_run", classifier)
        if code != 0:
            print(output, file=sys.stderr)
            return 1
        code, output = psql("eligibility_dry_run", (ROOT / "proposals" / "20261108040000_claim_eligibility_dry_run.sql").read_text(encoding="utf-8"))
        compact = " ".join(output.split())
        if code != 0 or "0 | 1 | 1 | 2 | 0" not in compact:
            print(output, file=sys.stderr)
            return 1
        print("PASS | claim eligibility dry run | 0 eligible, 1 unique, 1 unmatched, 2 ambiguous", flush=True)
        print("PASS | owner admin surface | local authorization, RLS, and rollback", flush=True)
        return 0
    finally:
        try:
            admin(
                "DROP DATABASE IF EXISTS "
                + DATABASE
                + " WITH (FORCE); DROP DATABASE IF EXISTS eligibility_dry_run WITH (FORCE);"
            )
        except RuntimeError as error:
            print(error, file=sys.stderr)
            return 1


if __name__ == "__main__":
    sys.exit(main())
