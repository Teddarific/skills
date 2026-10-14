# Composition

Where the art sits on its canvas, and how it holds a page. An Anatomy figure is centred in a card; an asset is placed on a canvas beside a headline, inside a tile, or in a row of siblings.

## Contents
1. Canvases
2. Regions and safe zones
3. Placing the object
4. Cameras for assets
5. Sets that match
6. Line weight and small sizes
7. Edges, bleed and the ground

## 1. Canvases

Start from the placement, not a size. Defaults:

| Placement | viewBox | Art region | Safe zone |
|---|---|---|---|
| Hero, art right | 1200 × 640 | `{ x: 500, y: 36, w: 668, h: 568 }` | `{ x: 0, y: 0, w: 470, h: 640 }` |
| Hero, art centre (text above) | 1200 × 720 | `{ x: 160, y: 200, w: 880, h: 500 }` | `{ x: 0, y: 0, w: 1200, h: 180 }` |
| Art only (the page lays out text) | 800 × 600 | the whole canvas, `pad` 24 | none |
| Feature tile | 640 × 480 | the whole canvas, `pad` 32 | none, or the top band for a label |
| Spot illustration | 320 × 320 | the whole canvas, `pad` 20 | none |
| Wide banner, section divider | 1600 × 400 | `{ x: 0, y: 20, w: 1600, h: 360 }` | per design |
| Social / OG card | 1200 × 630 | right 55% | left 45% |
| Deck slide | 1920 × 1080 | right 60% | left 40% |

Ask for the real size if it matters, and keep the viewBox at about 1 unit per CSS px at the size it's shown, so the line weight means what you set.

## 2. Regions and safe zones

- Fit the art into its region with `fitInto(points, region, { pad, azimuth })` (`kit/asset.mjs`). Pass every extreme point: `boxCorners` of the base and the tallest tip, and the top of anything lifted.
- Give `previewHtml` the `safe` region. The preview logs a console error when the art's bounding box enters it, so `capture.mjs` shows `console: errors` instead of `clean`. Open the page with `?safe` to draw the zone.
- Halos and blurs count as art. If the halo grazes the safe zone, shrink the region, not the halo.
- Leave the safe zone empty: no floor grid, no texture, no shadow running under the text.

## 3. Placing the object

- **Fill the region, not the canvas.** In its region the object takes 80–90% of the width (the pad does the rest); on the canvas a hero object is typically 45–60% of the width.
- **Lead toward the text.** A hero on the right reads best when its long face or its moment faces left, toward the headline. Choose the azimuth for that (section 4).
- **Strong points.** Put the moment (`concepts.md`, section 6) about a third of the way in from the region's edges, not dead centre and not at the rim.
- **Air.** At least 24 units of empty canvas between the art and any edge it doesn't bleed off.
- **Lifted parts** add height: include their top in the fit points, and leave room above for the float stroke.

## 4. Cameras for assets

The kit camera is a fixed iso-like view: `azimuth` turns the object on the floor, `elevation` tilts the view.

- **Azimuth.** 45° shows two faces equally. 55–65° shows the long +y face (the front of a keyboard, a counter, a shelf) and turns its length across the screen; 25–35° shows the short +x end. Try two or three and keep the one with the most interesting face toward the viewer and toward the text.
- **Elevation.** 30° by default. Raise it (40–50°) to look into trays, drawers, open boxes and dioramas; never below 25°, where tops vanish and faces stack.
- **One camera per set.** Spots in a row share azimuth, elevation and world scale.

## 5. Sets that match

A row of three spots, or a hero plus feature tiles, must look like one family:

- One world scale (`P.scale` within about 10% across the set). Don't fit each object to its box: fit the biggest, then build the others at the same scale and centre them.
- One camera, one ground colour, one accent family; each spot has the accent on its own moment.
- One part vocabulary: the same screw dots, bevel sizes, foot style and label plates.
- Similar visual weight: count the solids, and add parts to the sparse one, never remove detail from the dense one.
- Build them from one script with a shared module for the camera and the shared parts, as Anatomy's examples share `iso-kit`.

## 6. Line weight and small sizes

The kit draws strokes with `vector-effect: non-scaling-stroke`, so `--anatomy-weight` is in screen px whatever the scale.

| Shown at | `weight` |
|---|---|
| 1200+ px wide hero | 0.8–1 |
| 600–900 px | 0.6–0.7 (the kit default) |
| 160–320 px spot | 0.5 |

At small sizes cut part count density rather than letting detail turn to mush: bigger screws (0.6), fewer ticks, no knurls under 4 units radius. Capture at the shipped size and at 390 px wide for phones, and look.

## 7. Edges, bleed and the ground

- **Floating object (default).** The object stands on its halo on the page colour. No floor, no frame.
- **Ground plane.** A tray, mat, slab, tabletop or cutting board under the object gives a scene its own floor. It is a real object with thickness and edges, never an infinite grid.
- **Bleed.** An object may run off the canvas edge (a long bench, a conveyor), but only along a clean straight edge of the object, and never off the edge next to the safe zone.
- **Background.** `assetSvg({ background: false })` is the default: transparent between parts, so the page shows through. Use `background: true` only when the asset must carry its own rectangle (an OG card, a slide).
