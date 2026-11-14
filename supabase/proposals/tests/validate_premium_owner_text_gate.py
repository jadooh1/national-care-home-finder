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


def require(database, sql):
    code, output = psql(database, sql)
    if code != 0:
        raise RuntimeError(output)


def main():
    refuse_remote()
    for path in (FIXTURE, PROPOSAL, CHECKS, ROLLBACK):
        if not path.is_file():
            raise RuntimeError(f"missing {path}")
    proposal = PREAMBLE + PROPOSAL.read_text(encoding="utf-8")
    rollback = PREAMBLE + ROLLBACK.read_text(encoding="utf-8")
    require("postgres", f"drop database if exists {DATABASE}; create database {DATABASE};")
    require(DATABASE, FIXTURE.read_text(encoding="utf-8"))
    require(DATABASE, proposal)
    require(DATABASE, CHECKS.read_text(encoding="utf-8"))
    occupied = """
    insert into public.premium_subscriptions (facility_id, status, current_period_end)
    values ('00000000-0000-4000-8000-0000000000e2', 'active', now() + interval '1 day');
    """
    require(DATABASE, occupied)
    code, output = psql(DATABASE, rollback, on_error_stop=False)
    if "refuses existing entitlement rows" not in output:
        raise RuntimeError(output or f"rollback exit {code}")
    require(
        DATABASE,
        """
        delete from public.premium_subscriptions
        where facility_id = '00000000-0000-4000-8000-0000000000e2';
        """,
    )
    require(DATABASE, rollback)
    require(
        DATABASE,
        """
        do $closed$
        begin
          if has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT') then
            raise exception 'rollback reopened the ungated view';
          end if;
          if to_regclass('public.published_owner_listings') is null then
            raise exception 'rollback removed publication records';
          end if;
        end;
        $closed$;
        """,
    )
    require("postgres", f"drop database if exists {DATABASE};")

    development = f"{DATABASE}_development"
    require("postgres", f"drop database if exists {development}; create database {development};")
    require(development, FIXTURE.read_text(encoding="utf-8"))
    require(
        development,
        """
        create function public.development_record_premium_subscription(
          p_facility_id uuid,
          p_owner_user_id uuid,
          p_status text,
          p_period_end timestamptz,
          p_cancel_at_period_end boolean,
          p_provider_reference text
        ) returns uuid language sql as $$ select null::uuid $$;
        create view public.wa_afh_claimed_owner_content as
        select facility_id from public.published_owner_listings;
        """,
    )
    code, output = psql(development, proposal, on_error_stop=False)
    if "refuses the development database" not in output:
        raise RuntimeError(output)
    require(
        development,
        """
        do $unchanged$
        begin
          if to_regclass('public.premium_subscriptions') is not null then
            raise exception 'development refusal created a subscription table';
          end if;
          if not has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT') then
            raise exception 'development refusal changed the ungated grant';
          end if;
        end;
        $unchanged$;
        """,
    )
    require("postgres", f"drop database if exists {development};")
    print("premium owner-text gate checks passed")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(error, file=sys.stderr)
        sys.exit(1)
