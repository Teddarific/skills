#!/usr/bin/env node
// Captures the user's real product page: a screenshot plus computed styles and copy of visible elements, so scenes build on the real product.
// node capture.mjs <url> <name>  -> $APP_DIR/real/<name>.png (full-viewport screenshot @2x) + real/<name>.json (computed styles + copy of visible elements)
// Clean captures (env, all optional): STORAGE='{"key":"value"}' seeds localStorage before the page loads (e.g. a "welcome seen" flag);
// CLICK='["text=Got it","[aria-label=Close]"]' clicks each listed control that is visible (welcome screens, tours);
// HIDE='.promo, .upsell' hides promos and banners in place. CHROME only to use a browser other than Playwright's Chromium.
import { chromium } from 'playwright'
import fs from 'node:fs'
const [url, name = 'home'] = process.argv.slice(2)
const OUT = `${process.env.APP_DIR || '.'}/real`; fs.mkdirSync(OUT, { recursive: true })
const storage = JSON.parse(process.env.STORAGE || '{}'), clicks = JSON.parse(process.env.CLICK || '[]'), hide = process.env.HIDE || ''
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await ctx.addInitScript((s) => { try { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)) } catch {} }, storage)
const p = await ctx.newPage()
const idle = async () => { await p.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1500) }
for (let attempt = 1; ; attempt++) {
  try {
    await p.goto(url, { waitUntil: 'load', timeout: 60000 }); await idle(); await p.waitForTimeout(2000)
    for (const sel of clicks) { const el = p.locator(sel).first(); if (await el.isVisible().catch(() => false)) { await el.click({ timeout: 5000 }); await idle() } }
    if (hide) await p.addStyleTag({ content: `${hide} { visibility: hidden !important }` })
    break
  } catch (e) {
    if (attempt === 3) throw e
    console.error(`attempt ${attempt} failed: ${e.message.split('\n')[0]}; retrying`)
  }
}
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
console.log(name, 'ok', info.length, 'elements;', await p.title(), `-> ${OUT}/${name}.png (look at it: no promos, banners or welcome screens)`); await b.close()
