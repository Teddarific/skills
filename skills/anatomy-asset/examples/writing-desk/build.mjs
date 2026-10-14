// A landing-page hero for "Quill", a calm journaling app: a small oak writing desk on brass-shod
// legs, a pigeonhole hutch on its back edge holding index cards and envelopes, a desk set with
// an inkwell and a green fountain pen lifted just out of its socket, a ruled index card on the
// blotter and a brass swing lamp. The art sits in the right of a 1200 × 640 canvas so the left
// stays free for a headline.
//
//   node build.mjs            light  → writing-desk.svg, writing-desk.html
//   node build.mjs --dark     dark   → writing-desk-dark.svg, writing-desk-dark.html
//
// Motion: the top index card writes itself in green ink (amDraw), the pen bobs above its
// socket (amFloat), and one card breathes in and out of its pigeonhole (amSlide).

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const dark = process.argv.includes("--dark");
const PAPER = dark ? "#12110f" : "#f4f1ea";
const BRAND = "#2f6b4f";

const W = 1200;
const H = 640;
const SAFE = { x: 0, y: 0, w: 470, h: H };
const REGION = { x: 500, y: 36, w: 668, h: 568 };

// ---------- world ----------
const FLOOR = { x: -140, y: -70, w: 280, d: 140, r: 1 };     // leg footprint
const LEG_Z = 46;
const APRON = { x: -140, y: -70, w: 280, d: 140, r: 1 };
const APRON_Z = [46, 68];
const TOP = { x: -152, y: -82, w: 304, d: 158, r: 3 };
const TZ = 74;                                                // writing surface
const HUT = { x0: -142, x1: 142, y0: -78, y1: -36 };
const IN = { x0: -136, x1: 136 };                             // between the cheeks
const CASE_Z = [TZ, 98];
const ROW0 = [98, 133];
const SHELF = [133, 137];
const ROW1 = [137, 172];
const BOARD = [172, 176];
const CORNICE = [176, 184];
const PEN = { x: 66, y: 24 };
const PEN_LIFT = 5;

const P = a.fitInto(
  [
    ...k.boxCorners(TOP, 0, TZ),
    ...k.boxCorners({ x: HUT.x0 - 6, y: HUT.y0 - 6, w: HUT.x1 - HUT.x0 + 12, d: HUT.y1 - HUT.y0 + 10, r: 0 }, TZ, CORNICE[1]),
    [PEN.x, PEN.y, 93 + PEN_LIFT + 86],
    [40, -70, CORNICE[1] + 30],
  ],
  REGION,
  { pad: 14, azimuth: 58, elevation: 32 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (items, key = (i) => i) => [...items].sort((p, q) => depth(key(p)) - depth(key(q)));
const brand = (svg) => `<g class="ac-brand">${svg}</g>`;
const ink = (svg) => `<g class="ac-ink">${svg}</g>`;
const brass = (svg) => `<g class="ac-brass">${svg}</g>`;
const wood = (svg) => `<g class="ac-wood">${svg}</g>`;
const leather = (svg) => `<g class="ac-leather">${svg}</g>`;
const ebony = (svg) => `<g class="ac-ebony">${svg}</g>`;
const path = (pts, closed = false) => k.pathOf(pts.map(at), closed);
// A closed rectangle in the plane y = const (a +y face) or x = const (a +x face).
const rectY = (y, x0, x1, z0, z1) => path([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], true);
const rectX = (x, y0, y1, z0, z1) => path([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]], true);
const screwY = (x, y, z, r = 0.9) => L(k.sideRing([x, y, z], r, "y", P, 14), { tone: "lo" }) + D([at([x, y, z])], { size: 0.45 });
const screwTop = (x, y, z, r = 1.6) => L(k.ring(x, y, r, z, P, 14), { tone: "lo" }) + D([at([x, y, z])], { size: 0.45 });

// A rotated rectangle on the floor, and a mapping from its local (u, v) to the world.
function card(cx, cy, w, d, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const to = (u, v) => [cx + u * c - v * s, cy + u * s + v * c];
  return { ring: [to(-w / 2, -d / 2), to(w / 2, -d / 2), to(w / 2, d / 2), to(-w / 2, d / 2)], to, w, d };
}

// ---------- fittings ----------

// A brass bail pull on a +y face: backplate with two screws, two posts and a bar.
function pull(cx, y, cz, w = 16) {
  const out = [];
  out.push(S(k.slabOf({ x: cx - w / 2, y, w, d: 0.6, r: 0.3 }, cz - 2.2, 4.4, P, 2), { tone: "mid", crease: "none" }));
  out.push(screwY(cx - w / 2 + 1.6, y + 0.6, cz, 0.8), screwY(cx + w / 2 - 1.6, y + 0.6, cz, 0.8));
  for (const px of [cx - w / 2 + 4, cx + w / 2 - 5.6]) out.push(S(k.slabOf({ x: px, y: y + 0.6, w: 1.6, d: 2.2, r: 0.4 }, cz - 0.8, 1.6, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: cx - w / 2 + 3, y: y + 2.8, w: w - 6, d: 1.5, r: 0.7 }, cz - 0.9, 1.8, P, 3, 0.3), { tone: "hi" }));
  return brass(out.join(""));
}

// A brass label holder on a +y face, with a card in it and a line of writing.
function holder(cx, y, z0, w = 20, h = 5.5) {
  const frame = brass(
    S(k.slabOf({ x: cx - w / 2, y, w, d: 0.7, r: 0.3 }, z0, h, P, 2), { tone: "mid", crease: "none" }) +
      D([at([cx - w / 2 + 0.9, y + 0.7, z0 + h / 2]), at([cx + w / 2 - 0.9, y + 0.7, z0 + h / 2])], { size: 0.4 }),
  );
  const cardSvg = S(k.slabOf({ x: cx - w / 2 + 1.8, y: y + 0.7, w: w - 3.6, d: 0.2, r: 0 }, z0 + 0.9, h - 1.8, P, 1), { tone: "lo", crease: "none" });
  const line = L(k.segment([cx - w / 2 + 3.4, y + 0.9, z0 + h / 2], [cx + w / 2 - 6, y + 0.9, z0 + h / 2], P), { tone: "mid", free: true });
  return frame + cardSvg + line;
}

// An overlay drawer front with a raised-panel groove, a label holder and a pull.
function drawer(x0, x1, y, z0, z1, { panel = true, pullW = 16, holderW = 20 } = {}) {
  const cx = (x0 + x1) / 2;
  const h = z1 - z0;
  const groove = panel ? L(rectY(y + 1.2, x0 + 3, x1 - 3, z0 + 2.4, z1 - 2.4), { tone: "faint" }) : "";
  const out = [S(k.slabOf({ x: x0, y, w: x1 - x0, d: 1.2, r: 0.6 }, z0, h, P, 3, 0.5), { tone: "mid" }), groove];
  out.push(holder(cx, y + 1.2, z0 + h * 0.56, holderW, Math.min(5.5, h * 0.3)));
  out.push(pull(cx, y + 1.2, z0 + h * 0.3, pullW));
  return out.join("");
}

// ---------- base: halo, legs, shelf, apron, top ----------
const LEGS = [[-140, -70], [128, -70], [-140, 58], [128, 58]].map(([x, y]) => ({ x, y }));

function leg({ x, y }) {
  const plan = { x, y, w: 12, d: 12, r: 1.2 };
  const out = [S(k.slabOf(plan, 7, LEG_Z - 7, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(plan, LEG_Z - 4, P, 3), { tone: "faint" }) })];
  const ferrule = k.insetPlan(plan, -0.8);
  out.push(brass(S(k.slabOf(ferrule, 0, 7, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(ferrule, 1.6, P, 3), { tone: "lo" }) })));
  return wood(out.join(""));
}

const SHELF_PLAN = { x: -128, y: -64, w: 256, d: 128, r: 0 };
const SHELF_Z = [12, 15.5];

function lowerShelf() {
  const out = [wood(S(k.slabOf(SHELF_PLAN, SHELF_Z[0], SHELF_Z[1] - SHELF_Z[0], P, 1, 0.5), { tone: "mid" }))];
  const z = SHELF_Z[1];
  // A card file box: oak, brass label holder and pull on its front.
  const box = { x: -112, y: 0, w: 74, d: 60, r: 2 };
  out.push(wood(S(k.slabOf(box, z, 24, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(box, z + 3, P, 3), { tone: "faint" }) })));
  const lid = k.insetPlan(box, -1);
  out.push(wood(S(k.slabOf(lid, z + 24, 4, P, 3, 0.6), { tone: "mid" })));
  out.push(L(k.planOutline(k.insetPlan(lid, 3), z + 28, P, 3), { tone: "faint" }));
  out.push(holder(box.x + box.w / 2, box.y + box.d, z + 13, 22, 6));
  out.push(pull(box.x + box.w / 2, box.y + box.d, z + 7.5, 14));
  // Two books, one on the other, page blocks as seams.
  const b1 = { x: -10, y: 4, w: 84, d: 56, r: 1 };
  const b2 = { x: 0, y: 10, w: 66, d: 46, r: 1 };
  out.push(S(k.slabOf(b1, z, 9, P, 2, 0.4), { tone: "mid", inner: L(k.sideSeam(b1, z + 1.4, P, 2) + k.sideSeam(b1, z + 7.6, P, 2), { tone: "faint" }) }));
  out.push(ebony(S(k.slabOf(b2, z + 9, 7, P, 2, 0.4), { tone: "hi", inner: L(k.sideSeam(b2, z + 10.2, P, 2) + k.sideSeam(b2, z + 14.8, P, 2), { tone: "lo" }) })));
  return out.join("");
}

function apron() {
  const out = [];
  out.push(wood(S(k.slabOf(APRON, APRON_Z[0], APRON_Z[1] - APRON_Z[0], P, 2), { tone: "mid" })));
  // A raised panel on the visible end.
  out.push(wood(L(rectX(APRON.x + APRON.w, APRON.y + 14, APRON.y + APRON.d - 14, APRON_Z[0] + 3, APRON_Z[1] - 3), { tone: "faint" })));
  const y = APRON.y + APRON.d;
  for (const [x0, x1] of [[-125, -49], [-46, 46], [49, 125]]) out.push(drawer(x0, x1, y, 48, 63.5, { pullW: x1 - x0 > 80 ? 18 : 15 }));
  return out.join("");
}

function top() {
  const out = [wood(S(k.slabOf(TOP, APRON_Z[1], TZ - APRON_Z[1], P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(TOP, APRON_Z[1] + 2, P, 4), { tone: "faint" }) }))];
  return out.join("");
}

// ---------- the hutch ----------
const CELL_W = (IN.x1 - IN.x0 - 9) / 4;
const cellX = (i) => IN.x0 + i * (CELL_W + 3);
const DIVIDERS = [0, 1, 2].map((i) => cellX(i) + CELL_W);

function cheek(x0) {
  const plan = { x: x0, y: HUT.y0, w: 6, d: HUT.y1 - HUT.y0, r: 0.8 };
  const out = [S(k.slabOf(plan, TZ, BOARD[1] - TZ, P, 2, 0.4), { tone: "mid" })];
  if (x0 > 0) {
    const x = x0 + 6;
    out.push(L(rectX(x, HUT.y0 + 5, HUT.y1 - 5, TZ + 6, BOARD[1] - 6), { tone: "faint" }));
    out.push(L(rectX(x, HUT.y0 + 8, HUT.y1 - 8, TZ + 9, BOARD[1] - 9), { tone: "faint" }));
  }
  return wood(out.join(""));
}

function hutchBack() {
  const back = { x: IN.x0, y: HUT.y0, w: IN.x1 - IN.x0, d: 3, r: 0 };
  return S(k.slabOf(back, TZ, BOARD[1] - TZ, P, 1), { tone: "mid" });
}

function hutchDrawers() {
  const plan = { x: IN.x0, y: HUT.y0 + 3, w: IN.x1 - IN.x0, d: HUT.y1 - HUT.y0 - 3, r: 0 };
  const out = [S(k.slabOf(plan, CASE_Z[0], CASE_Z[1] - CASE_Z[0], P, 1, 0.4), { tone: "mid" })];
  const w = (IN.x1 - IN.x0 - 8) / 3;
  for (let i = 0; i < 3; i++) {
    const x0 = IN.x0 + 2 + i * (w + 2);
    out.push(drawer(x0, x0 + w, HUT.y1, CASE_Z[0] + 2, CASE_Z[1] - 1.5, { pullW: 14, holderW: 20 }));
  }
  return out.join("");
}

// Stack of cards lying flat: one block with a seam per few cards, and a loose top card.
function flatStack(cx, cy, z, w, d, h, { ang = 0.05, env = false } = {}) {
  const plan = { x: cx - w / 2, y: cy - d / 2, w, d, r: 0.6 };
  const seams = [];
  for (let s = 1.2; s < h - 0.4; s += 1.2) seams.push(k.sideSeam(plan, z + s, P, 2));
  const out = [S(k.slabOf(plan, z, h, P, 2), { tone: "mid", crease: "faint", inner: L(seams.join(""), { tone: "faint" }) })];
  const c = card(cx + 1, cy - 0.5, w - 1, d - 1, ang);
  const zt = z + h + 0.8;
  const lines = [];
  if (env) {
    lines.push(L(k.onTop([c.to(-c.w / 2, -c.d / 2), c.to(0, 2), c.to(c.w / 2, -c.d / 2)], zt, P), { tone: "lo" }));
  } else {
    lines.push(L(k.onTop([c.to(-c.w / 2, -c.d / 2 + 5), c.to(c.w / 2, -c.d / 2 + 5)], zt, P), { tone: "lo" }));
    for (let v = -c.d / 2 + 9; v < c.d / 2 - 2; v += 4) lines.push(L(k.onTop([c.to(-c.w / 2, v), c.to(c.w / 2, v)], zt, P), { tone: "faint" }));
  }
  out.push(S(k.extrude(c.ring, z + h, 0.8, P), { tone: "mid", inner: lines.join("") }));
  return out.join("");
}

// Cards standing on edge, back to front, some with tabs.
function cardFile(x0, x1, z, h, tabs = []) {
  const out = [];
  const ys = [-72, -67, -62, -57, -52, -47];
  // Rule lines on the front card's face, edge to edge, under its outline.
  const fy = ys[ys.length - 1] + 0.8;
  const ftop = z + h - 4;
  const rules = [];
  for (let zz = ftop - 5; zz > z + 3; zz -= 4) rules.push(k.segment([x0, fy, zz], [x1, fy, zz], P));
  const front = L(rules.join(""), { tone: "faint" }) + L(k.segment([x0, fy, ftop - 2.5], [x1, fy, ftop - 2.5], P), { tone: "lo" });
  ys.forEach((y, i) => {
    const plan = { x: x0, y, w: x1 - x0, d: 0.8, r: 0 };
    const tall = i === ys.length - 1 ? h - 4 : h;
    out.push(S(k.slabOf(plan, z, tall, P, 1), { tone: "mid", crease: "none", inner: i === ys.length - 1 ? front : "" }));
    const t = tabs[i];
    if (t !== undefined) {
      const tab = { x: x0 + t, y, w: 12, d: 0.8, r: 0 };
      const svg = S(k.slabOf(tab, z + tall, 4, P, 1), { tone: "mid", crease: "none" });
      out.push(i === 2 ? brand(svg) : svg);
    }
  });
  return out.join("");
}

// Envelopes standing against the back, the flap drawn on the near face.
function envelope(x0, x1, y, z, h, green = false) {
  const plan = { x: x0, y, w: x1 - x0, d: 1.4, r: 0 };
  const fy = y + 1.4;
  const flap = L(path([[x0, fy, z + h], [(x0 + x1) / 2, fy, z + h - h * 0.42], [x1, fy, z + h]]), { tone: green ? "lo" : "faint" });
  const svg = S(k.slabOf(plan, z, h, P, 1), { tone: green ? "hi" : "mid", crease: "none", inner: flap });
  return green ? brand(svg) : svg;
}

function cellsRow0() {
  const z = ROW0[0];
  const out = [];
  const c = (i) => cellX(i) + CELL_W / 2;
  // 0: a flat stack of index cards
  out.push(flatStack(c(0), -56, z, 46, 30, 7, { ang: -0.04 }));
  out.push(divider(0, ROW0));
  // 1: two envelopes on end, the near one green
  out.push(envelope(cellX(1) + 6, cellX(1) + CELL_W - 4, -70, z, 26));
  out.push(envelope(cellX(1) + 3, cellX(1) + CELL_W - 12, -60, z, 22, true));
  out.push(divider(1, ROW0));
  // 2: a card file on edge with tabs
  out.push(cardFile(cellX(2) + 7, cellX(2) + CELL_W - 7, z, 26, [4, undefined, 22, undefined, 38]));
  out.push(divider(2, ROW0));
  // 3: envelopes lying flat
  out.push(flatStack(c(3), -57, z, 50, 30, 5, { ang: 0.05, env: true }));
  return out.join("");
}

function divider(i, [z0, z1]) {
  const plan = { x: DIVIDERS[i], y: HUT.y0 + 3, w: 3, d: HUT.y1 - HUT.y0 - 3, r: 0 };
  return S(k.slabOf(plan, z0, z1 - z0, P, 1), { tone: "mid" });
}

function shelf([z0, z1]) {
  const plan = { x: IN.x0, y: HUT.y0 + 3, w: IN.x1 - IN.x0, d: HUT.y1 - HUT.y0 - 3, r: 0 };
  return S(k.slabOf(plan, z0, z1 - z0, P, 1, 0.4), { tone: "mid" });
}

// The card that breathes in and out of its pigeonhole.
function slidingCard(cx) {
  const z = ROW1[0] + 5;
  const c = card(cx, -46, 44, 30, 0);
  const zt = z + 0.8;
  const svg = S(k.extrude(c.ring, z, 0.8, P), { tone: "hi", inner: [
    ink(L(k.onTop([c.to(-c.w / 2, -c.d / 2 + 5), c.to(c.w / 2, -c.d / 2 + 5)], zt, P), { tone: "mid" })),
    L([9, 13, 17, 21, 25].map((v) => k.onTop([c.to(-c.w / 2, -c.d / 2 + v), c.to(c.w / 2, -c.d / 2 + v)], zt, P)).join(""), { tone: "faint" }),
    L([[9, 28], [13, 20], [17, 31]].map(([v, len]) => k.onTop([c.to(-c.w / 2 + 3, -c.d / 2 + v - 1.4), c.to(-c.w / 2 + 3 + len, -c.d / 2 + v - 1.4)], zt, P)).join(""), { tone: "lo", free: true }),
  ].join("") });
  return a.amSlide(svg, [0, 7, 0], P, { period: 7600, delay: 2200 });
}

function cellsRow1() {
  const z = ROW1[0];
  const out = [];
  const c = (i) => cellX(i) + CELL_W / 2;
  out.push(cardFile(cellX(0) + 7, cellX(0) + CELL_W - 7, z, 25, [30, undefined, 6, 18]));
  out.push(divider(0, ROW1));
  out.push(flatStack(c(1), -57, z, 46, 30, 6, { ang: 0.03 }));
  out.push(divider(1, ROW1));
  // 2: a short stack with one card pulled half out
  const plan = { x: c(2) - 23, y: -72, w: 46, d: 30, r: 0.6 };
  const seams = [1.2, 2.4, 3.6].map((s) => k.sideSeam(plan, z + s, P, 2)).join("");
  out.push(S(k.slabOf(plan, z, 5, P, 2), { tone: "mid", inner: L(seams, { tone: "faint" }) }));
  out.push(slidingCard(c(2)));
  out.push(divider(2, ROW1));
  out.push(envelope(cellX(3) + 5, cellX(3) + CELL_W - 5, -70, z, 24));
  out.push(envelope(cellX(3) + 9, cellX(3) + CELL_W - 2, -62, z, 20));
  return out.join("");
}

function cornice() {
  const lo = { x: HUT.x0 - 2, y: HUT.y0 - 1, w: HUT.x1 - HUT.x0 + 4, d: HUT.y1 - HUT.y0 + 3, r: 1 };
  const hi = { x: HUT.x0 - 5, y: HUT.y0 - 2, w: HUT.x1 - HUT.x0 + 10, d: HUT.y1 - HUT.y0 + 6, r: 2 };
  const out = [
    S(k.slabOf(lo, CORNICE[0], 3, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf(hi, CORNICE[0] + 3, 5, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(hi, CORNICE[0] + 5, P, 3), { tone: "faint" }) }),
  ];
  return wood(out.join(""));
}

// A row of books on the cornice between two brass bookends.
function booksOnTop() {
  const z = CORNICE[1];
  const y = -70;
  const out = [];
  const end = (x, flip) => {
    const foot = { x: flip ? x - 9 : x, y: y - 1, w: 9, d: 24, r: 0.6 };
    const wall = { x: flip ? x - 1.4 : x, y: y - 1, w: 1.4, d: 24, r: 0.4 };
    return brass(S(k.slabOf(foot, z, 0.8, P, 2), { tone: "mid", crease: "none" }) + S(k.slabOf(wall, z + 0.8, 20, P, 2, 0.3), { tone: "hi" }));
  };
  const books = [[7, 28, "wood"], [5, 25, ""], [8, 30, "ebony"], [6, 26, ""], [5, 22, "brand"], [7, 27, ""]];
  let x = 34;
  out.push(end(x - 1.4, false));
  for (const [w, h, cls] of books) {
    const plan = { x, y, w, d: 22, r: 0.8 };
    const bands = L(k.sideSeam(plan, z + 3, P, 2) + k.sideSeam(plan, z + h - 3, P, 2), { tone: cls ? "lo" : "faint" });
    const svg = S(k.slabOf(plan, z, h, P, 2, 0.3), { tone: cls ? "hi" : "mid", inner: bands });
    out.push(cls ? `<g class="ac-${cls}">${svg}</g>` : svg);
    x += w + 0.4;
  }
  out.push(end(x + 1.4, true));
  return out.join("");
}

function hutch() {
  return [
    hutchBack(),
    cheek(HUT.x0),
    hutchDrawers(),
    cellsRow0(),
    shelf(SHELF),
    cellsRow1(),
    shelf(BOARD),
    cheek(HUT.x1 - 6),
    cornice(),
    booksOnTop(),
  ].join("");
}

// ---------- on the desk ----------
const BLOTTER = { x: -106, y: -22, w: 130, d: 86, r: 1.5 };

function blotter() {
  const z = TZ;
  const out = [S(k.slabOf(BLOTTER, z, 1.6, P, 2), { tone: "mid", crease: "none" })];
  out.push(L(k.planOutline(k.insetPlan(BLOTTER, 4), z + 1.6, P, 2), { tone: "faint" }));
  // Leather corners: triangles that wrap each corner.
  const { x, y, w, d } = BLOTTER;
  const c = 14;
  const tris = [
    [[x - 0.6, y - 0.6], [x + c, y - 0.6], [x - 0.6, y + c]],
    [[x + w + 0.6, y - 0.6], [x + w + 0.6, y + c], [x + w - c, y - 0.6]],
    [[x - 0.6, y + d + 0.6], [x - 0.6, y + d - c], [x + c, y + d + 0.6]],
    [[x + w + 0.6, y + d + 0.6], [x + w - c, y + d + 0.6], [x + w + 0.6, y + d - c]],
  ];
  for (const t of byDepth(tris, (t) => [t[0][0], t[0][1], z])) out.push(leather(S(k.extrude(t, z, 2.2, P, { bevel: 0.3 }), { tone: "hi" })));
  return out.join("");
}

// The index card on the blotter: a short stack, the top one ruled and written on.
function writingCards() {
  const z = TZ + 1.6;
  const out = [];
  const stack = [
    card(-36, 20, 84, 52, -0.08),
    card(-33, 19, 84, 52, 0.03),
    card(-34, 21, 84, 52, -0.02),
  ];
  stack.forEach((c, i) => out.push(S(k.extrude(c.ring, z + i * 0.8, 0.8, P), { tone: "mid", crease: i === 2 ? "faint" : "none" })));
  const top = card(-32, 22, 84, 52, 0.06);
  const zt = z + 3 * 0.8 + 0.8;
  const { to, w, d } = top;
  const lines = [];
  lines.push(ink(L(k.onTop([to(-w / 2, -d / 2 + 7), to(w / 2, -d / 2 + 7)], zt, P), { tone: "mid" })));
  const rules = [];
  for (let v = -d / 2 + 12; v < d / 2 - 2; v += 4.6) rules.push(k.onTop([to(-w / 2, v), to(w / 2, v)], zt, P));
  lines.push(L(rules.join(""), { tone: "faint" }));
  const writing = [[12, 56], [16.6, 64], [21.2, 44], [25.8, 60], [30.4, 30], [35, 52], [39.6, 18]]
    .map(([v, len]) => k.onTop([to(-w / 2 + 4, -d / 2 + v - 1.5), to(-w / 2 + 4 + len, -d / 2 + v - 1.5)], zt, P));
  // The card writes itself: each line draws in green ink after the one above, holds, then
  // fades, as if the hovering pen had just written it.
  const PERIOD = 9000;
  const STEP = 520;
  lines.push(ink(writing.map((d, i) => a.amDraw(d, { tone: "mid", period: PERIOD, delay: PERIOD - i * STEP, free: true })).join("")));
  lines.push(L(k.onTop([to(-w / 2 + 4, -d / 2 + 4.6), to(-w / 2 + 30, -d / 2 + 4.6)], zt, P), { tone: "mid", free: true }));
  out.push(S(k.extrude(top.ring, z + 3 * 0.8, 0.8, P), { tone: "hi", inner: lines.join("") }));
  return out.join("");
}

// A swing lamp: brass base, stem, knuckle, arm and a drum shade.
function lamp() {
  const [x, y] = [-130, -20];
  const out = [];
  out.push(S(k.cylinder(x, y, 11, TZ, 2.4, P, 40, 0.6), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 8, TZ + 2.4, 3, P, 36, 0.4), { tone: "mid" }));
  out.push(screwTop(x - 5, y + 5.5, TZ + 2.4, 1), screwTop(x + 6.5, y - 3.5, TZ + 2.4, 1));
  out.push(S(k.cylinder(x, y, 3, TZ + 5.4, 3, P, 20, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 1.5, TZ + 8.4, 62, P, 16), { tone: "mid", inner: L(k.sideArc(x, y, 1.5, TZ + 40, P, 12), { tone: "faint" }) }));
  const kz = TZ + 70.4;
  out.push(S(k.cylinder(x, y, 2.8, kz, 5, P, 20, 0.3), { tone: "hi", inner: L(k.sideArc(x, y, 2.8, kz + 2.5, P, 12), { tone: "lo" }) }));
  // Arm out toward the viewer, the shade hanging from its end.
  const sy = y + 30;
  const shadeTop = kz - 4;
  out.push(S(k.cylinder(x, sy, 13, shadeTop - 13, 7, P, 64, 0.6), {
    tone: "hi",
    inner: L(k.sideArc(x, sy, 13, shadeTop - 11.4, P, 48), { tone: "lo" }),
  }));
  out.push(S(k.cylinder(x, sy, 10.2, shadeTop - 6, 3, P, 56, 0.5), { tone: "hi" }));
  out.push(S(k.cylinder(x, sy, 6.4, shadeTop - 3, 1.8, P, 48, 0.4), { tone: "mid" }));
  out.push(screwTop(x, sy + 3.8, shadeTop - 1.2, 0.8));
  out.push(S(k.cylinder(x, sy, 1.6, shadeTop - 1.2, kz + 1.2 - shadeTop + 1.2, P, 16, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x - 1.2, y: y + 2.8, w: 2.4, d: sy - y - 2.8 + 1.6, r: 0.8 }, kz + 1.2, 2.4, P, 2), { tone: "mid" }));
  return brass(out.join(""));
}

// The desk set: an ebony base, a glass inkwell with a brass cap, a brass pen socket and the
// pen lifted just out of it.
function deskSet() {
  const base = { x: 48, y: -6, w: 70, d: 46, r: 3 };
  const bz = TZ + 6;
  const out = [];
  out.push(ebony(S(k.slabOf({ ...k.insetPlan(base, -1.4) }, TZ, 1.6, P, 3), { tone: "hi", crease: "none" })));
  out.push(ebony(S(k.slabOf(base, TZ + 1.6, bz - TZ - 1.6, P, 3, 0.8), { tone: "hi" })));
  out.push(ebony(L(k.planOutline(k.insetPlan(base, 3.2), bz, P, 3), { tone: "lo" })));
  out.push(ebony(screwTop(base.x + 5, base.y + base.d - 5, bz, 1.4) + screwTop(base.x + base.w - 5, base.y + base.d - 5, bz, 1.4)));
  // A brass plate on the base's front edge.
  const plate = { x: 86, y: 30, w: 26, d: 8, r: 0.8 };
  out.push(brass(S(k.slabOf(plate, bz, 0.6, P, 2), { tone: "mid", crease: "none" })));
  out.push(brass(L(k.planOutline(k.insetPlan(plate, 1.1), bz + 0.6, P, 2), { tone: "faint" })));
  out.push(brass(L(k.lineOnTop([plate.x + 4, plate.y + 4], [plate.x + 17, plate.y + 4], bz + 0.6, P), { tone: "lo", free: true })));
  out.push(brass(D([at([plate.x + 2.2, plate.y + 4, bz + 0.6]), at([plate.x + plate.w - 2.2, plate.y + 4, bz + 0.6])], { size: 0.4 })));

  // Pen socket.
  const { x, y } = PEN;
  const sz = bz + 13;
  out.push(brass([
    S(k.cylinder(x, y, 9.4, bz, 1.6, P, 40, 0.4), { tone: "mid" }),
    screwTop(x - 7.4, y - 3.2, bz + 1.6, 0.9),
    S(k.cylinder(x, y, 6.6, bz + 1.6, 2, P, 32, 0.3), { tone: "mid" }),
    S(k.cylinder(x, y, 5.4, bz + 3.6, sz - bz - 3.6, P, 32, 0.5), { tone: "hi", inner: L(k.sideArc(x, y, 5.4, sz - 2.2, P, 24), { tone: "lo" }) }),
  ].join("")));
  out.push(ebony(S(k.cylinder(x, y, 3.6, sz, 0.1, P, 24), { tone: "lo", crease: "none" })));
  out.push(pen(sz));

  // Inkwell.
  const [ix, iy] = [100, 12];
  const glass = { x: ix - 11, y: iy - 11, w: 22, d: 22, r: 4 };
  out.push(S(k.slabOf(glass, bz, 15, P, 4, 0.6), { tone: "hi", inner: L(k.sideSeam(glass, bz + 3, P, 4), { tone: "faint" }) }));
  const gz = bz + 15;
  out.push(L(k.planOutline(k.insetPlan(glass, 2.4), gz, P, 4), { tone: "faint" }));
  out.push(brass([
    S(k.cylinder(ix, iy, 6.4, gz, 2.2, P, 36, 0.3), { tone: "mid" }),
    S(k.cylinder(ix, iy, 7.8, gz + 2.2, 4, P, 40, 0.6), { tone: "hi", inner: L(k.sideArc(ix, iy, 7.8, gz + 3.6, P, 32), { tone: "lo" }) }),
    L(k.knurl(ix, iy, 7.8, gz + 3.6, gz + 6.2, 34, P, 0), { tone: "lo" }),
    S(k.cylinder(ix, iy, 2.6, gz + 6.2, 2.4, P, 20, 0.3), { tone: "mid" }),
    D([at([ix, iy, gz + 8.6])], { size: 0.5, tone: "hi" }),
  ].join("")));
  return out.join("");
}

// The fountain pen, nib down, hovering above its socket. Built bottom to top.
function pen(sz) {
  const { x, y } = PEN;
  let z = sz + PEN_LIFT;
  const out = [];
  const stack = (r, h, cls, style = {}) => {
    const svg = S(k.cylinder(x, y, r, z, h, P, 32, style.bevel ?? 0.3), { tone: style.tone ?? "hi", lit: style.lit, inner: style.inner?.(z, h) });
    out.push(cls ? `<g class="ac-${cls}">${svg}</g>` : svg);
    z += h;
    return z - h;
  };
  stack(0.9, 3, "brass", { bevel: 0 });
  stack(2, 4, "brass", { bevel: 0.2 });
  stack(3.1, 10, "ebony", { inner: (z0) => L(k.sideArc(x, y, 3.1, z0 + 2.6, P, 24) + k.sideArc(x, y, 3.1, z0 + 7.4, P, 24), { tone: "lo" }) });
  stack(3.8, 1.6, "brass", { bevel: 0.2 });
  const barrel = z;
  stack(4.1, 32, "brand", { lit: true });
  stack(4.3, 2, "brass");
  const capZ = z;
  stack(4.5, 26, "brand", { lit: true, inner: (z0) => L(k.sideArc(x, y, 4.5, z0 + 21, P, 28), { tone: "lo" }) });
  stack(3.2, 2.8, "brass", { bevel: 0.4 });
  out.push(brass(D([at([x, y, z])], { size: 0.45, tone: "hi" })));
  // The clip on the cap, on the side that faces the viewer.
  const [vx, vy] = k.towardViewer(P);
  const cr = 4.5;
  const clip = card(x + vx * (cr + 0.5), y + vy * (cr + 0.5), 2, 1.4, Math.atan2(vy, vx) + Math.PI / 2);
  out.push(brass(S(k.extrude(clip.ring, capZ + 4, 21, P, { bevel: 0.2 }), { tone: "hi" })));
  out.push(brass(S(k.cylinder(x + vx * (cr + 1.1), y + vy * (cr + 1.1), 1.2, capZ + 3, 2.2, P, 12), { tone: "hi" })));
  void barrel;
  const halo = `<path class="iso-halo" d="${k.haloOf({ x: x - 6, y: y - 6, w: 12, d: 12, r: 6 }, sz, 0.1, P)}" style="filter:blur(5px)"/>`;
  return a.amFloat(out.join(""), P, { rise: 4, period: 6400, halo });
}

function onDesk() {
  return [blotter(), lamp(), writingCards(), deskSet()].join("");
}

// ---------- assemble ----------
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(FLOOR, -8), 0, 4, P)}"/>`];
  out.push(leg(LEGS[0]), lowerShelf(), leg(LEGS[1]), leg(LEGS[2]), leg(LEGS[3]));
  out.push(apron(), top());
  return out.join("");
}

const body = [base(), hutch(), onDesk()].join("");

const name = dark ? "writing-desk-dark" : "writing-desk";
const svg = a.assetSvg({
  width: W,
  height: H,
  label: "An isometric oak writing desk with a pigeonhole hutch of index cards and envelopes, a ruled index card on the blotter, a brass lamp and inkwell, and a green fountain pen floating just above its stand.",
  body,
  paper: PAPER,
  accents: {
    brand: BRAND,
    ink: { hex: BRAND, mode: "ink" },
    brass: "#b08d57",
    wood: dark ? "#6a523b" : "#b39577",
    ebony: dark ? "#08080a" : "#3a3a3f",
    leather: dark ? "#5a3d27" : "#7a5638",
  },
  weight: 0.8,
  id: name,
});
writeFileSync(join(HERE, `${name}.svg`), svg);
writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W, safe: SAFE }));
console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB) and ${name}.html`);
