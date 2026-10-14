// A feature tile for an "AI assistant that does the busywork": a compact red espresso machine
// on rubber feet (drip tray with a slotted grille, group head with a locked-in portafilter, a
// face-up pressure gauge, a cup-warmer rail with two cups upside down, buttons and a steam
// wand) and, beside it, a tiny robot barista built from boxes and upright cylinders, its arm
// reaching out to hold the portafilter handle while it holds a milk pitcher in the other hand.
// Coffee runs from the spouts into the cup; the robot's head bobs on its neck and its eyes blink.
//
//   node build.mjs          light → espresso-tile.svg, espresso-tile.html
//   node build.mjs --dark   dark  → espresso-tile-dark.svg, espresso-tile-dark.html

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const dark = process.argv.includes("--dark");
const PAPER = dark ? "#121212" : "#fbfaf8";
const BRAND = "#e5484d";

const W = 640;
const H = 480;
const REGION = { x: 0, y: 0, w: W, h: H };

// ---------- world ----------
const CASE = { x: -100, y: -50, w: 88, d: 65, r: 5 };      // x -100..-12, y -50..15
const DECK = { x: -103, y: -53, w: 94, d: 94, r: 6 };      // y -53..41
const FOOT_H = 3;
const DECK_Z = FOOT_H;
const DECK_TOP = DECK_Z + 5;
const CASE_TOP = 86;
const TOP = CASE_TOP + 1.5;                                 // top plate surface
const FRONT_Y = CASE.y + CASE.d;                            // 15

const ROBOT = { x: 3, y: 11, w: 30, d: 30, r: 6 };          // robot base plan
const RC = [18, 26];
const SHIFT = 12;                                           // the robot stands this far along +x                                        // robot axis

const P = a.fitInto(
  [
    ...k.boxCorners(DECK, 0, CASE_TOP),
    [-83, -30, 98], [-66, -12, 98],
    ...k.boxCorners({ ...ROBOT, x: ROBOT.x + SHIFT }, 0, 72),
    [14 + SHIFT, 22, 86],
    [38 + SHIFT, 48, 20],
  ],
  REGION,
  { pad: 34, azimuth: 56 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (items, key = (i) => i) => [...items].sort((p, q) => depth(key(p)) - depth(key(q)));
const brand = (svg) => `<g class="ac-brand">${svg}</g>`;
const led = (svg) => `<g class="ac-led">${svg}</g>`;
const ebony = (svg) => `<g class="ac-ebony">${svg}</g>`;
const coffee = (svg) => `<g class="ac-coffee">${svg}</g>`;
const chrome = (svg) => `<g class="ac-chrome">${svg}</g>`;
const halo = (plan, z, blur) => `<path class="iso-halo" d="${k.haloOf(plan, z, 0.1, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ""}/>`;

// Closed outlines in a vertical face plane, for slots, panels and windows.
// face "y": the plane y = c, u along x.  face "x": the plane x = c, u along y.
function faceRect(face, c, u0, u1, z0, z1, r = 0, steps = 4) {
  const ring = k.roundedPlan({ x: u0, y: z0, w: u1 - u0, d: z1 - z0, r }, steps);
  return k.pathOf(ring.map(([u, v]) => at(face === "y" ? [u, c, v] : [c, u, v])), true);
}
const facePt = (face, c, u, z) => at(face === "y" ? [u, c, z] : [c, u, z]);
const faceLine = (face, c, u0, u1, z) => k.pathOf([facePt(face, c, u0, z), facePt(face, c, u1, z)]);

// A knurled knob standing on a surface, with a pointer that starts on a hub dot.
function knob(cx, cy, r, z, h, turn, wrap = ebony) {
  return wrap([
    S(k.cylinder(cx, cy, r + 0.8, z, 1, P, 28), { tone: "mid" }),
    S(k.cylinder(cx, cy, r, z + 1, h, P, 28, 0.4), { tone: "hi" }),
    L(k.knurl(cx, cy, r, z + 1, z + 1 + h - 1, 22, P), { tone: "lo" }),
    L(k.sideArc(cx, cy, r, z + h, P, 24), { tone: "faint" }),
    L(k.lineOnTop([cx, cy], [cx + Math.sin(turn) * (r - 1), cy - Math.cos(turn) * (r - 1)], z + 1 + h, P), { tone: "hi" }),
    D([at([cx, cy, z + 1 + h])], { size: 0.5, tone: "hi" }),
  ].join(""));
}

// ---------- machine: feet, deck, case ----------
function machineBase() {
  const out = [halo(k.insetPlan(DECK, -5), 0)];
  for (const [x, y] of byDepth(k.corners(DECK, 9))) {
    out.push(ebony(S(k.cylinder(x, y, 5, 0, 1.2, P, 24), { tone: "lo" }) + S(k.cylinder(x, y, 3.8, 1.2, FOOT_H - 1.2, P, 24), { tone: "mid" })));
  }
  const deck = S(k.slabOf(DECK, DECK_Z, DECK_TOP - DECK_Z, P, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(DECK, DECK_Z + 2, P, 6), { tone: "faint" }) });
  out.push(chrome(deck));
  return out.join("");
}

function caseBody() {
  const out = [];
  const seams = L(k.sideSeam(CASE, 14, P, 5), { tone: "faint" }) + L(k.sideSeam(CASE, 80, P, 5), { tone: "faint" });
  out.push(S(k.slabOf(CASE, DECK_TOP, CASE_TOP - DECK_TOP, P, 5, 1.2), { tone: "mid", inner: seams }));
  // side face (x = -12): an inset panel with a block of vent slots and four screws
  const sx = CASE.x + CASE.w;
  out.push(L(faceRect("x", sx, -45, 9, 18, 76, 2), { tone: "faint" }));
  const slots = [];
  for (let i = 0; i < 9; i++) slots.push(faceRect("x", sx, -40 + i * 4.2, -38.4 + i * 4.2, 58, 72, 0.8, 3));
  out.push(L(slots.join(""), { tone: "lo" }));
  const screws = [[-42, 21], [6, 21], [-42, 73], [6, 73]];
  out.push(L(screws.map(([u, z]) => k.sideRing([sx, u, z], 1.1, "x", P, 12)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([u, z]) => facePt("x", sx, u, z)), { size: 0.45 }));
  // front face (y = 15): an inset panel line round the lower front
  out.push(L(faceRect("y", FRONT_Y, -96, -16, 18, 50, 2), { tone: "faint" }));
  return brand(out.join(""));
}

function frontFittings() {
  const out = [];
  // name plate above the group head: printed rule lines stand for the maker's name
  const plate = { x: -72, y: FRONT_Y, w: 34, d: 0.8, r: 0.4 };
  out.push(chrome(S(k.slabOf(plate, 74, 4.6, P, 2), { tone: "mid", crease: "none" })));
  const py = FRONT_Y + 0.8;
  out.push(L(faceLine("y", py, -67, -50, 77.2) + faceLine("y", py, -67, -56, 75.6), { tone: "lo", free: true }));
  out.push(D([facePt("y", py, -70, 76.3), facePt("y", py, -40, 76.3)], { size: 0.4 }));
  // button bezel with three buttons and a power LED
  const bezel = { x: -40, y: FRONT_Y, w: 26, d: 1, r: 0.6 };
  out.push(chrome(S(k.slabOf(bezel, 60, 12, P, 2), { tone: "mid", crease: "none" })));
  const by = FRONT_Y + 1;
  out.push(L(faceRect("y", by, -38.6, -15.4, 61.4, 70.6, 1.2), { tone: "faint" }));
  for (const x of [-37, -29.5, -22]) {
    out.push(ebony(S(k.slabOf({ x, y: by, w: 5.5, d: 1.6, r: 0.8 }, 62.6, 5, P, 3, 0.3), { tone: "hi" })));
  }
  out.push(a.amPulse(led(D([facePt("y", by, -16.7, 69.6)], { size: 0.9, tone: "lit" })), { period: 3600, min: 0.45 }));
  return out.join("");
}

// ---------- top: plate, tank lid, rail, cups, gauge, knobs ----------
const RAIL = { x0: -95, x1: -52, y0: -45, y1: 3, z0: TOP, z1: TOP + 6 };

function cupUpsideDown(cx, cy, z, saucer) {
  const out = [];
  if (saucer) {
    out.push(S(k.cylinder(cx, cy, 7.4, z, 1.1, P, 40, 0.4), { tone: "hi" }));
    out.push(L(k.ring(cx, cy, 5.6, z + 1.1, P, 36), { tone: "faint" }));
    z += 1.1;
  }
  out.push(S(k.cylinder(cx, cy, 5.4, z, 8, P, 40, 0.5), { tone: "hi", inner: L(k.sideArc(cx, cy, 5.4, z + 1.2, P, 24), { tone: "faint" }) }));
  out.push(S(k.slabOf({ x: cx + 4.6, y: cy - 1, w: 3.4, d: 2, r: 0.8 }, z + 1.5, 6, P, 3), { tone: "hi" }));
  out.push(S(k.cylinder(cx, cy, 3.4, z + 8, 1.1, P, 32, 0.3), { tone: "hi" }));
  out.push(L(k.ring(cx, cy, 2.2, z + 9.1, P, 24), { tone: "faint" }));
  return out.join("");
}

function railPost(x, y) {
  return chrome(S(k.cylinder(x, y, 1.3, RAIL.z0, RAIL.z1 - RAIL.z0 + 0.6, P, 16), { tone: "mid" }) + S(k.cylinder(x, y, 1.7, RAIL.z0, 0.8, P, 16), { tone: "lo" }));
}
function railBar(plan) {
  return chrome(S(k.slabOf(plan, RAIL.z1 - 1.6, 1.6, P, 2), { tone: "mid", crease: "none" }));
}

function gauge(cx, cy) {
  const R = 10.5;
  const z = TOP + 2.2;
  const top = z + 6;
  const out = [];
  out.push(chrome(S(k.cylinder(cx, cy, 6.5, TOP, 2.2, P, 32), { tone: "lo" })));
  const puck = [
    S(k.cylinder(cx, cy, R, z, 6, P, 64, 0.6), { tone: "mid", crease: "lo" }),
    L(k.knurl(cx, cy, R, z, top - 2.6, 70, P, 0.3), { tone: "lo" }),
    L(k.sideArc(cx, cy, R, top - 2.6, P, 40), { tone: "faint" }),
    L(k.ring(cx, cy, R - 1.8, top, P, 64), { tone: "lo" }),
  ].join("");
  out.push(chrome(puck));
  // crown on the +x side
  out.push(chrome(S(k.slabOf({ x: cx + R - 0.4, y: cy - 1.4, w: 2.6, d: 2.8, r: 0.6 }, z + 1.8, 2.4, P, 2), { tone: "mid" })));
  const t = k.radialTicks(cx, cy, R - 1.8, 40, 5, top, [1.1, 2.3], P, -2.4, 4.8);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  // the brewing band, printed in brand ink, between two major ticks
  const band = [];
  for (let i = 0; i <= 16; i++) {
    const th = -2.4 + 4.8 * (25 / 40) + (i / 16) * 4.8 * (10 / 40);
    band.push([cx + Math.sin(th) * (R - 2.6), cy - Math.cos(th) * (R - 2.6)]);
  }
  out.push(led(L(k.onTop(band, top, P), { tone: "mid" })));
  const turn = -2.4 + 4.8 * 0.72;
  // the needle, drawn flat in the dial's own plane and swung about the hub as pressure builds
  const tip = [Math.sin(turn) * (R - 3.4), -Math.cos(turn) * (R - 3.4)].map((v) => +v.toFixed(3));
  const needle = led(L(`M0 0L${tip[0]} ${tip[1]}`, { tone: "hi", free: "end" }));
  out.push(a.amSwing(needle, a.topPlane([cx, cy, top + 0.1], P), { from: -22, to: 9, period: 3400, delay: 600 }));
  out.push(L(k.ring(cx, cy, 1.3, top + 0.1, P, 16), { tone: "lo" }));
  out.push(D([at([cx, cy, top + 0.1])], { size: 0.7, tone: "hi" }));
  return out.join("");
}

function topDeck() {
  const out = [];
  const plate = k.insetPlan(CASE, 2);
  out.push(chrome(S(k.slabOf(plate, CASE_TOP, 1.5, P, 5, 0.6), { tone: "mid" })));
  out.push(L(k.planOutline(k.insetPlan(plate, 2.4), TOP, P, 4), { tone: "faint" }));
  // water tank lid with a pull tab
  const lid = { x: -44, y: -46, w: 28, d: 14, r: 3 };
  out.push(chrome(S(k.slabOf(lid, TOP, 1.4, P, 4, 0.4), { tone: "mid" })));
  out.push(chrome(S(k.slabOf({ x: -34, y: -39.5, w: 8, d: 3, r: 1.2 }, TOP + 1.4, 1.6, P, 3, 0.3), { tone: "hi" })));
  out.push(D([at([-41, -43, TOP + 1.4]), at([-19, -43, TOP + 1.4])], { size: 0.4 }));
  // the rail: far bars and posts, the cups, then the near bars and posts
  out.push(railBar({ x: RAIL.x0, y: RAIL.y0 - 0.8, w: RAIL.x1 - RAIL.x0, d: 1.6, r: 0.8 }));
  out.push(railBar({ x: RAIL.x0 - 0.8, y: RAIL.y0, w: 1.6, d: RAIL.y1 - RAIL.y0, r: 0.8 }));
  out.push(railPost(RAIL.x0, RAIL.y0), railPost(RAIL.x1, RAIL.y0));
  out.push(cupUpsideDown(-84, -32, TOP, true));
  out.push(cupUpsideDown(-67, -13, TOP, false));
  out.push(railBar({ x: RAIL.x1 - 0.8, y: RAIL.y0, w: 1.6, d: RAIL.y1 - RAIL.y0, r: 0.8 }));
  out.push(railPost(RAIL.x0, RAIL.y1));
  out.push(railBar({ x: RAIL.x0, y: RAIL.y1 - 0.8, w: RAIL.x1 - RAIL.x0, d: 1.6, r: 0.8 }));
  out.push(railPost(RAIL.x1, RAIL.y1));
  out.push(gauge(-30, -16));
  out.push(knob(-88, 9, 3.6, TOP, 4, -0.8));
  out.push(knob(-21, 8, 3.6, TOP, 4, 0.9));
  return out.join("");
}

// ---------- drip tray, cup, steam wand ----------
const CUP = [-55, 24];
const CUP_Z = DECK_TOP + 5.6 + 1.6;                         // on the saucer
const CUP_TOP = CUP_Z + 12.6;
const SPOUT_Z = 37.5;

function dripTray() {
  const out = [];
  const tray = { x: -88, y: FRONT_Y, w: 62, d: 23, r: 3 };
  out.push(chrome(S(k.slabOf(tray, DECK_TOP, 5, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(tray, DECK_TOP + 1.6, P, 4), { tone: "faint" }) })));
  const grille = k.insetPlan(tray, 1.6);
  out.push(chrome(S(k.slabOf(grille, DECK_TOP + 5, 0.6, P, 3), { tone: "lo", crease: "none" })));
  const gz = DECK_TOP + 5.6;
  const slots = [];
  for (let i = 0; i < 12; i++) slots.push(k.planOutline({ x: -84 + i * 4.7, y: FRONT_Y + 4, w: 2.2, d: 14, r: 1.1 }, gz, P, 3));
  out.push(L(slots.join(""), { tone: "lo" }));
  return out.join("");
}

function cup() {
  const [cx, cy] = CUP;
  const out = [];
  out.push(S(k.cylinder(cx, cy, 9.5, DECK_TOP + 5.6, 1.6, P, 48, 0.5), { tone: "hi" }));
  out.push(L(k.ring(cx, cy, 7.6, CUP_Z, P, 40), { tone: "faint" }));
  const body = S(k.cylinder(cx, cy, 6.8, CUP_Z, CUP_TOP - CUP_Z, P, 48, 0.6), { tone: "hi", lit: true, inner: L(k.sideArc(cx, cy, 6.8, CUP_Z + 1.4, P, 32), { tone: "faint" }) });
  out.push(body);
  out.push(S(k.slabOf({ x: cx + 5.8, y: cy - 1, w: 4, d: 2, r: 0.9 }, CUP_Z + 3, 7.5, P, 3), { tone: "hi" }));
  out.push(coffee(S(k.cylinder(cx, cy, 5.8, CUP_TOP, 0.01, P, 40), { tone: "lo", crease: "none", flat: false })));
  out.push(coffee(L(k.ring(cx, cy, 4.2, CUP_TOP, P, 32), { tone: "faint" })));
  return out.join("");
}

function stream() {
  const out = [];
  for (const x of [-57, -53]) out.push(S(k.cylinder(x, 24, 0.45, CUP_TOP, SPOUT_Z - CUP_TOP, P, 8), { tone: "mid", crease: "none" }));
  return a.amPulse(coffee(out.join("")), { period: 2800, min: 0.55 });
}

// Steam: three soft wisps rising off the cup and drifting out past the portafilter. Each is
// a line that fades in at both ends; a scoped keyframe lifts and fades it (et-steam).
function steam() {
  const [cx, cy] = CUP;
  const out = [];
  for (const [i, ox] of [-3.4, 0.2, 3.6].entries()) {
    const pts = [];
    for (let s = 0; s <= 1.0001; s += 1 / 24) {
      pts.push(at([cx + ox + Math.sin(s * 5.2 + i * 1.9) * 1.5, cy + 3 + s * 11, CUP_TOP + 1.5 + s * 17]));
    }
    out.push(`<g class="et-steam" style="animation-delay:${(-i * 1.25).toFixed(2)}s">${k.fadeLineSvg(pts, { fade: [7, 12], tone: "mid" })}</g>`);
  }
  return out.join("");
}

// A bean canister on the deck: a jar with a lid, a knob and a label band.
function canister() {
  const [cx, cy] = [-17, 30];
  return [
    S(k.cylinder(cx, cy, 5.2, DECK_TOP, 12, P, 40, 0.5), { tone: "hi", inner: L(k.sideArc(cx, cy, 5.2, DECK_TOP + 3, P, 24), { tone: "faint" }) + L(k.sideArc(cx, cy, 5.2, DECK_TOP + 8, P, 24), { tone: "faint" }) }),
    brand(S(k.cylinder(cx, cy, 5.6, DECK_TOP + 12, 2.2, P, 40, 0.4), { tone: "hi" })),
    chrome(S(k.cylinder(cx, cy, 1.6, DECK_TOP + 14.2, 1.8, P, 16, 0.3), { tone: "mid" })),
  ].join("");
}

function steamWand() {
  const out = [];
  const x = -91;
  const y = 19;
  out.push(chrome(S(k.slabOf({ x: -95, y: FRONT_Y, w: 8, d: 6.5, r: 1.5 }, 60, 7, P, 3, 0.4), { tone: "mid" })));
  out.push(chrome(S(k.cylinder(x, y, 2.4, 56, 4, P, 20), { tone: "mid" })));
  out.push(chrome(S(k.cylinder(x, y, 1.3, 33, 23, P, 16), { tone: "hi", inner: L(k.sideArc(x, y, 1.3, 50, P, 10), { tone: "faint" }) })));
  out.push(chrome(S(k.cylinder(x, y, 1.8, 30, 3, P, 16), { tone: "mid" })));
  return out.join("");
}

// ---------- group head and portafilter ----------
function groupHead() {
  const out = [];
  const block = { x: -66, y: FRONT_Y, w: 22, d: 14, r: 2.5 };
  out.push(chrome(S(k.slabOf(block, 60, 12, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(block, 63, P, 4), { tone: "faint" }) })));
  out.push(D([facePt("y", FRONT_Y + 14, -61, 67.5), facePt("y", FRONT_Y + 14, -49, 67.5)], { size: 0.45 }));
  const [cx, cy] = [-55, 24];
  out.push(chrome(S(k.cylinder(cx, cy, 7.8, 55, 5, P, 40, 0.4), { tone: "mid", inner: L(k.sideArc(cx, cy, 7.8, 57.5, P, 24), { tone: "faint" }) })));
  out.push(chrome(S(k.cylinder(cx, cy, 6.6, 52, 3, P, 40), { tone: "lo" })));
  // portafilter: ears, basket, spout block and two spouts
  out.push(chrome(S(k.slabOf({ x: -66, y: 22.5, w: 4, d: 3, r: 0.8 }, 49.5, 2.5, P, 2), { tone: "mid" })));
  out.push(chrome(S(k.cylinder(cx, cy, 8.6, 45, 7, P, 48, 0.6), { tone: "hi", inner: L(k.sideArc(cx, cy, 8.6, 50, P, 28), { tone: "faint" }) })));
  out.push(chrome(S(k.slabOf({ x: -58.5, y: 20.5, w: 7, d: 7, r: 1.6 }, 41, 4, P, 3), { tone: "mid" })));
  for (const x of [-57, -53]) out.push(chrome(S(k.cylinder(x, 24, 1.1, SPOUT_Z, 41 - SPOUT_Z, P, 12), { tone: "mid" })));
  return out.join("");
}

// The handle runs +x from the basket; the robot's gripper closes round its grip.
const GRIP = { x: -40, y: 21.5, w: 12.5, d: 5, r: 2.2 };   // x -40..-27.5
const GRIP_Z = [45.5, 50];

function handle() {
  const out = [];
  out.push(chrome(S(k.slabOf({ x: -47.5, y: 22, w: 9, d: 4, r: 1 }, 46.2, 3.2, P, 2, 0.3), { tone: "hi" })));
  out.push(ebony(S(k.slabOf(GRIP, GRIP_Z[0], GRIP_Z[1] - GRIP_Z[0], P, 4, 0.5), { tone: "hi", inner: L(k.sideSeam(GRIP, 47.75, P, 4), { tone: "faint" }) })));
  return out.join("");
}

// ---------- robot ----------
const torso = { x: 5, y: 14, w: 26, d: 24, r: 4 };         // x 5..31, y 14..38
const T0 = 20;
const T1 = 48;

function finger(y) {
  return S(k.slabOf({ x: -35.5, y, w: 8.5, d: 2.2, r: 0.9 }, 44.4, 6.8, P, 2, 0.3), { tone: "hi" });
}

function leftArmFar() { return finger(19); }

function leftArmNear() {
  const out = [];
  // palm: a block standing at the end of the grip
  out.push(S(k.slabOf({ x: -28, y: 18.8, w: 4.5, d: 10.4, r: 1.2 }, 43.4, 8.2, P, 3, 0.4), { tone: "hi" }));
  out.push(finger(26.8));
  out.push(D([at([-25.75, 21, 51.6]), at([-25.75, 26.6, 51.6])], { size: 0.4 }));
  out.push(S(k.cylinder(-22.5, 24, 2.6, 41.5, 5, P, 20), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -22, y: 22, w: 12, d: 4, r: 1.2 }, 42, 4, P, 2, 0.4), { tone: "hi" }));
  out.push(S(k.cylinder(-10, 24, 3.4, 40.5, 7, P, 24, 0.4), { tone: "mid", inner: L(k.sideArc(-10, 24, 3.4, 44, P, 16), { tone: "faint" }) }));
  out.push(D([at([-10, 24, 47.5])], { size: 0.5 }));
  out.push(S(k.slabOf({ x: -8, y: 21.6, w: 12, d: 4.8, r: 1.2 }, 41.6, 3.8, P, 3, 0.3), { tone: "hi" }));
  out.push(S(k.slabOf({ x: 3, y: 20.4, w: 3, d: 7.2, r: 1 }, 40.4, 6.2, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 6, y: 21, w: SHIFT - 3, d: 6, r: 1.5 }, 41, 5, P, 3, 0.4), { tone: "hi" }));
  out.push(S(k.slabOf({ x: 1.5 + SHIFT, y: 19, w: 4, d: 10, r: 1.5 }, 38.5, 9, P, 3, 0.4), { tone: "mid" }));
  return out.join("");
}

function robotBase() {
  const out = [halo(k.insetPlan(ROBOT, -4), 0)];
  for (const [x, y] of byDepth(k.corners(ROBOT, 6))) {
    out.push(ebony(S(k.cylinder(x, y, 4, 0, 1.2, P, 24), { tone: "lo" }) + S(k.cylinder(x, y, 3, 1.2, 2.3, P, 24), { tone: "mid" })));
  }
  out.push(S(k.slabOf(ROBOT, 3.5, 7.5, P, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(ROBOT, 6, P, 6), { tone: "faint" }) }));
  out.push(D(k.corners(ROBOT, 3.5).map(([x, y]) => at([x, y, 11])), { size: 0.45 }));
  out.push(L(k.corners(ROBOT, 3.5).map(([x, y]) => k.ring(x, y, 1.4, 11, P, 12)).join(""), { tone: "lo" }));
  const [cx, cy] = RC;
  out.push(S(k.cylinder(cx, cy, 11, 11, 2.5, P, 56, 0.4), { tone: "lo" }));
  const t = k.radialTicks(cx, cy, 11, 48, 6, 13.5, [1, 2], P);
  out.push(L(t.minor, { tone: "faint" }), L(t.major, { tone: "lo" }));
  out.push(S(k.cylinder(cx, cy, 7, 13.5, T0 - 13.5, P, 40), { tone: "mid", inner: L(k.sideArc(cx, cy, 7, 16.8, P, 24), { tone: "faint" }) }));
  return out.join("");
}

function robotTorso() {
  const out = [];
  const seams = L(k.sideSeam(torso, 24, P, 4), { tone: "faint" }) + L(k.sideSeam(torso, 44, P, 4), { tone: "faint" });
  out.push(S(k.slabOf(torso, T0, T1 - T0, P, 4, 1), { tone: "hi", inner: seams }));
  out.push(L(k.planOutline(k.insetPlan(torso, 2.6), T1, P, 3), { tone: "faint" }));
  // side vents (x = 31), behind the right arm
  const sx = torso.x + torso.w;
  out.push(L([31.2, 33.6, 36].map((u) => faceRect("x", sx, u - 0.7, u + 0.7, 29.5, 41.5, 0.7, 3)).join(""), { tone: "lo" }));
  // chest panel on the front (y = 38)
  const fy = torso.y + torso.d;
  const panel = { x: 9, y: fy, w: 18, d: 1, r: 0.6 };
  out.push(S(k.slabOf(panel, 25, 16.5, P, 2), { tone: "mid", crease: "none" }));
  const py = fy + 1;
  out.push(D([[10.4, 26.4], [25.6, 26.4], [10.4, 40.1], [25.6, 40.1]].map(([u, z]) => facePt("y", py, u, z)), { size: 0.45 }));
  // a level meter window with four cells, the last one lit
  out.push(L(faceRect("y", py, 12, 24, 33.5, 38.5, 1), { tone: "lo" }));
  out.push(L([0, 1, 2].map((i) => faceRect("y", py, 13.2 + i * 2.7, 15.2 + i * 2.7, 34.7, 37.3, 0.4, 2)).join(""), { tone: "lo" }));
  out.push(led(L(faceRect("y", py, 21.3, 22.8, 34.7, 37.3, 0.4, 2), { tone: "mid" })));
  // three buttons, the middle one brand red
  for (const [i, x] of [11.6, 16.3, 21].entries()) {
    const b = S(k.slabOf({ x, y: py, w: 3.4, d: 1.4, r: 0.6 }, 27.5, 3.2, P, 2, 0.3), { tone: "hi" });
    out.push(i === 1 ? brand(b) : ebony(b));
  }
  return out.join("");
}

function robotRightArm() {
  const out = [];
  out.push(S(k.slabOf({ x: 30.5, y: 19, w: 4, d: 10, r: 1.5 }, 38.5, 9, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 31.5, y: 21, w: 5, d: 6, r: 1.5 }, 29, 10, P, 3, 0.4), { tone: "hi" }));
  out.push(S(k.slabOf({ x: 31, y: 20.5, w: 6, d: 7, r: 2 }, 24.5, 5, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([37, 24, 27])], { size: 0.45 }));
  out.push(S(k.slabOf({ x: 31.5, y: 27.5, w: 5, d: 10, r: 1.4 }, 25, 4, P, 2, 0.4), { tone: "hi" }));
  out.push(S(k.slabOf({ x: 28.2, y: 37.5, w: 11.6, d: 2.6, r: 0.9 }, 23.5, 7, P, 2, 0.3), { tone: "mid" }));
  return out.join("");
}

// A milk pitcher held in the right hand: fingers either side, a pour spout at the front.
const JUG = [34, 44.5];
function pitcher() {
  const [cx, cy] = JUG;
  const out = [];
  out.push(S(k.slabOf({ x: 28.2, y: 40.1, w: 1.6, d: 6.4, r: 0.6 }, 24, 4.6, P, 2, 0.3), { tone: "hi" }));
  const jug = [
    S(k.cylinder(cx, cy, 4.2, 19, 13, P, 40, 0.5), { tone: "hi", inner: L(k.sideArc(cx, cy, 4.2, 20.6, P, 24), { tone: "faint" }) + L(k.sideArc(cx, cy, 4.2, 30, P, 24), { tone: "faint" }) }),
    L(k.ring(cx, cy, 3.4, 32, P, 32), { tone: "lo" }),
    S(k.slabOf({ x: cx - 1, y: cy + 3.6, w: 2, d: 2.6, r: 0.8 }, 30, 2.2, P, 2), { tone: "hi" }),
  ].join("");
  out.push(chrome(jug));
  out.push(S(k.slabOf({ x: 38.2, y: 40.1, w: 1.6, d: 6.4, r: 0.6 }, 24, 4.6, P, 2, 0.3), { tone: "hi" }));
  return out.join("");
}

function robotHead() {
  const [cx, cy] = RC;
  const neck = [
    S(k.cylinder(cx, cy, 6.2, T1, 1.8, P, 32, 0.3), { tone: "lo" }),
    S(k.cylinder(cx, cy, 3.6, T1 + 1.8, 8.2, P, 24), { tone: "mid", inner: L(k.sideArc(cx, cy, 3.6, T1 + 4.4, P, 16), { tone: "faint" }) }),
  ].join("");
  const head = { x: 7, y: 16, w: 22, d: 20, r: 5 };
  const H0 = 55;
  const H1 = 71;
  const out = [];
  out.push(S(k.slabOf(head, H0, H1 - H0, P, 5, 1), { tone: "hi", inner: L(k.sideSeam(head, H0 + 2.5, P, 5), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(head, 2.4), H1, P, 4), { tone: "faint" }));
  // ear on the +x side
  out.push(S(k.slabOf({ x: 29, y: 21.5, w: 2.4, d: 9, r: 1 }, 59, 8, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 31.4, y: 24, w: 1.6, d: 4, r: 0.6 }, 61, 4, P, 2), { tone: "lo" }));
  // visor with two eye LEDs
  const fy = head.y + head.d;
  const visor = { x: 9.5, y: fy, w: 17, d: 1.6, r: 0.8 };
  out.push(ebony(S(k.slabOf(visor, 58.5, 9, P, 3, 0.3), { tone: "hi" })));
  const vy = fy + 1.6;
  const eyes = [[13.6, 63], [22.4, 63]];
  out.push(ebony(L(eyes.map(([u, z]) => k.sideRing([u, vy, z], 2.4, "y", P, 24)).join(""), { tone: "mid" })));
  out.push(`<g class="et-eyes">${led(D(eyes.map(([u, z]) => facePt("y", vy, u, z)), { size: 1.8, tone: "hi" }))}</g>`);
  // mouth grille: a row of dots under the visor
  out.push(D([14, 16, 18, 20, 22].map((u) => facePt("y", fy, u, 56.8)), { size: 0.4, tone: "lo" }));
  // antenna
  out.push(S(k.cylinder(13, 21, 2, H1, 1.4, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(13, 21, 0.7, H1 + 1.4, 7.6, P, 12), { tone: "mid" }));
  out.push(brand(S(k.cylinder(13, 21, 1.9, H1 + 9, 3, P, 20, 0.4), { tone: "hi" })));
  out.push(D([at([24, 31.5, H1])], { size: 0.45 }), D([at([24, 20.5, H1])], { size: 0.45 }));
  return neck + a.amFloat(out.join(""), P, { rise: 2.2, period: 5200 });
}

// ---------- assemble ----------
const body = [
  machineBase(),
  caseBody(),
  frontFittings(),
  topDeck(),
  steamWand(),
  dripTray(),
  canister(),
  cup(),
  stream(),
  groupHead(),
  leftArmFar(),
  handle(),
  steam(),
  leftArmNear(),
  `<g transform="${k.translateAlong(P, [SHIFT, 0, 0])}">`,
  robotBase(),
  robotTorso(),
  robotRightArm(),
  pitcher(),
  robotHead(),
  "</g>",
].join("");

const name = dark ? "espresso-tile-dark" : "espresso-tile";
const css = `
@keyframes et-blink{0%,88%,100%{opacity:1}91%,95%{opacity:.12}}
#${name} .et-eyes{animation:et-blink 4.6s linear -1.2s infinite}
@keyframes et-steam{0%{opacity:0;transform:translate(0,3px)}35%{opacity:.85}100%{opacity:0;transform:translate(0,-9px)}}
#${name} .et-steam{opacity:0;animation:et-steam 3.75s cubic-bezier(.3,0,.5,1) infinite}
@media (prefers-reduced-motion:reduce){#${name} .et-eyes{animation:none}#${name} .et-steam{animation:none;opacity:.55}}
`;
const svg = a.assetSvg({
  width: W,
  height: H,
  label: "An isometric red espresso machine pulling a shot into a cup, with a tiny robot barista holding the portafilter handle in one hand and a milk pitcher in the other.",
  body,
  paper: PAPER,
  accents: {
    brand: BRAND,
    led: { hex: BRAND, mode: "ink" },
    ebony: dark ? "#08080a" : "#3a3a3f",
    coffee: dark ? "#3a2418" : "#5a3a28",
    chrome: dark ? "#3c3f44" : "#d9dbde",
  },
  weight: 0.65,
  css,
  id: name,
});
writeFileSync(join(HERE, `${name}.svg`), svg);
writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W }));
console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB) and ${name}.html`);
