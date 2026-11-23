#!/bin/bash
# End-to-end smoke test of the scripts as a bot gets them: fetched without exec bits, package.json installed in a workspace,
# the film app in its own folder (APP_DIR). Records a moving and a static scene and checks the font gate, the seam and motion
# check, the QA sheet and zooms, the captions and a clean capture.
# usage: bash tests/smoke.sh   (needs Node, ffmpeg, Python with Pillow and numpy, and network for npm and Chromium; WITH_DEPS=1 also installs Chromium's system libraries)
set -euo pipefail
skill=$(cd "$(dirname "$0")/.." && pwd)
work=$(mktemp -d); export PORT=${PORT:-5391}
trap 'pkill -f "http.server $PORT" || true; rm -rf "$work"' EXIT
fail() { echo "SMOKE FAIL: $*" >&2; exit 1; }

mkdir -p "$work/scripts" "$work/day/app/src" "$work/day/app/public"
cp "$skill"/scripts/* "$work/scripts/"; chmod -x "$work"/scripts/*
cp "$work/scripts/package.json" "$work/"
cd "$work"
npm install --no-audit --no-fund --loglevel=error
npx playwright install ${WITH_DEPS:+--with-deps} chromium

font=$(find /usr/share/fonts -name '*.ttf' ! -iname '*italic*' ! -iname '*bold*' -print -quit); [ -n "$font" ] || fail "no .ttf font found"
cp "$font" day/app/public/smoke.ttf; cp scripts/clock.js day/app/src/
cat > day/app/index.html <<'EOF'
<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Smoke Sans"; src: url(/smoke.ttf); font-weight: 400 }
body { margin: 0 } #stage { position: relative; width: 960px; height: 540px; overflow: hidden; background: #f4f4f0; font: 400 32px "Smoke Sans" }
</style></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>
EOF
cat > day/app/src/main.jsx <<'EOF'
import { createRoot } from 'react-dom/client'
import { useClock, isRecording } from './clock.js'
const scene = new URLSearchParams(location.search).get('scene')
const ease = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)
function Stage() {
  const t = useClock(), T = isRecording() ? t : t % 2000
  const k = scene === 'still' ? 0 : T < 1000 ? ease(T / 1000) : ease(1 - (T - 1000) / 1000)
  return <div id="stage"><p style={{ margin: 40 }}>What if it moved?</p>
    <div style={{ position: 'absolute', left: 80 + 600 * k, top: 260, width: 200, height: 120, borderRadius: 16, background: '#3b5bdb' }} /></div>
}
createRoot(document.getElementById('root')).render(<Stage />)
EOF
cat > day/app/public/promo.html <<'EOF'
<!doctype html><html><body>
<a class="promo" href="#">Upgrade to Pro</a>
<p id="welcome" hidden>Welcome to the canvas <button>Got it</button></p>
<p id="tour">Take the tour <button aria-label="Close" onclick="this.parentNode.remove()">x</button></p>
<script>if (localStorage.getItem('welcomed') !== '1') document.getElementById('welcome').hidden = false</script>
<h1>Canvas</h1>
</body></html>
EOF

export APP_DIR="$work/day/app" DAY=smoke FRAMES_DIR="$work/frames" DIST_DIR="$work/dist"
bash scripts/build.sh

for fc in '' '400 32px Inter' '700 32px "Smoke Sans"'; do
  if FONT_CHECKS="$fc" node scripts/record.mjs move 500 "$work/x" > font.log 2>&1; then fail "record.mjs passed FONT_CHECKS='$fc'"; fi
  grep -q -e 'FONT_CHECKS is not set' -e 'FONT NOT LOADED' font.log || { cat font.log; fail "no font error for FONT_CHECKS='$fc'"; }
done
export FONT_CHECKS='400 32px "Smoke Sans"'

LIST=$'move 2000 move\nstill 2000 still' bash scripts/recall.sh
python3 - day/CHECKPOINT.json <<'PY'
import json, sys
s = {p['id']: p['status'] for p in json.load(open(sys.argv[1]))['pieces']}
assert s['move'] == 'recorded (QA pending)', s
assert 'CHECK' in s['still'], s
PY

probe=$(bash scripts/qa.sh move); echo "$probe"
for want in codec_name=h264 width=1920 height=1080 pix_fmt=yuv420p r_frame_rate=60/1 nb_frames=120; do grep -q "$want" <<< "$probe" || fail "qa.sh probe lacks $want"; done
bash scripts/sh.sh move a 600,1000
bash scripts/strip.sh day/out/move.mp4 strip.png 4
python3 - day/proofs strip.png <<'PY'
import sys
from PIL import Image
d = sys.argv[1]
assert Image.open(f'{d}/qa/move-sheet-a.png').size == (1920, 3240)
assert Image.open(f'{d}/snaps/move-a-1000.png').size == (1920, 1080)
assert Image.open(f'{d}/snaps/move-a-sheet.png').size == (1920, 540)
assert Image.open(sys.argv[2]).size == (1920, 1080)
PY

python3 scripts/write_drop.py
grep -qx "One short film today. These are concepts drawn from what we're hearing from customers, not a roadmap." intro.txt || { cat intro.txt; fail "write_drop.py intro"; }

STORAGE='{"welcomed":"1"}' CLICK='["[aria-label=Close]"]' HIDE='.promo' node scripts/capture.mjs "http://localhost:$PORT/promo.html" promo
python3 - "$APP_DIR/real/promo.json" <<'PY'
import json, sys
texts = ' '.join(e['text'] for e in json.load(open(sys.argv[1])))
assert 'Canvas' in texts and not any(w in texts for w in ('Upgrade', 'Welcome', 'tour')), texts
PY
echo "SMOKE OK"
