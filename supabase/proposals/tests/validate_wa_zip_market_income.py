#!/usr/bin/env python3
"""Validate the Washington ZIP market view on disposable local PostgreSQL.

The connection comes from PGHOST, PGPORT, PGUSER, and PGPASSWORD. Those values
must point at a local disposable server. This script does not connect to
Supabase or production, and it drops the temporary database before returning.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "proposals" / "tests" / "wa_zip_market_income_fixture.sql"
PROPOSAL = ROOT / "proposals" / "20261111013000_wa_zip_market_income.sql"
CHECKS = ROOT / "proposals" / "tests" / "wa_zip_market_income_checks.sql"
ROLLBACK = ROOT / "proposals" / "20261111013000_wa_zip_market_income_rollback.sql"
DATABASE = "wa_zip_market_income"
HAPPY_DATA = """
insert into public.fixture_wa_facilities (postal_code, licensed_capacity) values
  ('98101', 6),
  ('981010000', 4),
  ('98102-1234', null),
  ('98103', 5);
insert into public.wa_zip_market_census_staging (
  zip_code, population_total, age_60_69, age_70_79, age_80_84, age_85_plus,
  median_household_income, median_income_margin_error, total_households, households_100k_plus
) values
  ('98101', 100, 16, 8, 4, 2, 80000, 1200, 10, 4),
  ('98102', 40, null, 3, 1, 1, 250001, null, 8, 2),
  ('98001', null, null, null, null, null, null, null, 0, null);
select set_config('nchf.wa_market_expected_facilities', '4', false);
select set_config('nchf.wa_market_expected_zctas', '3', false);
"""
ACCEPTANCE = """
\\pset format unaligned
\\pset tuples_only on
\\pset fieldsep '|'
select zip_code, total_afhs, homes_with_capacity, known_licensed_beds,
       age_70_plus, households_100k_plus_pct, census_period
from public.wa_zip_market_income
order by zip_code;
"""
PERIOD = "2020\u20132024"
EXPECTED_ROWS = "\n".join([
    f"98001|0|0|0|||{PERIOD}",
    f"98101|2|2|10|14|40.0000|{PERIOD}",
    f"98102|1|0|0|5|25.0000|{PERIOD}",
    "98103|1|1|5|||",
])


def refuse_remote():
    host = os.environ.get("PGHOST", "")
    if host not in {"localhost", "127.0.0.1", "::1"}:
        raise RuntimeError("Refusing to run outside a local disposable database")


def psql(database, sql):
    completed = subprocess.run(
        ["psql", "-d", database, "-X", "-v", "ON_ERROR_STOP=1", "-f", "-"],
        input=sql.encode("utf-8"),
        capture_output=True,
        check=False,
    )
    output = (completed.stdout + completed.stderr).decode("utf-8", errors="replace")
    return completed.returncode, output


def admin(sql):
    code, output = psql("postgres", sql)
    if code != 0:
        raise RuntimeError(output)
    return output


def require_success(sql, marker):
    code, output = psql(DATABASE, sql)
    if code != 0 or marker not in output:
        raise RuntimeError(output)
    return output


def require_failure(sql, marker):
    code, output = psql(DATABASE, sql)
    if code == 0 or marker not in output:
        raise RuntimeError(output)


def recreate():
    admin(f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE); CREATE DATABASE {DATABASE};")
    require_success(FIXTURE.read_text(encoding="utf-8"), "CREATE VIEW")


def main():
    for path in (FIXTURE, PROPOSAL, CHECKS, ROLLBACK):
        if not path.is_file():
            print(f"Missing {path}", file=sys.stderr)
            return 2
    try:
        refuse_remote()
        version = admin("select current_setting('server_version_num');")
        version_numbers = [line.strip() for line in version.splitlines() if line.strip().isdigit()]
        if not version_numbers or int(version_numbers[-1]) < 160000:
            print(version, file=sys.stderr)
            return 2
        print(version.strip(), flush=True)

        recreate()
        require_failure(
            PROPOSAL.read_text(encoding="utf-8") + CHECKS.read_text(encoding="utf-8"),
            "expected facility and ZCTA counts",
        )

        recreate()
        require_success(PROPOSAL.read_text(encoding="utf-8"), "CREATE VIEW")
        require_failure(
            "insert into public.fixture_wa_facilities (postal_code, licensed_capacity) values ('ABCDE', 1);\n"
            "select set_config('nchf.wa_market_expected_facilities', '1', false);\n"
            "select set_config('nchf.wa_market_expected_zctas', '0', false);\n"
            + CHECKS.read_text(encoding="utf-8"),
            "reconciliation failed",
        )

        recreate()
        require_success(PROPOSAL.read_text(encoding="utf-8"), "CREATE VIEW")
        require_failure(
            "insert into public.wa_zip_market_census_staging (zip_code, median_household_income) values ('98101', 2499);",
            "wa_zip_market_census_median_code",
        )
        require_failure(
            "insert into public.wa_zip_market_census_staging (zip_code, median_income_margin_error) values ('98101', -333333333);",
            "wa_zip_market_census_margin_code",
        )

        recreate()
        require_success(PROPOSAL.read_text(encoding="utf-8") + HAPPY_DATA, "set_config")
        require_failure(
            "set role anon; select count(*) from public.wa_zip_market_income;",
            "permission denied",
        )
        require_success(
            "select set_config('nchf.wa_market_expected_facilities', '4', false);\n"
            "select set_config('nchf.wa_market_expected_zctas', '3', false);\n"
            + CHECKS.read_text(encoding="utf-8"),
            "WA_ZIP_MARKET_INCOME_READY",
        )
        output = require_success(ACCEPTANCE, "98101")
        for expected in EXPECTED_ROWS.splitlines():
            if expected not in output:
                raise RuntimeError(output)
        require_failure(
            "revoke select on table public.wa_zip_market_census_staging from anon;\n"
            "set role anon; select count(*) from public.wa_zip_market_income;",
            "permission denied",
        )
        require_success(
            "grant select on table public.wa_zip_market_census_staging to anon;\n"
            "set role anon; select count(*) from public.wa_zip_market_income;\n"
            "reset role;",
            "4",
        )
        require_failure(
            "set role anon; insert into public.wa_zip_market_census_staging (zip_code) values ('98104');",
            "permission denied",
        )
        require_success(ROLLBACK.read_text(encoding="utf-8"), "DROP TABLE")
        require_failure("select count(*) from public.wa_zip_market_income;", "does not exist")
        print("PASS | Washington ZIP market income | 4 facilities and 3 ZCTAs reconcile", flush=True)
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
