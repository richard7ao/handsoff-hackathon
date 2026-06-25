#!/usr/bin/env python3
"""Pulse — Reddit actions (post / engagement / edit).

Dependency-free (stdlib only) so it runs in a fresh Modal sandbox. Uses Reddit's
"script" app OAuth (password grant).

Required env (Person C registers the Reddit app + provides these):
  REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD
  REDDIT_USER_AGENT   e.g. "signal-pulse/0.1 by u/<username>"

Usage:
  python reddit_post.py submit --subreddit austin --title "..." --body "..."
  python reddit_post.py engagement --id t3_abc123
  python reddit_post.py edit --id t3_abc123 --body "updated text"

Prints JSON to stdout. Non-zero exit on failure.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

TOKEN_URL = "https://www.reddit.com/api/v1/access_token"
API = "https://oauth.reddit.com"


def _autoload_env() -> None:
    path = os.path.expanduser("~/.hermes/.env")
    if not os.path.exists(path):
        return
    try:
        with open(path, encoding="utf-8", errors="ignore") as fh:
            for line in fh:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
    except OSError:
        pass


_autoload_env()


def _env(name: str) -> str:
    val = os.environ.get(name, "").strip()
    if not val:
        sys.exit(f"ERROR: {name} is not set (Reddit app creds — owned by Person C).")
    return val


def _ua() -> str:
    return os.environ.get("REDDIT_USER_AGENT", "").strip() or "signal-pulse/0.1"


def _token() -> str:
    cid, csec = _env("REDDIT_CLIENT_ID"), _env("REDDIT_CLIENT_SECRET")
    data = urllib.parse.urlencode({
        "grant_type": "password",
        "username": _env("REDDIT_USERNAME"),
        "password": _env("REDDIT_PASSWORD"),
    }).encode()
    basic = base64.b64encode(f"{cid}:{csec}".encode()).decode()
    req = urllib.request.Request(TOKEN_URL, data=data, method="POST")
    req.add_header("Authorization", f"Basic {basic}")
    req.add_header("User-Agent", _ua())
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            tok = json.loads(r.read().decode()).get("access_token")
    except urllib.error.HTTPError as e:
        sys.exit(f"ERROR: Reddit auth failed ({e.code}): {e.read().decode()}")
    if not tok:
        sys.exit("ERROR: Reddit auth returned no access_token (check creds/2FA).")
    return tok


def _api(method: str, path: str, token: str, params: dict | None = None) -> dict:
    url = f"{API}{path}"
    body = urllib.parse.urlencode(params).encode() if (params and method == "POST") else None
    if params and method == "GET":
        url = f"{url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("User-Agent", _ua())
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        sys.exit(f"ERROR: Reddit {method} {path} failed ({e.code}): {e.read().decode()}")


def submit(args) -> None:
    token = _token()
    sr = args.subreddit.removeprefix("r/").removeprefix("/r/")
    resp = _api("POST", "/api/submit", token, {
        "sr": sr, "kind": "self", "title": args.title,
        "text": args.body or "", "api_type": "json", "resubmit": "true",
    })
    jq = (resp.get("json") or {})
    errors = jq.get("errors") or []
    if errors:
        sys.exit(f"ERROR: submit rejected: {errors}")
    data = (jq.get("data") or {})
    print(json.dumps({
        "reddit_id": data.get("name"),       # t3_xxxx fullname
        "permalink": data.get("url"),
        "subreddit": sr,
    }, indent=2))


def engagement(args) -> None:
    token = _token()
    resp = _api("GET", "/api/info", token, {"id": args.id})
    children = ((resp.get("data") or {}).get("children") or [])
    if not children:
        sys.exit(f"ERROR: no post found for id {args.id}")
    d = children[0].get("data") or {}
    print(json.dumps({
        "reddit_id": args.id,
        "upvotes": d.get("ups"),
        "num_comments": d.get("num_comments"),
        "permalink": d.get("permalink"),
        "title": d.get("title"),
    }, indent=2))


def edit(args) -> None:
    token = _token()
    resp = _api("POST", "/api/editusertext", token, {
        "thing_id": args.id, "text": args.body, "api_type": "json",
    })
    errors = ((resp.get("json") or {}).get("errors")) or []
    if errors:
        sys.exit(f"ERROR: edit rejected: {errors}")
    print(json.dumps({"reddit_id": args.id, "edited": True}, indent=2))


def main() -> None:
    ap = argparse.ArgumentParser(description="Pulse Reddit actions")
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("submit", help="Submit a self/text post")
    s.add_argument("--subreddit", required=True)
    s.add_argument("--title", required=True)
    s.add_argument("--body", default="")
    s.set_defaults(fn=submit)

    e = sub.add_parser("engagement", help="Get ups/comments for a post fullname (t3_...)")
    e.add_argument("--id", required=True)
    e.set_defaults(fn=engagement)

    ed = sub.add_parser("edit", help="Edit a self-post body (title is not editable on Reddit)")
    ed.add_argument("--id", required=True)
    ed.add_argument("--body", required=True)
    ed.set_defaults(fn=edit)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
