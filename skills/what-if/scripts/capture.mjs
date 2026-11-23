#!/usr/bin/env node
// Captures the user's real product page: a screenshot plus computed styles and copy of visible elements, so scenes build on the real product.
// node capture.mjs <url> <name>  -> $APP_DIR/real/<name>.png (full-viewport screenshot @2x) + real/<name>.json (computed styles + copy of visible elements). CHROME only to use a browser other than Playwright's Chromium.
import { chromium } from 'playwright'
import fs from 'node:fs'
const [url, name = 'home'] = process.argv.slice(2)
const OUT = `${process.env.APP_DIR || '.'}/real`; fs.mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }); await p.waitForTimeout(3500)
await p.screenshot({ path: `${OUT}/${name}.png` })
const info = await p.evaluate(() => {
  const out = []
  for (const el of document.querySelectorAll('h1,h2,h3,p,a,button,nav,img,svg,input,video,canvas,li')) {
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > 900 || r.width < 4 || r.height < 4) continue
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.opacity === '0') continue
    out.push({ tag: el.tagName, text: (el.innerText || el.getAttribute('alt') || '').trim().slice(0, 60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), size: cs.fontSize, weight: cs.fontWeight, color: cs.color, bg: cs.backgroundColor, radius: cs.borderRadius, font: cs.fontFamily })
  }
  return out
})
fs.writeFileSync(`${OUT}/${name}.json`, JSON.stringify(info, null, 1))
console.log(name, 'ok', info.length, 'elements;', await p.title()); await b.close()
