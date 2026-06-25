# Pulse — engagement & self-improvement agent

Pulse is a [Hermes Agent](https://hermes-agent.nousresearch.com/) skill. It
takes drafted posts from `scout_posts`, **posts them to Reddit**, monitors
engagement, and **rewrites underperformers** — the self-improving loop. It runs
agentically (LLM decides *why* a post underperformed and how to fix it), unlike
Scout's deterministic search.

```
scout_posts (draft) ──► reddit_post.py submit ──► monitor engagement ──► rewrite if weak ──► live
```

The live copy installs to `~/.hermes/skills/pulse/`. Scripts are stdlib-only so
they run as-is in the Modal sandbox.

## Status: scaffold — ⏳ waiting on Reddit API creds (Person C)

Everything is built and wired; `reddit_post.py` is **implemented but untested**
against the live Reddit API. To finish:

1. **Register a Reddit "script" app** → https://www.reddit.com/prefs/apps
   (type: *script*; note the client id + secret).
2. **Fill creds** — copy `.env.example` into `~/.hermes/.env`:
   `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`,
   `REDDIT_PASSWORD`, `REDDIT_USER_AGENT`. They're already in Hermes'
   `terminal.env_passthrough`, so they reach the Modal sandbox.
3. **Create the table** (once): run `schema.sql` in the Supabase SQL editor
   (`scout_posts`).
4. **Smoke-test the API**:
   ```bash
   python ~/.hermes/skills/pulse/reddit_post.py submit \
     --subreddit test --title "hello from pulse" --body "ignore"
   python ~/.hermes/skills/pulse/reddit_post.py engagement --id t3_<id from above>
   ```

## Files

| File | Purpose |
|------|---------|
| `reddit_post.py` | `submit` / `engagement` / `edit` Reddit actions (stdlib, script-app OAuth) |
| `SKILL.md` | Hermes skill — the agentic post→monitor→rewrite loop |
| `schema.sql` | `scout_posts` table (drafts + posted + engagement) |

## Notes
- Reddit **titles can't be edited** — a "title rewrite" = delete + repost a new
  post (SKILL.md handles this; body edits use `edit`).
- Respect subreddit rules + rate limits; gate every action on `status` so a
  draft is never posted twice.
