# Verify a real Scout run through Hermes (#1 acceptance test)

Goal: prove Hermes itself drives the `scout` skill, executes it in the Modal
sandbox (`modal_mode: direct`, so skill files + creds are synced), and a row
lands in `scout_findings`.

## 0. Prereqs (once)
- Tables exist: run `scout/schema.sql` in the Supabase SQL editor.
- `~/.hermes/.env` has `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `TAVILY_API_KEY`.
- `hermes doctor` is green; `hermes config get terminal.modal_mode` == `direct`.

## 1. Note the starting count
```bash
python ~/.hermes/skills/scout/supabase_insert.py --check --table scout_findings
```

## 2. Drive it through Hermes (interactive)
```bash
hermes --tui
```
Then in the chat, invoke the skill as a slash command:
```
/scout search Reddit for "barbershop recommendations austin" (max 3) and save the findings to scout_findings in Supabase
```
Watch the tool calls: Hermes should run `scout_search.py` (Tavily) and write via
`supabase_insert.py` **inside the Modal sandbox**. On the first run, expect a
short Modal cold-start while it provisions the sandbox and syncs the skill files.

## 3. Confirm the row landed
```bash
python ~/.hermes/skills/scout/supabase_insert.py --check --table scout_findings
```
Count should be higher than step 1. ✅ = Hermes → Modal → Tavily → Supabase works
end to end.

## Brief-driven path (used by the cron)
```bash
# seed a brief, then:
python ~/.hermes/skills/scout/scout_search.py --briefs-new --extract
# or one brief by id:
python ~/.hermes/skills/scout/scout_search.py --brief 1
```

## Troubleshooting
- **No skill files in sandbox / "file not found"** → `modal_mode` isn't `direct`
  (managed mode does not sync skills/creds). Fix:
  `hermes config set terminal.modal_mode direct`.
- **`SUPABASE_URL is not set` in the sandbox** → the var isn't in
  `terminal.env_passthrough` (it is by default now: SUPABASE_*, TAVILY, REDDIT_*).
- **Tavily/Supabase errors locally** → check `~/.hermes/.env`; scripts auto-load
  it, so `python scout_search.py --query ...` should work without sourcing.
