#!/usr/bin/env node
// Full-res snapshots of a scene at chosen times (ms) for the zoom check: 1920x1080 by default (DSF=2), the same pixels as the video.
// node snap.mjs <scene> <t1,t2,...> [tag]  -> $RUN_DIR/proofs/snaps/<scene>-<tag>-<t>.png (env: PORT PAGE RUN_DIR FONT_CHECKS DSF; CHROME only to use a browser other than Playwright's Chromium)
import { chromium } from 'playwright'
import fs from 'node:fs'
import { requireFonts } from './fonts.mjs'
const [scene, list, tag = 'a'] = process.argv.slice(2)
const dir = `${process.env.RUN_DIR || '.'}/proofs/snaps`; fs.mkdirSync(dir, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: Number(process.env.DSF || 2) })
p.on('pageerror', (e) => console.error('[pageerror]', e.message))
p.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()) })
await p.goto(`http://localhost:${process.env.PORT || 5292}${process.env.PAGE || '/'}?scene=${scene}&record=1`, { waitUntil: 'networkidle' })
await requireFonts(p)
await p.waitForFunction(() => typeof window.__filmStep === 'function')
let cur = 0; await p.evaluate(() => window.__filmStep(0))
for (const t of list.split(',').map(Number).sort((a, c) => a - c)) {
  await p.evaluate((d) => window.__filmStep(d), t - cur); cur = t
  await p.screenshot({ path: `${dir}/${scene}-${tag}-${t}.png` })
}
await b.close(); console.log('ok')
