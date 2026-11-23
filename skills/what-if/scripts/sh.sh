#!/bin/bash
# Runs snap.mjs (full-res 1920x1080 snapshots) and tiles them, scaled to 960x540, into a 2-column overview sheet. Judge text on the full-res PNGs.
# usage: bash sh.sh <scene> <tag> <t1,t2,...>  -> $RUN_DIR/proofs/snaps/<scene>-<tag>-<t>.png + <scene>-<tag>-sheet.png
source "$(dirname "$0")/env.sh" || exit 1
node "$SCRIPTS_DIR/snap.mjs" "$1" "$3" "$2" || exit 1
python3 - "$1" "$2" "$3" "$RUN_DIR/proofs/snaps" <<'P'
import sys
from PIL import Image
s,tag,ts,d=sys.argv[1],sys.argv[2],sorted(map(int,sys.argv[3].split(','))),sys.argv[4]
ims=[Image.open(f'{d}/{s}-{tag}-{t}.png').convert('RGB').resize((960,540),Image.LANCZOS) for t in ts]
c=Image.new('RGB',(1920,540*((len(ims)+1)//2)),'white')
for i,im in enumerate(ims): c.paste(im,((i%2)*960,(i//2)*540))
c.save(f'{d}/{s}-{tag}-sheet.png')
print('full-res zooms (open each at 100%):', ' '.join(f'{d}/{s}-{tag}-{t}.png' for t in ts))
P
