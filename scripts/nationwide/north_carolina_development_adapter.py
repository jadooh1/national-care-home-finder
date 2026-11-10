"""Development execution adapter for the North Carolina roster pilot.

This file is not a test harness. The localhost-only guard in
north_carolina_roster.py remains the default. This adapter runs only when a
person sets both the execution authorization and an explicit target.

Do not run it against Supabase unless that person authorizes the exact
development action. This module does not open a connection by itself.
"""

import os

from north_carolina_roster import (
    PILOT_BATCH,
    combine,
    ingest,
    map_source,
    rollback,
    summary,
)

EXECUTION_AUTHORIZATION = "authorize-development-north-carolina-roster-execution"
DEVELOPMENT_HOST = "aws-1-us-west-2.pooler.supabase.com"
DEVELOPMENT_USER = "postgres.ajjsyloyihcqdomywhik"


def assert_execution_target():
    host = os.environ.get("PGHOST", "")
    user = os.environ.get("PGUSER", "")
    target = os.environ.get("NCHF_NC_EXECUTION_TARGET", "")
    authorization = os.environ.get("NCHF_NC_DEVELOPMENT_EXECUTION", "")
    lowered = f"{host} {user}".lower()
    if "us-west-1" in lowered or "yiehgstweswxjakbcdzc" in lowered:
        raise RuntimeError("development execution refused: production is not a target")
    if authorization != EXECUTION_AUTHORIZATION:
        raise RuntimeError("development execution refused: explicit authorization is required")
    if target == "disposable" and host in {"localhost", "127.0.0.1", "::1"}:
        return
    if (
        target == "development"
        and host == DEVELOPMENT_HOST
        and user == DEVELOPMENT_USER
    ):
        return
    raise RuntimeError("development execution refused: the target is not authorized")


def execute(adult_path, family_path, database):
    mapped = combine([map_source(adult_path, "adult"), map_source(family_path, "family")])
    totals = summary(mapped)
    if totals["publication_public"] != 0 or totals["publication_unpublished"] != totals["accepted"]:
        raise RuntimeError("development execution refused: a row would be published")
    result = ingest(database, mapped["accepted"], guard=assert_execution_target, batch_id=PILOT_BATCH)
    result["batch_id"] = PILOT_BATCH
    result["summary"] = totals
    return result


def execute_rollback(database):
    rollback(database, guard=assert_execution_target)
    return {"batch_id": PILOT_BATCH}
