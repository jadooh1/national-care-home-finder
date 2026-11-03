#!/usr/bin/env python3
"""Run the review-only security proposal against disposable local databases.

The connection comes from PGHOST, PGPORT, PGUSER, and PGPASSWORD. Those values
are the GitHub Actions service container, not Supabase or production.
"""

import os
import subprocess
import sys
from pathlib import Path

PROPOSAL = (
    Path(__file__).resolve().parent.parent
    / "20261103000000_directory_views_readonly_and_claim_uniqueness.sql"
)

CLAIMS = """
CREATE TABLE public.owner_claims (
  facility_id text NOT NULL,
  claimant_user_id uuid NOT NULL,
  verification_status text NOT NULL
);
INSERT INTO public.owner_claims
VALUES ('home-1', '11111111-1111-1111-1111-111111111111', 'pending');
"""

CORRECT_INDEX = """
CREATE UNIQUE INDEX owner_claims_one_active_claim_per_user_facility
  ON public.owner_claims USING btree (facility_id, claimant_user_id)
  WHERE verification_status IN ('pending', 'approved');
"""

RESULTS = []
SERVER_VERSION_NUM = 0


def psql(database, sql=None, on_error_stop=True):
    command = [
        "psql",
        "-d",
        database,
        "-X",
        "-v",
        "ON_ERROR_STOP=1" if on_error_stop else "ON_ERROR_STOP=0",
        "-f",
        "-",
    ]
    completed = subprocess.run(
        command,
        input=sql,
        text=True,
        capture_output=True,
        check=False,
    )
    return completed.returncode, completed.stdout + completed.stderr


def admin(sql):
    code, output = psql("postgres", sql, on_error_stop=True)
    if code != 0:
        raise RuntimeError(output)
    return output


def record(scenario, passed, detail):
    RESULTS.append((scenario, passed, detail))
    status = "PASS" if passed else "FAIL"
    print(f"{status} | {scenario} | {detail}", flush=True)
    if not passed:
        print(detail, flush=True)


def setup_sql(claims, views=True, extra=""):
    views_sql = ""
    if views:
        views_sql = """
        CREATE TABLE public.directory_source (
          id integer PRIMARY KEY,
          canonical_name text NOT NULL
        );
        INSERT INTO public.directory_source VALUES (1, 'Example Home');
        CREATE VIEW public.wa_dshs_listed_facilities AS
          SELECT id, canonical_name FROM public.directory_source;
        CREATE VIEW public.wa_afh_map_facilities AS
          SELECT id, canonical_name FROM public.directory_source;
        GRANT ALL PRIVILEGES ON TABLE
          public.wa_dshs_listed_facilities,
          public.wa_afh_map_facilities
          TO PUBLIC, anon, authenticated;
        """
    return views_sql + "\n" + claims + "\n" + extra


def create_database(name, sql):
    admin(
        f"DROP DATABASE IF EXISTS {name} WITH (FORCE); "
        f"CREATE DATABASE {name};"
    )
    code, output = psql(name, sql, on_error_stop=True)
    if code != 0:
        raise RuntimeError(f"setup failed for {name}\n{output}")


def proposal_text():
    return PROPOSAL.read_text(encoding="utf-8")


def run_proposal(database):
    return psql(database, proposal_text(), on_error_stop=True)


def expect_success(scenario, database):
    code, output = run_proposal(database)
    if code == 0:
        record(scenario, True, "proposal completed")
        return True
    record(scenario, False, output)
    return False


def expect_failure(scenario, database, required_text):
    code, output = run_proposal(database)
    if code == 0:
        record(scenario, False, "proposal succeeded; expected failure\n" + output)
        return False
    if required_text.lower() not in output.lower():
        record(
            scenario,
            False,
            f"failure did not include {required_text!r}\n" + output,
        )
        return False
    error_line = next(
        (line.strip() for line in output.splitlines() if line.strip().startswith("ERROR:")),
        "failed as expected",
    )
    record(scenario, True, error_line)
    return True


def probe_count_sql():
    return """
SELECT 'PROBE_COUNT=' || count(*)::text
FROM pg_class
WHERE relname LIKE 'owner_claims_predicate_probe%';
"""


def run_with_probe_check(database, on_error_stop):
    sql = proposal_text()
    if not on_error_stop:
        # A failed proposal aborts its transaction. Roll it back before
        # the cleanup query, or PostgreSQL rejects every later command.
        sql += "\nROLLBACK;\n"
    sql += "\n" + probe_count_sql()
    return psql(database, sql, on_error_stop=on_error_stop)


def assert_created_index(database):
    sql = """
DO $check$
DECLARE
  index_oid oid;
  access_method text;
  is_unique boolean;
  nulls_not_distinct boolean;
  key_count smallint;
  attribute_count smallint;
  expression_keys boolean;
  predicate_text text;
  key_columns text[];
BEGIN
  SELECT pg_class.oid
    INTO index_oid
  FROM pg_class
  JOIN pg_namespace
    ON pg_namespace.oid = pg_class.relnamespace
  WHERE pg_namespace.nspname = 'public'
    AND pg_class.relname = 'owner_claims_one_active_claim_per_user_facility'
    AND pg_class.relkind = 'i';

  IF index_oid IS NULL THEN
    RAISE EXCEPTION 'created index is missing';
  END IF;

  SELECT pg_am.amname,
         pg_index.indisunique,
         pg_index.indnullsnotdistinct,
         pg_index.indnkeyatts,
         pg_index.indnatts,
         pg_index.indexprs IS NOT NULL,
         pg_get_expr(pg_index.indpred, pg_index.indrelid)
    INTO access_method, is_unique, nulls_not_distinct, key_count,
         attribute_count, expression_keys, predicate_text
  FROM pg_index
  JOIN pg_class ON pg_class.oid = pg_index.indexrelid
  JOIN pg_am ON pg_am.oid = pg_class.relam
  WHERE pg_index.indexrelid = index_oid;

  IF access_method IS DISTINCT FROM 'btree'
    OR is_unique IS NOT TRUE
    OR nulls_not_distinct IS DISTINCT FROM FALSE
    OR key_count IS DISTINCT FROM 2
    OR attribute_count IS DISTINCT FROM 2
    OR expression_keys
    OR predicate_text IS NULL THEN
    RAISE EXCEPTION
      'created index flags do not match the intended btree unique partial index';
  END IF;

  SELECT coalesce(
           array_agg(
             coalesce(attribute.attname, '<expression>')
             ORDER BY key_subscript.subscript
           ),
           '{}'::text[]
         )
    INTO key_columns
  FROM pg_index AS index_row
  CROSS JOIN LATERAL generate_series(0, index_row.indnkeyatts - 1)
    AS key_subscript(subscript)
  LEFT JOIN pg_attribute AS attribute
    ON attribute.attrelid = index_row.indrelid
   AND attribute.attnum = index_row.indkey[key_subscript.subscript]
   AND attribute.attnum > 0
   AND NOT attribute.attisdropped
  WHERE index_row.indexrelid = index_oid;

  IF key_columns IS DISTINCT FROM ARRAY['facility_id', 'claimant_user_id'] THEN
    RAISE EXCEPTION 'created index keys are %', key_columns;
  END IF;

  IF position('pending' in predicate_text) = 0
    OR position('approved' in predicate_text) = 0 THEN
    RAISE EXCEPTION 'created index predicate is %', predicate_text;
  END IF;
END
$check$;
"""
    code, output = psql(database, sql, on_error_stop=True)
    if code != 0:
        raise RuntimeError(output)


def assert_privileges(database):
    sql = """
SELECT 'VIOLATION table ' || grantee || ' ' || privilege_type || ' ' || table_name
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('wa_dshs_listed_facilities', 'wa_afh_map_facilities')
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
  AND privilege_type IN (
    'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
  )
UNION ALL
SELECT 'MISSING select ' || roles.role_name || ' ' || views.view_name
FROM (VALUES ('anon'), ('authenticated')) AS roles(role_name)
CROSS JOIN (
  VALUES ('wa_dshs_listed_facilities'), ('wa_afh_map_facilities')
) AS views(view_name)
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.role_table_grants AS granted
  WHERE granted.table_schema = 'public'
    AND granted.table_name = views.view_name
    AND granted.grantee = roles.role_name
    AND granted.privilege_type = 'SELECT'
)
UNION ALL
SELECT 'VIOLATION column ' || grantee || ' ' || privilege_type
  || ' ' || table_name || '.' || column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name IN ('wa_dshs_listed_facilities', 'wa_afh_map_facilities')
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
  AND privilege_type IN ('INSERT', 'UPDATE', 'REFERENCES');
"""
    code, output = psql(database, sql, on_error_stop=True)
    if code != 0:
        raise RuntimeError(output)
    problems = [
        line.strip()
        for line in output.splitlines()
        if line.strip().startswith(("VIOLATION", "MISSING"))
    ]
    return problems


def require_server():
    global SERVER_VERSION_NUM
    output = admin("SELECT version(); SELECT current_setting('server_version_num');")
    print(output.strip(), flush=True)
    version_line = [
        line.strip()
        for line in output.splitlines()
        if line.strip().isdigit()
    ]
    if not version_line or int(version_line[-1]) < 160000:
        raise RuntimeError("PostgreSQL 16 or newer is required\n" + output)
    SERVER_VERSION_NUM = int(version_line[-1])
    print(
        "command: psql -d <isolated-database> -v ON_ERROR_STOP=1 -f "
        + PROPOSAL.as_posix(),
        flush=True,
    )


def prepare_roles():
    admin(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
            CREATE ROLE anon NOLOGIN;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
            CREATE ROLE authenticated NOLOGIN;
          END IF;
        END
        $$;
        """
    )


def scenario_correct_index():
    create_database(
        "proposal_s01",
        setup_sql(CLAIMS, extra=CORRECT_INDEX),
    )
    expect_success("1. Correct existing unique B-tree index", "proposal_s01")


def scenario_reversed_columns():
    create_database(
        "proposal_s02",
        setup_sql(
            CLAIMS,
            extra="""
            CREATE UNIQUE INDEX owner_claims_one_active_claim_per_user_facility
              ON public.owner_claims USING btree (claimant_user_id, facility_id)
              WHERE verification_status IN ('pending', 'approved');
            """,
        ),
    )
    expect_failure(
        "2. Reversed index columns",
        "proposal_s02",
        "not (facility_id, claimant_user_id)",
    )


def scenario_wrong_opclass():
    create_database(
        "proposal_s03",
        setup_sql(
            CLAIMS,
            extra="""
            CREATE UNIQUE INDEX owner_claims_one_active_claim_per_user_facility
              ON public.owner_claims
              USING btree (facility_id text_pattern_ops, claimant_user_id)
              WHERE verification_status IN ('pending', 'approved');
            """,
        ),
    )
    expect_failure(
        "3. Wrong operator class",
        "proposal_s03",
        "default btree operator class",
    )


def scenario_wrong_collation():
    create_database(
        "proposal_s04",
        setup_sql(
            CLAIMS,
            extra="""
            CREATE COLLATION proposal_test_alt (provider = icu, locale = 'und');
            DO $$
            DECLARE
              column_collation oid;
              alternate_collation oid;
            BEGIN
              SELECT attribute.attcollation
                INTO column_collation
              FROM pg_attribute AS attribute
              WHERE attribute.attrelid = 'public.owner_claims'::regclass
                AND attribute.attname = 'facility_id';
              SELECT pg_collation.oid
                INTO alternate_collation
              FROM pg_collation
              WHERE pg_collation.collname = 'proposal_test_alt';
              IF column_collation IS NOT DISTINCT FROM alternate_collation THEN
                RAISE EXCEPTION 'test setup alternate collation is not different';
              END IF;
            END
            $$;
            CREATE UNIQUE INDEX owner_claims_one_active_claim_per_user_facility
              ON public.owner_claims
              USING btree (facility_id COLLATE proposal_test_alt, claimant_user_id)
              WHERE verification_status IN ('pending', 'approved');
            """,
        ),
    )
    expect_failure(
        "4. Wrong collation",
        "proposal_s04",
        "column collation",
    )


def scenario_wrong_access_method():
    # PostgreSQL rejects CREATE UNIQUE INDEX ... USING hash. The disposable
    # database changes only the catalog access method so the proposal's
    # btree check can be reached.
    create_database(
        "proposal_s05",
        setup_sql(
            CLAIMS,
            extra=CORRECT_INDEX
            + """
            UPDATE pg_class
            SET relam = (SELECT oid FROM pg_am WHERE amname = 'hash')
            WHERE oid = 'public.owner_claims_one_active_claim_per_user_facility'::regclass;
            """,
        ),
    )
    expect_failure(
        "5. Wrong access method",
        "proposal_s05",
        "not btree",
    )


def scenario_nulls_not_distinct():
    create_database(
        "proposal_s06",
        setup_sql(
            CLAIMS,
            extra="""
            CREATE UNIQUE INDEX owner_claims_one_active_claim_per_user_facility
              ON public.owner_claims USING btree (facility_id, claimant_user_id)
              NULLS NOT DISTINCT
              WHERE verification_status IN ('pending', 'approved');
            """,
        ),
    )
    expect_failure(
        "6. NULLS NOT DISTINCT index",
        "proposal_s06",
        "null-distinct",
    )


def scenario_wrong_predicate():
    create_database(
        "proposal_s07",
        setup_sql(
            CLAIMS,
            extra="""
            CREATE UNIQUE INDEX owner_claims_one_active_claim_per_user_facility
              ON public.owner_claims USING btree (facility_id, claimant_user_id)
              WHERE verification_status = 'pending';
            """,
        ),
    )
    expect_failure(
        "7. Incorrect partial-index predicate",
        "proposal_s07",
        "does not canonically match",
    )


def scenario_duplicate_claims():
    duplicate_claims = """
    CREATE TABLE public.owner_claims (
      facility_id text NOT NULL,
      claimant_user_id uuid NOT NULL,
      verification_status text NOT NULL
    );
    INSERT INTO public.owner_claims
    VALUES
      ('home-1', '11111111-1111-1111-1111-111111111111', 'pending'),
      ('home-1', '11111111-1111-1111-1111-111111111111', 'approved');
    """
    create_database("proposal_s08", setup_sql(duplicate_claims))
    expect_failure(
        "8. Duplicate active claims",
        "proposal_s08",
        "duplicate pending or approved",
    )


def scenario_missing_column():
    missing_column = """
    CREATE TABLE public.owner_claims (
      claimant_user_id uuid NOT NULL,
      verification_status text NOT NULL
    );
    """
    create_database("proposal_s09", setup_sql(missing_column))
    expect_failure(
        "9. Missing required columns",
        "proposal_s09",
        "facility_id must exist and be NOT NULL",
    )


def scenario_missing_views():
    create_database("proposal_s10", setup_sql(CLAIMS, views=False))
    expect_failure(
        "10. Missing directory views",
        "proposal_s10",
        "wa_dshs_listed_facilities",
    )


def scenario_probe_cleanup():
    create_database(
        "proposal_s11a",
        setup_sql(CLAIMS, extra=CORRECT_INDEX),
    )
    code, output = run_with_probe_check("proposal_s11a", on_error_stop=True)
    if code != 0 or "PROBE_COUNT=0" not in output.replace(" ", ""):
        record("11a. Probe cleanup after success", False, output)
    else:
        record("11a. Probe cleanup after success", True, "no probe objects remain")

    create_database(
        "proposal_s11b",
        setup_sql(
            CLAIMS,
            extra="""
            CREATE UNIQUE INDEX owner_claims_one_active_claim_per_user_facility
              ON public.owner_claims USING btree (facility_id, claimant_user_id)
              WHERE verification_status = 'pending';
            """,
        ),
    )
    code, output = run_with_probe_check("proposal_s11b", on_error_stop=False)
    failed = "does not canonically match" in output.lower()
    cleaned = "PROBE_COUNT=0" in output.replace(" ", "")
    if failed and cleaned:
        record("11b. Probe cleanup after failure", True, "proposal failed and probe objects are gone")
    else:
        record("11b. Probe cleanup after failure", False, output)


def scenario_privileges():
    scenario = "12. Read-only grants and revocations"
    create_database(
        "proposal_s12",
        setup_sql(CLAIMS, extra=CORRECT_INDEX),
    )
    code, output = run_proposal("proposal_s12")
    if code != 0:
        record(scenario, False, output)
        return
    try:
        problems = assert_privileges("proposal_s12")
    except RuntimeError as error:
        record(scenario, False, str(error))
        return
    if problems:
        record(scenario, False, "\n".join(problems))
    else:
        record(
            scenario,
            True,
            "SELECT retained; table and column write privileges revoked",
        )


def scenario_permission_rollback():
    scenario = "14. Late failure rolls back permission changes"
    create_database(
        "proposal_s14",
        setup_sql(
            CLAIMS,
            extra="""
            CREATE UNIQUE INDEX owner_claims_one_active_claim_per_user_facility
              ON public.owner_claims USING btree (facility_id, claimant_user_id)
              WHERE verification_status = 'pending';
            """,
        ),
    )
    code, output = run_proposal("proposal_s14")
    if code == 0 or "does not canonically match" not in output.lower():
        record(scenario, False, output)
        return
    code, output = psql(
        "proposal_s14",
        """
        SELECT 'STILL_GRANTED=' || count(*) FILTER (
                 WHERE privilege_type = 'INSERT'
               )::text
               || ' STILL_MAINTAIN=' || count(*) FILTER (
                 WHERE privilege_type = 'MAINTAIN'
               )::text
        FROM information_schema.role_table_grants
        WHERE table_schema = 'public'
          AND table_name IN (
            'wa_dshs_listed_facilities',
            'wa_afh_map_facilities'
          )
          AND grantee IN ('anon', 'authenticated', 'PUBLIC')
          AND privilege_type = 'INSERT';
        """,
        on_error_stop=True,
    )
    compact = output.replace(" ", "")
    if code != 0 or "STILL_GRANTED=6" not in compact:
        record(scenario, False, output)
        return
    detail = "predicate failure rolled back the earlier privilege changes"
    if SERVER_VERSION_NUM >= 170000:
        try:
            create_database(
                "proposal_s14_maintain",
                setup_sql(
                    CLAIMS,
                    extra="""
                    CREATE UNIQUE INDEX owner_claims_one_active_claim_per_user_facility
                      ON public.owner_claims USING btree (facility_id, claimant_user_id)
                      WHERE verification_status = 'pending';
                    """,
                ),
            )
            grant_maintain("proposal_s14_maintain")
        except RuntimeError as error:
            record(scenario, False, str(error))
            return
        maintain_code, maintain_output = run_proposal("proposal_s14_maintain")
        if maintain_code == 0 or "does not canonically match" not in maintain_output.lower():
            record(scenario, False, maintain_output)
            return
        try:
            remaining = maintain_grant_count("proposal_s14_maintain")
        except RuntimeError as error:
            record(scenario, False, str(error))
            return
        if remaining != 6:
            record(scenario, False, f"expected 6 MAINTAIN grants after rollback, found {remaining}")
            return
        detail += ", including MAINTAIN"
    record(scenario, True, detail)


MAINTAIN_GRANT = """
GRANT MAINTAIN ON TABLE
  public.wa_dshs_listed_facilities,
  public.wa_afh_map_facilities
TO PUBLIC, anon, authenticated;
"""


def grant_maintain(database):
    code, output = psql(database, MAINTAIN_GRANT, on_error_stop=True)
    if code != 0:
        raise RuntimeError(output)


def maintain_grant_count(database):
    code, output = psql(
        database,
        """
        SELECT 'PRIVILEGE_COUNT=' || count(*)::text
        FROM pg_class AS relation
        JOIN pg_namespace AS schema
          ON schema.oid = relation.relnamespace
        CROSS JOIN LATERAL aclexplode(relation.relacl) AS acl
        LEFT JOIN pg_roles AS grantee
          ON grantee.oid = acl.grantee
        WHERE schema.nspname = 'public'
          AND relation.relname IN (
            'wa_dshs_listed_facilities',
            'wa_afh_map_facilities'
          )
          AND acl.privilege_type = 'MAINTAIN'
          AND (
            acl.grantee = 0
            OR grantee.rolname IN ('anon', 'authenticated')
          );
        """,
        on_error_stop=True,
    )
    if code != 0:
        raise RuntimeError(output)
    compact = output.replace(" ", "")
    marker = "PRIVILEGE_COUNT="
    start = compact.find(marker)
    if start < 0:
        raise RuntimeError(output)
    digits = []
    for character in compact[start + len(marker):]:
        if character.isdigit():
            digits.append(character)
        else:
            break
    if not digits:
        raise RuntimeError(output)
    return int("".join(digits))


def privilege_count(database, privilege):
    code, output = psql(
        database,
        f"""
        SELECT 'PRIVILEGE_COUNT=' || count(*)::text
        FROM information_schema.role_table_grants
        WHERE table_schema = 'public'
          AND table_name IN (
            'wa_dshs_listed_facilities',
            'wa_afh_map_facilities'
          )
          AND grantee IN ('anon', 'authenticated', 'PUBLIC')
          AND privilege_type = '{privilege}';
        """,
        on_error_stop=True,
    )
    if code != 0:
        raise RuntimeError(output)
    compact = output.replace(" ", "")
    marker = "PRIVILEGE_COUNT="
    start = compact.find(marker)
    if start < 0:
        raise RuntimeError(output)
    digits = []
    for character in compact[start + len(marker):]:
        if character.isdigit():
            digits.append(character)
        else:
            break
    if not digits:
        raise RuntimeError(output)
    return int("".join(digits))


def scenario_maintain_privilege():
    scenario = "15. MAINTAIN removed when the server supports it"
    if SERVER_VERSION_NUM < 170000:
        record(
            scenario,
            True,
            "PostgreSQL 16 has no MAINTAIN privilege; the revoke is skipped",
        )
        return
    database = "proposal_s15"
    create_database(database, setup_sql(CLAIMS, extra=CORRECT_INDEX))
    try:
        grant_maintain(database)
        before = maintain_grant_count(database)
    except RuntimeError as error:
        record(scenario, False, str(error))
        return
    if before != 6:
        record(scenario, False, f"expected 6 MAINTAIN grants before the proposal, found {before}")
        return
    code, output = run_proposal(database)
    if code != 0:
        record(scenario, False, output)
        return
    try:
        after = maintain_grant_count(database)
        select_count = privilege_count(database, "SELECT")
    except RuntimeError as error:
        record(scenario, False, str(error))
        return
    if after != 0 or select_count < 4:
        record(
            scenario,
            False,
            f"MAINTAIN count {after}; SELECT count {select_count}",
        )
        return
    record(scenario, True, "MAINTAIN revoked from PUBLIC, anon, and authenticated; SELECT retained")


def scenario_create_index():
    scenario = "13. Index absent is created correctly"
    create_database("proposal_s13", setup_sql(CLAIMS))
    code, output = run_proposal("proposal_s13")
    if code != 0:
        record(scenario, False, output)
        return
    try:
        assert_created_index("proposal_s13")
    except RuntimeError as error:
        record(scenario, False, str(error))
        return
    code, output = run_proposal("proposal_s13")
    if code != 0:
        record(scenario, False, output)
        return
    record(
        scenario,
        True,
        "btree unique partial index matches and a second run passes",
    )


def write_summary():
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    lines = [
        "| Scenario | Result |",
        "| --- | --- |",
    ]
    for scenario, passed, _detail in RESULTS:
        lines.append(f"| {scenario} | {'PASS' if passed else 'FAIL'} |")
    table = "\n".join(lines)
    print("\n" + table, flush=True)
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as summary:
            summary.write(table + "\n")


def main():
    if not PROPOSAL.is_file():
        print(f"Proposal file is missing: {PROPOSAL}", file=sys.stderr)
        return 2
    try:
        require_server()
        prepare_roles()
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 2

    scenarios = [
        scenario_correct_index,
        scenario_reversed_columns,
        scenario_wrong_opclass,
        scenario_wrong_collation,
        scenario_wrong_access_method,
        scenario_nulls_not_distinct,
        scenario_wrong_predicate,
        scenario_duplicate_claims,
        scenario_missing_column,
        scenario_missing_views,
        scenario_probe_cleanup,
        scenario_privileges,
        scenario_permission_rollback,
        scenario_maintain_privilege,
        scenario_create_index,
    ]
    for scenario in scenarios:
        try:
            scenario()
        except Exception as error:
            record(scenario.__name__, False, str(error))

    write_summary()
    failed = [scenario for scenario, passed, _detail in RESULTS if not passed]
    print(f"\n{len(RESULTS) - len(failed)} passed, {len(failed)} failed", flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
