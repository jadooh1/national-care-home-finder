#!/usr/bin/env python3
"""Apply the premium gate proposal on a local disposable database only."""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = Path(__file__).with_name("premium_owner_text_gate_fixture.sql")
PROPOSAL = ROOT / "20261113200000_premium_owner_text_gate.sql"
CHECKS = Path(__file__).with_name("premium_owner_text_gate_checks.sql")
ROLLBACK = ROOT / "20261113200000_premium_owner_text_gate_ROLLBACK.sql"
DATABASE = "premium_owner_text_gate"
PREAMBLE = """
select set_config('nchf.premium_gate_authorization', 'authorize-premium-owner-text-gate', false);
select set_config('nchf.premium_gate_target', 'yiehgstweswxjakbcdzc', false);
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


def main():
    refuse_remote()
    for path in (FIXTURE, PROPOSAL, CHECKS, ROLLBACK):
        if not path.is_file():
            raise RuntimeError(f"missing {path}")
    code, output = psql("postgres", f"drop database if exists {DATABASE}; create database {DATABASE};")
    if code != 0:
        raise RuntimeError(output)
    for path, prefix in (
        (FIXTURE, ""),
        (PROPOSAL, PREAMBLE),
        (CHECKS, ""),
        (ROLLBACK, PREAMBLE),
    ):
        code, output = psql(DATABASE, prefix + path.read_text(encoding="utf-8"))
        if code != 0:
            raise RuntimeError(output)
    code, output = psql("postgres", f"drop database if exists {DATABASE};")
    if code != 0:
        raise RuntimeError(output)
    print("premium owner-text gate checks passed")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(error, file=sys.stderr)
        sys.exit(1)
