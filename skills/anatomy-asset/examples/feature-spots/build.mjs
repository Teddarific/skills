// Three matching spot illustrations for a features row on a dark developer-tools site:
// "Fast" (a stopwatch lying face-up in a cradle, its start crown pressing), "Secure" (a
// safe-deposit box with its drawer slid half out and a key hovering at the lock) and "Works
// offline" (a square battery lantern with a charge window, the top cell charging).
//
// One camera, one world scale, one tray, one part vocabulary, one violet accent family: each
// spot is fitted at the scale that fits the tallest of the three, then centred on its canvas.
//
//   node build.mjs            dark   → fast.svg, secure.svg, offline.svg (+ .html), feature-spots.html
//   node build.mjs --light    light  → fast-light.svg, … , feature-spots-light.html

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const light = process.argv.includes("--light");
const PAPER = light ? "#f6f7f9" : "#0b0d12";
const VIOLET = "#7c5cff";
const SUFFIX = light ? "-light" : "";

const W = 320;
const H = 320;
const PAD = 20;
const AZIMUTH = 55;
const ELEVATION = 35;
const SCREW = 0.6;

// ---------- the shared world ----------
const TRAY = { x: -44, y: -44, w: 88, d: 88, r: 6 };
const TRAY_Z = -6;          // tray slab from -6 to 0; feet below to -10
const FOOT_Z = -10;
const LABEL = { x: -39, y: 33, w: 22, d: 6.6, r: 1 };

// The projection is set per spot (same scale and camera, own centre).
let P = null;
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (items, key = (i) => i) => [...items].sort((p, q) => depth(key(p)) - depth(key(q)));
const brand = (svg) => `<g class="ac-brand">${svg}</g>`;
const rubber = (svg) => `<g class="ac-rubber">${svg}</g>`;
const halo = (plan, z, blur = 5) => `<path class="iso-halo" d="${k.haloOf(plan, z, 0.1, P)}" style="filter:blur(${blur}px)"/>`;
const screws = (pts, z, ring = 1.4) =>
  L(pts.map(([x, y]) => k.ring(x, y, ring, z, P, 16)).join(""), { tone: "lo" }) + D(pts.map(([x, y]) => at([x, y, z])), { size: SCREW });
// A closed outline on a vertical face: y = const (front) or x = const (side).
const faceY = (y, x0, x1, z0, z1) => k.pathOf([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]].map(at), true);
const faceX = (x, y0, y1, z0, z1) => k.pathOf([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]].map(at), true);

// A flat part drawn in a plane's own coordinates (commas keep the minifier off it), filled
// and edged with the kit's tones, for parts that turn with amSpin.
const flatPath = (pts) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`;
const flatStyle = (fill, edge) => `fill:var(--anatomy-${fill});stroke:var(--anatomy-${edge});stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke;stroke-linejoin:round`;
// A hand with real thickness: a shade copy under a lit copy, both turning in step about c.
function spinningHand(c, z, pts, { thick = 0.5, period, delay = 0, fill = "top", edge = "hi" }) {
  const local = pts.map(([x, y]) => [x - c[0], y - c[1]]);
  const d = flatPath(local);
  const opts = { period, delay };
  return a.amSpin(`<path d="${d}" style="${flatStyle("shade-0", "mid")}"/>`, a.topPlane([c[0], c[1], z], P), opts) +
    a.amSpin(`<path d="${d}" style="${flatStyle(fill, edge)}"/>`, a.topPlane([c[0], c[1], z + thick], P), opts);
}

// ---------- shared parts: tray on rubber feet, label plate ----------
function tray() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(TRAY, -3), FOOT_Z, 4, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(TRAY, 12))) {
    out.push(rubber(S(k.cylinder(x, y, 5, FOOT_Z, 1.2, P, 18), { tone: "lo" })));
    out.push(S(k.cylinder(x, y, 3.8, FOOT_Z + 1.2, TRAY_Z - FOOT_Z - 1.2, P, 16), { tone: "mid" }));
  }
  out.push(S(k.slabOf(TRAY, TRAY_Z, -TRAY_Z, P, 5, 1.2), { tone: "mid", inner: L(k.sideSeam(TRAY, TRAY_Z + 1.6, P, 5), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(TRAY, 4), 0, P, 4), { tone: "faint" }));
  out.push(screws(k.corners(TRAY, 8), 0));
  return out.join("");
}

function labelPlate() {
  const z = 0.8;
  const out = [S(k.slabOf(LABEL, 0, z, P, 3), { tone: "lo", crease: "none" })];
  out.push(L(k.planOutline(k.insetPlan(LABEL, 1.4), z, P, 3), { tone: "faint" }));
  out.push(L([[5.5, 11], [5.5, 7]].map(([dx, len], i) => k.lineOnTop([LABEL.x + dx, LABEL.y + 2.5 + i * 1.8], [LABEL.x + dx + len, LABEL.y + 2.5 + i * 1.8], z, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([LABEL.x + 3, LABEL.y + LABEL.d / 2, z]), at([LABEL.x + LABEL.w - 3, LABEL.y + LABEL.d / 2, z])], { size: SCREW }));
  return out.join("");
}

const base = () => tray() + labelPlate();
const trayPoints = () => [...k.boxCorners(k.insetPlan(TRAY, -3), FOOT_Z, 0), ...k.boxCorners(LABEL, 0, 1)];

// ======================================================================================
// FAST: a stopwatch lying face-up in a cradle. Its 12 o'clock points away from the viewer,
// so the crown and bow sit at the top of the picture; the crown (violet) presses gently.
// ======================================================================================
const SW = { x: 4, y: -2 };
const CASE_R = 30;
const RISE = 7;                 // the round riser drum the watch sits on
const Z_CRADLE = 4;
const Z_SEAT = Z_CRADLE + RISE;
const Z_BACK = Z_SEAT + 2;
const Z_BEZ = Z_BACK + 6;
const Z_DIAL = Z_BEZ + 3;

const clock = () => {
  const { sinA, cosA } = k.cameraOf(P);
  const u = [-cosA, -sinA];                // 12 o'clock: away from the viewer, up on screen
  const r = [sinA, -cosA];                 // 3 o'clock: screen right
  const dir = (deg) => {
    const t = (deg * Math.PI) / 180;
    return [Math.cos(t) * u[0] + Math.sin(t) * r[0], Math.cos(t) * u[1] + Math.sin(t) * r[1]];
  };
  return { u, r, dir };
};
const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];

// A rounded box laid along a clock direction, from radius r0 to r1 about c.
function radialRing(c, deg, r0, r1, half, rad = 0.8) {
  const { dir } = clock();
  const d = dir(deg);
  const n = dir(deg + 90);
  return k.roundedPlan({ x: r0, y: -half, w: r1 - r0, d: 2 * half, r: rad }, 3).map(([lx, ly]) => [c[0] + d[0] * lx + n[0] * ly, c[1] + d[1] * lx + n[1] * ly]);
}

function fastBody() {
  const { u, dir } = clock();
  const C = [SW.x, SW.y];
  const out = [base()];

  // cradle: a rounded square block with corner screws
  const CR = { x: SW.x - 34, y: SW.y - 34, w: 68, d: 68, r: 12 };
  out.push(halo(k.insetPlan(CR, 2), 0, 4));
  out.push(S(k.slabOf(CR, 0, Z_CRADLE, P, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(CR, 1.4, P, 6), { tone: "faint" }) }));
  out.push(screws(k.corners(CR, 6), Z_CRADLE, 1.3));

  // behind the case: crown assembly (bow, crown, stem) and two pushers, far to near
  const back = [];
  const crown = [];
  const CB = add(C, u, 41);
  const bow = [];
  const RO = 8.5;
  const RI = 6;
  const SPAN = 138;
  for (let i = 0; i <= 24; i++) bow.push(add(CB, dir(-SPAN + (i / 24) * 2 * SPAN), RO));
  for (let i = 24; i >= 0; i--) bow.push(add(CB, dir(-SPAN + (i / 24) * 2 * SPAN), RI));
  crown.push(S(k.extrude(bow, 8.2 + RISE, 1.6, P, { convex: false }), { tone: "mid" }));
  const crownRing = radialRing(C, 0, 34, 40, 4, 1.2);
  const grooves = [-2.4, -0.8, 0.8, 2.4].map((o) => {
    const n = dir(90);
    const p0 = add(add(C, u, 34), n, o);
    const p1 = add(add(C, u, 40), n, o);
    return k.lineOnTop(p0, p1, 12 + RISE, P);
  }).join("");
  crown.push(brand(S(k.extrude(crownRing, 6 + RISE, 6, P, { bevel: 0.5 }), { tone: "hi", inner: L(grooves, { tone: "lo" }) })));
  crown.push(S(k.extrude(radialRing(C, 0, 31.6, 34, 2.8, 0.8), 7.4 + RISE, 3.2, P, { bevel: 0.3 }), { tone: "mid" }));
  crown.push(S(k.extrude(radialRing(C, 0, 28, 31.6, 1.6, 0.5), 8 + RISE, 2, P), { tone: "mid" }));
  back.push({ key: add(C, u, 38), svg: a.amPress(crown.join(""), [-u[0] * 1.6, -u[1] * 1.6, 0], P, { period: 3000 }) });
  for (const deg of [-42, 42]) {
    const svg = [
      rubber(S(k.extrude(radialRing(C, deg, 35.6, 37.4, 2.4, 0.9), 7.6 + RISE, 3, P), { tone: "hi" })),
      S(k.extrude(radialRing(C, deg, 32.6, 35.6, 2.8, 1), 7.4 + RISE, 3.4, P, { bevel: 0.4 }), { tone: "hi" }),
      S(k.extrude(radialRing(C, deg, 28, 32.6, 1.4, 0.5), 8.2 + RISE, 1.8, P), { tone: "mid" }),
    ].join("");
    back.push({ key: add(C, dir(deg), 35), svg });
  }
  for (const b of byDepth(back, (b) => b.key)) out.push(b.svg);

  // the case: a rubber seat, back, body with a seam, knurled bezel
  out.push(S(k.cylinder(SW.x, SW.y, CASE_R + 1, Z_CRADLE, Z_SEAT - Z_CRADLE, P, 44, 0.6), { tone: "mid", inner: L(k.sideArc(SW.x, SW.y, CASE_R + 1, Z_CRADLE + 1.4, P, 40), { tone: "faint" }) }));
  out.push(L(k.ring(SW.x, SW.y, CASE_R + 1 - 1.2, Z_SEAT, P, 44), { tone: "faint" }));
  out.push(rubber(S(k.cylinder(SW.x, SW.y, CASE_R - 1.2, Z_SEAT, 0.6, P, 36), { tone: "lo" })));
  out.push(S(k.cylinder(SW.x, SW.y, CASE_R - 2, Z_SEAT + 0.6, Z_BACK - Z_SEAT - 0.6, P, 44), { tone: "lo" }));
  out.push(S(k.cylinder(SW.x, SW.y, CASE_R, Z_BACK, Z_BEZ - Z_BACK, P, 44), { tone: "mid", inner: L(k.sideArc(SW.x, SW.y, CASE_R, Z_BACK + 3, P, 48), { tone: "faint" }) }));
  const bandTop = Z_BEZ + 1.8;
  out.push(S(k.cylinder(SW.x, SW.y, CASE_R + 0.6, Z_BEZ, Z_DIAL - Z_BEZ, P, 44, 0.6), {
    tone: "hi",
    crease: "lo",
    inner: L(k.knurl(SW.x, SW.y, CASE_R + 0.6, Z_BEZ, bandTop, 60, P, 0.1), { tone: "lo" }) + L(k.sideArc(SW.x, SW.y, CASE_R + 0.6, bandTop, P, 48), { tone: "faint" }),
  }));

  // the dial: a face inlay, chapter ring, ticks, sub-dial and hands
  const Z = Z_DIAL + 0.4;
  out.push(S(k.cylinder(SW.x, SW.y, CASE_R - 2.6, Z_DIAL, 0.4, P, 44), { tone: "lo", crease: "none" }));
  const from = Math.atan2(u[0], -u[1]);
  out.push(L(k.ring(SW.x, SW.y, CASE_R - 4, Z, P, 44), { tone: "faint" }));
  const t = k.radialTicks(SW.x, SW.y, CASE_R - 4, 60, 5, Z, [1.4, 3.2], P, from);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  // two counters: 30 minutes at 12, tenths at 6, each with a solid hand on a hub
  for (const [deg, count, turn, spin] of [[0, 15, 130, 24000], [180, 10, 250, 0]]) {
    const sc = add(C, dir(deg), 11);
    const sr = 6.2;
    out.push(L(k.ring(sc[0], sc[1], sr, Z, P, 40), { tone: "lo" }));
    const st = k.radialTicks(sc[0], sc[1], sr, count, 5, Z, [1, 1.8], P, from);
    out.push(L(st.minor, { tone: "lo" }), L(st.major, { tone: "mid" }));
    const d = dir(turn);
    const n = dir(turn + 90);
    const tip = add(sc, d, sr - 1.2);
    const tri = [tip, add(add(sc, d, -1.6), n, 0.6), add(add(sc, d, -1.6), n, -0.6)];
    out.push(spin ? spinningHand(sc, Z, tri, { thick: 0.4, period: spin }) : S(k.extrude(tri, Z, 0.4, P), { tone: "hi" }));
    out.push(S(k.cylinder(sc[0], sc[1], 1, Z + 0.4, 0.5, P, 16), { tone: "mid" }));
  }
  // hub and the sweep hand (the moment: violet, lit)
  out.push(S(k.cylinder(SW.x, SW.y, 2.4, Z, 1.2, P, 24), { tone: "mid" }));
  const HAND = 64;
  const hd = dir(HAND);
  const hn = dir(HAND + 90);
  const hand = [
    add(C, hd, CASE_R - 5), add(add(C, hd, 4), hn, 0.9), add(add(C, hd, -6), hn, 0.9),
    add(add(C, hd, -8), hn, 1.8), add(add(C, hd, -10.5), hn, 1.8), add(add(C, hd, -10.5), hn, -1.8),
    add(add(C, hd, -8), hn, -1.8), add(add(C, hd, -6), hn, -0.9), add(add(C, hd, 4), hn, -0.9),
  ];
  // the sweep hand turns once every 3 s, flat in the dial's plane; the hub cap covers its root
  out.push(brand(spinningHand(C, Z + 1.2, hand, { period: 3000, fill: "lit-top", edge: "lit" })));
  out.push(brand(S(k.cylinder(SW.x, SW.y, 1.3, Z + 1.7, 0.6, P, 16), { tone: "hi" })));
  out.push(D([at([SW.x, SW.y, Z + 2.3])], { size: SCREW, tone: "hi" }));

  // cradle fingers in front of the case
  for (const deg of byDepth([150, 210], (d) => add(C, dir(d), 33))) {
    const ring = radialRing(C, deg, CASE_R + 1.2, CASE_R + 6.5, 3, 1);
    const mid = add(C, dir(deg), CASE_R + 4.2);
    const ft = Z_BACK + 4;
    out.push(S(k.extrude(ring, Z_CRADLE, ft - Z_CRADLE, P, { bevel: 0.4 }), { tone: "mid", inner: L(k.ringSeam(ring, Z_SEAT, P), { tone: "faint" }) }));
    out.push(rubber(S(k.extrude(radialRing(C, deg, CASE_R + 1.6, CASE_R + 4.8, 2, 0.8), ft, 0.8, P), { tone: "hi" })));
    out.push(D([at([mid[0], mid[1], ft + 0.8])], { size: SCREW }));
  }
  return out.join("");
}

function fastPoints() {
  const { u, dir } = clock();
  const C = [SW.x, SW.y];
  const pts = [...trayPoints()];
  for (let i = 0; i < 36; i++) { const p = add(C, dir(i * 10), CASE_R + 1); pts.push([p[0], p[1], Z_DIAL + 2.5]); }
  const tip = add(C, u, 49.5);
  pts.push([tip[0], tip[1], 12 + RISE]);
  return pts;
}

// ======================================================================================
// SECURE: a steel safe-deposit box on four feet. The lower drawer is slid half out, coins
// and papers inside; the key (violet, lit) hovers at the lock of the upper compartment.
// ======================================================================================
const BOX = { x: -22, y: -36, w: 54, d: 44, r: 2 };    // x -22..32, y -36..8
const FRONT = BOX.y + BOX.d;                            // 8
const Z_FEET = 2;
const Z_FLOOR = 5;
const Z_SHELF = 19;
const Z_LID = 44;
const WALL = 3;
const OUT = 22;
const DR = { x0: BOX.x + WALL + 0.6, x1: BOX.x + BOX.w - WALL - 0.6 };    // drawer box x range
const DR_Y0 = FRONT - 34 + OUT;      // back of the drawer box
const DR_Y1 = FRONT + OUT - 3;       // inner face of the drawer front
const DR_TOP = 15;

function secureBody() {
  const out = [base()];
  out.push(halo(k.insetPlan(BOX, -1), 0, 5));
  for (const [x, y] of byDepth(k.corners(BOX, 5))) {
    out.push(rubber(S(k.cylinder(x, y, 3, 0, Z_FEET, P, 20), { tone: "lo" })));
  }
  // carcass, far to near, with the drawer between the far and near cheeks
  out.push(S(k.slabOf(BOX, Z_FEET, Z_FLOOR - Z_FEET, P, 3, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf({ x: BOX.x, y: BOX.y, w: BOX.w, d: WALL, r: 1 }, Z_FLOOR, Z_SHELF - Z_FLOOR, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: BOX.x, y: BOX.y, w: WALL, d: BOX.d, r: 1 }, Z_FLOOR, Z_SHELF - Z_FLOOR, P, 3), { tone: "mid" }));
  out.push(a.amSlide(drawer(), [0, -7, 0], P, { period: 6400, delay: 1200 }));
  out.push(S(k.slabOf({ x: BOX.x + BOX.w - WALL, y: BOX.y, w: WALL, d: BOX.d, r: 1 }, Z_FLOOR, Z_SHELF - Z_FLOOR, P, 3), { tone: "mid" }));

  // the upper compartment: a solid block with its door outline, rivets and lock
  const upper = { ...BOX };
  out.push(S(k.slabOf(upper, Z_SHELF, Z_LID - Z_SHELF, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(upper, Z_SHELF + 2, P, 3), { tone: "faint" }) }));
  const door = { x0: BOX.x + 4, x1: BOX.x + BOX.w - 4, z0: Z_SHELF + 5, z1: Z_LID - 3 };
  out.push(L(faceY(FRONT, door.x0, door.x1, door.z0, door.z1), { tone: "lo" }));
  const riv = [];
  for (const x of [door.x0 + 2.4, door.x1 - 2.4]) for (const z of [door.z0 + 2.4, door.z1 - 2.4]) riv.push(at([x, FRONT, z]));
  out.push(D(riv, { size: SCREW }));
  // side vents on the near cheek of the upper block: closed slots
  out.push(L([0, 1, 2, 3].map((i) => faceX(BOX.x + BOX.w, BOX.y + 6 + i * 7, BOX.y + 10 + i * 7, 27, 38)).join(""), { tone: "lo" }));
  // lock plate with a horizontal keyway
  const LX = BOX.x + BOX.w / 2;
  const LZ = 32.5;
  const plate = { x: LX - 6, y: FRONT, w: 12, d: 1.2, r: 0.6 };
  out.push(S(k.slabOf(plate, LZ - 5.5, 11, P, 2, 0.3), { tone: "hi" }));
  const PF = FRONT + 1.2;
  out.push(L(k.sideRing([LX, PF, LZ], 2.6, "y", P, 28), { tone: "lo" }));
  out.push(L(faceY(PF, LX - 1.7, LX + 1.7, LZ - 0.5, LZ + 0.5), { tone: "mid" }));
  out.push(D([at([LX - 4, PF, LZ + 4]), at([LX + 4, PF, LZ + 4]), at([LX - 4, PF, LZ - 4]), at([LX + 4, PF, LZ - 4])], { size: SCREW }));
  // the key, lying flat at the keyway and hovering just out of it: blade with bits, shoulder, round bow
  const ky = PF + 2.6;
  const kz = LZ - 0.5;
  const key = [
    S(k.slabOf({ x: LX - 1.5, y: ky, w: 3, d: 8, r: 0.4 }, kz, 1, P, 2), { tone: "hi" }),
    S(k.slabOf({ x: LX + 1.5, y: ky + 1.2, w: 1.2, d: 1.6, r: 0.2 }, kz, 1, P, 2), { tone: "hi" }),
    S(k.slabOf({ x: LX + 1.5, y: ky + 4, w: 0.8, d: 1.4, r: 0.2 }, kz, 1, P, 2), { tone: "hi" }),
    S(k.slabOf({ x: LX - 3, y: ky + 8, w: 6, d: 1.6, r: 0.6 }, kz - 0.2, 1.4, P, 2, 0.3), { tone: "hi" }),
    S(k.cylinder(LX, ky + 14, 5.2, kz - 0.2, 1.4, P, 36, 0.5), { tone: "hi", lit: true, inner: "" }),
    L(k.ring(LX, ky + 14, 1.8, kz + 1.2, P, 20), { tone: "mid" }),
    L(k.ring(LX, ky + 14, 3.8, kz + 1.2, P, 32), { tone: "faint" }),
  ].join("");
  out.push(a.amSlide(brand(key), [0, -2, 0], P, { period: 4800 }));

  // lid with a carry handle
  const lid = k.insetPlan(BOX, -1);
  out.push(S(k.slabOf(lid, Z_LID, 3, P, 4, 1), { tone: "hi" }));
  out.push(L(k.planOutline(k.insetPlan(lid, 3.5), Z_LID + 3, P, 4), { tone: "faint" }));
  const HZ = Z_LID + 3;
  const hp = [[BOX.x + 9, -14], [BOX.x + BOX.w - 9, -14]];
  for (const [x, y] of byDepth(hp)) out.push(S(k.slabOf({ x: x - 2, y: y - 2, w: 4, d: 4, r: 1 }, HZ, 4, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: BOX.x + 6, y: -16, w: BOX.w - 12, d: 4, r: 1.6 }, HZ + 4, 2.4, P, 3, 0.4), { tone: "hi" }));
  out.push(screws(k.corners(lid, 4.5), Z_LID + 3, 1.2));
  return out.join("");
}

function drawer() {
  const g = [];
  const { x0, x1 } = DR;
  // floor, back, far wall
  g.push(S(k.slabOf({ x: x0, y: DR_Y0, w: x1 - x0, d: DR_Y1 - DR_Y0, r: 0.6 }, Z_FLOOR, 1.2, P, 2), { tone: "lo" }));
  const fz = Z_FLOOR + 1.2;
  g.push(S(k.slabOf({ x: x0, y: DR_Y0, w: x1 - x0, d: 1.4, r: 0.4 }, fz, DR_TOP - fz, P, 2), { tone: "mid" }));
  g.push(S(k.slabOf({ x: x0, y: DR_Y0, w: 1.4, d: DR_Y1 - DR_Y0, r: 0.4 }, fz, DR_TOP - fz, P, 2), { tone: "mid" }));
  // contents: a stack of bonds and two coin rolls standing on end
  const items = [];
  // three banded bundles of notes, stacked a little askew
  const bundles = [0, 1, 2].map((i) => ({ x: x0 + 3 + [0, 1.2, 0.4][i], y: FRONT + 7 - [0, 0.8, -0.6][i], w: 17, d: 8, r: 0.5, z: fz + i * 2 }));
  items.push({
    key: [x0 + 12, FRONT + 11],
    svg: bundles.map((b) => [
      S(k.slabOf(b, b.z, 2, P, 2), { tone: "hi", crease: "lo", inner: L(k.sideSeam(b, b.z + 1, P, 2), { tone: "faint" }) }),
      S(k.slabOf({ x: b.x + 6, y: b.y - 0.3, w: 3.2, d: b.d + 0.6, r: 0.2 }, b.z, 2, P, 2), { tone: "mid", crease: "none" }),
    ].join("")).join(""),
  });
  for (const [cx, cy, n] of [[x1 - 8, FRONT + 6, 8], [x1 - 15, FRONT + 9, 6], [x1 - 6, FRONT + 14, 5]]) {
    const h = n * 1.3;
    const seams = Array.from({ length: n - 1 }, (_, i) => k.sideArc(cx, cy, 3.4, fz + (i + 1) * 1.3, P, 20)).join("");
    items.push({
      key: [cx, cy],
      svg: S(k.cylinder(cx, cy, 3.4, fz, h, P, 28, 0.3), { tone: "hi", crease: "lo", inner: L(seams, { tone: "lo" }) }) + L(k.ring(cx, cy, 2.2, fz + h, P, 20), { tone: "faint" }),
    });
  }
  for (const it of byDepth(items, (i) => i.key)) g.push(it.svg);
  // near wall, then the front with its pull and card holder
  g.push(S(k.slabOf({ x: x1 - 1.4, y: DR_Y0, w: 1.4, d: DR_Y1 - DR_Y0, r: 0.4 }, fz, DR_TOP - fz, P, 2), { tone: "mid" }));
  const FX0 = BOX.x + 1.4;
  const FX1 = BOX.x + BOX.w - 1.4;
  const FY = DR_Y1 + 3;
  g.push(S(k.slabOf({ x: FX0, y: DR_Y1, w: FX1 - FX0, d: 3, r: 1 }, Z_FLOOR - 0.4, Z_SHELF - 0.6 - Z_FLOOR + 0.4, P, 3, 0.6), { tone: "hi" }));
  // card holder: a frame outline with a card inside, rule lines for print
  const cx0 = FX0 + 6;
  const cx1 = cx0 + 14;
  g.push(S(k.slabOf({ x: cx0, y: FY, w: cx1 - cx0, d: 0.6, r: 0.2 }, 11, 6, P, 2), { tone: "lo" }));
  g.push(L(faceY(FY + 0.6, cx0 + 1.2, cx1 - 1.2, 12.2, 15.8), { tone: "faint" }));
  g.push(L([[2.4, 7], [2.4, 5]].map(([dx, len], i) => k.segment([cx0 + dx, FY + 0.6, 14.8 - i * 1.6], [cx0 + dx + len, FY + 0.6, 14.8 - i * 1.6], P)).join(""), { tone: "lo", free: true }));
  g.push(D([at([cx0 - 1.6, FY, 14]), at([cx1 + 1.6, FY, 14])], { size: SCREW }));
  // pull: two posts and a bar
  const px0 = 8;
  const px1 = 22;
  for (const x of [px0, px1]) g.push(S(k.slabOf({ x: x - 1.2, y: FY, w: 2.4, d: 3, r: 0.6 }, 12, 2.6, P, 2), { tone: "mid" }));
  g.push(S(k.slabOf({ x: px0 - 2, y: FY + 3, w: px1 - px0 + 4, d: 2, r: 0.8 }, 11.6, 3.4, P, 3, 0.3), { tone: "hi" }));
  return g.join("");
}

function securePoints() {
  return [...trayPoints(), ...k.boxCorners(k.insetPlan(BOX, -1), 0, Z_LID + 9.4), [BOX.x + BOX.w / 2, FRONT + 24, 36]];
}

// ======================================================================================
// OFFLINE: a square battery lantern. A base with a charge window (three cells lit violet,
// the fourth charging), a glass cage round a violet emitter, a vented roof and a handle.
// ======================================================================================
const LB = { x: -22, y: -26, w: 44, d: 44, r: 5 };   // x -22..22, y -26..18
const LC = { x: 0, y: -4 };
const Z_BASE = 3;
const Z_CAGE = 18;
const Z_TOPPLATE = 50;
const Z_ROOF = 52;
const Z_CAP = 56;

function offlineBody() {
  const out = [base()];
  out.push(halo(k.insetPlan(LB, -2), 0, 5));
  // plinth and battery base
  const plinth = k.insetPlan(LB, -2);
  out.push(S(k.slabOf(plinth, 0, Z_BASE, P, 6, 0.6), { tone: "lo" }));
  out.push(S(k.slabOf(LB, Z_BASE, Z_CAGE - Z_BASE, P, 6, 1), { tone: "mid", inner: L(k.sideSeam(LB, Z_CAGE - 3, P, 6), { tone: "faint" }) }));
  const FY = LB.y + LB.d;
  const SX = LB.x + LB.w;
  // charge window: a frame on the front with four cells
  out.push(S(k.slabOf({ x: -13, y: FY, w: 26, d: 0.8, r: 0.4 }, 6, 6.6, P, 2, 0.3), { tone: "lo" }));
  // the cells fill one after another: a flipbook of 0..4 lit, resting on three
  const cells = (lit) => Array.from({ length: 4 }, (_, i) => {
    const cell = S(k.slabOf({ x: -11.6 + i * 6, y: FY + 0.8, w: 5, d: 0.6, r: 0.2 }, 7.2, 4.2, P, 2), { tone: i < lit ? "hi" : "lo" });
    return i < lit ? brand(cell) : cell;
  }).join("");
  out.push(a.amFlip([3, 4, 0, 1, 2].map(cells), { period: 4000 }));
  // side: slide switch in a slot, and a charging port
  out.push(S(k.slabOf({ x: SX, y: -14, w: 0.6, d: 12, r: 0.3 }, 7, 5, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf({ x: SX + 0.6, y: -12.6, w: 1.4, d: 4, r: 0.4 }, 7.8, 3.4, P, 2, 0.3), { tone: "hi" }));
  out.push(L(faceX(SX, 4, 10, 8.2, 10.8), { tone: "lo" }));
  // base screws in the corners round the cage
  out.push(screws(k.corners(LB, 2.6), Z_CAGE, 1));

  // cage: bottom plate, posts behind, emitter, the near post, glints on the glass
  const CAGE = { x: -19, y: -23, w: 38, d: 38, r: 3 };
  out.push(S(k.slabOf(CAGE, Z_CAGE, 2, P, 3, 0.5), { tone: "mid" }));
  const zc = Z_CAGE + 2;
  const posts = [[CAGE.x, CAGE.y], [CAGE.x + CAGE.w - 4, CAGE.y], [CAGE.x, CAGE.y + CAGE.d - 4], [CAGE.x + CAGE.w - 4, CAGE.y + CAGE.d - 4]];
  const sorted = byDepth(posts, ([x, y]) => [x + 2, y + 2]);
  const post = ([x, y]) => S(k.slabOf({ x, y, w: 4, d: 4, r: 1 }, zc, Z_TOPPLATE - zc, P, 3), { tone: "mid" });
  for (const p of sorted.slice(0, 3)) out.push(post(p));
  // emitter: socket, violet tube with LED bands, cap
  out.push(S(k.cylinder(LC.x, LC.y, 8, zc, 3, P, 40, 0.4), { tone: "mid" }));
  const ez0 = zc + 3;
  const ez1 = 43;
  const bands = [ez0 + 4.5, ez0 + 9, ez0 + 13.5].map((z) => k.sideArc(LC.x, LC.y, 4.6, z, P, 28)).join("");
  const glow = `<path d="${k.haloOf({ x: LC.x - 11, y: LC.y - 11, w: 22, d: 22, r: 11 }, ez0, ez1 - ez0, P)}" style="fill:var(--anatomy-top);opacity:.5;filter:blur(7px)"/>`;
  out.push(a.amPulse(brand(glow), { period: 3600, min: 0.15 }));
  const tube = (lit) => brand(S(k.cylinder(LC.x, LC.y, 4.6, ez0, ez1 - ez0, P, 40), { tone: "hi", lit, inner: L(bands, { tone: "mid" }) }));
  out.push(tube(false), a.amPulse(tube(true), { period: 3600, min: 0.2 }));
  out.push(S(k.cylinder(LC.x, LC.y, 6, ez1, 2, P, 40, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(LC.x, LC.y, 2.2, ez1 + 2, Z_TOPPLATE - ez1 - 2, P, 20), { tone: "mid" }));
  out.push(post(sorted[3]));
  // glass glints on the two near panes, each from the bottom plate's edge to the top plate's
  const GY = CAGE.y + CAGE.d;
  const GX = CAGE.x + CAGE.w;
  const glints = [
    k.segment([-9, GY, zc], [-1, GY, Z_TOPPLATE], P), k.segment([-6, GY, zc], [2, GY, Z_TOPPLATE], P),
    k.segment([GX, -9, zc], [GX, -17, Z_TOPPLATE], P),
  ].join("");
  out.push(L(glints, { tone: "faint" }));

  // top plate, roof, vent cap with slots, handle
  out.push(S(k.slabOf(k.insetPlan(CAGE, -0.6), Z_TOPPLATE, Z_ROOF - Z_TOPPLATE, P, 3, 0.4), { tone: "mid" }));
  const ROOF = k.insetPlan(LB, -1);
  out.push(S(k.slabOf(ROOF, Z_ROOF, Z_CAP - Z_ROOF, P, 6, 1), { tone: "hi" }));
  out.push(screws(k.corners(ROOF, 4.5), Z_CAP, 1.2));
  const CAP = { x: LC.x - 12, y: LC.y - 12, w: 24, d: 24, r: 3 };
  const HP = [[-17, LC.y], [17, LC.y]];
  const top = [];
  top.push({ key: [LC.x, LC.y], svg: S(k.slabOf(CAP, Z_CAP, 4, P, 3, 0.5), { tone: "mid" }) + L([0, 1, 2, 3].map((i) => k.planOutline({ x: CAP.x + 4, y: CAP.y + 4.5 + i * 4.4, w: 16, d: 1.6, r: 0.8 }, Z_CAP + 4, P, 3)).join(""), { tone: "lo" }) });
  for (const [x, y] of HP) {
    top.push({
      key: [x, y],
      svg: S(k.slabOf({ x: x - 3, y: y - 3, w: 6, d: 6, r: 1.2 }, Z_CAP, 1.6, P, 3, 0.3), { tone: "lo" }) +
        S(k.slabOf({ x: x - 1.8, y: y - 1.8, w: 3.6, d: 3.6, r: 0.8 }, Z_CAP + 1.6, 14, P, 3), { tone: "mid" }),
    });
  }
  for (const t of byDepth(top, (t) => t.key)) out.push(t.svg);
  const HZ = Z_CAP + 15.6;
  out.push(S(k.slabOf({ x: -19, y: LC.y - 1.8, w: 38, d: 3.6, r: 1.2 }, HZ, 2.6, P, 3, 0.3), { tone: "mid" }));
  const grip = { x: -9, y: LC.y - 2.8, w: 18, d: 5.6, r: 2.4 };
  const ribs = [-6, -3, 0, 3, 6].map((x) => k.lineOnTop([x, grip.y], [x, grip.y + grip.d], HZ + 3.4, P)).join("");
  out.push(rubber(S(k.slabOf(grip, HZ - 0.8, 4.2, P, 4, 0.4), { tone: "hi" })));
  out.push(rubber(L(ribs, { tone: "mid" })));
  return out.join("");
}

function offlinePoints() {
  return [...trayPoints(), ...k.boxCorners(k.insetPlan(LB, -2), 0, Z_CAP + 19)];
}

// ---------- size: lossless path minifier ----------
// The kit writes absolute M/L/Z commands in tenths. Rewrite each path as relative commands,
// computed in integer tenths so nothing drifts, and drop leading zeros: about a third smaller.
const num = (t) => {
  const v = (t / 10).toString();
  return v.replace(/^(-?)0\./, "$1.");
};
function minifyD(d) {
  if (!/^[MLZ0-9 .\-]+$/.test(d)) return d;
  const tokens = d.match(/[MLZ]|-?\d*\.?\d+/g);
  let out = "";
  let cx = 0, cy = 0, sx = 0, sy = 0, first = true, prev = "";
  for (let i = 0; i < tokens.length; ) {
    const c = tokens[i++];
    if (c === "Z") { out += "z"; cx = sx; cy = sy; prev = "z"; continue; }
    const x = Math.round(parseFloat(tokens[i++]) * 10);
    const y = Math.round(parseFloat(tokens[i++]) * 10);
    const dx = first ? x : x - cx;
    const dy = first ? y : y - cy;
    const cmd = c === "M" ? (first ? "M" : "m") : "l";
    const pair = num(dx) + (dy < 0 ? "" : " ") + num(dy);
    out += (cmd === prev && cmd === "l" ? (dx < 0 ? "" : " ") : cmd) + pair;
    prev = cmd;
    first = false;
    cx = x; cy = y;
    if (c === "M") { sx = x; sy = y; }
  }
  return out;
}
const minify = (svg) => svg.replace(/ d="([^"]*)"/g, (_, d) => ` d="${minifyD(d)}"`);

// ======================================================================================
// One camera, one scale: fit each spot alone, keep the smallest scale (the biggest object),
// then centre every spot at that scale.
// ======================================================================================
const SPOTS = [
  { name: "fast", title: "Fast", body: fastBody, points: fastPoints, label: "An isometric stopwatch lying face-up in a cradle on a small tray, its violet sweep hand turning on the dial and its violet start crown pressing." },
  { name: "secure", title: "Secure", body: secureBody, points: securePoints, label: "An isometric steel safe-deposit box on a small tray, its lower drawer sliding in and out with coins and banded notes inside, and a violet key hovering at the lock." },
  { name: "offline", title: "Works offline", body: offlineBody, points: offlinePoints, label: "An isometric square battery lantern on a small tray, a glowing violet light column inside its glass cage and a charge window whose violet cells fill one after another." },
];

const unit = { origin: [0, 0], scale: 1, azimuth: AZIMUTH, elevation: ELEVATION };
// The clock helpers read P's camera, so give it one before the fit points are made. One fit
// over all three spots' extremes gives one scale and one origin: the trays line up in a row.
P = { ...unit };
const SHARED = k.fitProjection(SPOTS.flatMap((s) => s.points()), W, H, { pad: PAD, azimuth: AZIMUTH, elevation: ELEVATION });
const SCALE = SHARED.scale;
const svgs = [];
for (const s of SPOTS) {
  P = SHARED;
  const id = `${s.name}${SUFFIX}`;
  const svg = a.assetSvg({
    width: W,
    height: H,
    label: s.label,
    body: minify(s.body()),
    paper: PAPER,
    accents: { brand: VIOLET, rubber: light ? "#3a3c44" : "#07080b" },
    weight: 0.5,
    id,
  });
  writeFileSync(join(HERE, `${id}.svg`), svg);
  writeFileSync(join(HERE, `${id}.html`), a.previewHtml({ title: id, svg, paper: PAPER, width: W }));
  svgs.push({ ...s, id, svg });
  console.log(`wrote ${id}.svg (${(svg.length / 1024).toFixed(1)} KB, scale ${SCALE.toFixed(3)})`);
}

// The row: three spots side by side on the page colour, at their shown size (240 px).
const ink = light ? "#1b1d23" : "#e8e9ee";
const sub = light ? "#5d616c" : "#8a8f9c";
const row = svgs.map((s) => `<figure><div class="spot">${s.svg}</div><figcaption><b>${s.title}</b></figcaption></figure>`).join("");
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>feature-spots${SUFFIX}</title><style>*{box-sizing:border-box}html,body{margin:0;background:${PAPER};color:${ink};font:15px/1.4 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:960px;margin:48px auto;padding:0 16px}.row.asset-stage.iso-plate{display:flex;flex-wrap:wrap;justify-content:center;gap:24px;padding:0;box-shadow:none;background:${PAPER}}figure{margin:0;width:240px;text-align:center}.spot svg{width:240px;height:auto;display:block}figcaption{margin-top:4px;color:${sub}}figcaption b{color:${ink};font-weight:600}</style></head><body><main><div class="row asset-stage iso-plate">${row}</div></main></body></html>`;
writeFileSync(join(HERE, `feature-spots${SUFFIX}.html`), page);
console.log(`wrote feature-spots${SUFFIX}.html`);
