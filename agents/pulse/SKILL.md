---
name: pulse
description: "Pulse — post Scout's drafts to Reddit, monitor engagement, and rewrite underperformers (self-improving loop)."
version: 0.1.0
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [pulse, reddit, posting, engagement, self-improvement]
    related_skills: [scout]
prerequisites:
  env: [SUPABASE_URL, SUPABASE_SERVICE_KEY, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, REDDIT_USER_AGENT]
---

# Pulse

Pulse is the engagement agent. It takes drafted posts from `scout_posts`, posts
them to Reddit, monitors how they do, and **rewrites underperformers** — the
self-improving loop. Unlike Scout (deterministic), Pulse uses your judgment to
decide *why* a post underperformed and how to rewrite it, so it runs as an
agentic skill (LLM in the loop), not a `--no-agent` script.

> ⚠️ STATUS: scaffold. `reddit_post.py` is implemented but **untested** — it
> needs the Reddit app credentials (owned by Person C). Once the env vars are
> set, run the verification in the README before trusting it.

## Helper: `reddit_post.py` (mechanical actions, stdlib-only)

```bash
python ~/.hermes/skills/pulse/reddit_post.py submit --subreddit austin --title "..." --body "..."
python ~/.hermes/skills/pulse/reddit_post.py engagement --id t3_abc123
python ~/.hermes/skills/pulse/reddit_post.py edit --id t3_abc123 --body "updated text"
```

Supabase reads/writes go through Scout's `supabase_insert.py`
(`insert` / `select` / `update`).

## Loop (run each cycle, e.g. on a cron)

1. **Post drafts.** For each `scout_posts` row with `status='draft'`:
   - `reddit_post.py submit` → capture `reddit_id` + `permalink`.
   - `update scout_posts` → `status='posted'`, `reddit_id`, `permalink`, `posted_at`.
2. **Monitor.** For each `status in ('posted','rewritten')`:
   - `reddit_post.py engagement --id <reddit_id>` → `upvotes`, `num_comments`.
   - `update scout_posts` with the latest numbers + `updated_at`.
3. **Decide (this is the agentic part).** If `upvotes < score_threshold` and
   `rewrites < max_rewrites`:
   - Reason about *why* (title too generic? wrong subreddit? bad timing?).
   - Reddit **titles are not editable** — a "title rewrite" means delete + repost.
     For the body, use `reddit_post.py edit`. To change the title, submit a new
     post and update the row's `reddit_id`/`permalink`, bump `rewrites`,
     `status='rewritten'`.
   - If `upvotes >= score_threshold`: `status='live'` — keep it, stop touching it.
4. **Report** what you posted / rewrote / promoted to live.

## Notes

- Respect Reddit rate limits and subreddit rules; one action at a time.
- Never post the same draft twice — always gate on `status`.
- Keep the business voice from the draft; rewrites should improve the hook, not
  change the meaning.
