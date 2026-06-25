# Scout — research & data-collection agent

Scout is a [Hermes Agent](https://hermes-agent.nousresearch.com/) skill. It
**searches/scrapes via the Tavily API**, normalizes hits into structured rows,
and writes them to **Supabase**. Long-running work runs on **Modal** (Hermes'
cloud terminal backend).

```
Tavily /search  ──►  scout_search.py  ──►  scout_findings rows  ──►  supabase_insert.py  ──►  Supabase
       (runs inside the Modal sandbox; creds passed via Hermes env_passthrough)
```

This folder is the **source of truth**; the live copy is installed at
`~/.hermes/skills/scout/`. These scripts are **stdlib-only** (no `pip install`)
so they run as-is in a fresh Modal container.

## Files

| File | Purpose |
|------|---------|
| `scout_search.py` | Tavily search/extract → `scout_findings` records (prints JSON or `--write`) |
| `supabase_insert.py` | Write records to Supabase via PostgREST (`--check` to test connectivity) |
| `schema.sql` | The `scout_findings` table (run in Supabase SQL editor) |
| `SKILL.md` | Hermes skill definition (agent-facing instructions) |
| `.env.example` | Required env vars (copy to `~/.hermes/.env`, never commit real values) |

## Setup (per developer)

1. **Install Hermes Agent** (macOS/Linux/WSL2):
   ```bash
   curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
   hermes setup --portal        # auth a model
   ```
2. **Install + auth Modal**, then point Hermes' terminal backend at it:
   ```bash
   uv tool install modal && modal token new      # browser login
   hermes config set terminal.backend modal
   hermes config set terminal.container_cpu 1
   hermes config set terminal.container_memory 5120
   hermes config set terminal.container_disk 51200
   hermes config set terminal.container_persistent true
   hermes config set terminal.modal_mode direct   # REQUIRED: syncs skills+creds into the sandbox
   ```
   > `modal_mode: direct` matters — the default `auto`/`managed` mode does **not**
   > sync skill files or credentials into the Modal sandbox, so Scout would fail.
3. **Credentials** — copy `.env.example` values into `~/.hermes/.env`
   (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `TAVILY_API_KEY`) and make sure
   they're passed through to the sandbox. In `~/.hermes/config.yaml`:
   ```yaml
   terminal:
     env_passthrough:
       - SUPABASE_URL
       - SUPABASE_SERVICE_KEY
       - TAVILY_API_KEY
   ```
4. **Install the skill**: copy this folder to `~/.hermes/skills/scout/`.
5. **Create the table** (once): run `schema.sql` in the Supabase SQL editor.
6. **Verify**: `hermes doctor` (Modal creds) and:
   ```bash
   python ~/.hermes/skills/scout/supabase_insert.py --check --table scout_findings
   ```

## Run it

```bash
# search Reddit, pull full content, write to Supabase in one shot
python ~/.hermes/skills/scout/scout_search.py \
  --query "barbershop recommendations austin" \
  --include-domains reddit.com --max-results 5 --extract --write

# or pipe search → insert
python scout_search.py --query "..." --include-domains reddit.com \
  | python supabase_insert.py --table scout_findings
```

### Brief-driven scouting (autonomous)

Scout can pull work from the `scout_briefs` table instead of a freeform query —
this is what the cron uses:

```bash
python scout_search.py --brief 1          # scout one brief by id
python scout_search.py --briefs-new       # scout every brief with status='new'
```

Each brief is searched, findings are written (tagged `metadata.brief_id`), and
the brief's `status` flips `new → done` (or `error`).

### Cron (no one at the keyboard)

`scout_cron.py` is the cron entry point (runs `--briefs-new`, silent when idle):

```bash
# install the script, then register the job
cp scout_cron.py ~/.hermes/scripts/
hermes cron create "every 10m" --name scout-briefs --script scout_cron.py --no-agent --deliver local
hermes gateway install        # start the scheduler so it actually fires
```

See `VERIFY.md` for the end-to-end acceptance test through `hermes --tui`.

## Notes

- The Supabase **service-role** key bypasses RLS — server-side only, never in
  the frontend or git.
- `scout_findings` de-dupes on `(source, url)`, so re-running a search is safe.
- Scripts auto-load `~/.hermes/.env`, so they work under cron without a sourced
  environment.
- Verified end-to-end (incl. inside a Modal sandbox) and the brief→cron loop.
