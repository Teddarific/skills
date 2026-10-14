// A landing-page hero: a compact analogue synthesiser on rubber feet, its keys along the
// front, a panel of knobs, faders, buttons and a speaker grille behind them, two knobs in the
// brand colour, and one knob cap lifted off its shaft as if in a product shot. The art sits
// in the right of a 1200 × 640 canvas so the left stays free for a headline.
//
//   node build.mjs            dark   → synth-hero.svg, synth-hero.html
//   node build.mjs --light    light  → synth-hero-light.svg, synth-hero-light.html

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const light = process.argv.includes("--light");
const PAPER = light ? "#f4f1ea" : "#0c0d10";
const BRAND = "#ff5a1f";

const W = 1200;
const H = 640;
const SAFE = { x: 0, y: 0, w: 470, h: H };
const REGION = { x: 500, y: 36, w: 668, h: 568 };

// ---------- world ----------
const CASE = { x: -180, y: -70, w: 360, d: 150, r: 6 };
const BACK = { x: -180, y: -70, w: 360, d: 96, r: 6 };      // panel tier
const FRONT = { x: -180, y: 22, w: 360, d: 58, r: 6 };      // key tier
const PANEL_Z = 26;
const KEYBED_Z = 12;
const FOOT_H = 6;
const CHEEK = (x) => ({ x, y: -72, w: 12, d: 154, r: 4 });
const CHEEK_TOP = 32;

const P = a.fitInto(
  [...k.boxCorners(CASE, -FOOT_H, CHEEK_TOP), ...k.boxCorners({ x: -192, y: -72, w: 384, d: 154, r: 0 }, -FOOT_H, CHEEK_TOP), [26, -36, PANEL_Z + 32]],
  REGION,
  { pad: 8, azimuth: 60 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (items, key = (i) => i) => [...items].sort((p, q) => depth(key(p)) - depth(key(q)));
const accent = (svg) => `<g class="ac-brand">${svg}</g>`;
const ink = (svg) => `<g class="ac-led">${svg}</g>`;
const ebony = (svg) => `<g class="ac-ebony">${svg}</g>`;

// ---------- base: halo, feet, cheeks, case ----------
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CASE, -6), -FOOT_H, 4, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(CASE, 20))) {
    out.push(S(k.cylinder(x, y, 7, -FOOT_H, 1.4, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.6, -FOOT_H + 1.4, FOOT_H - 1.4, P, 28), { tone: "mid" }));
  }
  return out.join("");
}

function cheek(x) {
  const plan = CHEEK(x);
  const seam = k.sideSeam(plan, 4, P, 4);
  const out = [S(k.slabOf(plan, 0, CHEEK_TOP, P, 4, 0.8), { tone: "mid", inner: L(seam, { tone: "faint" }) })];
  out.push(L(k.planOutline(k.insetPlan(plan, 2.4), CHEEK_TOP, P, 4), { tone: "faint" }));
  out.push(D([at([x + 6, plan.y + 12, CHEEK_TOP]), at([x + 6, plan.y + plan.d - 12, CHEEK_TOP])], { size: 0.5 }));
  return out.join("");
}

function tiers() {
  const out = [];
  out.push(S(k.slabOf(BACK, 0, PANEL_Z, P, 6, 1.2), { tone: "mid", inner: L(k.sideSeam(BACK, 3, P, 6), { tone: "faint" }) }));
  out.push(S(k.slabOf(FRONT, 0, KEYBED_Z, P, 6, 1), { tone: "mid", inner: L(k.sideSeam(FRONT, 3, P, 6), { tone: "faint" }) }));
  return out.join("");
}

// ---------- panel ----------
const PANEL = { x: -174, y: -64, w: 348, d: 84, r: 4 };
const TOP = PANEL_Z + 0.8;

function panelPlate() {
  const out = [S(k.slabOf(PANEL, PANEL_Z, 0.8, P, 4), { tone: "mid", crease: "none" })];
  out.push(L(k.planOutline(k.insetPlan(PANEL, 3), TOP, P, 4), { tone: "faint" }));
  const screws = k.corners(PANEL, 7);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, TOP, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, TOP])), { size: 0.5 }));
  return out.join("");
}

function grille() {
  const plan = { x: -166, y: -56, w: 58, d: 68, r: 5 };
  const out = [S(k.slabOf(plan, TOP, 0.6, P, 5), { tone: "lo", crease: "none" })];
  out.push(L(k.planOutline(k.insetPlan(plan, 2.5), TOP + 0.6, P, 5), { tone: "faint" }));
  out.push(D(k.dotGrid(plan.x + 7, plan.y + 7, 10, 12, 4.9, TOP + 0.6, P), { size: 0.55, tone: "lo" }));
  return out.join("");
}

// A printed knob scale: an arc on the panel with ticks rooted on it.
function scale(cx, cy, r, z, count = 10) {
  const from = -2.6;
  const span = 5.2;
  const arc = [];
  for (let i = 0; i <= 48; i++) {
    const t = from + (i / 48) * span;
    arc.push([cx + Math.sin(t) * r, cy - Math.cos(t) * r]);
  }
  const minor = [];
  const major = [];
  for (let i = 0; i <= count; i++) {
    const t = from + (i / count) * span;
    const len = i % 5 === 0 ? 3 : 1.8;
    const p = [cx + Math.sin(t) * r, cy - Math.cos(t) * r];
    const q = [cx + Math.sin(t) * (r + len), cy - Math.cos(t) * (r + len)];
    (i % 5 === 0 ? major : minor).push(k.lineOnTop(p, q, z, P));
  }
  return L(k.onTop(arc, z, P), { tone: "faint" }) + L(minor.join(""), { tone: "lo" }) + L(major.join(""), { tone: "mid" });
}

function knob(cx, cy, r, turn, { tall = 7, brand = false, sway = null } = {}) {
  const out = [];
  const skirt = S(k.cylinder(cx, cy, r + 2, TOP, 1.6, P, 40, 0.4), { tone: "lo" });
  const cap = [
    S(k.cylinder(cx, cy, r, TOP + 1.6, tall, P, 40, 0.6), { tone: "hi" }),
    L(k.knurl(cx, cy, r, TOP + 1.6, TOP + 1.6 + tall - 1.2, Math.round(r * 4), P), { tone: "lo" }),
    L(k.ring(cx, cy, r - 1.4, TOP + 1.6 + tall, P, 32), { tone: "faint" }),
    L(k.sideArc(cx, cy, r, TOP + 1.6 + tall - 1.2, P, 32), { tone: "faint" }),
    sway
      ? a.amSwing(L(`M0 0L${(Math.sin(turn) * (r - 1.4)).toFixed(2)} ${(-Math.cos(turn) * (r - 1.4)).toFixed(2)}`, { tone: "hi" }), a.topPlane([cx, cy, TOP + 1.6 + tall], P), { from: -25, to: 25, ...sway })
      : L(k.lineOnTop([cx, cy], [cx + Math.sin(turn) * (r - 1.4), cy - Math.cos(turn) * (r - 1.4)], TOP + 1.6 + tall, P), { tone: "hi" }),
    D([at([cx, cy, TOP + 1.6 + tall])], { size: 0.45, tone: "hi" }),
  ].join("");
  out.push(skirt, brand ? accent(cap) : cap);
  return out.join("");
}

// The lifted cap: the shaft stands on its skirt, the cap hovers above it and breathes.
function liftedKnob(cx, cy, r) {
  const shaft = [
    S(k.cylinder(cx, cy, r + 2, TOP, 1.6, P, 40, 0.4), { tone: "lo" }),
    S(k.cylinder(cx, cy, 3.4, TOP + 1.6, 1.4, P, 24), { tone: "mid" }),
    S(k.cylinder(cx, cy, 2.2, TOP + 3, 6, P, 20), { tone: "mid" }),
    L(k.lineOnTop([cx - 1.6, cy], [cx + 1.6, cy], TOP + 9, P), { tone: "lo" }),
  ].join("");
  const LIFT = 15;
  const z = TOP + LIFT;
  const tall = 9;
  const cap = accent([
    S(k.cylinder(cx, cy, r + 0.8, z, 2, P, 48, 0.4), { tone: "hi" }),
    S(k.cylinder(cx, cy, r, z + 2, tall, P, 48, 0.8), { tone: "hi", lit: true }),
    L(k.knurl(cx, cy, r, z + 2, z + 2 + tall - 1.6, 44, P), { tone: "lo" }),
    L(k.ring(cx, cy, r - 1.8, z + 2 + tall, P, 40), { tone: "faint" }),
    L(k.sideArc(cx, cy, r, z + 2 + tall - 1.6, P, 40), { tone: "faint" }),
    L(k.lineOnTop([cx, cy], [cx + (r - 1.8) * 0.7, cy - (r - 1.8) * 0.7], z + 2 + tall, P), { tone: "hi" }),
    D([at([cx, cy, z + 2 + tall])], { size: 0.5, tone: "hi" }),
  ].join(""));
  const halo = `<path class="iso-halo" d="${k.haloOf({ x: cx - r, y: cy - r, w: 2 * r, d: 2 * r, r }, TOP, 0.1, P)}" style="filter:blur(6px)"/>`;
  return shaft + a.amFloat(cap, P, { rise: 4, period: 5600, halo });
}

// Two pointers sway slowly in the knob-top plane, out of phase.
const SWAY = [null, { period: 6400, delay: 0 }, { period: 8200, delay: 3100 }, null];
const BIG = [-82, -46, -10, 26].map((x, i) => ({ x, y: -36, r: 9, turn: [-1.6, 0.4, 1.9, 0][i], brand: i === 1, sway: SWAY[i] }));
const SMALL = [-82, -64, -46, -28, -10, 8, 26].map((x, i) => ({ x, y: -2, r: 5, turn: -2 + i * 0.62, brand: i === 4 }));
const FADERS = [58, 78, 98, 118].map((x, i) => ({ x, pos: [-44, -18, -30, -8][i] }));
const BUTTONS = [-50, -32, -14, 4].map((y) => ({ x: 150, y }));

function knobs() {
  const out = [];
  const all = [...BIG.map((b) => ({ ...b, big: true })), ...SMALL];
  for (const b of all) out.push(scale(b.x, b.y, b.r + 3.6, TOP, b.big ? 10 : 5));
  for (const b of byDepth(all, (b) => [b.x, b.y])) {
    if (b.big && b.x === 26) out.push(liftedKnob(b.x, b.y, b.r));
    else out.push(knob(b.x, b.y, b.r, b.turn, { tall: b.big ? 7 : 5, brand: b.brand, sway: b.sway }));
  }
  return out.join("");
}

function faders() {
  const out = [];
  const Y0 = -58;
  const Y1 = 4;
  for (const f of FADERS) {
    const slot = { x: f.x - 1.4, y: Y0, w: 2.8, d: Y1 - Y0, r: 1.4 };
    out.push(S(k.slabOf(slot, TOP - 0.6, 0.6, P, 3), { tone: "lo", crease: "none", flat: true }));
    out.push(L(k.planOutline(slot, TOP, P, 3), { tone: "lo" }));
    const strip = { x: f.x + 4, y: Y0, w: 3.2, d: Y1 - Y0, r: 0.6 };
    out.push(S(k.slabOf(strip, TOP, 0.4, P, 2), { tone: "lo", crease: "none" }));
    const t = k.topTicks(Y0 + 2, Y1 - 2, 3, 5, strip.x + 0.2, TOP + 0.4, [1.4, 2.6], P, "y");
    out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  }
  for (const f of byDepth(FADERS, (f) => [f.x, f.pos])) {
    const cap = { x: f.x - 5, y: f.pos - 3.5, w: 10, d: 7, r: 1.2 };
    const svg = [
      S(k.slabOf({ x: f.x - 1, y: f.pos - 1, w: 2, d: 2, r: 0.6 }, TOP, 2.4, P, 2), { tone: "mid" }),
      S(k.slabOf(cap, TOP + 2.4, 5, P, 3, 0.5), { tone: "hi", lit: f.x === 78 }),
      L(k.lineOnTop([cap.x, f.pos], [cap.x + cap.w, f.pos], TOP + 7.4, P), { tone: f.x === 78 ? "lit" : "mid" }),
    ].join("");
    out.push(f.x === 78 ? a.amSlide(svg, [0, 16, 0], P, { period: 7200, delay: 1800 }) : svg);
  }
  return out.join("");
}

function buttons() {
  const out = [];
  for (const [i, b] of byDepth(BUTTONS, (b) => [b.x, b.y]).entries()) {
    const plan = { x: b.x - 6, y: b.y - 6, w: 12, d: 12, r: 1.6 };
    out.push(S(k.slabOf(k.insetPlan(plan, -1.2), TOP, 0.8, P, 3), { tone: "lo", crease: "none" }));
    out.push(S(k.slabOf(plan, TOP + 0.8, 3, P, 3, 0.5), { tone: "hi" }));
    const led = [b.x - 11, b.y];
    out.push(S(k.cylinder(led[0], led[1], 1.8, TOP, 0.8, P, 16), { tone: "lo" }));
    out.push(a.amBlink(ink(D([at([led[0], led[1], TOP + 0.8])], { size: 1.1, tone: "lit" })), { period: PHRASE, delay: onBeat(i * 600) }));
  }
  return out.join("");
}

function labelPlate() {
  const plan = { x: 56, y: 9, w: 40, d: 9, r: 1 };
  const z = TOP + 0.6;
  const out = [S(k.slabOf(plan, TOP, 0.6, P, 3), { tone: "lo", crease: "none" })];
  out.push(L(k.planOutline(k.insetPlan(plan, 1.2), z, P, 3), { tone: "faint" }));
  out.push(L([[6, 22], [6, 16]].map(([dx, len], i) => k.lineOnTop([plan.x + dx, plan.y + 3.2 + i * 2.8], [plan.x + dx + len, plan.y + 3.2 + i * 2.8], z, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([plan.x + 3, plan.y + 4.5, z]), at([plan.x + plan.w - 3, plan.y + 4.5, z])], { size: 0.45 }));
  return out.join("");
}

// ---------- keys ----------
const KEYS_X0 = -170;
const WHITE = 15;
const KEY_W = 340 / WHITE;
const KEY_Y = 26;
const KEY_D = 50;
const BLACK_AFTER = new Set([0, 1, 3, 4, 5, 7, 8, 10, 11, 12]);

// The phrase: one loop of PHRASE ms, each note a key and the time it goes down. White keys by
// index, black keys by the white key they follow. amPress (and amBlink) are down from 8% of the
// period, so a note at time T needs the animation offset by 8% − T.
const PHRASE = 3000;
const onBeat = (t) => (((0.08 * PHRASE - t) % PHRASE) + PHRASE) % PHRASE;
const WHITE_NOTES = new Map([[2, 0], [4, 300], [6, 600], [9, 1200], [11, 1500], [8, 1800], [5, 2400]]);
const BLACK_NOTES = new Map([[7, 900], [4, 2100]]);
const PRESS = [0, 0, -1.2];

// A key that plays: it presses down within its slot, and a lit copy blinks on over it for the
// same window, so the key brightens while it is down.
function playKey(solid, lit, t) {
  const opts = { period: PHRASE, delay: onBeat(t) };
  return a.amPress(solid + a.amBlink(lit, { ...opts, min: 0 }), PRESS, P, opts);
}

function keys() {
  const out = [];
  const rail = { x: -172, y: 22, w: 344, d: 4, r: 1 };
  out.push(S(k.slabOf(rail, KEYBED_Z, 8, P, 2, 0.4), { tone: "lo" }));
  const whites = [];
  for (let i = 0; i < WHITE; i++) whites.push({ i, x: KEYS_X0 + i * KEY_W + 0.6, w: KEY_W - 1.2 });
  for (const w of byDepth(whites, (w) => [w.x + w.w / 2, KEY_Y + KEY_D / 2])) {
    const plan = { x: w.x, y: KEY_Y, w: w.w, d: KEY_D, r: 1.4 };
    const paths = k.slabOf(plan, KEYBED_Z, 6, P, 3, 0.6);
    const key = S(paths, { tone: "hi" });
    out.push(WHITE_NOTES.has(w.i) ? playKey(key, S(paths, { tone: "hi", lit: true }), WHITE_NOTES.get(w.i)) : key);
  }
  const blacks = [...BLACK_AFTER].map((i) => ({ i, x: KEYS_X0 + (i + 1) * KEY_W - 6 }));
  for (const b of byDepth(blacks, (b) => [b.x + 6, KEY_Y + 16])) {
    const plan = { x: b.x, y: KEY_Y, w: 12, d: 30, r: 1.2 };
    const paths = k.slabOf(plan, KEYBED_Z + 6, 5, P, 3, 0.5);
    const key = ebony(S(paths, { tone: "hi" }));
    out.push(BLACK_NOTES.has(b.i) ? playKey(key, ebony(S(paths, { tone: "hi", lit: true })), BLACK_NOTES.get(b.i)) : key);
  }
  return out.join("");
}

// ---------- assemble ----------
const body = [
  base(),
  cheek(-192),
  tiers(),
  panelPlate(),
  grille(),
  knobs(),
  faders(),
  buttons(),
  labelPlate(),
  keys(),
  cheek(180),
].join("");

const name = light ? "synth-hero-light" : "synth-hero";
const svg = a.assetSvg({
  width: W,
  height: H,
  label: "An isometric analogue synthesiser: keys along the front, a panel of knobs, faders and buttons, two knobs in orange and one orange knob cap floating above its shaft.",
  body,
  paper: PAPER,
  accents: { brand: BRAND, led: { hex: BRAND, mode: "ink" }, ebony: light ? "#3a3a3f" : "#08080a" },
  weight: 0.8,
  id: name,
});
writeFileSync(join(HERE, `${name}.svg`), svg);
writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W, safe: SAFE }));
console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB) and ${name}.html`);
