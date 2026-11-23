#!/bin/bash
# QA on the encoded mp4: ffprobe, a 12-frame contact sheet (960x540 tiles, two per row) and the full-res last/first mean diff. Proofs go under $RUN_DIR/proofs/qa/.
# The sheet shows the beats; it's too coarse to judge UI text, so the full-res zooms (sh.sh) are the real check for that.
# usage: bash qa.sh <name> [tag]
source "$(dirname "$0")/env.sh" || exit 1; n=$1; t=${2:-a}; f=$OUT_DIR/$n.mp4; q=$RUN_DIR/proofs/qa
[ -f "$f" ] || { echo "no $f" >&2; exit 1; }
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,nb_frames -show_entries format=duration -of compact "$f"
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
ffmpeg -v error -y -i "$f" -vf "fps=12/$d,scale=960:540,tile=2x6" -frames:v 1 "$q/$n-sheet-$t.png"
ffmpeg -v error -y -sseof -0.05 -i "$f" -frames:v 1 "$q/$n-last.png"
ffmpeg -v error -y -i "$f" -frames:v 1 "$q/$n-first.png"
python3 - "$q/$n-last.png" "$q/$n-first.png" <<'P'
import sys
from PIL import Image, ImageChops, ImageStat
a=Image.open(sys.argv[1]).convert('RGB'); b=Image.open(sys.argv[2]).convert('RGB')
print("full-res last/first mean diff", [round(x,2) for x in ImageStat.Stat(ImageChops.difference(a,b)).mean])
P
echo "sheet: $q/$n-sheet-$t.png  (open it and look at the beats; judge text on the sh.sh zooms)"
