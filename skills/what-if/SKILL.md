---
name: what-if
description: "How to build, QA and post a daily drop of \"What if...\" concept films: short code-rendered, seamlessly looping product interaction videos at 1920x1080/60fps, built on the user's real product, checked from the encoded mp4, and posted to Slack so they play inline. Use whenever you are making or posting a What-if drop."
license: MIT
compatibility: Tuned for Grok Bot; adapts to other agents that can run code, schedule jobs and post to Slack. Needs Node, Chrome, ffmpeg, Python with Pillow and numpy, and playwright-core, vite and react in the app.
---

# What-if film craft

## 1. Stack
- One small web app (React + Vite + TypeScript or JS, plain CSS/SVG; WebGL only if the idea needs it), one scene per concept, one fixed **960x540 CSS px** stage (`#stage`).
- **Every animation is a pure function of one shared clock** (section 8). No CSS animations, timers or requestAnimationFrame inside scenes. Live preview ticks the clock; recording steps it by hand, so every frame is exact.
- **Record from a built bundle**, not the dev server (hot reload can reload the page mid-recording). `build.sh` builds into a dist dir and serves it on a port.
- Headless Chrome via Playwright, viewport 960x540, **deviceScaleFactor 2** (output 1920x1080), **60 fps**, software GL flags if there's no GPU. Wait for `document.fonts.ready` and check the specific font weights you use are loaded (abort if not). Log page errors. Take PORT and PAGE from the environment.
- Encode with ffmpeg: `libx264 -preset slow -crf 14 -pix_fmt yuv420p -movflags +faststart`. Save a hero still next to each mp4. Support resuming a long render with START.
- Per-run folders: every day-specific path (frames dir, dist dir, output dir, port) is a variable set in one `env.sh` (DAY, PORT, PAGE, FRAMES_DIR, DIST_DIR). Frames go in `$FRAMES_DIR/<scene>/`. Never hardcode a date.

## 2. Make it real
- Study the real product first: tokens, fonts, radii, shadows, logo and icon SVG paths, real copy. Put tokens in one CSS file and use only them.
- **Capture the real product page** (`capture.mjs`): a screenshot plus the computed styles and copy of visible elements. Build scenes on that real screenshot and real styles instead of mocking the product up. Re-capture when the product changes.
- Write real, specific UI copy. No lorem ipsum. Garbled placeholder text in any frame is a failure.
- Use the fixed-rules guide (written from the product's repo or live page: tokens, fonts, spacing, radii, motion feel, voice, logo). Use only its allowed colors for gradients and effects and keep to its type ladder; concepts push ideas, not the fixed rules.

## 3. Composition and motion
- One idea per film, readable in 2 seconds with sound off, **5-8 s**. Structure: settle, trigger (visible cursor or keypress), payoff, hold, **return to the start state** (that makes a perfect loop).
- Easing: ease-out curves like cubic-bezier(0.22, 1, 0.36, 1) for entrances, springs for travel, every move rest-to-rest with zero velocity at both ends. Avoid linear except for continuous scrolls.
- Stagger layout changes by dependency (an item enters only after its slot is vacated), at least ~0.9 s per move, with settled time to read.
- Never hard-cut or crossfade the whole frame to change state; morph or sweep. If you must crossfade two layers, isolate each (own stacking context, overflow hidden) and snap opacity to 1 near the end.
- Don't overuse one decorative motif. Cool isn't enough: it must be a plausible, usable feature. Cut anything you couldn't picture shipping.
- Side explorations (pure eye candy, experiments) never post. At most 1-2 eye-candy slots go in a drop, clearly separate from the practical ones.

## 4. Per-film brief (the contract for each piece)
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

## 5. QA (every film, from the encoded mp4)
1. `qa.sh`: ffprobe (h264, 1920x1080, yuv420p, 60 fps, frame count), a 12-frame sheet, and a full-res mean diff between the last and first frames. Proofs are saved under `proofs/qa/`. **Open the sheet and look at it.**
2. `seam.py`: the last-to-first step must look like an ordinary frame step (compare to the median and 95th percentile of normal steps). If it's over ~1.5x p95, fix the ending state.
3. Zoom check: `sh.sh` takes full-res snapshots at chosen times (the busiest moment and the end). Look for garbled or overlapping text, clipped shapes, stray edges, elements passing over others, tiny labels, loops that snap instead of easing home.
4. Verify each flagged problem against the source before fixing it; automated reviews flag false positives. Re-render and re-check after every fix.
5. Note remaining flaws in a notes file. Don't post a film with a flaw you'd be embarrassed by.

## 6. Method and reliability
- **One worker builds the whole drop in sequence**, updating `CHECKPOINT.json` after every piece (id, name, status, output path), and sets its stage to "ready to post" when done. An interrupted run resumes where it stopped. `recall.sh` batch-records a list of scenes, runs `seam.py` on each and marks them in the checkpoint.
- Scheduled runs sometimes get cut off near the end. The checkpoint saves them: the next run finishes the drop and posts it.
- **The owner bot reviews the encoded mp4s itself** (section 5) before anything posts. Never post a film you haven't looked at; replace a weak piece rather than ship it.
- Dated folders; never overwrite earlier output. Append every drop to a log (one line per piece naming its theme or "eye candy", plus known flaws). Treat repeated owner corrections ("not production quality", "too much like another brand", "no purpose", "too much of one motif", "make transitions buttery smooth") as standing rules.
- Quality bar per piece: one clear, memorable interaction moment, a minimal composition, pixel-clean UI. A witty caption on a modest visual isn't enough. Show ONE moment, not a miniature of a whole flow.
- **Eye candy** (1-2 per drop at most): rich materials and crafted staging; the practicality rule doesn't apply, but it must be precise. Keep transitions continuous: same silhouette, size and perspective across material handoffs, rest-to-rest curves with continuous velocity, settled holds, no hard cuts, pops, flashes or double-logo ghosting. The end-to-start join must be as smooth as the internal joins.

### Finishing brief (rebuilt from the drop files; use it to finish an interrupted drop)
```
Finish today's What-if drop in <DAY folder>. The morning run was cut off. Read CHECKPOINT.json first and resume from it. Don't restart, and don't rebuild finished pieces.
State: <N> of 10 recorded in out/. Finish the remaining piece(s), then QA all 10. Order: <piece list>.
Pipeline: build with build.sh (vite build, served on PORT); record with record.mjs <scene> <durationMs> <outBase> [heroMs] or batch with recall.sh (shared clock stepped 1/60 s at 960x540, deviceScaleFactor 2 = 1920x1080 at 60 fps; libx264 crf 14, yuv420p, faststart; hero PNG beside each mp4; check fonts loaded before frame 0). Resume a partial recording with START=<frame>.
QA for every piece, from the encoded mp4: qa.sh (ffprobe must show h264, 1920x1080, yuv420p, 60 fps, expected frame count; look at the 12-frame sheet as an image); seam.py (both loop-seam steps no bigger than 1.5x the 95th percentile of normal steps, else fix the ending state and re-record); zoom check with sh.sh / snap.mjs at the busiest moment and the end (garbled or overlapping text, clipped shapes, stray edges, elements passing through each other, unreadable labels, moves that snap instead of easing home). Check every flag against the source before changing anything (false positives); re-render and re-check after every fix. Replace a weak piece rather than ship it. Write down small remaining flaws. Update CHECKPOINT.json after every piece.
Captions: one intro plus one caption per piece, all "What if..." questions grounded in each piece's customer theme. Write them with write_drop.py into intro.txt and captions.json. Name in bold, then one or two sentences. No numbering. Link the real site where a film uses it. No customer names, quotes, ticket IDs or pricing. The intro ends with the line that these are concepts drawn from what we're hearing from customers, not a roadmap.
Log: append today's entry, one line per piece naming its theme (or "eye candy"), plus known flaws.
Don't post. Set the checkpoint stage to "ready to post" and report the out/ paths, QA results per piece (seam numbers, probe), and any flaws you chose to keep.
```

## 7. Captions, intro and Slack posting
- Every intro and caption is a natural, specific "What if..." question ("What if you could...", "What if a user could...", "What if the design system..."), varied openings, tied to a real customer theme (paraphrased). The intro frames the set as a "What if..." question and says these are concepts drawn from what we're hearing from customers, not a roadmap. Use `write_drop.py` to write `intro.txt` and `captions.json`. Never number or label pieces.
- Posting is automatic with no review step, from the bot's **own Slack app**. Uploads through a person's Slack account and Slack's generic file-upload flow came through as unplayable stubs; and single-asterisk bold rendered as italic, so use `**Name**`.
  1. Post the intro.
  2. For each piece, in order: post the caption with `**Name**` bold, then the mp4 from the app as a file attachment so it plays inline; read the channel back to confirm the video landed (large files sometimes need a second read); delete the stray "filename.mp4" text message the upload leaves behind. Before retrying an upload, check whether it already went through.
  3. Never post side explorations (card packs, extra eye-candy studies).
  4. Send the owner one short line with the link to the intro. If posting fails, send the videos and captions to the owner and say it failed. If nothing publishable was produced, say what blocked the drop instead of posting old work.
- Keep real customer quotes and internal notes out of anything public. Describe the method, not the content.

## 8. Scripts
Reference scripts live in this skill's `scripts/` folder (raw files at `https://raw.githubusercontent.com/Teddarific/skills/main/skills/what-if/scripts/<file>`): `env.sh`, `build.sh`, `record.mjs`, `recall.sh`, `seam.py`, `qa.sh`, `strip.sh`, `snap.mjs`, `sh.sh`, `capture.mjs`, `write_drop.py`, and the shared clock `clock.js`. If you can't fetch them, write equivalents to the specs above (shared clock stepped by hand, 960x540 at 2x, 60 fps, libx264 crf 14 yuv420p faststart; seam, qa, snapshot and capture steps as described). Requirements: Node, Chrome, ffmpeg, Python with Pillow and numpy, and `playwright-core`, `vite`, `react` in the app.

The shared clock (step hook `window.__filmStep`):
```js
import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
const listeners = new Set(); let now = 0; let raf = null
const recording = new URLSearchParams(location.search).has('record')
const notify = () => listeners.forEach((l) => l())
const tick = (ts) => { now = ts; notify(); raf = listeners.size ? requestAnimationFrame(tick) : null }
if (recording) window.__filmStep = (ms) => { now += ms; flushSync(notify) }
const subscribe = (l) => { listeners.add(l); if (!recording && raf === null) raf = requestAnimationFrame(tick); return () => listeners.delete(l) }
export const isRecording = () => recording
export const useClock = () => useSyncExternalStore(subscribe, () => now, () => 0)
```
In a scene, `const t = useClock()` gives ms; derive every position, opacity and color from `t` with easing. Loop with `t % duration` in live preview; use raw `t` while recording.
