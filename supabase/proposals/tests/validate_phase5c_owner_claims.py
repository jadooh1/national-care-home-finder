#!/usr/bin/env python3
"""Run the Phase 5C owner-claim migration on disposable local PostgreSQL.

The connection comes from PGHOST, PGPORT, PGUSER, and PGPASSWORD. Those values
must point at a local disposable server. This script does not connect to
Supabase or production.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "proposals" / "tests" / "phase5c_owner_claim_fixture.sql"
MIGRATION = ROOT / "migrations" / "20261106160000_phase5c_owner_claim_controls.sql"
ROLLBACK = ROOT / "migrations" / "20261106160000_phase5c_owner_claim_controls_ROLLBACK.sql"
CHECKS = ROOT / "proposals" / "tests" / "phase5c_owner_claim_checks.sql"
RESULTS = []


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


def record(scenario, passed, detail):
    RESULTS.append((scenario, passed, detail))
    print(f"{'PASS' if passed else 'FAIL'} | {scenario} | {detail}", flush=True)


def create_database(name):
    admin(
        f"DROP DATABASE IF EXISTS {name} WITH (FORCE); "
        f"CREATE DATABASE {name};"
    )
    code, output = psql(name, FIXTURE.read_text(encoding="utf-8"))
    if code != 0:
        raise RuntimeError(output)


def run_files(database, files, prefix=""):
    sql = prefix + "\n" + "\n".join(path.read_text(encoding="utf-8") for path in files)
    return psql(database, sql)


def scenario_forward():
    create_database("phase5c_forward")
    code, output = run_files("phase5c_forward", [MIGRATION, CHECKS])
    if code != 0:
        record("forward controls", False, output)
        return
    record("forward controls", True, "migration and privilege checks passed")
    code, output = psql(
        "phase5c_forward",
        """
        select id::text
        from public.owner_claims
        where facility_id = '00000000-0000-4000-8000-000000000106'
          and verification_status = 'pending'
        order by claimant_user_id;
        """,
    )
    ids = [
        line.strip()
        for line in output.splitlines()
        if len(line.strip()) == 36 and line.strip().count("-") == 4
    ]
    if len(ids) != 2:
        record("duplicate approval concurrency", False, output)
        return
    first = subprocess.Popen(
        ["psql", "-d", "phase5c_forward", "-X", "-v", "ON_ERROR_STOP=1", "-f", "-"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    first_sql = f"""
    begin;
    select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
    set role authenticated;
    select public.admin_approve_owner_claim('{ids[0]}'::uuid);
    select pg_catalog.pg_sleep(3);
    commit;
    """
    assert first.stdin is not None
    first.stdin.write(first_sql)
    first.stdin.close()
    import time
    time.sleep(0.8)
    code, output = psql(
        "phase5c_forward",
        f"""
        select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
        set role authenticated;
        select public.admin_approve_owner_claim('{ids[1]}'::uuid);
        """,
    )
    first_code = first.wait(timeout=20)
    approved = psql(
        "phase5c_forward",
        """
        select count(*)
        from public.owner_claims
        where facility_id = '00000000-0000-4000-8000-000000000106'
          and verification_status = 'approved';
        """,
    )
    if (
        first_code == 0
        and code != 0
        and "another approved claim exists" in output
        and "1" in approved[1]
    ):
        record("duplicate approval concurrency", True, "second approval waited and was rejected")
    else:
        record(
            "duplicate approval concurrency",
            False,
            f"first={first_code}\n{output}\n{approved[1]}",
        )


def scenario_inherited():
    create_database("phase5c_inherited")
    code, output = psql(
        "phase5c_inherited",
        """
        do $$
        begin
          if not exists (select 1 from pg_roles where rolname = 'phase5c_parent') then
            create role phase5c_parent nologin;
          end if;
        end
        $$;
        grant insert on table public.owner_claims to phase5c_parent;
        grant phase5c_parent to authenticated;
        """,
    )
    if code != 0:
        record("inherited privilege refusal", False, output)
        return
    code, output = run_files("phase5c_inherited", [MIGRATION])
    absent = psql(
        "phase5c_inherited",
        """
        select to_regclass('public.owner_claim_events') is null
          and has_table_privilege('phase5c_parent', 'public.owner_claims', 'INSERT');
        """,
    )
    if code != 0 and "inherits a role" in output and "t" in absent[1].lower():
        record("inherited privilege refusal", True, "migration stopped and the parent grant remains")
    else:
        record("inherited privilege refusal", False, output + absent[1])
    admin(
        "DROP DATABASE IF EXISTS phase5c_inherited WITH (FORCE); "
        "REVOKE phase5c_parent FROM authenticated; "
        "DROP ROLE IF EXISTS phase5c_parent;"
    )


def scenario_duplicate_rows():
    create_database("phase5c_duplicate")
    code, output = psql(
        "phase5c_duplicate",
        """
        insert into public.owner_claims (
          id, facility_id, claimant_user_id, verification_status, evidence_notes
        ) values (
          '00000000-0000-4000-8000-0000000000c2',
          '00000000-0000-4000-8000-000000000101',
          '00000000-0000-4000-8000-0000000000b2',
          'approved',
          'second approved'
        );
        update public.owner_claims
        set verification_status = 'approved'
        where id = '00000000-0000-4000-8000-0000000000c1';
        """,
    )
    if code != 0:
        record("existing duplicate approval refusal", False, output)
        return
    code, output = run_files("phase5c_duplicate", [MIGRATION])
    count = psql("phase5c_duplicate", "select count(*) from public.owner_claims;")
    if code != 0 and "more than one approved claim" in output and "2" in count[1]:
        record("existing duplicate approval refusal", True, "both existing rows remain")
    else:
        record("existing duplicate approval refusal", False, output + count[1])


def scenario_rollback_empty():
    create_database("phase5c_rollback_empty")
    code, output = run_files("phase5c_rollback_empty", [MIGRATION])
    if code != 0:
        record("rollback with empty events", False, output)
        return
    code, output = run_files(
        "phase5c_rollback_empty",
        [ROLLBACK],
        prefix="select set_config('nchf.phase5c_rollback_authorization', 'authorize-owner-claim-direct-insert-downgrade', false);",
    )
    check = psql(
        "phase5c_rollback_empty",
        """
        select
          to_regclass('public.owner_claim_events') is null
          and has_table_privilege('authenticated', 'public.owner_claims', 'INSERT')
          and (select evidence_notes from public.owner_claims where id = '00000000-0000-4000-8000-0000000000c1') = 'preserved claim evidence'
          and (select privilege_text from public.nchf_phase5a_facilities_acl_snapshot where id = 1) = 'preserved phase 5a grant text'
          and (select relrowsecurity from pg_class where oid = 'public.nchf_phase5a_facilities_acl_snapshot'::regclass)
          and (select relrowsecurity from pg_class where oid = 'public.nchf_phase5c_privilege_snapshot'::regclass)
          and to_regprocedure('public.submit_owner_claim(uuid, text)') is null
          and pg_get_functiondef('public.admin_approve_owner_claim(uuid)'::regprocedure) like '%phase5c-prior-approve%';
        """,
    )
    if code == 0 and "t" in check[1].lower():
        record("rollback with empty events", True, "captured privileges restored and recovery rows kept")
    else:
        record("rollback with empty events", False, output + check[1])


def scenario_rollback_events():
    create_database("phase5c_rollback_events")
    code, output = run_files("phase5c_rollback_events", [MIGRATION])
    if code != 0:
        record("rollback with audit rows", False, output)
        return
    code, output = psql(
        "phase5c_rollback_events",
        """
        select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
        set role authenticated;
        select public.submit_owner_claim(
          '00000000-0000-4000-8000-000000000104',
          'A claim that must keep its audit row'
        );
        reset role;
        """,
    )
    if code != 0:
        record("rollback with audit rows", False, output)
        return
    code, output = run_files(
        "phase5c_rollback_events",
        [ROLLBACK],
        prefix="select set_config('nchf.phase5c_rollback_authorization', 'authorize-owner-claim-direct-insert-downgrade', false);",
    )
    check = psql(
        "phase5c_rollback_events",
        """
        select
          to_regclass('public.owner_claim_events') is not null
          and (select count(*) from public.owner_claim_events) = 1
          and not has_table_privilege('anon', 'public.owner_claim_events', 'TRUNCATE')
          and not has_table_privilege('authenticated', 'public.owner_claim_events', 'INSERT')
          and (select evidence_notes from public.owner_claims where id = '00000000-0000-4000-8000-0000000000c1') = 'preserved claim evidence';
        """,
    )
    if code == 0 and "t" in check[1].lower():
        record("rollback with audit rows", True, "event table, its row, and browser revokes remain")
    else:
        record("rollback with audit rows", False, output + check[1])


def scenario_checksum():
    create_database("phase5c_checksum")
    code, output = run_files("phase5c_checksum", [MIGRATION])
    if code != 0:
        record("rollback checksum refusal", False, output)
        return
    code, output = psql(
        "phase5c_checksum",
        """
        alter table public.nchf_phase5c_privilege_snapshot disable trigger user;
        update public.nchf_phase5c_privilege_snapshot
        set captured_line = captured_line || 'tamper'
        where id = (select min(id) from public.nchf_phase5c_privilege_snapshot);
        alter table public.nchf_phase5c_privilege_snapshot enable trigger user;
        """,
    )
    if code != 0:
        record("rollback checksum refusal", False, output)
        return
    code, output = run_files(
        "phase5c_checksum",
        [ROLLBACK],
        prefix="select set_config('nchf.phase5c_rollback_authorization', 'authorize-owner-claim-direct-insert-downgrade', false);",
    )
    check = psql(
        "phase5c_checksum",
        "select has_table_privilege('authenticated', 'public.owner_claims', 'INSERT');",
    )
    if code != 0 and "checksum does not match" in output and "f" in check[1].lower():
        record("rollback checksum refusal", True, "tampered snapshot restored nothing")
    else:
        record("rollback checksum refusal", False, output + check[1])


def scenario_public_acl():
    migration = MIGRATION.read_text(encoding="utf-8")
    treats_public_as_role = (
        "('public')" in migration
        or "has_table_privilege('public'" in migration
        or "has_column_privilege('public'" in migration
    )
    if treats_public_as_role or "acl.grantee = 0" not in migration:
        record("public acl inspection", False, "verification still treats PUBLIC as a role")
        return
    create_database("phase5c_public_shape")
    code, output = psql(
        "phase5c_public_shape",
        """
        create table public.phase5c_public_probe (id integer, secret text);
        revoke all on table public.phase5c_public_probe from public;
        grant insert on table public.phase5c_public_probe to public;
        grant update (secret) on table public.phase5c_public_probe to public;
        select
          exists (
            select 1
            from pg_class as relation
            cross join lateral aclexplode(relation.relacl) as acl
            where relation.oid = 'public.phase5c_public_probe'::regclass
              and acl.grantee = 0
              and acl.privilege_type = 'INSERT'
          )
          and not exists (
            select 1
            from pg_class as relation
            cross join lateral aclexplode(relation.relacl) as acl
            where relation.oid = 'public.phase5c_public_probe'::regclass
              and acl.grantee = 0
              and acl.privilege_type = 'UPDATE'
          )
          and exists (
            select 1
            from pg_attribute as attribute
            cross join lateral aclexplode(attribute.attacl) as acl
            where attribute.attrelid = 'public.phase5c_public_probe'::regclass
              and attribute.attname = 'secret'
              and acl.grantee = 0
              and acl.privilege_type = 'UPDATE'
          );
        """,
    )
    if code == 0 and any(line.strip() == "t" for line in output.splitlines()):
        record("public acl inspection", True, "table INSERT and column UPDATE are both visible at grantee 0")
    else:
        record("public acl inspection", False, output)
        return

    def refuse(database, grant_sql, label):
        create_database(database)
        setup = f"""
        create function public.phase5c_plant_public_grant()
        returns event_trigger
        language plpgsql
        as $fn$
        begin
          if pg_catalog.current_setting('nchf.phase5c_public_probe', true) = 'on' then
            return;
          end if;
          perform pg_catalog.set_config('nchf.phase5c_public_probe', 'on', true);
          if to_regclass('public.owner_claim_events') is null then
            return;
          end if;
          execute {grant_sql!r};
        end;
        $fn$;
        create event trigger phase5c_plant_public_grant
          on ddl_command_end
          when tag in ('GRANT')
          execute function public.phase5c_plant_public_grant();
        """
        code, output = psql(database, setup)
        if code != 0:
            record(label, False, output)
            return
        code, output = run_files(database, [MIGRATION])
        check = psql(
            database,
            """
            select to_regclass('public.owner_claim_events') is null
              and to_regclass('public.nchf_phase5c_privilege_snapshot') is null
              and (select evidence_notes from public.owner_claims
                   where id = '00000000-0000-4000-8000-0000000000c1')
                  = 'preserved claim evidence'
              and (select proposed_value from public.listing_edits
                   where id = '00000000-0000-4000-8000-0000000000e1')
                  = 'preserved proposal text'
              and not (select relrowsecurity from pg_class
                       where oid = 'public.nchf_phase5a_facilities_acl_snapshot'::regclass);
            """,
        )
        if (
            code != 0
            and "browser privileges were not reduced to the approved column list" in output
            and any(line.strip() == "t" for line in check[1].splitlines())
        ):
            record(label, True, "migration rolled back and the existing rows remain")
        else:
            record(label, False, output + check[1])

    refuse(
        "phase5c_public_table",
        "grant insert on table public.owner_claims to public",
        "public table privilege detection",
    )
    refuse(
        "phase5c_public_column",
        "grant update (proposed_value) on table public.listing_edits to public",
        "public column privilege detection",
    )


def main():
    for path in (FIXTURE, MIGRATION, ROLLBACK, CHECKS):
        if not path.is_file():
            print(f"Missing {path}", file=sys.stderr)
            return 2
    try:
        refuse_remote()
        version = admin("select current_setting('server_version_num');")
        print(version.strip(), flush=True)
        version_numbers = [line.strip() for line in version.splitlines() if line.strip().isdigit()]
        if not version_numbers or int(version_numbers[-1]) < 160000:
            raise RuntimeError(version)
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 2
    for scenario in (
        scenario_forward,
        scenario_rollback_empty,
        scenario_rollback_events,
        scenario_checksum,
        scenario_duplicate_rows,
        scenario_inherited,
        scenario_public_acl,
    ):
        try:
            scenario()
        except Exception as error:
            record(scenario.__name__, False, str(error))
    failed = [name for name, passed, _detail in RESULTS if not passed]
    print(f"\n{len(RESULTS) - len(failed)} passed, {len(failed)} failed", flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
