"""Development execution adapter for the Delaware roster pilot.

The localhost-only guard in delaware_roster.py remains the default. This
adapter runs only when a person sets both the execution authorization and an
explicit target. It does not open a connection by itself.
"""

from delaware_roster import PILOT_BATCH, ingest, map_path, rollback, summary
from roster_ingestion import assert_authorized_target, preflight_before_write

EXECUTION_AUTHORIZATION = "authorize-development-delaware-roster-execution"
DEVELOPMENT_HOST = "aws-1-us-west-2.pooler.supabase.com"
DEVELOPMENT_USER = "postgres.ajjsyloyihcqdomywhik"


def assert_execution_target():
    assert_authorized_target(
        "NCHF_DE_EXECUTION_TARGET",
        "NCHF_DE_DEVELOPMENT_EXECUTION",
        EXECUTION_AUTHORIZATION,
    )


def execute(listing_path, database):
    assert_execution_target()
    preflight_before_write(database, assert_execution_target)
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
    assert_execution_target()
    preflight_before_write(database, assert_execution_target)
    rollback(database, guard=assert_execution_target)
    return {"batch_id": PILOT_BATCH}
