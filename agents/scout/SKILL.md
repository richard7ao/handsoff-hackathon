---
name: scout
description: "Scout — collect structured records from any source and persist them to Supabase."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [scout, supabase, data-collection, scraping, ingest, persistence]
    related_skills: [research]
prerequisites:
  env: [SUPABASE_URL, SUPABASE_SERVICE_KEY, TAVILY_API_KEY]
---

# Scout

Scout is the data-collection agent. It gathers structured records from a
source (web pages, feeds, APIs, search results, Reddit, etc.), normalizes them
into JSON rows, and writes them to a **Supabase** table via the PostgREST API.

Two stdlib-only helpers (no pip installs — run as-is in the Modal sandbox):
- `scout_search.py` — **search/scrape via the Tavily API** → scout_findings records.
- `supabase_insert.py` — write records to Supabase (PostgREST).

## Prerequisites

These must be present in `~/.hermes/.env` **and** passed through to the terminal
backend (see `terminal.env_passthrough` in `~/.hermes/config.yaml`):

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<service-role key>
TAVILY_API_KEY=tvly-<your key>
```

The target table must exist. The default table is `scout_findings`
(see `schema.sql` in this skill folder — hand it to Person A to run, or apply
it in the Supabase SQL editor).

## Workflow

1. **Collect.** Search/scrape with Tavily (it returns AI-ready results and can
   pull full page content). Output is already shaped as scout_findings rows:

   ```bash
   # restrict to Reddit, get 5 hits with full page content
   python ~/.hermes/skills/scout/scout_search.py \
     --query "barbershop recommendations austin" \
     --include-domains reddit.com --max-results 5 --extract
   ```

   Useful flags: `--depth advanced` (deeper search), `--topic news --days 7`
   (recent news), `--include-domains a.com,b.com`. Drop `--include-domains` for
   the open web.

2. **Normalize.** `scout_search.py` already maps each hit to the
   `scout_findings` columns: `source`, `title`, `url`, `content`, `metadata`
   (`{via, query, score, published_date}`). `collected_at` and `id` are
   auto-filled by the DB. (For non-Tavily sources, shape records the same way.)

3. **Verify connectivity first** (recommended before a big write):

   ```bash
   python ~/.hermes/skills/scout/supabase_insert.py --check --table scout_findings
   ```

4. **Write.** Easiest: pipe search output straight into the inserter:

   ```bash
   python ~/.hermes/skills/scout/scout_search.py --query "..." --include-domains reddit.com \
     | python ~/.hermes/skills/scout/supabase_insert.py --table scout_findings
   ```

   Or let scout_search write directly with `--write`:

   ```bash
   python ~/.hermes/skills/scout/scout_search.py --query "..." --write
   ```

   Or insert hand-built records (object or array):

   ```bash
   python ~/.hermes/skills/scout/supabase_insert.py --table scout_findings \
     --data '[{"source":"reddit","title":"Example post","url":"https://...","content":"...","metadata":{"subreddit":"startups","score":42}}]'
   ```

5. **Report** how many rows were inserted (the script prints the inserted rows).

## Notes

- Uses the **service-role** key, so inserts succeed regardless of RLS. Never
  expose this key client-side.
- Writing to a different table? Pass `--table <name>` and match that table's
  columns. The script is schema-agnostic; the DB rejects unknown columns.
- A non-zero exit code means the write failed — surface the error, don't claim
  success.
