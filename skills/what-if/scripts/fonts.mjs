// Font gate shared by record.mjs and snap.mjs. FONT_CHECKS is required (see env.sh); exits 2 unless every listed font is really loaded.
// document.fonts.check() alone returns true for a font that was never declared, so each entry must match a loaded @font-face
// whose weight range and style cover it (a 600 that only has a 400 face is a fail, not a synthetic bold).
export async function requireFonts(page) {
  const list = (process.env.FONT_CHECKS || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!list.length) {
    console.error('FONT_CHECKS is not set. Set it to every family and weight in the fixed-rules guide, e.g.\n  FONT_CHECKS=\'600 40px "Your Font",400 16px "Your Font"\'\n(or FONT_CHECKS=none if the product only uses system fonts).')
    process.exit(2)
  }
  if (list.length === 1 && list[0] === 'none') return console.log('fonts: FONT_CHECKS=none, not checked')
  await page.evaluate(() => document.fonts.ready)
  const res = await page.evaluate(async (fonts) => {
    const range = (v) => { const n = String(v).trim().split(/\s+/).map((x) => (x === 'bold' ? 700 : x === 'normal' ? 400 : Number(x))); return [n[0], n[1] ?? n[0]] }
    return Promise.all(fonts.map(async (font) => {
      const s = document.createElement('i').style; s.font = font
      if (!s.fontFamily) return { font, ok: false, got: 'not a CSS font shorthand' }
      const [want] = range(s.fontWeight), italic = s.fontStyle !== 'normal'
      const faces = await document.fonts.load(font).catch(() => [])
      const ok = faces.some((f) => { const [lo, hi] = range(f.weight); return f.status === 'loaded' && lo <= want && want <= hi && (f.style !== 'normal') === italic })
      return { font, ok, got: faces.map((f) => `${f.family} ${f.weight} ${f.style} ${f.status}`).join('; ') || 'no matching @font-face' }
    }))
  }, list)
  console.log('fonts', JSON.stringify(res.map(({ font, ok }) => [font, ok])))
  const bad = res.filter((r) => !r.ok)
  if (bad.length) {
    for (const r of bad) console.error(`FONT NOT LOADED: ${r.font} (got: ${r.got})`)
    console.error('Serve the product fonts from the app with @font-face, or fix FONT_CHECKS to match the fixed-rules guide. Aborting.')
    process.exit(2)
  }
}
