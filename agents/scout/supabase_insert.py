#!/usr/bin/env python3
"""Scout -> Supabase writer.

Dependency-free (stdlib only) so it runs anywhere, including a fresh Modal
sandbox, without `pip install`. Talks to Supabase via the PostgREST API.

Auth: reads SUPABASE_URL and SUPABASE_SERVICE_KEY from the environment.
(The service-role key is used so Scout can write regardless of RLS policies.)

Usage:
  # connectivity / table check (HEAD, returns row count)
  python supabase_insert.py --check --table scout_findings

  # insert one or many records (JSON object or array) via --data or stdin
  python supabase_insert.py --table scout_findings --data '{"source":"reddit","title":"hi"}'
  echo '[{"source":"reddit","title":"a"},{"source":"hn","title":"b"}]' \
      | python supabase_insert.py --table scout_findings

Exit code is non-zero on any failure so callers can detect errors.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


def _autoload_env() -> None:
    """Populate missing vars from ~/.hermes/.env so the scripts work under cron
    (no sourced env) and locally. No-op in the Modal sandbox (file absent there;
    creds arrive via terminal.env_passthrough). Never overrides existing vars."""
    path = os.path.expanduser("~/.hermes/.env")
    if not os.path.exists(path):
        return
    try:
        with open(path, encoding="utf-8", errors="ignore") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    except OSError:
        pass


_autoload_env()


def _env(name: str) -> str:
    val = os.environ.get(name, "").strip()
    if not val:
        sys.exit(
            f"ERROR: {name} is not set. Add it to ~/.hermes/.env and make sure "
            f"it is passed through to the terminal backend (env_passthrough)."
        )
    return val


def _base() -> tuple[str, str]:
    url = _env("SUPABASE_URL").rstrip("/")
    key = _env("SUPABASE_SERVICE_KEY")
    return url, key


def _request(method: str, path: str, key: str, body: bytes | None, extra_headers: dict) -> tuple[int, str, dict]:
    req = urllib.request.Request(path, data=body, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    for k, v in extra_headers.items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8", "replace"), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), dict(e.headers or {})


def check(table: str) -> None:
    url, key = _base()
    status, payload, headers = _request(
        "HEAD",
        f"{url}/rest/v1/{table}?select=*",
        key,
        None,
        {"Prefer": "count=exact", "Range": "0-0"},
    )
    if status >= 400:
        sys.exit(f"ERROR: check failed ({status}): {payload or headers}")
    count = headers.get("Content-Range", "?").split("/")[-1]
    print(f"OK: connected to Supabase. Table '{table}' currently has {count} row(s).")


def insert(table: str, records: list) -> None:
    url, key = _base()
    body = json.dumps(records).encode("utf-8")
    status, payload, _ = _request(
        "POST",
        f"{url}/rest/v1/{table}",
        key,
        body,
        {"Prefer": "return=representation"},
    )
    if status >= 400:
        sys.exit(f"ERROR: insert failed ({status}): {payload}")
    inserted = json.loads(payload) if payload.strip() else []
    print(f"OK: inserted {len(inserted)} row(s) into '{table}'.")
    print(json.dumps(inserted, indent=2))


def select(table: str, params: str = "") -> list:
    """GET rows. `params` is a raw PostgREST query string, e.g.
    "status=eq.new&order=created_at.asc&limit=5". Returns a list of dicts."""
    url, key = _base()
    sep = "?" if params else ""
    status, payload, _ = _request("GET", f"{url}/rest/v1/{table}{sep}{params}", key, None, {})
    if status >= 400:
        raise RuntimeError(f"select {table} failed ({status}): {payload}")
    return json.loads(payload) if payload.strip() else []


def update(table: str, match: str, patch: dict) -> list:
    """PATCH rows matching `match` (raw PostgREST filter, e.g. "id=eq.3").
    Returns the updated rows."""
    url, key = _base()
    body = json.dumps(patch).encode("utf-8")
    status, payload, _ = _request(
        "PATCH", f"{url}/rest/v1/{table}?{match}", key, body, {"Prefer": "return=representation"}
    )
    if status >= 400:
        raise RuntimeError(f"update {table} failed ({status}): {payload}")
    return json.loads(payload) if payload.strip() else []


def main() -> None:
    ap = argparse.ArgumentParser(description="Scout -> Supabase writer")
    ap.add_argument("--table", required=True, help="Target Supabase table")
    ap.add_argument("--check", action="store_true", help="Test connectivity / row count and exit")
    ap.add_argument("--data", help="JSON object or array of records (else read stdin)")
    args = ap.parse_args()

    if args.check:
        check(args.table)
        return

    raw = args.data if args.data is not None else sys.stdin.read()
    raw = (raw or "").strip()
    if not raw:
        sys.exit("ERROR: no records provided (use --data or pipe JSON via stdin).")
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        sys.exit(f"ERROR: invalid JSON: {e}")
    records = parsed if isinstance(parsed, list) else [parsed]
    if not records:
        sys.exit("ERROR: empty record list.")
    insert(args.table, records)


if __name__ == "__main__":
    main()
