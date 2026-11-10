"""Development execution adapter for the Delaware roster pilot.

The localhost-only guard in delaware_roster.py remains the default. This
adapter runs only when a person sets both the execution authorization and an
explicit target. It does not open a connection by itself.
"""

import os

from delaware_roster import PILOT_BATCH, ingest, map_path, rollback, summary

EXECUTION_AUTHORIZATION = "authorize-development-delaware-roster-execution"
DEVELOPMENT_HOST = "aws-1-us-west-2.pooler.supabase.com"
DEVELOPMENT_USER = "postgres.ajjsyloyihcqdomywhik"


def assert_execution_target():
    host = os.environ.get("PGHOST", "")
    user = os.environ.get("PGUSER", "")
    target = os.environ.get("NCHF_DE_EXECUTION_TARGET", "")
    authorization = os.environ.get("NCHF_DE_DEVELOPMENT_EXECUTION", "")
    lowered = f"{host} {user}".lower()
    if "us-west-1" in lowered or "yiehgstweswxjakbcdzc" in lowered:
        raise RuntimeError("development execution refused: production is not a target")
    if authorization != EXECUTION_AUTHORIZATION:
        raise RuntimeError("development execution refused: explicit authorization is required")
    if target == "disposable" and host in {"localhost", "127.0.0.1", "::1"}:
        return
    if target == "development" and host == DEVELOPMENT_HOST and user == DEVELOPMENT_USER:
        return
    raise RuntimeError("development execution refused: the target is not authorized")


def execute(listing_path, database):
    mapped = map_path(listing_path)
    totals = summary(mapped)
    if totals["publication_public"] != 0 or totals["physical_addresses"] != 0:
        raise RuntimeError("development execution refused: a row would be published or treated as a physical address")
    if totals["publication_unpublished"] != totals["accepted"]:
        raise RuntimeError("development execution refused: a row would be published")
    result = ingest(database, mapped["accepted"], guard=assert_execution_target, batch_id=PILOT_BATCH)
    result["batch_id"] = PILOT_BATCH
    result["summary"] = totals
    return result


def execute_rollback(database):
    rollback(database, guard=assert_execution_target)
    return {"batch_id": PILOT_BATCH}
