#!/bin/bash
# Builds your Vite app (APP_DIR) into DIST_DIR and serves it on PORT (record from a build, never the dev server).
# usage: bash build.sh
set -e; source "$(dirname "$0")/env.sh"
[ -f "$APP_DIR/index.html" ] || { echo "no index.html in APP_DIR=$APP_DIR; set APP_DIR to your film app" >&2; exit 1; }
cd "$APP_DIR"
npx vite build --outDir "$DIST_DIR" --emptyOutDir > /tmp/build-$DAY.log 2>&1 || { cat /tmp/build-$DAY.log; exit 1; }
pkill -f "http.server $PORT" || true
(cd "$DIST_DIR" && nohup python3 -m http.server "$PORT" > /dev/null 2>&1 &)
sleep 0.7; echo "built, serving $DIST_DIR on :$PORT"
