#!/usr/bin/env python3
"""Scout search — Tavily web/Reddit search → scout_findings records.

Dependency-free (stdlib only) so it runs anywhere, incl. a fresh Modal sandbox.
Calls the Tavily REST API directly (no Composio/MCP hop).

Auth: reads TAVILY_API_KEY from the environment (a `tvly-...` key).

What it does:
  1. POST https://api.tavily.com/search  with your query
  2. (optional) POST https://api.tavily.com/extract  to pull full page content
  3. Normalizes each hit into a scout_findings row:
       {source, title, url, content, metadata:{score, query, published_date}}

Output: a JSON array of records on stdout — pipe straight into supabase_insert.py:

  python scout_search.py --query "best barbershop austin reddit" \
      --include-domains reddit.com --max-results 5 \
    | python supabase_insert.py --table scout_findings

Or write in one shot with --write (inserts via the sibling supabase_insert module):

  python scout_search.py --query "..." --include-domains reddit.com --write
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

# Make the sibling supabase_insert importable regardless of cwd, and reuse its
# ~/.hermes/.env autoloader so this script works under cron / without a sourced env.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from supabase_insert import _autoload_env  # noqa: E402

_autoload_env()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

TAVILY_SEARCH = "https://api.tavily.com/search"
TAVILY_EXTRACT = "https://api.tavily.com/extract"


def _key() -> str:
    val = os.environ.get("TAVILY_API_KEY", "").strip()
    if not val:
        sys.exit(
            "ERROR: TAVILY_API_KEY is not set. Add it to ~/.hermes/.env (and to "
            "terminal.env_passthrough so it reaches the Modal sandbox)."
        )
    return val


def _post(url: str, key: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        sys.exit(f"ERROR: Tavily {url} failed ({e.code}): {detail}")


def _domain(url: str) -> str:
    try:
        host = url.split("//", 1)[-1].split("/", 1)[0]
        return host[4:] if host.startswith("www.") else host
    except Exception:
        return "web"


def tavily_search(query, *, include_domains="", max_results=5, depth="basic",
                  topic="general", days=0, extract=False, extra_meta=None) -> list:
    key = _key()
    payload = {
        "query": query,
        "search_depth": depth,
        "topic": topic,
        "max_results": max_results,
        "include_answer": False,
        "include_raw_content": extract,
    }
    if include_domains:
        payload["include_domains"] = [d.strip() for d in include_domains.split(",") if d.strip()]
    if days:
        payload["days"] = days

    data = _post(TAVILY_SEARCH, key, payload)
    results = data.get("results", []) or []

    records = []
    for r in results:
        content = r.get("raw_content") or r.get("content") or ""
        meta = {
            "via": "tavily",
            "query": query,
            "score": r.get("score"),
            "published_date": r.get("published_date"),
        }
        if extra_meta:
            meta.update(extra_meta)
        records.append(
            {
                "source": _domain(r.get("url", "")) or "web",
                "title": r.get("title"),
                "url": r.get("url"),
                "content": content,
                "metadata": meta,
            }
        )
    return records


def search(args) -> list:
    return tavily_search(
        args.query, include_domains=args.include_domains, max_results=args.max_results,
        depth=args.depth, topic=args.topic, days=args.days, extract=args.extract,
    )


def _brief_query(brief: dict) -> str:
    parts = [brief.get("business_type") or brief.get("business_name") or "",
             brief.get("keywords") or "", brief.get("city") or ""]
    return " ".join(p for p in parts if p).strip()


def run_briefs(args, briefs: list) -> None:
    """Scout each brief: search -> write findings -> mark status. Used by --brief
    and by the cron (--briefs-new)."""
    from supabase_insert import insert, update

    if not briefs:
        print("No briefs to scout.")
        return

    for b in briefs:
        bid = b.get("id")
        query = _brief_query(b)
        if not query:
            update("scout_briefs", f"id=eq.{bid}", {"status": "error"})
            print(f"brief {bid}: empty query — marked error")
            continue
        try:
            update("scout_briefs", f"id=eq.{bid}", {"status": "scouting"})
            records = tavily_search(
                query,
                include_domains=b.get("include_domains") or "reddit.com",
                max_results=int(b.get("max_results") or args.max_results),
                depth=args.depth, extract=args.extract,
                extra_meta={"brief_id": bid, "business_name": b.get("business_name")},
            )
            if records:
                insert(args.table, records)
            update("scout_briefs", f"id=eq.{bid}",
                   {"status": "done", "scouted_at": _now_iso()})
            print(f"brief {bid} ({b.get('business_name')!r}): {len(records)} finding(s) written")
        except Exception as e:  # noqa: BLE001 — keep the loop alive across briefs
            update("scout_briefs", f"id=eq.{bid}", {"status": "error"})
            print(f"brief {bid}: ERROR {e}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Scout search via Tavily -> scout_findings records")
    ap.add_argument("--query", help="Search query (omit when using --brief/--briefs-new)")
    ap.add_argument("--brief", help="Scout a single scout_briefs row by id")
    ap.add_argument("--briefs-new", action="store_true", dest="briefs_new",
                    help="Scout all scout_briefs with status='new' (used by the cron)")
    ap.add_argument("--limit", type=int, default=10, help="Max briefs to process in --briefs-new")
    ap.add_argument("--max-results", type=int, default=5, dest="max_results")
    ap.add_argument("--include-domains", default="", dest="include_domains",
                    help="Comma-separated domains to restrict to, e.g. reddit.com")
    ap.add_argument("--depth", choices=["basic", "advanced"], default="basic")
    ap.add_argument("--topic", choices=["general", "news"], default="general")
    ap.add_argument("--days", type=int, default=0, help="For topic=news: lookback window in days")
    ap.add_argument("--extract", action="store_true",
                    help="Include full page content (raw_content) per result")
    ap.add_argument("--write", action="store_true",
                    help="Insert results into Supabase via supabase_insert.py")
    ap.add_argument("--table", default="scout_findings")
    args = ap.parse_args()

    # Brief-driven modes always write (search -> findings -> mark brief).
    if args.brief or args.briefs_new:
        from supabase_insert import select
        if args.brief:
            briefs = select("scout_briefs", f"id=eq.{args.brief}")
        else:
            briefs = select("scout_briefs",
                            f"status=eq.new&order=created_at.asc&limit={args.limit}")
        run_briefs(args, briefs)
        return

    if not args.query:
        ap.error("provide --query, or --brief <id>, or --briefs-new")

    records = search(args)

    if args.write:
        from supabase_insert import insert  # sibling module (path set at import time)
        if not records:
            print("No results to write.")
            return
        insert(args.table, records)
    else:
        print(json.dumps(records, indent=2))


if __name__ == "__main__":
    main()
