#!/usr/bin/env node
// Frame-exact recorder. Steps the shared clock 1/60 s per frame on a 960x540 stage at 2x (1920x1080), then encodes with ffmpeg. Aborts unless every font in FONT_CHECKS is loaded (fonts.mjs). START=<frame> resumes.
// usage: node record.mjs <scene> <durationMs> <outBase> [heroMs]   (env: PORT PAGE FRAMES_DIR FONT_CHECKS START; CHROME only to use a browser other than Playwright's Chromium)
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { requireFonts } from './fonts.mjs'
const [scene, durStr, outBase, heroStr] = process.argv.slice(2)
const fps = 60, dur = Number(durStr), frames = Math.round((dur / 1000) * fps)
const tmp = `${process.env.FRAMES_DIR || '/tmp/frames'}/${scene}`
const START = Number(process.env.START || 0)
if (!START) fs.rmSync(tmp, { recursive: true, force: true })
fs.mkdirSync(tmp, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-accelerated-2d-canvas', '--font-render-hinting=none'],
})
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 })
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()) })
page.on('pageerror', (e) => console.error('[pageerror]', e.message))
await page.goto(`http://localhost:${process.env.PORT || 5292}${process.env.PAGE || '/'}?scene=${scene}&record=1`, { waitUntil: 'networkidle' })
await requireFonts(page)
await page.waitForFunction(() => typeof window.__filmStep === 'function')
const box = await (await page.$('#stage')).boundingBox()
await page.evaluate(() => window.__filmStep(0))
if (START) await page.evaluate((ms) => window.__filmStep(ms), (START * 1000) / fps)
for (let i = START; i < frames; i++) {
  await page.evaluate((ms) => window.__filmStep(ms), 1000 / fps)
  await page.screenshot({ path: `${tmp}/f${String(i).padStart(4, '0')}.png`, clip: box, animations: 'allow', caret: 'initial', timeout: 180000 })
  if (i % 60 === 0) process.stdout.write(`${i}/${frames} `)
}
await browser.close()
fs.mkdirSync(path.dirname(outBase), { recursive: true })
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', `${tmp}/f%04d.png`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${outBase}.mp4`])
const hero = Math.min(frames - 1, Math.round(((heroStr ? Number(heroStr) : dur - 400) / 1000) * fps))
fs.copyFileSync(`${tmp}/f${String(hero).padStart(4, '0')}.png`, `${outBase}-hero.png`)
console.log(`\nwrote ${outBase}.mp4 (${frames} frames) + hero`)
