#!/usr/bin/env python3
"""Check the owner listing read path on a local disposable database only."""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLAIMED_FIXTURE = Path(__file__).with_name("owner_listing_claimed_fixture.sql")
CLAIMED_GRANTS = ROOT / "20261109140000_development_owner_text_grants.sql"
CLAIMED_CHECKS = Path(__file__).with_name("owner_listing_claimed_checks.sql")
REVIEW_FIXTURE = Path(__file__).with_name("owner_listing_review_fixture.sql")
REVIEW_PROPOSAL = ROOT / "20261113210000_owner_listing_read_REVIEW_ONLY.sql"
REVIEW_CHECKS = Path(__file__).with_name("owner_listing_review_checks.sql")
DEVELOPMENT_PREAMBLE = """
set search_path to public, auth;
select set_config('nchf.billing_environment', 'development', false);
select set_config('nchf.supabase_project_ref', 'ajjsyloyihcqdomywhik', false);
"""
REVIEW_PREAMBLE = """
set search_path to public, auth;
select set_config('nchf.owner_listing_authorization', 'review-owner-listing-read', false);
select set_config('nchf.owner_listing_target', 'yiehgstweswxjakbcdzc', false);
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
    paths = (
        CLAIMED_FIXTURE,
        CLAIMED_GRANTS,
        CLAIMED_CHECKS,
        REVIEW_FIXTURE,
        REVIEW_PROPOSAL,
        REVIEW_CHECKS,
    )
    for path in paths:
        if not path.is_file():
            raise RuntimeError(f"missing {path}")

    require("postgres", "drop database if exists owner_listing_claimed; create database owner_listing_claimed;")
    require("owner_listing_claimed", CLAIMED_FIXTURE.read_text(encoding="utf-8"))
    refused = DEVELOPMENT_PREAMBLE.replace(
        "ajjsyloyihcqdomywhik",
        "yiehgstweswxjakbcdzc",
    ) + CLAIMED_GRANTS.read_text(encoding="utf-8")
    code, output = psql("owner_listing_claimed", refused)
    if code == 0 or "refusing the production project" not in output:
        raise RuntimeError(output or f"development grant exit {code}")
    require(
        "owner_listing_claimed",
        """
        do $still_open$
        begin
          if to_regclass('public.wa_afh_claimed_owner_content') is not null then
            raise exception 'refused grant created the claimed view';
          end if;
          if not has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT') then
            raise exception 'refused grant changed the ungated view';
          end if;
        end;
        $still_open$;
        """,
    )
    require(
        "owner_listing_claimed",
        DEVELOPMENT_PREAMBLE + CLAIMED_GRANTS.read_text(encoding="utf-8"),
    )
    require("owner_listing_claimed", CLAIMED_CHECKS.read_text(encoding="utf-8"))
    for denied in (
        "set role anon; select count(*) from public.wa_afh_claimed_owner_content;",
        "set role authenticated; select count(*) from public.wa_afh_published_owner_content;",
    ):
        code, output = psql("owner_listing_claimed", denied, on_error_stop=False)
        if "permission denied" not in output:
            raise RuntimeError(output or f"expected permission denied, exit {code}")
    require(
        "owner_listing_claimed",
        "revoke select on table public.wa_afh_claimed_owner_content from authenticated;",
    )
    code, output = psql(
        "owner_listing_claimed",
        """
        select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
        set role authenticated;
        select count(*) from public.wa_afh_claimed_owner_content;
        """,
        on_error_stop=False,
    )
    if "permission denied" not in output:
        raise RuntimeError(output or f"expected database failure, exit {code}")
    require("postgres", "drop database if exists owner_listing_claimed;")

    require("postgres", "drop database if exists owner_listing_review; create database owner_listing_review;")
    require("owner_listing_review", REVIEW_FIXTURE.read_text(encoding="utf-8"))
    unchanged = """
    do $unchanged$
    begin
      if to_regclass('public.wa_afh_claimed_owner_content') is not null then
        raise exception 'failed preflight left the claimed view';
      end if;
      if not has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT')
         or not has_table_privilege('service_role', 'public.wa_afh_published_owner_content', 'SELECT')
         or not has_table_privilege('service_role', 'public.published_owner_listings', 'SELECT')
         or not has_function_privilege('authenticated', 'public.admin_list_published_owner_listings()', 'EXECUTE') then
        raise exception 'failed preflight changed an existing privilege';
      end if;
    end;
    $unchanged$;
    """
    failures = (
        (REVIEW_PROPOSAL.read_text(encoding="utf-8"), "requires review authorization"),
        (
            REVIEW_PREAMBLE.replace("yiehgstweswxjakbcdzc", "ajjsyloyihcqdomywhik")
            + REVIEW_PROPOSAL.read_text(encoding="utf-8"),
            "refuses this database target",
        ),
    )
    for sql, expected in failures:
        code, output = psql("owner_listing_review", sql, on_error_stop=False)
        if expected not in output:
            raise RuntimeError(output or f"failed preflight exit {code}")
        require("owner_listing_review", unchanged)
    require(
        "owner_listing_review",
        "create function public.nchf_phase5g_facility_is_listed(p_facility_id uuid) returns boolean language sql as $$ select false $$;",
    )
    code, output = psql(
        "owner_listing_review",
        REVIEW_PREAMBLE + REVIEW_PROPOSAL.read_text(encoding="utf-8"),
        on_error_stop=False,
    )
    if "refuses the development listing function" not in output:
        raise RuntimeError(output or f"development refusal exit {code}")
    require("owner_listing_review", unchanged)
    require("owner_listing_review", "drop function public.nchf_phase5g_facility_is_listed(uuid);")
    require("owner_listing_review", REVIEW_PREAMBLE + REVIEW_PROPOSAL.read_text(encoding="utf-8"))
    require("owner_listing_review", REVIEW_CHECKS.read_text(encoding="utf-8"))
    for denied in (
        "set role anon; select count(*) from public.wa_afh_claimed_owner_content;",
        "set role authenticated; select count(*) from public.wa_afh_published_owner_content;",
        "set role service_role; select count(*) from public.wa_afh_claimed_owner_content;",
        "set role authenticated; insert into public.wa_afh_claimed_owner_content (facility_id, field_name, published_value, published_at) values ('00000000-0000-4000-8000-000000000101', 'description', 'browser write', now());",
        "set role anon; delete from public.wa_afh_claimed_owner_content;",
    ):
        code, output = psql("owner_listing_review", denied, on_error_stop=False)
        if "permission denied" not in output and "cannot insert into view" not in output and "cannot delete from view" not in output:
            raise RuntimeError(output or f"expected a denied browser operation, exit {code}")
    require("postgres", "drop database if exists owner_listing_review;")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(error, file=sys.stderr)
        sys.exit(1)
