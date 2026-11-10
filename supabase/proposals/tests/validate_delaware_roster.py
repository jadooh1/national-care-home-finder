#!/usr/bin/env python3
"""Validate the Delaware roster pilot on disposable PostgreSQL.

PGHOST must be localhost. This script does not connect to Supabase.
"""

import os
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / "scripts" / "nationwide"))

from delaware_development_adapter import execute, execute_rollback  # noqa: E402
from delaware_roster import PILOT_BATCH, map_listing, summary  # noqa: E402

PROPOSAL = REPO / "supabase" / "proposals" / "20261110090000_nationwide_roster_development.sql"
BATCH = REPO / "supabase" / "proposals" / "20261110120000_nationwide_roster_ingestion_batch.sql"
ROLLBACK = REPO / "supabase" / "proposals" / "20261110130000_delaware_roster_ingestion_ROLLBACK.sql"
DATABASE = "delaware_roster_pilot"
PSQL = os.environ.get("PSQL", "psql")
NC_BATCH = "north-carolina-dhhs-roster-pilot-20261110"


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


def require_ok(database, sql, marker):
    output = psql(database, sql)
    if marker not in output:
        raise RuntimeError(output)
    return output


def child(name, address, license_identifier):
    return f"""
<div class="wp-block-esab-accordion-child">
  <h2 class="esab__heading_tag">{name}</h2>
  <table><tr><td><strong>Address</strong></td><td>{address}</td></tr>
  <tr><td><strong>License #</strong></td><td>{license_identifier}</td></tr></table>
</div>
"""


def write_listing(html):
    handle = Path(os.environ.get("TEMP", "/tmp")) / "nchf-de-synthetic.html"
    handle.write_text(html, encoding="utf-8")
    return str(handle)


def apply_schema():
    fixture = """
create view public.wa_dshs_listed_facilities as select 0::integer as preserved_count where false;
create view public.wa_afh_map_facilities as select 0::integer as preserved_count where false;
create view public.or_odhs_listed_afh as select 0::integer as preserved_count where false;
create schema if not exists nchf_de_fixture;
create table nchf_de_fixture.preserved (name text primary key, definition text not null);
insert into nchf_de_fixture.preserved(name, definition)
select cls.relname, pg_get_viewdef(cls.oid, true)
from pg_class as cls
join pg_namespace as namespace on namespace.oid = cls.relnamespace
where namespace.nspname = 'public'
  and cls.relname in ('wa_dshs_listed_facilities', 'wa_afh_map_facilities', 'or_odhs_listed_afh');
"""
    proposal = PROPOSAL.read_text(encoding="utf-8")
    require_ok(
        DATABASE,
        "select set_config('nchf.nationwide_roster_authorization', 'authorize-development-nationwide-roster', false);\n"
        + fixture
        + proposal,
        "COMMIT",
    )
    batch = BATCH.read_text(encoding="utf-8")
    refused = subprocess.run(
        [PSQL, "-d", DATABASE, "-X", "-v", "ON_ERROR_STOP=1", "-f", "-"],
        input=batch,
        text=True,
        capture_output=True,
        check=False,
    )
    if refused.returncode == 0 or "later development-only authorization" not in (refused.stdout + refused.stderr):
        raise RuntimeError(refused.stdout + refused.stderr)
    require_ok(
        DATABASE,
        "select set_config('nchf.nationwide_roster_batch_authorization', 'authorize-development-nationwide-roster-batch', false);\n"
        + batch,
        "COMMIT",
    )


def views_unchanged():
    require_ok(
        DATABASE,
        """
        do $views$
        declare
          relation_name text;
          preserved text;
          current_definition text;
        begin
          foreach relation_name in array ARRAY['wa_dshs_listed_facilities', 'wa_afh_map_facilities', 'or_odhs_listed_afh']
          loop
            select definition into preserved from nchf_de_fixture.preserved where name = relation_name;
            select pg_get_viewdef(format('public.%I', relation_name)::regclass, true) into current_definition;
            if preserved is distinct from current_definition then
              raise exception 'FAIL % definition changed', relation_name;
            end if;
          end loop;
        end
        $views$;
        select 'VIEWS_UNCHANGED';
        """,
        "VIEWS_UNCHANGED",
    )


def count_sql(where):
    output = psql(DATABASE, f"select count(*) from public.nationwide_roster where {where};")
    for line in output.splitlines():
        stripped = line.strip()
        if stripped.isdigit():
            return int(stripped)
    raise RuntimeError(output)


def use_disposable_adapter():
    os.environ["NCHF_DE_DEVELOPMENT_EXECUTION"] = "authorize-development-delaware-roster-execution"
    os.environ["NCHF_DE_EXECUTION_TARGET"] = "disposable"


def main():
    for path in (PROPOSAL, BATCH, ROLLBACK):
        if not path.is_file():
            print(f"Missing {path}", file=sys.stderr)
            return 2
    try:
        refuse_remote()
        psql("postgres", "select current_setting('server_version_num');")
        psql("postgres", f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE); CREATE DATABASE {DATABASE};")
        proposal = PROPOSAL.read_text(encoding="utf-8")
        code = subprocess.run(
            [PSQL, "-d", DATABASE, "-X", "-v", "ON_ERROR_STOP=1", "-f", "-"],
            input=proposal,
            text=True,
            capture_output=True,
            check=False,
        )
        if code.returncode == 0 or "later development-only authorization" not in (code.stdout + code.stderr):
            print(code.stdout + code.stderr, file=sys.stderr)
            return 1
        apply_schema()
        views_unchanged()
        use_disposable_adapter()
        psql(
            DATABASE,
            f"""
            insert into public.nationwide_roster (
              state_name, license_identifier, identifier_type, issuing_authority, facility_name, ingestion_batch_id, publication
            ) values
              ('North Carolina', '900000', 'license', 'Example North Carolina authority', 'Example North Carolina home', '{NC_BATCH}', 'unpublished'),
              ('Washington', 'WA-EXAMPLE-901', 'license', 'Example Washington authority', 'Example Washington home', null, 'unpublished'),
              ('Oregon', 'OR-EXAMPLE-901', 'license', 'Example Oregon authority', 'Example Oregon home', null, 'unpublished');
            """,
        )
        listing = write_listing(child("Example Assisted Living", "1 Example Street Dover, DE 19901", "9001"))
        first = execute(listing, DATABASE)
        if first["inserted"] != 1 or first["conflicts"] != 0 or first["batch_id"] != PILOT_BATCH:
            raise RuntimeError(str(first))
        second = execute(listing, DATABASE)
        if second["inserted"] != 0 or second["already_present"] != 1 or second["conflicts"] != 0:
            raise RuntimeError(str(second))
        changed = write_listing(child("Changed Example Home", "1 Example Street Dover, DE 19901", "9001"))
        conflict = execute(changed, DATABASE)
        if conflict["conflicts"] != 1 or conflict["inserted"] != 0:
            raise RuntimeError(str(conflict))
        if count_sql("facility_name = 'Example Assisted Living'") != 1:
            raise RuntimeError("conflict changed an existing row")
        if count_sql("state_name = 'Delaware' and physical_address is not null") != 0:
            raise RuntimeError("a Delaware address was stored as physical")
        if count_sql("state_name = 'Delaware' and publication = 'public'") != 0:
            raise RuntimeError("a Delaware row was public")
        execute_rollback(DATABASE)
        if count_sql(f"ingestion_batch_id = '{PILOT_BATCH}'") != 0:
            raise RuntimeError("rollback left a Delaware pilot row")
        if count_sql(f"ingestion_batch_id = '{NC_BATCH}'") != 1:
            raise RuntimeError("rollback changed a North Carolina row")
        if count_sql("state_name = 'Washington'") != 1 or count_sql("state_name = 'Oregon'") != 1:
            raise RuntimeError("rollback changed another state")
        views_unchanged()
        bare = subprocess.run(
            [PSQL, "-d", DATABASE, "-X", "-v", "ON_ERROR_STOP=1", "-f", str(ROLLBACK)],
            text=True,
            capture_output=True,
            check=False,
        )
        if bare.returncode == 0 or "later development-only authorization" not in (bare.stdout + bare.stderr):
            print(bare.stdout + bare.stderr, file=sys.stderr)
            return 1
        official_path = os.environ.get("NCHF_DE_HTML", "")
        if official_path:
            official = map_listing(Path(official_path).read_text(encoding="utf-8", errors="replace"))
            totals = summary(official)
            expected = {
                "accepted": 39,
                "rejected": 0,
                "rejected_reasons": {},
                "unverified_addresses": 39,
                "physical_addresses": 0,
                "unresolved_official_export_date": 39,
                "unresolved_original_status": 39,
                "unresolved_facility_specific_disclosure": 39,
                "publication_unpublished": 39,
                "publication_public": 0,
            }
            if totals != expected:
                raise RuntimeError(str(totals))
            loaded = execute(official_path, DATABASE)
            if loaded["inserted"] != 39 or loaded["conflicts"] != 0:
                raise RuntimeError(str(loaded))
            repeated = execute(official_path, DATABASE)
            if repeated["inserted"] != 0 or repeated["already_present"] != 39:
                raise RuntimeError(str(repeated))
            if count_sql(f"ingestion_batch_id = '{NC_BATCH}'") != 1:
                raise RuntimeError("official load changed a North Carolina row")
            if count_sql("state_name = 'Washington'") != 1 or count_sql("state_name = 'Oregon'") != 1:
                raise RuntimeError("official load changed another state")
            views_unchanged()
            execute_rollback(DATABASE)
            if count_sql(f"ingestion_batch_id = '{PILOT_BATCH}'") != 0 or count_sql(f"ingestion_batch_id = '{NC_BATCH}'") != 1:
                raise RuntimeError("official rollback did not preserve the other batch")
            print("DE_OFFICIAL_READY", totals["accepted"], totals["rejected"], totals["unverified_addresses"])
        grants = psql(
            DATABASE,
            """
            select count(*) from information_schema.role_table_grants
            where table_schema = 'public' and table_name = 'nationwide_roster' and grantee <> current_user;
            """,
        )
        if not any(line.strip() == "0" for line in grants.splitlines()):
            raise RuntimeError(grants)
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 1
    finally:
        try:
            refuse_remote()
            psql("postgres", f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE);")
        except RuntimeError as error:
            print(error, file=sys.stderr)
            return 1
    print("DELAWARE_ROSTER_PILOT_READY")
    return 0


if __name__ == "__main__":
    sys.exit(main())
