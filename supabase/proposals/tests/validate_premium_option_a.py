#!/usr/bin/env python3
"""Run the Option A premium checks on disposable local PostgreSQL.

The connection comes from PGHOST, PGPORT, PGUSER, and PGPASSWORD. Those values
must point at a local disposable server. This script does not connect to
Supabase or production, and it drops the temporary database before returning.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "proposals" / "tests" / "premium_option_a_fixture.sql"
PROPOSAL = ROOT / "proposals" / "20261109120000_premium_option_a_development.sql"
CHECKS = ROOT / "proposals" / "tests" / "premium_option_a_checks.sql"
DATABASE = "premium_option_a"
PREAMBLE = """
select set_config('nchf.billing_environment', 'development', false);
select set_config('nchf.supabase_project_ref', 'ajjsyloyihcqdomywhik', false);
"""


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


def main():
    for path in (FIXTURE, PROPOSAL, CHECKS):
        if not path.is_file():
            print(f"Missing {path}", file=sys.stderr)
            return 2
    try:
        refuse_remote()
        version = admin("select current_setting('server_version_num');")
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 2
    print(version.strip(), flush=True)
    version_numbers = [line.strip() for line in version.splitlines() if line.strip().isdigit()]
    if not version_numbers or int(version_numbers[-1]) < 160000:
        print(version, file=sys.stderr)
        return 2
    try:
        admin(f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE); CREATE DATABASE {DATABASE};")
        code, output = psql(DATABASE, FIXTURE.read_text(encoding="utf-8"))
        if code != 0:
            print(output, file=sys.stderr)
            return 1
        code, output = psql(DATABASE, PROPOSAL.read_text(encoding="utf-8"))
        if code == 0 or "premium ledger requires nchf.billing_environment=development" not in output:
            print(output, file=sys.stderr)
            return 1
        code, output = psql(
            DATABASE,
            PREAMBLE + PROPOSAL.read_text(encoding="utf-8") + CHECKS.read_text(encoding="utf-8"),
        )
        if code != 0 or "PREMIUM_OPTION_A_READY" not in output:
            print(output, file=sys.stderr)
            return 1
        print(
            "PASS | option A premium ledger | owner text stays hidden without an open development subscription",
            flush=True,
        )
        return 0
    finally:
        try:
            admin(f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE);")
        except RuntimeError as error:
            print(error, file=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())
