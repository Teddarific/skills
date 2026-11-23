#!/bin/bash
# Labeled contact sheet of n evenly spaced frames from any mp4 (960x540 tiles, two per row).
# usage: bash strip.sh <mp4> <out.png> [n]  -> n evenly spaced frames, labeled with time
f=$1; o=$2; n=${3:-12}
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f"); tmp=$(mktemp -d)
for i in $(seq 0 $((n-1))); do t=$(python3 -c "print($d*$i/$n)"); ffmpeg -v error -ss $t -i "$f" -frames:v 1 -vf scale=960:540 $tmp/s$(printf %02d $i).png; done
python3 - "$tmp" "$o" "$d" "$n" <<'P'
import glob,sys
from PIL import Image, ImageDraw, ImageFont
tmp,o,d,n=sys.argv[1],sys.argv[2],float(sys.argv[3]),int(sys.argv[4])
ims=[Image.open(x) for x in sorted(glob.glob(tmp+'/s*.png'))]
try: font=ImageFont.load_default(size=28)
except TypeError: font=ImageFont.load_default()
c=2; r=(len(ims)+c-1)//c; s=Image.new('RGB',(960*c,540*r),'#888')
for i,im in enumerate(ims):
    s.paste(im,((i%c)*960,(i//c)*540)); ImageDraw.Draw(s).text(((i%c)*960+10,(i//c)*540+500),'%.2fs'%(d*i/n),fill='red',font=font)
s.save(o)
P
rm -rf $tmp
