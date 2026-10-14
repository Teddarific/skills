# Export

What ships, and how to check it before it does.

## Contents
1. The drop
2. Using it on a site
3. PNG and other formats
4. Ambient motion
5. Size budget
6. Asset checks

## 1. The drop

`assetSvg({ width, height, label, body, paper, theme, accents, tint, weight, background, motion, css, id })` from `kit/asset.mjs` returns one standalone SVG:

- `ISO_CSS`, the ground tokens, the accent rules and the ambient keyframes, inlined in a CDATA `<style>`.
- Every rule beyond the shared kit CSS scoped to the SVG's `id`, so two assets inlined on one page don't fight. Give each asset a stable `id` (the file name is good).
- `width`/`height` attributes and a `viewBox`, so it has an intrinsic size in `<img>` and in design tools.
- `role="img"` and an `aria-label`: say what the object is, in one sentence.
- The art in `<g data-art="">`, which the preview's safe-zone check measures.

Write it next to the build script with the preview page:

```js
writeFileSync(join(HERE, `${name}.svg`), svg);
writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W, safe: SAFE }));
```

`previewHtml` shows the SVG inline on its page colour inside a stage the capture, drive and line scripts find by default.

## 2. Using it on a site

- **`<img src="hero.svg" alt="…">`.** The default. It renders, scales and animates (CSS animations run inside SVG images), and it caches. Scripts don't run, and the page's CSS can't reach in, which is why everything is inlined.
- **Inline `<svg>`.** Paste or import the markup when the page needs to style or script it. The scoped ids keep it from leaking.
- **React / Next.js.** `<img>` or `next/image` with `unoptimized` (the optimiser rasterises SVG). For an interactive asset, move to Anatomy's React path (`references/react.md`).
- **Design tools.** Figma and others import the `.svg`; they drop CSS variables, so export a flattened copy if the user needs one: open the preview, then save each element's computed fill and stroke (a small `drive.mjs` `eval`), or ship the PNG.
- **Theme switching.** Ship two files (`hero.svg`, `hero-light.svg`) and swap them with `<picture>` and `prefers-color-scheme`, or with the site's theme class.

## 3. PNG and other formats

- **PNG at 2×:** `node scripts/capture.mjs hero.html --select .asset-stage --scale 2 --out hero@2x.png`. The PNG carries the page colour as its background.
- **Social/OG:** build the asset on a 1200 × 630 canvas with `background: true`, then capture at `--scale 1` and `--scale 2`.
- **Video or GIF of the ambient loop:** capture frames with `drive.mjs` (`["shot", …]` in a loop of `["wait", 40]`), then assemble with ffmpeg if the user has it. Prefer the SVG itself; a loop that runs in CSS is smaller than any video.

## 4. Ambient motion

CSS only, so it survives `<img>`. From `kit/asset.mjs`:

| Helper | Motion | Use it for |
|---|---|---|
| `amFloat(svg, P, { rise, period, delay, halo })` | Bobs up `rise` world units and back; its halo stays on the floor and lightens | A lifted part, a hovering product |
| `amSlide(svg, offset, P, { period, delay, halo })` | Eases along a world offset and back | A fader, a carriage, a drawer that breathes |
| `amPulse(svg, { period, delay, min })` | Opacity breathes | A glow, a status ring |
| `amBlink(svg, { period, delay, min })` | A short on-blink | LEDs; stagger `delay` across a row |
| `amSpin(flat, matrix, { period, reverse, delay })` | Turns a flat drawing about its origin, inside a plane placed by `matrix` | Rotors, propellers, fans, turbine blades, a turntable's marks |
| `amRotor(hub, u, v, P, { count, r0, r1, chord, tip, sweep, period, reverse, delay, thickness, blur, clip })` | A finished propeller: a soft blur disc that doesn't turn, blades with thickness, trailing ghost blades | Every propeller, rotor and fan. Use this rather than a bare `amSpin` |
| `amSwing(flat, matrix, { from, to, period, delay })` | Sways about a pivot in a plane | Gauge needles, pendulums, wind vanes, a lamp on its arm |
| `amPress(svg, offset, P, { period, delay })` | A quick press and release, then a rest | Keys, buttons, stamps, plungers; stagger a row to play a phrase |
| `amLoop(svg, offset, P, { period, delay })` | Slides one pitch at constant speed and jumps back | Conveyors, belts, a queue of identical parts: endless motion |
| `amDraw(d, { tone, period, delay })` | A line that draws itself, holds and fades | Handwriting, a trace on a screen, a signal down a cable |
| `amFlip(frames, { period, delay })` | A flipbook of kit-drawn poses | Motion that isn't flat: a vertical-axis turbine, a hinge, a part turning about a vertical axis |

Rules:

- **Every asset moves, and the motion is the object working.** A single blinking LED is not enough: give each asset a signature motion someone notices in the first two seconds (rotors spin, a conveyor runs, a needle swings, keys play, ink writes, a pod lowers), plus one or two small echoes (status LEDs, a float). Anything that would turn in real life turns.
- **Readable, not busy.** At most three or four kinds of motion per asset. Periods 2.5–8 s for slow things, out of phase; spinning things as fast as reads well.
- **How to spin a rotor.** Get the plane: `topPlane([x, y, z], P)` for anything that faces up (an eVTOL rotor, a ducted fan, a ceiling fan), or `planeMatrix(hub, u, v, P)` for any other plane, with `u` and `v` unit world vectors in it (a wind turbine's rotor: `u` horizontal across the rotor, `v` = `[0, 0, -1]`; a fan on a box's front face: `u` along the face, `v` down). Draw the blades in that plane's 2D coordinates around (0, 0): `bladesPath(count, r0, r1, { chord, tip, sweep })` gives tapered blades to fill with a tone (`fill: var(--anatomy-top)`, a `hi` or `mid` stroke), and a faint circle at the tip radius reads as the blur disc. Draw the static hub, spinner or grille after it so it covers the blade roots; for a fan behind an opening pass `clip` (the opening's radius in plane units) so the blades never draw outside it. The swept disc sits in one slot of the painter's order: anything that has to pass in front of part of it and behind another part (a tower behind a turbine rotor is fine; a duct lip in front of half the fan needs the fan drawn inside it) must be split around it.
- **Use `amRotor` for propellers.** Bare flat blades turning slowly look like a paper cut-out. `amRotor` adds what makes a rotor read as spinning: a soft disc (lit with `--anatomy-hi`, so it is a sheen on dark and a shadow on light), blade thickness, and ghost blades trailing the direction of travel. Wrap it in a material class to colour the blades (carbon, composite).
- **Speeds.** Propellers and fans fast enough to blur: 0.45–0.8 s a turn with `amRotor`. A wind turbine slow and stately: 5–7 s, `blur: false`. Give neighbouring rotors different `delay`s (and `reverse` on alternate ones, as real multirotors counter-rotate) so they don't move in lockstep.
- **Order never changes.** A moving part is drawn in one slot of the painter's order; its whole stroke must keep clear of everything it could pass in front of or behind. If it can't, shorten the stroke or move the part.
- **Things that turn spin in their own plane.** A CSS `rotate` of a drawn part is wrong in an isometric view, but a part that turns in a plane is not: draw it flat in the plane's coordinates and `amSpin` it (below). Anything with rotors, fans, propellers, turbine blades, wheels seen side-on or a turntable gets this; a static rotor on a hero reads as broken.
- **Reduced motion.** Every `am-*` class stops under `prefers-reduced-motion: reduce`, holding the rest pose. Design the rest pose as the hero frame.
- **Pass `motion: false`** to `assetSvg` for a still drop.

## 5. Size budget

The synth hero is about 240 KB raw and compresses to a fraction of that with gzip or brotli, which any CDN applies to SVG. Keep a hero under about 400 KB raw and a spot under about 80 KB. If it runs over: fewer facet `steps` on small cylinders (16–20), fewer dots in grids, and no hidden parts (anything fully covered by a nearer part can go).

## 6. Asset checks

On top of `references/verify.md`:

- [ ] `xmllint --noout asset.svg` is silent. HTML is forgiving; `<img>` is not: an attribute with no value (`<g data-art>`) or a stray `&` renders the whole asset blank.
- [ ] Loaded through an `<img>` it renders and, with motion, moves: write a two-line page with `<img src="asset.svg">` next to it and capture at two `--times`.
- [ ] `capture.mjs` on the preview prints `console: clean`: nothing in the safe zone.
- [ ] `lines.mjs` prints `line ends: 0`, in every theme shipped.
- [ ] The accent parts at 4×: edges darker (light) or brighter (dark) than their faces, four tones visible, no glare.
- [ ] At the size it's shown and at 390 px wide, it still reads as the object.
- [ ] With `--reduced`, the still frame is the composition you'd choose.
- [ ] The `aria-label` says what the object is.
