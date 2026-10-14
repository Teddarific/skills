// A feature tile for "Aether", an aerospace company: a small satellite on an integration
// stand in a clean room. The bus (navy panels, gold-foil blankets, a face-up dish, a star
// tracker, a camera turret, a patch array, thrusters) floats a hair above the stand's adapter
// ring, its two solar wings deployed flat either side. The stand is a rotation fixture on a
// wheeled base with leveling feet; a cable cover runs across the taped floor to a test
// console with a telemetry screen. The adapter ring's interface marks glow ice blue, the
// satellite floats, the rotary table turns, the console's trace draws itself, and the
// turret lens and the console LED breathe.
//
//   node build.mjs           dark   → aero-satellite.svg, aero-satellite.html
//   node build.mjs --light   light  → aero-satellite-light.svg, aero-satellite-light.html

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const light = process.argv.includes("--light");
const PAPER = light ? "#f2f4f7" : "#07090d";
const ICE = "#4cc9ff";

const W = 640;
const H = 480;
const REGION = { x: 0, y: 0, w: W, h: H };

// ---------- world ----------
const FLOOR = { x: -164, y: -64, w: 268, d: 140, r: 3 };
const BASE = { x: -48, y: -40, w: 96, d: 80, r: 3 };
const BASE_Z = 12;
const BASE_TOP = 20;
const COL = { x: -14, y: -14, w: 28, d: 28, r: 2 };
const COL_TOP = 58;
const TABLE_Z = 61;
const TABLE_TOP = 66;
const RING_TOP = 72;
const LIFT = 10;                                  // the satellite hovers this far above the ring
const SEP_Z = RING_TOP + LIFT;                    // separation ring bottom
const BUS = { x: -28, y: -28, w: 56, d: 56, r: 2.5 };
const BUS_Z = SEP_Z + 4;
const BUS_TOP = BUS_Z + 52;
const DECK = BUS_TOP + 2;
const WING_Z = BUS_Z + 27;
const WING_H = 2.2;
const SPAN = 130;
const CONSOLE = { x: -152, y: 34, w: 42, d: 30, r: 2 };

const P = a.fitInto(
  [
    ...k.boxCorners(FLOOR, -5, 0),
    ...k.boxCorners({ x: -SPAN, y: -24, w: 2 * SPAN, d: 48, r: 0 }, WING_Z, WING_Z + WING_H + 4),
    [18, -18, DECK + 22], [-4, -6, DECK + 22], [16, 16, DECK + 22],
    [CONSOLE.x, CONSOLE.y + 8, 72],
  ],
  REGION,
  { pad: 30, azimuth: 60, elevation: 32 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (items, key = (i) => i) => [...items].sort((p, q) => depth(key(p)) - depth(key(q)));
const wrap = (cls) => (svg) => `<g class="ac-${cls}">${svg}</g>`;
const navy = wrap("navy");
const foil = wrap("foil");
const cell = wrap("cell");
const ice = wrap("ice");
const ebony = wrap("ebony");
const white = wrap("white");
const halo = (plan, z, blur) => `<path class="iso-halo" d="${k.haloOf(plan, z, 0.1, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ""}/>`;

// Closed outlines and lines in a vertical face plane.
// face "y": the plane y = c, u along x.  face "x": the plane x = c, u along y.
const facePt = (face, c, u, z) => at(face === "y" ? [u, c, z] : [c, u, z]);
function faceRect(face, c, u0, u1, z0, z1, r = 0, steps = 3) {
  const ring = k.roundedPlan({ x: u0, y: z0, w: u1 - u0, d: z1 - z0, r }, steps);
  return k.pathOf(ring.map(([u, v]) => facePt(face, c, u, v)), true);
}
const faceLine = (face, c, u0, z0, u1, z1) => k.pathOf([facePt(face, c, u0, z0), facePt(face, c, u1, z1)]);

// A wheel on an axle along y: a short horizontal cylinder, built by hand as the kit's prisms
// only stand upright. The near face (+y) is the visible one at this azimuth.
function hull(points) {
  const pts = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (const p of pts.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
function wheelY(cx, cy, cz, r, hw, steps = 28) {
  const disc = (y) => Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    return at([cx + r * Math.cos(t), y, cz + r * Math.sin(t)]);
  });
  const near = disc(cy + hw);
  const far = disc(cy - hw);
  const outline = k.pathOf(hull([...near, ...far]), true);
  return { fill: outline, outline, crease: k.pathOf(near, true), top: k.pathOf(near, true), shades: ["", outline, "", ""] };
}

// ---------- floor ----------
function floor() {
  const out = [];
  out.push(S(k.slabOf(FLOOR, -5, 5, P, 3, 0.6), { tone: "lo", crease: "faint" }));
  // raised-floor tile joints, edge to edge
  const seams = [];
  for (const x of [-116, -68, -20, 28, 76]) seams.push(k.lineOnTop([x, FLOOR.y], [x, FLOOR.y + FLOOR.d], 0, P));
  for (const y of [-18, 30]) seams.push(k.lineOnTop([FLOOR.x, y], [FLOOR.x + FLOOR.w, y], 0, P));
  out.push(L(seams.join(""), { tone: "faint" }));
  // tape: L-shaped corner marks round the stand's keep-out zone
  const Z = { x0: -70, x1: 70, y0: -58, y1: 62 };
  const arm = 22;
  const tw = 3;
  const marks = [
    { cx: Z.x0, cy: Z.y0, sx: 1, sy: 1 },
    { cx: Z.x1, cy: Z.y0, sx: -1, sy: 1 },
    { cx: Z.x0, cy: Z.y1, sx: 1, sy: -1 },
    { cx: Z.x1, cy: Z.y1, sx: -1, sy: -1 },
  ];
  for (const m of byDepth(marks, (m) => [m.cx, m.cy])) {
    const ring = [
      [m.cx, m.cy], [m.cx + m.sx * arm, m.cy], [m.cx + m.sx * arm, m.cy + m.sy * tw],
      [m.cx + m.sx * tw, m.cy + m.sy * tw], [m.cx + m.sx * tw, m.cy + m.sy * arm], [m.cx, m.cy + m.sy * arm],
    ];
    out.push(foil(S(k.extrude(ring, 0, 0.4, P, { convex: false }), { tone: "mid", crease: "none" })));
  }
  // a walkway line along the front of the floor
  out.push(foil(S(k.slabOf({ x: -158, y: 68, w: 256, d: 3, r: 0.5 }, 0, 0.4, P, 2), { tone: "mid", crease: "none" })));
  return out.join("");
}

// ---------- cable cover from the stand to the console ----------
const COVER = { x: CONSOLE.x + CONSOLE.w, y: 38, w: -30 - (CONSOLE.x + CONSOLE.w), d: 10, r: 2 };
function cableCover() {
  const out = [];
  out.push(S(k.slabOf(COVER, 0, 2.4, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(COVER, 1, P, 3), { tone: "faint" }) }));
  // tread grooves across the cover: closed slots, so no ends
  const slots = [];
  for (let x = COVER.x + 6; x < COVER.x + COVER.w - 6; x += 6) slots.push(k.planOutline({ x, y: COVER.y + 2.5, w: 2, d: 5, r: 1 }, 2.4, P, 2));
  out.push(L(slots.join(""), { tone: "lo" }));
  return out.join("");
}

// ---------- stand: casters, leveling feet, base, column, rotary table, adapter ring ----------
function caster(cx, cy) {
  const out = [];
  const cheek = (y) => S(k.slabOf({ x: cx - 3, y, w: 6, d: 1.2, r: 0.4 }, 4, 5, P, 2), { tone: "mid" });
  out.push(cheek(cy - 3.6));
  out.push(ebony(S(wheelY(cx, cy, 4, 4, 2.2), { tone: "hi" })));
  out.push(D([at([cx, cy + 2.2, 4])], { size: 0.5, tone: "mid" }));
  out.push(cheek(cy + 2.4));
  out.push(S(k.slabOf({ x: cx - 3, y: cy - 3.6, w: 6, d: 7.2, r: 0.6 }, 8.6, 1, P, 2), { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, 3.4, 9.6, BASE_Z - 9.6, P, 20), { tone: "lo" }));
  return out.join("");
}

function levelFoot(sx) {
  const fx = sx * 56;
  const tab = { x: sx > 0 ? 48 : -62, y: -7, w: 14, d: 14, r: 2 };
  const out = [];
  out.push(ebony(S(k.cylinder(fx, 0, 5, 0, 2.6, P, 32, 0.4), { tone: "hi" })));
  out.push(S(k.cylinder(fx, 0, 2.2, 2.6, 1.4, P, 16), { tone: "mid" }));
  out.push(S(k.cylinder(fx, 0, 1.5, 4, 10, P, 16), { tone: "mid", inner: L(k.sideArc(fx, 0, 1.5, 6, P, 10) + k.sideArc(fx, 0, 1.5, 8, P, 10), { tone: "faint" }) }));
  out.push(S(k.cylinder(fx, 0, 3.2, 10, 2.2, P, 6), { tone: "mid" }));
  out.push(S(k.slabOf(tab, 14, 4, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([fx, 0, 18])], { size: 0.5 }));
  out.push(L(k.ring(fx, 0, 2, 18, P, 16), { tone: "lo" }));
  return out.join("");
}

function standBase() {
  const out = [halo(k.insetPlan(BASE, -10), 0, 3)];
  out.push(levelFoot(-1));
  for (const [x, y] of byDepth(k.corners(BASE, 10))) out.push(caster(x, y));
  const seam = L(k.sideSeam(BASE, 16, P, 3), { tone: "faint" });
  out.push(S(k.slabOf(BASE, BASE_Z, BASE_TOP - BASE_Z, P, 3, 0.8), { tone: "mid", inner: seam }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 4), BASE_TOP, P, 3), { tone: "faint" }));
  const screws = k.corners(BASE, 7);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 1.8, BASE_TOP, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, BASE_TOP])), { size: 0.5 }));
  out.push(levelFoot(1));
  // a push handle on the +x end: two posts and a bar
  for (const y of [-24, 24]) out.push(S(k.cylinder(42, y, 1.6, BASE_TOP, 18, P, 14), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 40.4, y: -25.6, w: 3.2, d: 51.2, r: 1.6 }, BASE_TOP + 18, 3.2, P, 3, 0.3), { tone: "mid" }));
  // a connector box on the front face; the harness drops from it into the cable cover
  const box = { x: -40, y: 40, w: 16, d: 6, r: 1 };
  out.push(S(k.slabOf(box, 8, 12, P, 2, 0.4), { tone: "mid", inner: L(faceRect("y", 46, -38, -26, 10.5, 17.5, 1), { tone: "lo" }) }));
  out.push(D([facePt("y", 46, -36, 14), facePt("y", 46, -32, 14), facePt("y", 46, -28, 14)], { size: 0.55, tone: "hi" }));
  out.push(S(k.cylinder(-32, 43, 1.6, 2.4, 5.6, P, 14), { tone: "lo", inner: L(k.sideArc(-32, 43, 1.6, 5, P, 10), { tone: "faint" }) }));
  return out.join("");
}

function standColumn() {
  const out = [];
  const flange = { x: -20, y: -20, w: 40, d: 40, r: 3 };
  out.push(S(k.slabOf(flange, BASE_TOP, 3, P, 3, 0.4), { tone: "lo" }));
  out.push(D(k.corners(flange, 4).map(([x, y]) => at([x, y, BASE_TOP + 3])), { size: 0.5 }));
  const seams = L(k.sideSeam(COL, 30, P, 3) + k.sideSeam(COL, 52, P, 3), { tone: "faint" });
  out.push(S(k.slabOf(COL, BASE_TOP + 3, COL_TOP - BASE_TOP - 3, P, 3, 0.6), { tone: "mid", inner: seams }));
  // access panel on the front face
  const fy = COL.y + COL.d;
  out.push(L(faceRect("y", fy, -9, 9, 34, 48, 1.2), { tone: "lo" }));
  out.push(D([[-7, 36], [7, 36], [-7, 46], [7, 46]].map(([u, z]) => facePt("y", fy, u, z)), { size: 0.45 }));
  out.push(L([-4, 0, 4].map((u) => faceRect("y", fy, u - 0.8, u + 0.8, 38, 44, 0.8, 2)).join(""), { tone: "faint" }));
  // drive motor on the +x face
  out.push(S(k.slabOf({ x: 14, y: -6, w: 3, d: 12, r: 0.6 }, 34, 14, P, 2), { tone: "lo" }));
  out.push(S(k.cylinder(23, 0, 6, 32, 18, P, 36, 0.5), { tone: "mid", inner: L(k.sideArc(23, 0, 6, 36, P, 24) + k.sideArc(23, 0, 6, 46, P, 24), { tone: "faint" }) }));
  out.push(S(k.cylinder(23, 0, 4, 50, 1.6, P, 28), { tone: "lo" }));
  out.push(D([at([23, 0, 51.6])], { size: 0.5 }));
  return out.join("");
}

function rotaryTable() {
  const out = [];
  out.push(S(k.cylinder(0, 0, 20, COL_TOP, TABLE_Z - COL_TOP, P, 56), { tone: "lo" }));
  out.push(S(k.cylinder(0, 0, 27, TABLE_Z, TABLE_TOP - TABLE_Z, P, 72, 0.6), { tone: "mid", inner: L(k.sideArc(0, 0, 27, TABLE_Z + 2, P, 48), { tone: "faint" }) }));
  out.push(L(k.ring(0, 0, 26.6, TABLE_TOP, P, 72), { tone: "faint" }));
  // the table turns: its degree ticks and four index holes spin in the table's top plane,
  // drawn flat around the axis; the ring they root on and the index pointer stay still
  const minor = [];
  const major = [];
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * Math.PI * 2;
    const len = i % 6 === 0 ? 2.4 : 1.2;
    const seg = `M${(Math.sin(t) * 26.6).toFixed(2)} ${(-Math.cos(t) * 26.6).toFixed(2)}L${(Math.sin(t) * (26.6 - len)).toFixed(2)} ${(-Math.cos(t) * (26.6 - len)).toFixed(2)}`;
    (i % 6 === 0 ? major : minor).push(seg);
  }
  const holes = [0, 1, 2, 3].map((i) => {
    const t = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const [x, y] = [Math.cos(t) * 23, Math.sin(t) * 23];
    return `M${(x + 1.2).toFixed(2)} ${y.toFixed(2)}A1.2 1.2 0 1 0 ${(x - 1.2).toFixed(2)} ${y.toFixed(2)}A1.2 1.2 0 1 0 ${(x + 1.2).toFixed(2)} ${y.toFixed(2)}Z`;
  });
  const flat = L(minor.join(""), { tone: "lo" }) + L(major.join(""), { tone: "mid" }) + L(holes.join(""), { tone: "lo" });
  out.push(a.amSpin(flat, a.topPlane([0, 0, TABLE_TOP], P), { period: 10000 }));
  // index pointer on the flange
  out.push(S(k.slabOf({ x: -1.4, y: 18, w: 2.8, d: 11, r: 0.6 }, COL_TOP, TABLE_Z - COL_TOP, P, 2), { tone: "mid" }));
  return out.join("");
}

function adapterRing() {
  const out = [];
  out.push(ice(S(k.cylinder(0, 0, 20, TABLE_TOP, RING_TOP - TABLE_TOP, P, 64, 0.6), { tone: "hi", lit: true, inner: L(k.sideArc(0, 0, 20, TABLE_TOP + 2, P, 40), { tone: "faint" }) })));
  out.push(L(k.ring(0, 0, 12, RING_TOP, P, 48), { tone: "lo" }));
  const bolts = Array.from({ length: 12 }, (_, i) => {
    const t = (i / 12) * Math.PI * 2;
    return [16 * Math.cos(t), 16 * Math.sin(t)];
  });
  const glow = ice(L(k.ring(0, 0, 18.4, RING_TOP, P, 64), { tone: "lit" }) + D(bolts.map(([x, y]) => at([x, y, RING_TOP])), { size: 0.6, tone: "lit" }));
  out.push(a.amPulse(glow, { period: 4200, min: 0.4 }));
  return out.join("");
}

// ---------- satellite ----------
function thrusterUnder(x, y) {
  return S(k.cylinder(x, y, 1.4, SEP_Z + 1, 3, P, 14), { tone: "lo" }) + S(k.cylinder(x, y, 2.4, SEP_Z - 1.4, 2.4, P, 18, 0.3), { tone: "mid" });
}

function underside() {
  const items = [
    ...[[-22, -22], [22, -22], [-22, 22], [22, 22]].map(([x, y]) => ({ p: [x, y], svg: thrusterUnder(x, y) })),
    { p: [0, 0], svg: S(k.cylinder(0, 0, 18, SEP_Z, 4, P, 56, 0.4), { tone: "mid", inner: L(k.sideArc(0, 0, 18, SEP_Z + 2, P, 40), { tone: "faint" }) }) },
  ];
  return byDepth(items, (i) => i.p).map((i) => i.svg).join("");
}

// One wing on side s (+1 / -1): SADA block on the bus face, a yoke, two hinged panels.
const PANELS = [[40, 84], [86, 130]];
function panel(s, [u0, u1]) {
  const x0 = s > 0 ? u0 : -u1;
  const plan = { x: x0, y: -24, w: u1 - u0, d: 48, r: 1 };
  const top = WING_Z + WING_H;
  const inset = k.insetPlan(plan, 2);
  const grid = [];
  for (let i = 1; i < 5; i++) {
    const x = inset.x + (i * inset.w) / 5;
    grid.push(k.lineOnTop([x, inset.y], [x, inset.y + inset.d], top, P));
  }
  for (const y of [-12, 0, 12]) grid.push(k.lineOnTop([inset.x, y], [inset.x + inset.w, y], top, P));
  return cell(
    S(k.slabOf(plan, WING_Z, WING_H, P, 2, 0.4), { tone: "mid", inner: L(k.sideSeam(plan, WING_Z + 1, P, 2), { tone: "faint" }) }) +
      L(k.planOutline(inset, top, P, 2), { tone: "lo" }) +
      L(grid.join(""), { tone: "faint" }),
  );
}
function wingHinge(s) {
  const x = s > 0 ? 84 : -86;
  return [-16, 16].map((y) => S(k.slabOf({ x, y: y - 3, w: 2, d: 6, r: 0.4 }, WING_Z - 0.4, WING_H + 1.2, P, 2), { tone: "hi" })).join("");
}
function yoke(s) {
  const ring = s > 0 ? [[31.5, -3], [40, -18], [40, 18], [31.5, 3]] : [[-31.5, 3], [-40, 18], [-40, -18], [-31.5, -3]];
  return S(k.extrude(ring, WING_Z + 0.4, 1.4, P, { bevel: 0.3 }), { tone: "mid" });
}
function sada(s) {
  const x = s > 0 ? 28 : -31.5;
  return S(k.slabOf({ x, y: -5, w: 3.5, d: 10, r: 0.8 }, WING_Z - 4, 10, P, 2, 0.3), { tone: "mid" });
}
function wing(s) {
  const parts = [sada(s), yoke(s), panel(s, PANELS[0]), wingHinge(s), panel(s, PANELS[1])];
  return (s > 0 ? parts : parts.reverse()).join("");
}

function busBody() {
  const out = [];
  const seams = L(k.sideSeam(BUS, BUS_Z + 4, P, 3) + k.sideSeam(BUS, BUS_TOP - 4, P, 3), { tone: "faint" });
  out.push(navy(S(k.slabOf(BUS, BUS_Z, BUS_TOP - BUS_Z, P, 3, 0.8), { tone: "hi", inner: seams })));
  // gold-foil blanket on the front face, stitched in three gores
  const fy = BUS.y + BUS.d;
  const blanket = { x: -22, y: fy, w: 44, d: 0.8, r: 0.4 };
  const by = fy + 0.8;
  const z0 = BUS_Z + 6;
  const z1 = BUS_TOP - 6;
  const stitches = faceLine("y", by, -7.3, z0, -7.3, z1) + faceLine("y", by, 7.3, z0, 7.3, z1);
  out.push(foil(S(k.slabOf(blanket, z0, z1 - z0, P, 2), { tone: "mid", crease: "none", inner: L(stitches, { tone: "lo" }) })));
  out.push(foil(D([[-19.5, z0 + 2.5], [19.5, z0 + 2.5], [-19.5, z1 - 2.5], [19.5, z1 - 2.5]].map(([u, z]) => facePt("y", by, u, z)), { size: 0.45, tone: "hi" })));
  // umbilical connector below the blanket
  out.push(S(k.slabOf({ x: -6, y: fy, w: 12, d: 1.6, r: 0.5 }, BUS_Z + 1.2, 3.4, P, 2), { tone: "lo" }));
  // side face (+x): a white radiator above the wing, a foil blanket below it
  const sx = BUS.x + BUS.w;
  const rad = { x: sx, y: -22, w: 0.8, d: 44, r: 0.4 };
  const rz0 = WING_Z + 9;
  const rz1 = BUS_TOP - 6;
  const fins = [-14, -6, 2, 10].map((u) => faceLine("x", sx + 0.8, u + 2, rz0, u + 2, rz1)).join("");
  out.push(white(S(k.slabOf(rad, rz0, rz1 - rz0, P, 2), { tone: "mid", inner: L(fins, { tone: "lo" }) })));
  const low = { x: sx, y: -22, w: 0.8, d: 44, r: 0.4 };
  out.push(foil(S(k.slabOf(low, BUS_Z + 6, WING_Z - 8 - BUS_Z - 6, P, 2), { tone: "mid", crease: "none" })));
  return out.join("");
}

function deck() {
  const out = [];
  const plate = k.insetPlan(BUS, -1);
  out.push(navy(S(k.slabOf(plate, BUS_TOP, DECK - BUS_TOP, P, 3, 0.6), { tone: "mid" })));
  out.push(navy(L(k.planOutline(k.insetPlan(plate, 3), DECK, P, 3), { tone: "faint" })));
  out.push(D(k.corners(plate, 2.2).map(([x, y]) => at([x, y, DECK])), { size: 0.45 }));
  const items = [
    { p: [-4, -6], svg: dish(-4, -6) },
    { p: [18, -18], svg: starTracker(18, -18) },
    { p: [16, 16], svg: turret(16, 16) },
    { p: [-20, 17], svg: patchArray(-20, 17) },
    { p: [-22, -21], svg: sunSensor(-22, -21) },
  ];
  out.push(byDepth(items, (i) => i.p).map((i) => i.svg).join(""));
  return out.join("");
}

function dish(cx, cy) {
  const out = [];
  const R = 14.5;
  const rim = DECK + 6;
  out.push(S(k.cylinder(cx, cy, 4, DECK, 3, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(cx, cy, R, DECK + 3, 3, P, 64, 0.5), { tone: "hi", crease: "lo" }));
  out.push(L(k.ring(cx, cy, R - 1.4, rim, P, 56) + k.ring(cx, cy, 9, rim, P, 48) + k.ring(cx, cy, 4.6, rim, P, 36), { tone: "faint" }));
  // three feed struts from the inner rim to the feed horn
  const struts = [];
  for (const t of [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6]) {
    struts.push(k.segment([cx + Math.cos(t) * (R - 1.4), cy + Math.sin(t) * (R - 1.4), rim], [cx + Math.cos(t) * 2.2, cy + Math.sin(t) * 2.2, rim + 10], P));
  }
  out.push(L(struts.join(""), { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, 1, rim, 10, P, 12), { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, 2.4, rim + 10, 3.6, P, 20, 0.3), { tone: "hi", lit: true }));
  return out.join("");
}

function starTracker(cx, cy) {
  const out = [];
  out.push(navy(S(k.slabOf({ x: cx - 6, y: cy - 6, w: 12, d: 12, r: 1 }, DECK, 6, P, 2, 0.4), { tone: "mid" })));
  out.push(S(k.cylinder(cx, cy, 4.4, DECK + 6, 1.4, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(cx, cy, 3.8, DECK + 7.4, 10, P, 28, 0.4), { tone: "hi", inner: L(k.sideArc(cx, cy, 3.8, DECK + 10, P, 20), { tone: "faint" }) }));
  out.push(L(k.ring(cx, cy, 2.8, DECK + 17.4, P, 24), { tone: "lo" }));
  out.push(ice(D([at([cx, cy, DECK + 17.4])], { size: 0.8, tone: "lit" })));
  return out.join("");
}

function turret(cx, cy) {
  const out = [];
  out.push(S(k.cylinder(cx, cy, 6, DECK, 2.4, P, 32, 0.3), { tone: "lo" }));
  out.push(S(k.cylinder(cx, cy, 4.4, DECK + 2.4, 6, P, 28), { tone: "mid", inner: L(k.sideArc(cx, cy, 4.4, DECK + 5, P, 20), { tone: "faint" }) }));
  const head = { x: cx - 6, y: cy - 5, w: 12, d: 9, r: 1.2 };
  const hz = DECK + 8.4;
  out.push(S(k.slabOf(head, hz, 7, P, 2, 0.4), { tone: "hi", inner: L(k.sideSeam(head, hz + 2, P, 2), { tone: "faint" }) }));
  // lens hood on the front face, the lens ringed in ice
  const hood = { x: cx - 3, y: cy + 4, w: 6, d: 2.4, r: 0.6 };
  out.push(S(k.slabOf(hood, hz + 0.8, 5.4, P, 2), { tone: "mid" }));
  const fy = cy + 6.4;
  out.push(L(k.sideRing([cx, fy, hz + 3.5], 1.9, "y", P, 20), { tone: "lo" }));
  out.push(a.amPulse(ice(L(k.sideRing([cx, fy, hz + 3.5], 1.9, "y", P, 20), { tone: "lit" })), { period: 3000, delay: 1200, min: 0.25 }));
  out.push(ice(D([facePt("y", fy, cx, hz + 3.5)], { size: 0.7, tone: "lit" })));
  return out.join("");
}

function patchArray(cx, cy) {
  const out = [];
  const plate = { x: cx - 7, y: cy - 7, w: 14, d: 14, r: 0.8 };
  out.push(S(k.slabOf(plate, DECK, 1.2, P, 2, 0.3), { tone: "lo" }));
  const patches = [];
  for (const dx of [-3.4, 3.4]) for (const dy of [-3.4, 3.4]) patches.push([cx + dx, cy + dy]);
  for (const [x, y] of byDepth(patches)) {
    out.push(foil(S(k.slabOf({ x: x - 2.4, y: y - 2.4, w: 4.8, d: 4.8, r: 0.3 }, DECK + 1.2, 0.6, P, 2), { tone: "hi", crease: "none" })));
    out.push(D([at([x, y, DECK + 1.8])], { size: 0.4, tone: "lo" }));
  }
  return out.join("");
}

function sunSensor(cx, cy) {
  return S(k.cylinder(cx, cy, 2.6, DECK, 2.6, P, 20, 0.3), { tone: "mid" }) + L(k.ring(cx, cy, 1.4, DECK + 2.6, P, 14), { tone: "lo" }) + D([at([cx, cy, DECK + 2.6])], { size: 0.45 });
}

function satellite() {
  const body = [underside(), wing(-1), busBody(), deck(), wing(1)].join("");
  const shadow = halo({ x: -18, y: -18, w: 36, d: 36, r: 18 }, RING_TOP, 4);
  return a.amFloat(body, P, { rise: 3, period: 6400, halo: shadow });
}

// ---------- test console ----------
function testConsole() {
  const out = [halo(k.insetPlan(CONSOLE, -5), 0, 3)];
  const C = CONSOLE;
  for (const [x, y] of byDepth(k.corners(C, 4))) out.push(ebony(S(k.cylinder(x, y, 2.4, 0, 3, P, 18), { tone: "hi" })));
  const seam = L(k.sideSeam(C, 8, P, 3), { tone: "faint" });
  out.push(S(k.slabOf(C, 3, 37, P, 3, 0.6), { tone: "lo", inner: seam }));
  // front face: two drawers with pulls, a vent block
  const fy = C.y + C.d;
  out.push(L(faceRect("y", fy, C.x + 4, C.x + C.w - 4, 24, 36, 1) + faceRect("y", fy, C.x + 4, C.x + C.w - 4, 11, 22, 1), { tone: "lo" }));
  for (const z of [32, 19]) out.push(S(k.slabOf({ x: C.x + 14, y: fy, w: 14, d: 1.4, r: 0.5 }, z, 1.6, P, 2), { tone: "hi" }));
  // side face (+x): vent slots, where the cable cover runs in below
  const sx = C.x + C.w;
  out.push(L([0, 1, 2, 3, 4, 5].map((i) => faceRect("x", sx, C.y + 6 + i * 3.4, C.y + 7.6 + i * 3.4, 22, 34, 0.7, 2)).join(""), { tone: "lo" }));
  // desk top
  const desk = k.insetPlan(C, -1.5);
  out.push(S(k.slabOf(desk, 40, 2.4, P, 3, 0.5), { tone: "mid" }));
  const top = 42.4;
  // monitor on a foot at the back of the desk, its screen facing front
  out.push(S(k.slabOf({ x: C.x + 15, y: C.y + 1, w: 12, d: 7, r: 1 }, top, 1.2, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf({ x: C.x + 19, y: C.y + 2.5, w: 4, d: 2.5, r: 0.6 }, top + 1.2, 5, P, 2), { tone: "mid" }));
  const mon = { x: C.x + 3, y: C.y + 4, w: 36, d: 3.2, r: 0.8 };
  const m0 = top + 5;
  const m1 = top + 27;
  out.push(S(k.slabOf(mon, m0, m1 - m0, P, 2, 0.4), { tone: "mid" }));
  const my = mon.y + mon.d;
  const wx0 = mon.x + 2;
  const wx1 = mon.x + mon.w - 2;
  const wz0 = m0 + 2;
  const wz1 = m1 - 2;
  out.push(S(k.slabOf({ x: wx0, y: my, w: wx1 - wx0, d: 0.3, r: 0.3 }, wz0, wz1 - wz0, P, 2), { tone: "lo", crease: "none", flat: true }));
  // telemetry: a trace and two bar rows, all rooted on the window's frame or on a rule
  const sy = my + 0.3;
  const trace = [];
  for (let i = 0; i <= 40; i++) {
    const u = wx0 + (i / 40) * (wx1 - wx0);
    trace.push(facePt("y", sy, u, wz0 + 12 + Math.sin(i * 0.55) * 3 * Math.exp(-i / 50) + Math.sin(i * 1.7) * 0.6));
  }
  out.push(ice(L(k.pathOf(trace), { tone: "faint" }) + a.amDraw(k.pathOf(trace), { tone: "lit", period: 4800 })));
  out.push(L(faceLine("y", sy, wx0, wz0 + 6.5, wx1, wz0 + 6.5), { tone: "faint" }));
  const bars = [];
  for (let i = 0; i < 8; i++) {
    const u = wx0 + 3 + i * 4;
    bars.push(faceLine("y", sy, u, wz0 + 6.5, u, wz0 + 6.5 - [3.4, 2.4, 4.2, 1.8, 3.8, 2.8, 4, 2.2][i]));
  }
  out.push(ice(L(bars.join(""), { tone: "mid" })));
  out.push(D([facePt("y", my, mon.x + mon.w - 3, m0 + 1)], { size: 0.45 }));
  // keypad and a status lamp on the desk
  const keys = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) keys.push([C.x + 5 + c * 5.4, C.y + 14 + r * 5.4]);
  for (const [x, y] of byDepth(keys)) out.push(S(k.slabOf({ x, y, w: 4.2, d: 4.2, r: 0.6 }, top, 1.2, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(C.x + 33, C.y + 19, 3.4, top, 1.2, P, 24), { tone: "lo" }));
  out.push(ebony(S(k.cylinder(C.x + 33, C.y + 19, 2.6, top + 1.2, 2.8, P, 24, 0.3), { tone: "hi" })));
  out.push(L(k.knurl(C.x + 33, C.y + 19, 2.6, top + 1.2, top + 3.6, 14, P), { tone: "lo" }));
  out.push(S(k.cylinder(C.x + 33, C.y + 11, 1.8, top, 1.4, P, 18), { tone: "lo" }));
  out.push(a.amPulse(ice(D([at([C.x + 33, C.y + 11, top + 1.4])], { size: 1.3, tone: "lit" })), { period: 2800, delay: 600, min: 0.3 }));
  return out.join("");
}

// ---------- assemble ----------
const body = [
  floor(),
  cableCover(),
  standBase(),
  standColumn(),
  rotaryTable(),
  adapterRing(),
  satellite(),
  testConsole(),
].join("");

const name = light ? "aero-satellite-light" : "aero-satellite";
const svg = a.assetSvg({
  width: W,
  height: H,
  label: "An isometric small satellite floating just above the adapter ring of an integration stand in a clean room, its two solar wings deployed flat, with a cable cover running across the taped floor to a test console.",
  body,
  paper: PAPER,
  accents: {
    navy: light ? "#3c5078" : "#34476a",
    foil: "#b8955a",
    cell: light ? "#2e3f5e" : "#1c2a44",
    ice: { hex: ICE, mode: "ink" },
    ebony: light ? "#3a3d44" : "#08090c",
    white: light ? "#f7f8fa" : "#8a93a3",
  },
  weight: 0.65,
  id: name,
});
writeFileSync(join(HERE, `${name}.svg`), svg);
writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W }));
console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB) and ${name}.html; scale ${P.scale.toFixed(2)}`);
