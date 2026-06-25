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


def search(args) -> list:
    key = _key()
    payload = {
        "query": args.query,
        "search_depth": args.depth,
        "topic": args.topic,
        "max_results": args.max_results,
        "include_answer": False,
        "include_raw_content": args.extract,
    }
    if args.include_domains:
        payload["include_domains"] = [d.strip() for d in args.include_domains.split(",") if d.strip()]
    if args.days:
        payload["days"] = args.days

    data = _post(TAVILY_SEARCH, key, payload)
    results = data.get("results", []) or []

    records = []
    for r in results:
        content = r.get("raw_content") or r.get("content") or ""
        records.append(
            {
                "source": _domain(r.get("url", "")) or "web",
                "title": r.get("title"),
                "url": r.get("url"),
                "content": content,
                "metadata": {
                    "via": "tavily",
                    "query": args.query,
                    "score": r.get("score"),
                    "published_date": r.get("published_date"),
                },
            }
        )
    return records


def main() -> None:
    ap = argparse.ArgumentParser(description="Scout search via Tavily -> scout_findings records")
    ap.add_argument("--query", required=True, help="Search query")
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

    records = search(args)

    if args.write:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from supabase_insert import insert  # sibling module
        if not records:
            print("No results to write.")
            return
        insert(args.table, records)
    else:
        print(json.dumps(records, indent=2))


if __name__ == "__main__":
    main()
