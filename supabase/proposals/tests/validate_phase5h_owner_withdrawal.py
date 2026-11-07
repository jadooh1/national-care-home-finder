#!/usr/bin/env python3
"""Run the Phase 5H withdrawal checks on disposable local PostgreSQL.

The connection comes from PGHOST, PGPORT, PGUSER, and PGPASSWORD. Those values
must point at a local disposable server. This script does not connect to
Supabase or production, and it drops the temporary database before returning.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "proposals" / "tests" / "phase5c_owner_claim_fixture.sql"
MIGRATION = ROOT / "migrations" / "20261106160000_phase5c_owner_claim_controls.sql"
PUBLICATION = ROOT / "migrations" / "20261107120000_phase5g_owner_listing_publication.sql"
WITHDRAWAL = ROOT / "migrations" / "20261107140000_phase5h_owner_listing_withdrawal.sql"
CHECKS = ROOT / "proposals" / "tests" / "phase5h_owner_withdrawal_checks.sql"
DATABASE = "phase5h_withdrawal"


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
    for path in (FIXTURE, MIGRATION, PUBLICATION, WITHDRAWAL, CHECKS):
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
        for path in (FIXTURE, MIGRATION, PUBLICATION, WITHDRAWAL, CHECKS):
            code, output = psql(DATABASE, path.read_text(encoding="utf-8"))
            if code != 0 or (path == CHECKS and "PHASE5H_READY" not in output):
                print(output, file=sys.stderr)
                return 1
        print(
            "PASS | phase 5h owner withdrawal | withdrawn text leaves the public profile and the audit history remains",
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
