#!/usr/bin/env python3
"""Test the development owner eligibility seam on disposable PostgreSQL.

The connection comes from PGHOST, PGPORT, PGUSER, and PGPASSWORD. Those values
must point at a local disposable server. This script does not connect to
Supabase or production and does not publish owner text.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "proposals" / "tests" / "phase5c_owner_claim_fixture.sql"
CLAIMS = ROOT / "migrations" / "20261106160000_phase5c_owner_claim_controls.sql"
PUBLICATION = ROOT / "migrations" / "20261107120000_phase5g_owner_listing_publication.sql"
GRANTS = ROOT / "migrations" / "20261109140000_development_owner_text_grants.sql"
BASELINE = ROOT / "proposals" / "tests" / "owner_eligibility_baseline.sql"
PROPOSAL = ROOT / "proposals" / "20261113223000_owner_facility_eligibility_REVIEW_ONLY.sql"
CHECKS = ROOT / "proposals" / "tests" / "owner_eligibility_checks.sql"
REFUSAL_CHECKS = ROOT / "proposals" / "tests" / "owner_eligibility_refusal_checks.sql"
ROLLBACK = ROOT / "proposals" / "20261113223000_owner_facility_eligibility_ROLLBACK.sql"
ROLLBACK_REFUSAL_CHECKS = ROOT / "proposals" / "tests" / "owner_eligibility_rollback_refusal_checks.sql"
ROLLBACK_CHECKS = ROOT / "proposals" / "tests" / "owner_eligibility_rollback_checks.sql"
DATABASE = "owner_eligibility_seam"
DEVELOPMENT = (
    "select set_config('nchf.billing_environment', 'development', false);\n"
    "select set_config('nchf.supabase_project_ref', 'ajjsyloyihcqdomywhik', false);\n"
    "grant select on table public.wa_dshs_listed_facilities to anon, authenticated;\n"
)


def refuse_remote():
    host = os.environ.get("PGHOST", "")
    if host not in {"localhost", "127.0.0.1", "::1"}:
        raise RuntimeError("Refusing to run outside a local disposable database")


def psql(database, sql, on_error_stop=True):
    completed = subprocess.run(
        [
            "psql",
            "-d",
            database,
            "-X",
            "-v",
            "ON_ERROR_STOP=1" if on_error_stop else "ON_ERROR_STOP=0",
            "-f",
            "-",
        ],
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


def run(database, sql):
    code, output = psql(database, sql)
    if code != 0:
        raise RuntimeError(output)
    return output


def session_settings(billing, project=None):
    sql = f"select set_config('nchf.billing_environment', '{billing}', false);\n"
    if project is None:
        sql += "reset nchf.supabase_project_ref;\n"
    else:
        sql += f"select set_config('nchf.supabase_project_ref', '{project}', false);\n"
    return sql


def expect_refusal(database, statement, expected, unchanged):
    code, output = psql(database, statement, on_error_stop=False)
    if expected not in output:
        raise RuntimeError(output)
    if code not in {0, 3}:
        raise RuntimeError(output)
    run(database, unchanged)


def main():
    proposal_text = PROPOSAL.read_text(encoding="utf-8")
    if "grant select" in proposal_text.lower() or "facility_type = 'AF'" in proposal_text:
        print("Proposal widens a view grant or names the production AF predicate", file=sys.stderr)
        return 1
    try:
        refuse_remote()
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 2
    try:
        admin(f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE); CREATE DATABASE {DATABASE};")
        for path in (FIXTURE, CLAIMS, PUBLICATION):
            run(DATABASE, path.read_text(encoding="utf-8"))
        run(DATABASE, DEVELOPMENT + GRANTS.read_text(encoding="utf-8"))
        run(DATABASE, BASELINE.read_text(encoding="utf-8"))
        refusal_checks = REFUSAL_CHECKS.read_text(encoding="utf-8")
        forward_refusals = (
            ("production", "ajjsyloyihcqdomywhik", "owner eligibility seam requires nchf.billing_environment=development"),
            ("development", None, "owner eligibility seam requires the development project"),
            ("development", "not-the-development-project", "owner eligibility seam requires the development project"),
            ("development", "yiehgstweswxjakbcdzc", "owner eligibility seam requires the development project"),
        )
        for billing, project, expected in forward_refusals:
            expect_refusal(
                DATABASE,
                session_settings(billing, project) + proposal_text,
                expected,
                refusal_checks,
            )
        run(DATABASE, DEVELOPMENT + proposal_text)
        run(DATABASE, CHECKS.read_text(encoding="utf-8"))
        rollback_text = ROLLBACK.read_text(encoding="utf-8")
        rollback_refusal_checks = ROLLBACK_REFUSAL_CHECKS.read_text(encoding="utf-8")
        rollback_refusals = (
            ("production", "ajjsyloyihcqdomywhik", "owner eligibility rollback requires nchf.billing_environment=development"),
            ("development", None, "owner eligibility rollback requires the development project"),
            ("development", "not-the-development-project", "owner eligibility rollback requires the development project"),
            ("development", "yiehgstweswxjakbcdzc", "owner eligibility rollback requires the development project"),
        )
        for billing, project, expected in rollback_refusals:
            expect_refusal(
                DATABASE,
                session_settings(billing, project) + rollback_text,
                expected,
                rollback_refusal_checks,
            )
        run(DATABASE, DEVELOPMENT + rollback_text)
        run(DATABASE, ROLLBACK_CHECKS.read_text(encoding="utf-8"))
        print("PASS | owner eligibility seam | Washington results and privileges stayed unchanged", flush=True)
        return 0
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 1
    finally:
        try:
            admin(f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE);")
        except RuntimeError as error:
            print(error, file=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())
