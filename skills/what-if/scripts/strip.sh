#!/bin/bash
# Labeled contact sheet of n evenly spaced frames from any mp4.
# usage: strip.sh <mp4> <out.png> [n]  -> n evenly spaced frames, labeled with time
f=$1; o=$2; n=${3:-12}
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f"); tmp=$(mktemp -d)
for i in $(seq 0 $((n-1))); do t=$(python3 -c "print($d*$i/$n)"); ffmpeg -v error -ss $t -i "$f" -frames:v 1 -vf scale=480:270 $tmp/s$(printf %02d $i).png; done
python3 - "$tmp" "$o" "$d" "$n" <<'P'
import glob,sys
from PIL import Image, ImageDraw
tmp,o,d,n=sys.argv[1],sys.argv[2],float(sys.argv[3]),int(sys.argv[4])
ims=[Image.open(x) for x in sorted(glob.glob(tmp+'/s*.png'))]
c=4; r=(len(ims)+c-1)//c; s=Image.new('RGB',(480*c,270*r),'#888')
for i,im in enumerate(ims):
    s.paste(im,((i%c)*480,(i//c)*270)); ImageDraw.Draw(s).text(((i%c)*480+6,(i//c)*270+256),'%.2fs'%(d*i/n),fill='red')
s.save(o)
P
rm -rf $tmp
