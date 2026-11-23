#!/bin/bash
# One place for every run-specific setting: DAY, PORT, PAGE, DIST_DIR, FRAMES_DIR, OUT_DIR, CHROME, FONT_CHECKS. `source` it first. Set FONT_CHECKS to the exact font weights your product uses, e.g. "600 40px YourFont,400 16px YourFont".
# Source this. Everything date/path-specific lives here.
export DAY=${DAY:-$(date +%F)}
export ROOT=${ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}
export PORT=${PORT:-5292}
export PAGE=${PAGE:-/}
export DIST_DIR=${DIST_DIR:-/tmp/dist-$DAY}
export FRAMES_DIR=${FRAMES_DIR:-/tmp/frames-$DAY}   # per-scene subfolders: $FRAMES_DIR/<scene>
export OUT_DIR=${OUT_DIR:-$ROOT/../out}
export CHROME=${CHROME:-/usr/bin/google-chrome}
export FONT_CHECKS=${FONT_CHECKS:-"600 40px Inter,500 16px Inter,400 16px Inter"}  # comma list of CSS font shorthands that must be loaded
mkdir -p "$OUT_DIR" "$ROOT/proofs/qa" "$ROOT/proofs/snaps"
