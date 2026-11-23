#!/bin/bash
# One place for every run-specific setting: DAY, APP_DIR, RUN_DIR, PORT, PAGE, DIST_DIR, FRAMES_DIR, OUT_DIR, FONT_CHECKS, CHROME. `source` it first. Set FONT_CHECKS to the exact font weights your product uses, e.g. "600 40px YourFont,400 16px YourFont".
# APP_DIR is your film app (index.html, src/) and can live anywhere; it defaults to this folder for scripts copied into the app.
# CHROME is optional: leave it unset to use Playwright's bundled Chromium (npx playwright install chromium).
# Source this. Everything date/path-specific lives here.
export DAY=${DAY:-$(date +%F)}
export SCRIPTS_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
_app=${APP_DIR:-${ROOT:-$SCRIPTS_DIR}}
APP_DIR=$(cd "$_app" 2>/dev/null && pwd) || { echo "APP_DIR not found: $_app" >&2; return 1 2>/dev/null || exit 1; }
export APP_DIR; unset _app
export RUN_DIR=${RUN_DIR:-$(dirname "$APP_DIR")}   # the dated run folder: CHECKPOINT.json, out/, proofs/
export PORT=${PORT:-5292}
export PAGE=${PAGE:-/}
export DIST_DIR=${DIST_DIR:-/tmp/dist-$DAY}
export FRAMES_DIR=${FRAMES_DIR:-/tmp/frames-$DAY}   # per-scene subfolders: $FRAMES_DIR/<scene>
export OUT_DIR=${OUT_DIR:-$RUN_DIR/out}
export FONT_CHECKS=${FONT_CHECKS:-"600 40px Inter,500 16px Inter,400 16px Inter"}  # comma list of CSS font shorthands that must be loaded
mkdir -p "$OUT_DIR" "$RUN_DIR/proofs/qa" "$RUN_DIR/proofs/snaps"
