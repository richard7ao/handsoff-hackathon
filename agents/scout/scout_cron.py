#!/usr/bin/env python3
"""Scout cron entry point.

Run by Hermes cron in `--no-agent --script` mode: scouts every business brief
in scout_briefs with status='new' (search via Tavily -> write to scout_findings
-> mark the brief done). No LLM involved — deterministic and cheap.

Stays SILENT when there are no new briefs (empty stdout => no delivery).
"""
import os
import subprocess
import sys

SCOUT = os.path.expanduser("~/.hermes/skills/scout/scout_search.py")


def main() -> int:
    proc = subprocess.run(
        [sys.executable, SCOUT, "--briefs-new", "--extract", "--limit", "10"],
        capture_output=True,
        text=True,
    )
    out = (proc.stdout or "").strip()
    err = (proc.stderr or "").strip()

    # "No briefs to scout." => nothing happened; stay silent.
    if out and out != "No briefs to scout.":
        print(out)
    if proc.returncode != 0 and err:
        print(f"[scout-cron] error: {err}")
    return 0  # never fail the cron tick; errors are reported in stdout


if __name__ == "__main__":
    sys.exit(main())
