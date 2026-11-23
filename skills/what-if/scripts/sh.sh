#!/bin/bash
# Runs snap.mjs and tiles the snapshots into a 2-column sheet.
# usage: bash sh.sh <scene> <tag> <t1,t2,...>  -> snaps + 2-column sheet $RUN_DIR/proofs/snaps/<scene>-<tag>-sheet.png
source "$(dirname "$0")/env.sh" || exit 1
node "$SCRIPTS_DIR/snap.mjs" $1 $3 $2 || exit 1
python3 - "$1" "$2" "$3" "$RUN_DIR" <<'P'
import sys
from PIL import Image
s,tag,ts,root=sys.argv[1],sys.argv[2],sorted(map(int,sys.argv[3].split(','))),sys.argv[4]
d=f'{root}/proofs/snaps/'
ims=[Image.open(f'{d}{s}-{tag}-{t}.png') for t in ts]
c=Image.new('RGB',(1920,540*((len(ims)+1)//2)),'white')
for i,im in enumerate(ims): c.paste(im,((i%2)*960,(i//2)*540))
c.save(f'{d}{s}-{tag}-sheet.png')
P
