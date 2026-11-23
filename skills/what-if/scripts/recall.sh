#!/bin/bash
# Batch-records a list of scenes, runs seam.py on each and marks them in CHECKPOINT.json. LIST=$'id durationMs name heroMs' per line.
# usage: LIST=$'id durationMs name heroMs\n...' bash recall.sh
# records each scene, runs seam.py, marks it in $RUN_DIR/CHECKPOINT.json
source "$(dirname "$0")/env.sh" || exit 1; CP="$RUN_DIR/CHECKPOINT.json"
[ -f "$CP" ] || echo '{"pieces":[]}' > "$CP"
while read id T name hero; do
  [ -z "$id" ] && continue
  echo "== $id $name $(date +%H:%M:%S)"
  node "$SCRIPTS_DIR/record.mjs" $id $T $OUT_DIR/$name $hero > /tmp/rec-$DAY-$name.log 2>&1 && python3 "$SCRIPTS_DIR/seam.py" $id
  python3 - "$CP" "$id" "$name" "$OUT_DIR" <<'PY'
import json,sys
p,i,n,o=sys.argv[1:5]; d=json.load(open(p))
x=next((x for x in d['pieces'] if x['id']==i),None)
if not x: x={'id':i}; d['pieces'].append(x)
x['name']=n; x['status']='recorded (QA pending)'; x['out']=f'{o}/{n}.mp4'
json.dump(d,open(p,'w'),indent=1)
PY
done <<< "$LIST"
echo ALLDONE
