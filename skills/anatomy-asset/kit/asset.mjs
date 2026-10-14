// Assets: a standalone SVG drop instead of a framed figure.
//
// The kit's look is a token set (`--anatomy-*` on `.iso`). This module re-derives that set for
// any page colour (`groundTokens`), adds brand accents as scoped token sets (`accentCss`), fits
// a drawing into one region of a wide canvas (`fitInto`), wraps CSS-only ambient motion that
// still runs inside an `<img>` (`amFloat`, `amSlide`, `amPulse`, `amBlink`, and `amSpin` for
// parts that turn in a plane), and writes the
// deliverable SVG (`assetSvg`) plus a preview page the capture and line checks run on
// (`previewHtml`).

import { ISO_CSS, fitProjection, iso } from "./iso-kit.mjs";

// ---------- colour (OKLab / OKLCH) ----------

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex) {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}

const rgbToHex = (rgb) => `#${rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("")}`;

export function hexToOklch(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}

function oklchToRgb([L, C, H]) {
  const A = C * Math.cos(H);
  const B = C * Math.sin(H);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// Lightness is kept exactly; chroma is reduced until the colour fits sRGB.
export function oklchToHex([L, C, H]) {
  const l = Math.min(1, Math.max(0, L));
  let c = Math.max(0, C);
  for (let i = 0; i < 40; i++) {
    const rgb = oklchToRgb([l, c, H]);
    if (rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)) return rgbToHex(rgb.map(toGamma));
    c *= 0.92;
  }
  return rgbToHex(oklchToRgb([l, 0, H]).map(toGamma));
}

export const lightnessOf = (hex) => hexToOklch(hex)[0];
export const themeFor = (paper) => (lightnessOf(paper) > 0.6 ? "light" : "dark");

// ---------- the ground: the neutral ramp, re-derived for any page colour ----------

// The kit's own token values (ISO_CSS), so a new ground keeps the same steps.
const BASE = {
  dark: {
    paper: "#131313", face: "#1b1b1b", top: "#1c1c1c",
    "shade-0": "#0f0f0f", "shade-1": "#121212", "shade-2": "#151515", "shade-3": "#181818",
    "lit-top": "#262626", "lit-shade": "#1d1d1d",
    hi: "#d4d4d4", mid: "#6a6a6a", lo: "#3e3e3e", faint: "#2a2a2a",
    halo: "#050505", dot: "#e6e6e6",
  },
  light: {
    paper: "#fbfbfa", face: "#ffffff", top: "#ffffff",
    "shade-0": "#dcdcd9", "shade-1": "#e5e5e2", "shade-2": "#ededea", "shade-3": "#f4f4f1",
    "lit-top": "#ffffff", "lit-shade": "#eeeeeb",
    hi: "#26262a", mid: "#8a8a8f", lo: "#b4b4b8", faint: "#d4d4d6",
    halo: "#8a8a80", dot: "#3a3a3e",
  },
};

const labOf = (hex) => { const [L, C, H] = hexToOklch(hex); return [L, C * Math.cos(H), C * Math.sin(H)]; };
const fromLab = ([L, A, B]) => oklchToHex([L, Math.hypot(A, B), Math.atan2(B, A)]);

// Every token keeps its own offset from the kit's paper (lightness and tint), moved by how far
// the new paper is from the kit's: in lightness fully, in colour by `tint` (0..1). Faces,
// shades and lines then sit on the page as the defaults sit on the card, and the kit's own
// papers give back the kit's own ramps.
export function groundTokens(paper, { theme = themeFor(paper), tint = 0.6 } = {}) {
  const base = BASE[theme];
  const p = labOf(paper);
  const b = labOf(base.paper);
  const shift = [p[0] - b[0], (p[1] - b[1]) * tint, (p[2] - b[2]) * tint];
  const out = {};
  for (const [name, hex] of Object.entries(base)) {
    if (name === "paper") { out.paper = paper; continue; }
    const t = labOf(hex);
    out[name] = fromLab([t[0] + shift[0], t[1] + shift[1], t[2] + shift[2]]);
  }
  out.card = paper;
  out.page = paper;
  return out;
}

const declare = (tokens) => Object.entries(tokens).map(([name, value]) => `--anatomy-${name}:${value}`).join(";");

// ---------- accents: a brand colour as a scoped token set ----------

// mode "body": the part is made of the colour; its faces, shades and lines are a ramp of it.
// mode "ink":  the part stays neutral; only its lines, dots and lit edge take the colour
//              (an engraved mark, an LED ring, a lit accent edge).
export function accentTokens(hex, { theme = "dark", mode = "body" } = {}) {
  const [L, C, H] = hexToOklch(hex);
  const at = (l, c = C) => oklchToHex([l, c, H]);
  if (mode === "ink") {
    return theme === "light"
      ? { hi: at(Math.min(L, 0.5)), mid: at(L), lo: at(L + (1 - L) * 0.45, C * 0.6), faint: at(L + (1 - L) * 0.7, C * 0.35), lit: at(Math.min(L, 0.55)), dot: at(Math.min(L, 0.55)) }
      : { hi: at(Math.max(L, 0.78), C * 0.8), mid: at(L), lo: at(L * 0.6, C * 0.7), faint: at(L * 0.42, C * 0.5), lit: at(Math.max(L, 0.85), C * 0.6), dot: at(Math.max(L, 0.8)) };
  }
  if (theme === "light") {
    const b = Math.min(Math.max(L, 0.3), 0.86);
    return {
      paper: at(b - 0.03), face: at(b + 0.04), top: at(b + 0.05, C * 0.85),
      "shade-0": at(b - 0.09), "shade-1": at(b - 0.06), "shade-2": at(b - 0.03), "shade-3": at(b),
      "lit-top": at(b + 0.08, C * 0.7), "lit-shade": at(b - 0.01),
      hi: at(Math.max(b - 0.42, 0.14), C * 0.7), mid: at(b - 0.24, C * 0.9), lo: at(b - 0.13), faint: at(b - 0.07),
      lit: at(Math.max(b - 0.5, 0.08), C * 0.6), dot: at(Math.max(b - 0.4, 0.16), C * 0.7),
    };
  }
  const b = Math.min(Math.max(L * 0.72, 0.14), 0.6);
  return {
    paper: at(b - 0.05), face: at(b + 0.02), top: at(b + 0.04),
    "shade-0": at(b - 0.1), "shade-1": at(b - 0.075), "shade-2": at(b - 0.05), "shade-3": at(b - 0.025),
    "lit-top": at(b + 0.1), "lit-shade": at(b),
    hi: at(Math.min(b + 0.36, 0.95), C * 0.6), mid: at(b + 0.16), lo: at(b - 0.12), faint: at(b - 0.17),
    lit: at(Math.min(b + 0.42, 0.97), C * 0.4), dot: at(Math.min(b + 0.36, 0.95), C * 0.6),
  };
}

// CSS for a set of accents: { orange: "#ff6a1a", led: { hex: "#38f", mode: "ink" } }.
// Wrap a part in `<g class="ac-orange">` and every kit fill, shade and line inside takes the
// ramp. Pass `scope` so two assets inlined on one page don't fight.
export function accentCss(accents = {}, { scope = "", theme } = {}) {
  const rules = [];
  for (const [name, spec] of Object.entries(accents)) {
    const { hex, mode = "body" } = typeof spec === "string" ? { hex: spec } : spec;
    if (theme) {
      rules.push(`${scope} .ac-${name}{${declare(accentTokens(hex, { theme, mode }))}}`);
    } else {
      rules.push(`${scope} .ac-${name}{${declare(accentTokens(hex, { theme: "dark", mode }))}}`);
      rules.push(`${scope}[data-theme="light"] .ac-${name}{${declare(accentTokens(hex, { theme: "light", mode }))}}`);
    }
  }
  return rules.join("\n");
}

// ---------- layout ----------

// fitProjection into one region of the canvas: { x, y, w, h } in viewBox units. Use it to
// keep a hero object on one side and leave the other side free for a headline.
export function fitInto(points, region, options = {}) {
  const P = fitProjection(points, region.w, region.h, options);
  return { ...P, origin: [P.origin[0] + region.x, P.origin[1] + region.y] };
}

// ---------- ambient motion (CSS only, so it runs inside <img> and on a CDN) ----------

const AMBIENT_CSS = `
@keyframes am-float{0%,100%{transform:translate(0,0)}50%{transform:translate(var(--am-dx,0),var(--am-dy,0))}}
@keyframes am-pulse{0%,100%{opacity:var(--am-min,.35)}50%{opacity:1}}
@keyframes am-blink{0%,100%{opacity:var(--am-min,.15)}8%,30%{opacity:1}}
@keyframes am-shadow{0%,100%{opacity:1}50%{opacity:var(--am-min,.6)}}
.am-float{animation:am-float var(--am-period,6s) cubic-bezier(.45,0,.55,1) var(--am-delay,0s) infinite}
.am-pulse{animation:am-pulse var(--am-period,3.2s) cubic-bezier(.45,0,.55,1) var(--am-delay,0s) infinite}
.am-blink{animation:am-blink var(--am-period,2.4s) linear var(--am-delay,0s) infinite}
.am-shadow{animation:am-shadow var(--am-period,6s) cubic-bezier(.45,0,.55,1) var(--am-delay,0s) infinite}
@keyframes am-spin{to{transform:rotate(360deg)}}
.am-spin{transform-box:view-box;transform-origin:0 0;animation:am-spin var(--am-period,1.6s) linear var(--am-delay,0s) infinite var(--am-dir,normal)}
@keyframes am-swing{0%,100%{transform:rotate(var(--am-a0,-10deg))}50%{transform:rotate(var(--am-a1,10deg))}}
.am-swing{transform-box:view-box;transform-origin:0 0;animation:am-swing var(--am-period,3s) cubic-bezier(.45,0,.55,1) var(--am-delay,0s) infinite}
@keyframes am-press-k{0%,8%{transform:translate(0,0)}12%,20%{transform:translate(var(--am-dx,0),var(--am-dy,0))}28%,100%{transform:translate(0,0)}}
.am-press{animation:am-press-k var(--am-period,2.4s) cubic-bezier(.3,0,.3,1) var(--am-delay,0s) infinite}
@keyframes am-draw{0%{stroke-dashoffset:1;opacity:1}45%,88%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
.am-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:am-draw var(--am-period,6s) cubic-bezier(.4,0,.2,1) var(--am-delay,0s) infinite}
@keyframes am-loop{from{transform:translate(0,0)}to{transform:translate(var(--am-dx,0),var(--am-dy,0))}}
.am-loop{animation:am-loop var(--am-period,3s) linear var(--am-delay,0s) infinite}
@media (prefers-reduced-motion:reduce){.am-float,.am-pulse,.am-blink,.am-shadow,.am-spin,.am-swing,.am-press,.am-loop{animation:none}.am-draw{animation:none;stroke-dashoffset:0}.am-flip{animation:none!important}.am-flip-rest{visibility:visible!important}}
`;

const vars = (pairs) => Object.entries(pairs).filter(([, v]) => v !== undefined).map(([k, v]) => `--am-${k}:${v}`).join(";");
const secs = (ms) => (ms === undefined ? undefined : `${(ms / 1000).toFixed(2)}s`);

// A part that bobs up `rise` world units and back. A halo, if given, stays on the floor and
// lightens as the part lifts. The part must have air around it for the whole stroke: it is
// drawn in one slot of the painter's order and never re-sorts.
export function amFloat(svg, P, { rise = 3, period = 6000, delay = 0, halo = "" } = {}) {
  return amSlide(svg, [0, 0, rise], P, { period, delay, halo });
}

// A part that eases along a world offset and back: a carriage drifting, a drawer breathing open.
export function amSlide(svg, offset, P, { period = 6000, delay = 0, halo = "" } = {}) {
  const a = iso([0, 0, 0], P);
  const b = iso(offset, P);
  const timing = { period: secs(period), delay: secs(-Math.abs(delay)) };
  const shadow = halo ? `<g class="am-shadow" style="${vars({ ...timing, min: 0.55 })}">${halo}</g>` : "";
  return `${shadow}<g class="am-float" style="${vars({ ...timing, dx: `${(b[0] - a[0]).toFixed(2)}px`, dy: `${(b[1] - a[1]).toFixed(2)}px` })}">${svg}</g>`;
}

// Opacity that breathes: a glow, a status ring, an active surface.
export function amPulse(svg, { period = 3200, delay = 0, min = 0.35 } = {}) {
  return `<g class="am-pulse" style="${vars({ period: secs(period), delay: secs(-Math.abs(delay)), min })}">${svg}</g>`;
}

// A short on-blink, for LEDs. Stagger `delay` across a row so they don't fire together.
export function amBlink(svg, { period = 2400, delay = 0, min = 0.15 } = {}) {
  return `<g class="am-blink" style="${vars({ period: secs(period), delay: secs(-Math.abs(delay)), min })}">${svg}</g>`;
}

// ---------- spinning parts ----------
//
// A screen rotation of a drawn part is wrong in an isometric view, but a part that turns in a
// plane (rotor blades, a fan, a turbine rotor, a turntable's marks) can turn correctly: draw it
// flat in the plane's own 2D coordinates, centred on the hub, and place it with the plane's
// matrix. The projection is affine, so rotating the flat drawing and then projecting it is
// exactly the real rotor turning. Strokes keep their width (`vector-effect` in ISO_CSS).

const n2 = (v) => +v.toFixed(4);

// The plane through world point `origin`, with world directions `u` (its x) and `v` (its y),
// as an SVG matrix. Pass unit vectors to keep plane units equal to world units.
export function planeMatrix(origin, u, v, P) {
  const o = iso(origin, P);
  const a = iso(origin.map((c, i) => c + u[i]), P);
  const b = iso(origin.map((c, i) => c + v[i]), P);
  return `matrix(${n2(a[0] - o[0])} ${n2(a[1] - o[1])} ${n2(b[0] - o[0])} ${n2(b[1] - o[1])} ${n2(o[0])} ${n2(o[1])})`;
}

// The horizontal plane at `centre` ([x, y, z]): rotors, fans and turntables that face up.
export const topPlane = (centre, P) => planeMatrix(centre, [1, 0, 0], [0, 1, 0], P);

// Blades as one path in plane coordinates: `count` tapered blades from `r0` to `r1`, chord
// `chord` at the root narrowing to `tip`, with a rounded tip and an optional `sweep` (radians
// of lean from root to tip). Fill it with a tone class; it reads as thin blades seen flat.
export function bladesPath(count, r0, r1, { chord = 4, tip = 2, sweep = 0.12, phase = 0 } = {}) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const a = phase + (i / count) * Math.PI * 2;
    const at = (r, side, lean) => {
      const t = a + lean;
      return [Math.cos(t) * r - Math.sin(t) * side, Math.sin(t) * r + Math.cos(t) * side];
    };
    const pts = [at(r0, -chord / 2, 0), at(r1, -tip / 2, sweep), at(r1 + tip * 0.45, 0, sweep), at(r1, tip / 2, sweep), at(r0, chord / 2, 0)];
    parts.push(`M${pts.map((p) => `${n2(p[0])} ${n2(p[1])}`).join("L")}Z`);
  }
  return parts.join("");
}

// A part that spins in a plane. `flat` is SVG drawn in plane coordinates around (0, 0);
// `matrix` comes from `planeMatrix` or `topPlane`. Draw the hub (and anything that must cover
// the blades) after it, in its usual slot. The blades stay in one slot of the painter's order,
// so keep the whole swept disc clear of parts that would need to pass in front of it.
// `clip` (a radius in plane units) keeps the blades inside a round opening, such as a fan behind
// a grille; the clip sits in the plane, outside the turning group, so it doesn't turn.
let spinClips = 0;
export function amSpin(flat, matrix, { period = 1600, reverse = false, delay = 0, clip } = {}) {
  const turning = `<g class="am-spin" style="${vars({ period: secs(period), delay: secs(-Math.abs(delay)), dir: reverse ? "reverse" : "normal" })}">${flat}</g>`;
  if (!clip) return `<g transform="${matrix}">${turning}</g>`;
  const id = `am-spin-clip-${(++spinClips).toString(36)}-${Math.round(clip * 100)}`;
  return `<g transform="${matrix}"><clipPath id="${id}"><circle r="${clip}"/></clipPath><g clip-path="url(#${id})">${turning}</g></g>`;
}

const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
let rotorIds = 0;

// A propeller, fan or rotor that reads as spinning fast: a soft blur disc that doesn't turn,
// blades with real thickness (a darker copy one `thickness` behind the plane, turning in step),
// and trailing ghost blades that smear the motion. `u` and `v` are unit world directions in the
// rotor plane (`[1,0,0]`, `[0,1,0]` for a rotor that faces up); the thickness goes toward
// −(u × v), so pick u, v so that points away from the viewer (down, for an up-facing rotor).
// Wrap it in an accent class (`ac-carbon`) to colour the blades; the disc reads `--anatomy-mid`.
// Draw the hub or spinner after it. For a slow rotor (a wind turbine) pass `blur: false`.
export function amRotor(hub, u, v, P, {
  count = 3, r0 = 2, r1 = 12, chord = 3, tip = 1.4, sweep = 0.12, period = 700, reverse = false,
  delay = 0, thickness = 0.6, blur = true, disc = blur, clip,
} = {}) {
  const id = `am-rotor-${(++rotorIds).toString(36)}-${Math.round(r1 * 10)}`;
  const n = cross3(u, v);
  const under = hub.map((c, i) => c - n[i] * thickness);
  const dir = reverse ? 1 : -1; // trailing ghosts sit behind the direction of travel
  const blades = (phase, style) => `<path d="${bladesPath(count, r0, r1, { chord, tip, sweep, phase })}" style="${style}"/>`;
  const opts = { period, reverse, delay, clip };
  const R = r1 + tip * 0.5;
  // The blur disc is lit with `--anatomy-hi`, so it reads as a soft sheen on a dark page and a
  // soft shadow on a light one. It doesn't turn.
  const discSvg = disc
    ? `<g transform="${planeMatrix(hub, u, v, P)}"><defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${R}"><stop offset="0" stop-color="var(--anatomy-hi)" stop-opacity="0"/><stop offset=".5" stop-color="var(--anatomy-hi)" stop-opacity=".035"/><stop offset=".9" stop-color="var(--anatomy-hi)" stop-opacity=".13"/><stop offset="1" stop-color="var(--anatomy-hi)" stop-opacity=".02"/></radialGradient></defs><circle r="${R}" fill="url(#${id})" stroke="var(--anatomy-mid)" stroke-opacity=".55" stroke-width="var(--anatomy-weight)"/></g>`
    : "";
  // Ghosts trail the blades in their own colour, fading out: a smear, not a second rotor.
  const ghosts = blur
    ? [0.14, 0.28, 0.44].map((a, i) => blades(dir * a, `fill:var(--anatomy-top);fill-opacity:${[0.5, 0.28, 0.12][i]};stroke:var(--anatomy-hi);stroke-opacity:${[0.18, 0.08, 0][i]};stroke-width:var(--anatomy-weight)`)).join("")
    : "";
  const lower = thickness > 0 ? amSpin(blades(0, "fill:var(--anatomy-shade-0);stroke:var(--anatomy-mid);stroke-width:var(--anatomy-weight)"), planeMatrix(under, u, v, P), opts) : "";
  const upper = amSpin(ghosts + blades(0, "fill:var(--anatomy-top);stroke:var(--anatomy-hi);stroke-width:var(--anatomy-weight);stroke-linejoin:round"), planeMatrix(hub, u, v, P), opts);
  return `<g class="am-rotor">${discSvg}${lower}${upper}</g>`;
}

// A part that sways about a pivot in a plane: a gauge needle, a pendulum, a wind vane, a
// lamp on its arm. `flat` is drawn in plane coordinates around the pivot; it swings between
// `from` and `to` degrees and back.
export function amSwing(flat, matrix, { from = -10, to = 10, period = 3000, delay = 0 } = {}) {
  return `<g transform="${matrix}"><g class="am-swing" style="${vars({ period: secs(period), delay: secs(-Math.abs(delay)), a0: `${from}deg`, a1: `${to}deg` })}">${flat}</g></g>`;
}

// A quick press and release along a world offset, then a rest: a key, a button, a stamp, a
// plunger. Stagger `delay` across a row of keys to play a little phrase.
export function amPress(svg, offset, P, { period = 2400, delay = 0 } = {}) {
  const a = iso([0, 0, 0], P);
  const b = iso(offset, P);
  return `<g class="am-press" style="${vars({ period: secs(period), delay: secs(-Math.abs(delay)), dx: `${(b[0] - a[0]).toFixed(2)}px`, dy: `${(b[1] - a[1]).toFixed(2)}px` })}">${svg}</g>`;
}

// A conveyor or a stream: the group slides one `offset` (a world vector, one pitch of the
// repeating parts) at constant speed and jumps back, which reads as endless motion when the
// parts repeat at that pitch. Draw one extra part at the upstream end, clipped or hidden by
// the machine it comes out of.
export function amLoop(svg, offset, P, { period = 3000, delay = 0 } = {}) {
  const a = iso([0, 0, 0], P);
  const b = iso(offset, P);
  return `<g class="am-loop" style="${vars({ period: secs(period), delay: secs(-Math.abs(delay)), dx: `${(b[0] - a[0]).toFixed(2)}px`, dy: `${(b[1] - a[1]).toFixed(2)}px` })}">${svg}</g>`;
}

// A line that draws itself, holds, and fades: handwriting on a card, a trace on a screen, a
// signal running down a cable. `d` is the path; style it as you would a lineSvg.
export function amDraw(d, { tone = "lo", period = 6000, delay = 0, free = false } = {}) {
  return `<path class="iso-line am-draw" data-tone="${tone}"${free ? ' data-free=""' : ""} pathLength="1" d="${d}" style="${vars({ period: secs(period), delay: secs(-Math.abs(delay)) })}"/>`;
}

// A flipbook: `frames` is a list of SVG strings, each a whole pose drawn with the kit (true
// shading and painter's order in each), shown one after another over `period`. Use it for
// motion that isn't a flat rotation or a translation: a vertical-axis turbine, a hinge, a
// part that turns about a vertical axis. Mind the size: every frame is in the file. Under
// reduced motion only the first frame shows.
export function amFlip(frames, { period = 1200, delay = 0 } = {}) {
  const N = frames.length;
  const share = 100 / N;
  const name = `am-flip-${N}`;
  // Every SVG carries its own keyframes, so the same build can write several files.
  const style = `<style>@keyframes ${name}{0%,${share.toFixed(4)}%{visibility:visible}${(share + 0.0001).toFixed(4)}%,100%{visibility:hidden}}</style>`;
  // Frame i shows during [i/N, (i+1)/N) of each turn.
  const at = (i) => secs(-(((N - i) % N) * period) / N - Math.abs(delay));
  return style + frames.map((f, i) => `<g class="am-flip${i === 0 ? " am-flip-rest" : ""}" style="visibility:hidden;animation:${name} ${secs(period)} steps(1,end) ${at(i)} infinite">${f}</g>`).join("");
}

// ---------- the drop ----------

let counter = 0;

// The deliverable: one standalone SVG that carries its own styles, works as <img src>, as an
// inline <svg>, and in design tools. `paper` is the colour of the page it will sit on: every
// solid is filled with it so things in front hide things behind, so it must match the page.
// `background: false` leaves the canvas transparent (the page shows through between parts).
export function assetSvg({
  width, height, label, body, paper, theme, accents = {}, tint = 0.6, weight,
  background = false, motion = true, css = "", id,
}) {
  const t = theme ?? (paper ? themeFor(paper) : "dark");
  const sid = id ?? `asset-${(++counter).toString(36)}`;
  const scope = `#${sid}`;
  const ground = paper ? `${scope}.iso{${declare(groundTokens(paper, { theme: t, tint }))}}` : "";
  const stroke = weight ? `${scope}.iso{--anatomy-weight:${weight}px}` : "";
  const style = [ISO_CSS, ground, stroke, accentCss(accents, { scope, theme: t }), motion ? AMBIENT_CSS : "", css].join("\n");
  const bg = background ? `<rect width="${width}" height="${height}" fill="var(--anatomy-paper)"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" id="${sid}" class="iso-svg iso" data-theme="${t}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${label.replace(/"/g, "&quot;")}"><style><![CDATA[${style}]]></style>${bg}<g data-art="">${Array.isArray(body) ? body.join("") : body}</g></svg>`;
}

// A page to check the drop on: the SVG inline, on its own page colour, inside a stage the
// capture, drive and line scripts find by default (`.iso-plate`). With `safe` (a region in
// viewBox units kept free for a headline), the page logs a console error when the art's
// bounding box enters it, and `?safe` in the URL draws the region.
export function previewHtml({ title, svg, paper = "#131313", width = 1200, safe }) {
  const check = safe
    ? `<script>(()=>{const s=${JSON.stringify(safe)};const svg=document.querySelector(".asset-stage svg");const art=svg.querySelector("[data-art]");const b=art.getBBox();const hit=b.x<s.x+s.w&&b.x+b.width>s.x&&b.y<s.y+s.h&&b.y+b.height>s.y;if(hit)console.error("art enters the safe zone",JSON.stringify({art:{x:+b.x.toFixed(1),y:+b.y.toFixed(1),w:+b.width.toFixed(1),h:+b.height.toFixed(1)},safe:s}));if(location.search.includes("safe")){const r=document.createElementNS("http://www.w3.org/2000/svg","rect");for(const[k,v]of Object.entries({x:s.x,y:s.y,width:s.w,height:s.h,fill:"none",stroke:"#e5484d","stroke-dasharray":"4 4","vector-effect":"non-scaling-stroke"}))r.setAttribute(k,v);svg.appendChild(r)}})()</script>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>*{box-sizing:border-box}html,body{margin:0;background:${paper}}main{width:min(${width}px,100% - 32px);margin:48px auto}.asset-stage.iso-plate{padding:0;box-shadow:none;background:${paper}}.asset-stage svg{width:100%;height:auto;display:block}</style></head><body><main><div class="asset-stage iso-plate">${svg}</div></main>${check}</body></html>`;
}
