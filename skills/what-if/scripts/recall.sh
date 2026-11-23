#!/bin/bash
# Batch-records a list of scenes, runs seam.py on each and marks them in CHECKPOINT.json. LIST=$'id durationMs name heroMs' per line.
# usage: LIST=$'id durationMs name heroMs\n...' bash recall.sh
# records each scene, runs seam.py (seam + motion), marks it in $RUN_DIR/CHECKPOINT.json with what actually happened
source "$(dirname "$0")/env.sh" || exit 1; CP="$RUN_DIR/CHECKPOINT.json"
[ -f "$CP" ] || echo '{"pieces":[]}' > "$CP"
while read -r id T name hero; do
  [ -z "$id" ] && continue
  echo "== $id $name $(date +%H:%M:%S)"
  log=/tmp/rec-$DAY-$name.log
  if ! node "$SCRIPTS_DIR/record.mjs" "$id" "$T" "$OUT_DIR/$name" $hero > "$log" 2>&1; then status="record failed (see $log)"; tail -5 "$log"
  elif ! python3 "$SCRIPTS_DIR/seam.py" "$id"; then status='recorded, seam/motion CHECK failed'
  else status='recorded (QA pending)'; fi
  python3 - "$CP" "$id" "$name" "$OUT_DIR" "$status" <<'PY'
import json,sys
p,i,n,o,s=sys.argv[1:6]; d=json.load(open(p))
x=next((x for x in d['pieces'] if x['id']==i),None)
if not x: x={'id':i}; d['pieces'].append(x)
x['name']=n; x['status']=s; x['out']=f'{o}/{n}.mp4'
json.dump(d,open(p,'w'),indent=1)
PY
done <<< "$LIST"
echo ALLDONE
