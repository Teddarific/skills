# Brief templates

Use the film brief before building each piece, and the finishing brief to complete an interrupted drop. Placeholders in angle brackets are for the bot to fill in from the current drop; they are not for you.

## Film brief (the contract for each piece)
Write one for every film before building it:
```
Film: <Name>
Customer theme it answers: <one sentence, paraphrased from real feedback; no names or quotes>
Interaction, beat by beat:
  0.0-0.8s  <start state, what's on screen>
  0.8-1.6s  <trigger: cursor moves / key pressed>
  1.6-4.0s  <payoff: what changes, with easing>
  4.0-6.5s  <hold so it can be read>
  6.5-7.5s  <return to the start state>
Use: <tokens file, fonts + weights, logo/icon SVG paths, real-page capture to build on>
Output contract: 960x540 stage at 2x = 1920x1080, 60 fps, 5-8 s, ends in its start state, H.264 yuv420p faststart
QA: probe, seam check, 12-frame sheet, zoom check (section 5)
Caption: "What if ...?" 1-2 sentences naming the interaction
```


## Finishing brief (use it to finish an interrupted drop)
```
Finish today's What-if drop in <DAY folder>. The morning run was cut off. Read CHECKPOINT.json first and resume from it. Don't restart, and don't rebuild finished pieces.
State: <N> of 10 recorded in out/. Finish the remaining piece(s), then QA all 10. Order: <piece list>.
Pipeline: build with build.sh (vite build, served on PORT); record with record.mjs <scene> <durationMs> <outBase> [heroMs] or batch with recall.sh (shared clock stepped 1/60 s at 960x540, deviceScaleFactor 2 = 1920x1080 at 60 fps; libx264 crf 14, yuv420p, faststart; hero PNG beside each mp4; check fonts loaded before frame 0). Resume a partial recording with START=<frame>.
QA for every piece, from the encoded mp4: qa.sh (ffprobe must show h264, 1920x1080, yuv420p, 60 fps, expected frame count; look at the 12-frame sheet as an image); seam.py (both loop-seam steps no bigger than 1.5x the 95th percentile of normal steps, else fix the ending state and re-record); zoom check with sh.sh / snap.mjs at the busiest moment and the end (garbled or overlapping text, clipped shapes, stray edges, elements passing through each other, unreadable labels, moves that snap instead of easing home). Check every flag against the source before changing anything (false positives); re-render and re-check after every fix. Replace a weak piece rather than ship it. Write down small remaining flaws. Update CHECKPOINT.json after every piece.
Captions: one intro plus one caption per piece, all "What if..." questions grounded in each piece's customer theme. Write them with write_drop.py into intro.txt and captions.json. Name in bold, then one or two sentences. No numbering. Link the real site where a film uses it. No customer names, quotes, ticket IDs or pricing. The intro ends with the line that these are concepts drawn from what we're hearing from customers, not a roadmap.
Log: append today's entry, one line per piece naming its theme (or "eye candy"), plus known flaws.
Don't post. Set the checkpoint stage to "ready to post" and report the out/ paths, QA results per piece (seam numbers, probe), and any flaws you chose to keep.
```

