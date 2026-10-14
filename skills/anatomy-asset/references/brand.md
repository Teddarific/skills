# Brand and colour

Anatomy is monochrome with one lit accent. An asset is mostly monochrome too, because that is what makes the drawing look calm and expensive, but it sits on a brand's page and carries its colour. Everything here is done with the kit's own tokens, so the drawing code doesn't change: colour is a token set on a group.

## Contents
1. How the kit paints
2. The ground: greys for any page
3. Accents
4. How much colour
5. Dark neutrals and materials
6. Light and dark
7. Faults

## 1. How the kit paints

Every fill and stroke reads a CSS token on `.iso`: `--anatomy-paper` (fills that hide what's behind), `--anatomy-face`/`--anatomy-top` (tops), `--anatomy-shade-0..3` (sides by facing), `--anatomy-hi`, `mid`, `lo`, `faint` (lines and edges), `--anatomy-lit` (the one lit edge) and `--anatomy-dot`. A theme is a token set; so is an accent. Redefine the tokens on a `<g>` and every part inside it takes them.

## 2. The ground: greys for any page

`paper` must be the colour of the page the asset sits on, because every solid is filled with it to hide what is behind. `assetSvg({ paper })` calls `groundTokens(paper)`, which moves the kit's whole neutral ramp by the difference between your paper and the kit's: fully in lightness, and by `tint` (0.6 by default) in colour. A cream page gets warm greys; a navy page gets cool ones; the default `#131313` and `#fbfbfa` reproduce the kit exactly.

- The theme follows the paper: lightness above 0.6 (OKLab) is light, otherwise dark. Force it with `theme`.
- `tint: 0` keeps the kit's greys at the new lightness; `tint: 1` takes on the paper's full colour. Above 0.8 the faces start to look painted.
- A saturated page (brand blue, bright yellow) is a ground for one object at most; shades still step by lightness, so test both 1× and 4×.

## 3. Accents

`assetSvg({ accents: { brand: "#ff5a1f" } })` writes a scoped rule for `.ac-brand`. Wrap parts with `<g class="ac-brand">…</g>`.

- **`body`** (the default): the part is made of the colour. Faces, top, shades and edges are a ramp of it: lighter top, four close side tones, a dark edge in light theme and a bright edge in dark. Use it for a knob cap, a key, a case, a door.
- **`ink`**: the part stays neutral and only its lines, dots and lit edge take the colour: `{ led: { hex: "#ff5a1f", mode: "ink" } }`. Use it for LEDs (a `lit` dot), an engraved mark, a pointer, a status ring, a lit edge.
- `accentTokens(hex, { theme, mode })` returns the token values if you need them elsewhere (a shader, a fallback glow).
- The ramp keeps the colour's hue and chroma (reduced only to stay in sRGB) and sets its lightness for the theme, inside a range where four tones still read: the colour's own OKLab lightness clamped to 0.3–0.86 in light, and 0.72 of it clamped to 0.14–0.6 in dark, so faces never glare next to the dark greys. Pick a material's hex per theme when it must stay near-black or near-white (section 5).

## 4. How much colour

The default, unless the user asks otherwise:

- **One accent family.** The subject in `body`, one or two echoes of it elsewhere (a smaller knob, an LED in `ink`). The synth has three accent parts in about 95.
- **Accent the moment.** The part carrying the moment (`concepts.md`, section 6) gets the colour. If the accent lands on structure, the eye lands on structure.
- **No accent on the base or the large faces** unless the product *is* that colour (a red espresso machine).

When the user wants more: two or three accents are fine. Give each a job, keep them at similar lightness so none jumps out, and keep greys in the majority. A fully coloured illustration (every part its own colour) is a different style; build it if asked, with a ramp per colour, but say that the kit's look is strongest with restraint.

## 5. Dark neutrals and materials

Not every colour is brand. Use accents for materials too, each a named ramp:

- Black keys, rubber feet, a dark case: `ebony: "#3a3a3f"` in light, `"#08080a"` in dark, in `body` mode.
- Brass, copper, walnut, oak: a low-chroma warm hex (`#b08d57`, `#8a5a3b`, `#6b4a2f`) in `body` mode. Grain is not drawn as stripes; a wooden part reads by its colour, its joints and its screws.
- Glass, water, light: these are shader work (`webgl.md`) or a faint `ink` outline with a `faint` fill.

## 6. Light and dark

Ship the theme the page uses. If the site has both, build both from the same script (`--light`), with the same accents: `accentCss` writes both ramps from one hex. Check the accent at 4× in each: in light the edge of an accent part must be clearly darker than its faces; in dark the faces must not glare next to the greys (the dark ramp keeps faces at or below 0.6 lightness for this reason).

## 7. Faults

- **A hex typed into a fill.** It ignores the theme and the shading. Every colour is a token or an accent class.
- **Paper that isn't the page.** A white-filled object on a cream page shows every fill as a pale patch. Set `paper` to the exact page colour.
- **Accent on a flat inlay only.** A coloured groove line on a grey part reads as a printing error; colour whole parts (`body`) or clear marks (`ink`).
- **Black keys that turn grey.** A neutral used as a stand-in for black (`lo` tone) looks white in light theme. Use a dark ramp.
- **Opacity fades on a pale accent.** Fading a light accent by opacity makes it grey; blink and pulse saturated `ink` marks, not pale bodies.
