<h1 align="center">Anatomy Asset</h1>

<p align="center"><b>A fork of <a href="https://github.com/wheresryan22/anatomy">Anatomy</a> for making assets, not explainers.</b><br>Crafted, highly detailed isometric SVG illustrations for landing pages, product sites, launch posts and decks.</p>

<p align="center">
  <a href="https://www.magicpatterns.com/os/1FyiDKAoDWYp6DEW1jQmgz/eH9fNzakc7ftmL5BkLgqfK"><b>Examples gallery</b></a> ·
  <a href="https://www.magicpatterns.com/os/1FyiDKAoDWYp6DEW1jQmgz/vn1wkBo1A85rreFiefjVjU"><b>Landing page: Aether</b></a> (aerospace, dark) ·
  <a href="https://www.magicpatterns.com/os/1FyiDKAoDWYp6DEW1jQmgz/nGo5msWtXZqk2hN925WC4b"><b>Landing page: Halden</b></a> (clean energy, light) ·
  <a href="#install">Install</a>
</p>

<p align="center">
  <a href="https://www.magicpatterns.com/os/1FyiDKAoDWYp6DEW1jQmgz/vn1wkBo1A85rreFiefjVjU"><img src="media/aether-landing-v2.gif" width="768" alt="Scrolling through Aether, an example landing page for an electric-aviation company. Every illustration on it was made by the skill: an air taxi hovering over a rooftop vertiport, three feature spots, an assembly hangar where a gantry lowers an engine pod onto a jet, and a satellite on a test stand."></a>
</p>

<p align="center"><sub><b>Aether</b>, an example landing page. Every illustration on it is a standalone SVG made by the skill (<code>examples/aero-*</code>): a hero with the headline in its safe zone, a set of matching spots, a banner and a feature tile. Propellers blur and spin, the fan pods turn, the aircraft hovers, a pod lowers on its crane and the lidar scans, all in CSS, so it moves even as a plain <code>&lt;img&gt;</code>.</sub></p>

---

> [!NOTE]
> **This is a fork of the Anatomy skill by Ryan.**
> Original skill: [skills.wheresryan.sh/anatomy](https://skills.wheresryan.sh/anatomy) · Source: [github.com/wheresryan22/anatomy](https://github.com/wheresryan22/anatomy)
> The kit, the checks and the craft rules all come from Anatomy. If you want interactive figures that *explain* a technical idea, use the original.

[Anatomy](https://skills.wheresryan.sh/anatomy) by Ryan builds isometric figures that *explain* a technical idea as a real machine, with a card, a live readout and a model behind every number. Anatomy Asset keeps everything that makes those drawings look so good — the kit, the four-tone shading, the painter's order, the many small precise parts, the line-end check and the geometry audit — and points it at a different job: **a striking, on-brand picture that sits on a page.**

| | Anatomy | Anatomy Asset |
|---|---|---|
| The object | Its mechanism *is* the concept | It carries a promise or a mood: literal, metaphor or scene |
| Starts from | The truth: real numbers and a model | A brief: product, message, page colour, brand, placement |
| Frame | A card with Fig n, title, hint, live readout, legend | None: art in a region of a canvas, with a safe zone for text |
| Colour | Monochrome, one lit accent | Mostly monochrome, greys grounded in the page colour, brand accents as token ramps |
| Motion | Interactive, pointer and keyboard | Quiet ambient loops in CSS; interactive when asked |
| Output | An HTML page or React | A standalone `.svg` (works as `<img>`), a preview page, PNGs |
| Style rules | Strict | The user's taste wins; the craft rules stay strict |

## Install

It's a standard [Agent Skill](https://agentskills.io): a folder with `SKILL.md` at its root. It lives in [Teddarific/skills](https://github.com/Teddarific/skills), at `skills/anatomy-asset/`. Install it with the [`skills`](https://github.com/vercel-labs/skills) CLI:

```sh
npx skills add Teddarific/skills --skill anatomy-asset -g -a claude-code
```

`-g` installs it for your user (`~/.claude/skills/anatomy-asset`); leave it off to install into the current project. Swap the agent for OpenCode, Codex or Antigravity: `-a opencode`, `-a codex`, `-a antigravity`.

Or with git, cloning the whole collection and linking this skill:

```sh
git clone https://github.com/Teddarific/skills.git ~/teddarific-skills
ln -s ~/teddarific-skills/skills/anatomy-asset ~/.claude/skills/anatomy-asset
```

Then ask for an asset:

```text
/anatomy-asset a hero illustration for our journaling app's landing page, cream background (#f4f1ea), brand colour #2f6b4f
```

It installs alongside Anatomy without clashing: Anatomy answers for explainers, this skill for illustrations.

## What's new in the fork

- **`kit/asset.mjs`**: `assetSvg` (the standalone drop: styles inlined and scoped, valid XML, `aria-label`), `previewHtml` (the page the checks run on, with a safe-zone check), `fitInto` (fit the art into one region of a wide canvas), `groundTokens` (the kit's grey ramp rebuilt for any page colour), `accentTokens`/`accentCss` (brand colours as scoped ramps, in `body` or `ink` mode), and `amFloat`, `amSlide`, `amPulse`, `amBlink` (CSS-only ambient motion that respects reduced motion).
- **`SKILL.md`**, rewritten around briefs, concepts, composition and shipping.
- **`references/concepts.md`, `composition.md`, `brand.md`, `export.md`**: from a brief to an object, canvases and safe zones, palette, and shipping and checks.
- **Thirteen example assets** in `examples/`, two of them full brand sets used on the [Aether](https://www.magicpatterns.com/os/1FyiDKAoDWYp6DEW1jQmgz/vn1wkBo1A85rreFiefjVjU) and [Halden](https://www.magicpatterns.com/os/1FyiDKAoDWYp6DEW1jQmgz/nGo5msWtXZqk2hN925WC4b) landing pages (source in `examples/landing-pages/`), shown in the [gallery](https://www.magicpatterns.com/os/1FyiDKAoDWYp6DEW1jQmgz/eH9fNzakc7ftmL5BkLgqfK).

Everything else — the kit, the audit, the scripts, Anatomy's eight examples and its references — is upstream's, unchanged, and kept in sync with `git pull upstream main`.

## Examples

**[See the gallery in Magic Patterns →](https://www.magicpatterns.com/os/1FyiDKAoDWYp6DEW1jQmgz/eH9fNzakc7ftmL5BkLgqfK)**: every example below, in light and dark, with the brief that made it and a mock headline in each hero's safe zone.

| Example | Placement | What it is |
|---|---|---|
| [`synth-hero`](examples/synth-hero) | Hero, 1200 × 640 | A compact analogue synth; orange knobs, one cap floating off its shaft |
| [`writing-desk`](examples/writing-desk) | Hero, 1200 × 640 | An oak writing desk with a pigeonhole hutch; the green fountain pen hovers |
| [`espresso-tile`](examples/espresso-tile) | Feature tile, 640 × 480 | A red espresso machine run by a small robot barista |
| [`feature-spots`](examples/feature-spots) | Spot set, 3 × 320 × 320 | Fast, Secure, Works offline: a stopwatch, a safe-deposit box, a battery lantern |
| [`bottling-line`](examples/bottling-line) | Banner, 1600 × 560 | A bottling line for "ship every commit"; a violet cap floats under the capper |
| [`aero-vertiport`](examples/aero-vertiport) | Hero, 1200 × 640 | A six-rotor electric air taxi hovering over a rooftop vertiport |
| [`aero-hangar`](examples/aero-hangar) | Banner, 1600 × 560 | An assembly hangar; a gantry lowers a fan pod onto a jet's wing |
| [`aero-satellite`](examples/aero-satellite) | Feature tile, 640 × 480 | A satellite on an integration stand in a clean room |
| [`aero-spots`](examples/aero-spots) | Spot set, 3 × 320 × 320 | Electric propulsion, autonomous flight, quiet by design |
| [`energy-turbine`](examples/energy-turbine) | Hero, 1200 × 640 | A wind turbine on a hilltop diorama, an inspection drone at a blade tip |
| [`energy-solar-farm`](examples/energy-solar-farm) | Banner, 1600 × 560 | Solar trackers, battery containers and a substation, with grazing sheep |
| [`energy-home`](examples/energy-home) | Feature tile, 640 × 480 | A house with rooftop solar, a filling home battery, a heat pump and an EV |
| [`energy-spots`](examples/energy-spots) | Spot set, 3 × 320 × 320 | Generate, store, share |

Each folder has a `build.mjs` that writes the `.svg` assets and their preview pages. The default theme is the one the brief asked for; pass `--light` or `--dark` for the other:

```sh
node examples/synth-hero/build.mjs --light
```

Check an asset with:

```sh
xmllint --noout examples/synth-hero/synth-hero.svg
node scripts/capture.mjs examples/synth-hero/synth-hero.html --out shots/hero.png
node scripts/lines.mjs examples/synth-hero/synth-hero.html
```

Anatomy's examples (`dial-indicator`, `test-rig`, `desk-computer`, `arcade-cabinet`, `raptor-engine`, `spot-plate`, `ripple-tank`, `turning-dial`) stay as the reference for craft.

## Requirements

Node.js 20.10 or later, and Chrome or Chromium for the capture and line checks. No dependencies.

## License

MIT, as upstream. Anatomy is © 2026 Ryan ([wheresryan22/anatomy](https://github.com/wheresryan22/anatomy)); the fork's additions are under the same license. See `LICENSE`.
