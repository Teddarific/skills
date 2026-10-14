// A wide banner for a CI/CD product ("ship every commit"): a compact bottling line running
// diagonally across a 1600 × 560 canvas. A belt conveyor on legs carries bottles through a
// filler, a capper, a labeller and an inspection gate, and a roller table hands them into a
// crate. The conveyor runs: bottles come in from off the left edge and travel one pitch at a
// time (an endless amLoop) into the inspection tunnel; the filler nozzles dip, a violet cap
// drops from the spinning capper chuck onto the bottle passing under it, and the tunnel lamp's
// LED blinks.
//
//   node build.mjs            dark   → bottling-line.svg, bottling-line.html
//   node build.mjs --light    light  → bottling-line-light.svg, bottling-line-light.html

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const light = process.argv.includes("--light");
const PAPER = light ? "#f3f4f7" : "#0b0d12";
const BRAND = "#7c5cff";
const GLASS = light ? "#dfe5f0" : "#aeb9cf";

const W = 1600;
const H = 560;
const REGION = { x: 40, y: 20, w: 1520, h: 520 };

// ---------- world ----------
// The line runs along +x. The belt is centred on y = 0; bottles stand on it at z = BELT_Z.
const X0 = -400;           // infeed end of the frame, behind the infeed cabinet
const BELT_END = 146;      // belt ends inside the tunnel; the roller table follows
const X1 = 222;            // discharge end of the frame
const BEAM_Z0 = 26;
const BEAM_Z1 = 42;
const BELT_Z = 40;
// Beams are split inside the tunnel: the upstream run is drawn before it, the downstream run after.
const SPLIT = 125;
const BACK_BEAM = { x: X0, y: -18, w: SPLIT - X0, d: 4, r: 0.8 };
const FRONT_BEAM = { x: X0, y: 14, w: SPLIT - X0, d: 4, r: 0.8 };
const BACK_BEAM_R = { x: SPLIT, y: -18, w: X1 - SPLIT, d: 4, r: 0.8 };
const FRONT_BEAM_R = { x: SPLIT, y: 14, w: X1 - SPLIT, d: 4, r: 0.8 };
const PITCH = 40;          // bottle pitch: the belt moves one pitch per loop
const LOOP_MS = 3000;
const TUN = { x: 100, y: -30, w: 50, d: 60, r: 2 };
const TUN_Z = 106;
const BELT = { x: X0 + 6, y: -14, w: BELT_END - X0 - 6, d: 28, r: 1 };
const RAIL_Z0 = 47;
const RAIL_Z1 = 51;

// Bottle: body, shoulder ring, neck, cap.
const BR = 9;
const BODY_H = 28;
const SH_R = 7;
const SH_H = 3.5;
const NECK_R = 3.4;
const NECK_H = 9;
const CAP_R = 4.4;
const CAP_H = 5;
const NECK_TOP = BODY_H + SH_H + NECK_H;

const STAND_TOP = 30;
const P = a.fitInto(
  [
    ...k.boxCorners({ x: -382, y: -66, w: 697, d: 118, r: 0 }, 0, 0),
    [-382, 52, 100], [-312, 22, 100],
    [-240, -18, 166], [-110, -1, 152], [138, -18, 136], [-300, -18, 56], [-36, -66, 72], [315, 32, 0], [315, -30, 80],
  ],
  REGION,
  { pad: 8, azimuth: Number(process.env.AZ ?? 62) },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (items, key = (i) => i) => [...items].sort((p, q) => depth(key(p)) - depth(key(q)));
const accent = (svg) => `<g class="ac-brand">${svg}</g>`;
const glass = (svg) => `<g class="ac-glass">${svg}</g>`;
const ink = (svg) => `<g class="ac-led">${svg}</g>`;
const slab = (plan, z, h, steps = 3, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel);
const cyl = (x, y, r, z, h, steps = 28, bevel = 0) => k.cylinder(x, y, r, z, h, P, steps, bevel);
const seam = (plan, z, steps = 3) => k.sideSeam(plan, z, P, steps);
// Lines in a vertical face plane: y = const (front faces) or x = const (end faces).
const faceY = (y, pts, closed = false) => k.pathOf(pts.map(([x, z]) => at([x, y, z])), closed);
const faceX = (x, pts, closed = false) => k.pathOf(pts.map(([yy, z]) => at([x, yy, z])), closed);
const slotPts = (u0, u1, zc, h, n = 6) => {
  const r = h / 2;
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + (i / n) * Math.PI; pts.push([u1 - r + Math.cos(t) * r, zc + Math.sin(t) * r]); }
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + (i / n) * Math.PI; pts.push([u0 + r + Math.cos(t) * r, zc + Math.sin(t) * r]); }
  return pts;
};
const screwsTop = (pts, z, r = 1.6) =>
  L(pts.map(([x, y]) => k.ring(x, y, r, z, P, 14)).join(""), { tone: "mid" }) + D(pts.map(([x, y]) => at([x, y, z])), { size: 0.6 });
const screwsY = (y, pts, r = 1.3) =>
  L(pts.map(([x, z]) => k.sideRing([x, y, z], r, "y", P, 14)).join(""), { tone: "mid" }) + D(pts.map(([x, z]) => at([x, y, z])), { size: 0.55 });
const screwsX = (x, pts, r = 1.3) =>
  L(pts.map(([yy, z]) => k.sideRing([x, yy, z], r, "x", P, 14)).join(""), { tone: "mid" }) + D(pts.map(([yy, z]) => at([x, yy, z])), { size: 0.55 });
const halo = (plan, z, h, blur = 0) =>
  `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ""}/>`;
// A label plate on a front face (y = fy), with rule lines standing for print.
function facePlate(x, fy, z, w, h, rules) {
  const out = [S(slab({ x, y: fy, w, d: 0.7, r: 0.3 }, z, h, 2), { tone: "mid", crease: "none" })];
  const py = fy + 0.7;
  out.push(L(faceY(py, [[x + 1.5, z + 1.2], [x + w - 1.5, z + 1.2], [x + w - 1.5, z + h - 1.2], [x + 1.5, z + h - 1.2]], true), { tone: "lo" }));
  out.push(L(rules.map((len, i) => faceY(py, [[x + 4, z + h - 3.6 - i * 2.8], [x + 4 + len, z + h - 3.6 - i * 2.8]])).join(""), { tone: "mid", free: true }));
  return out.join("");
}

// ---------- bottles ----------
// state: "empty" (no cap), "capped", "labelled".
function bottle(x, y, z0, state) {
  const out = [];
  const bodyInner = [L(k.sideArc(x, y, BR, z0 + 2.6, P, 18), { tone: "faint" })];
  if (state === "labelled") bodyInner.push(L(k.sideArc(x, y, BR, z0 + 8, P, 18) + k.sideArc(x, y, BR, z0 + 21, P, 18), { tone: "mid" }));
  out.push(S(cyl(x, y, BR, z0, BODY_H, 18, 0.6), { tone: "hi", inner: bodyInner.join("") }));
  out.push(S(cyl(x, y, SH_R, z0 + BODY_H, SH_H, 16, 0.5), { tone: "hi" }));
  const nz = z0 + BODY_H + SH_H;
  out.push(S(cyl(x, y, NECK_R, nz, NECK_H, 12), { tone: "hi", inner: L(k.sideArc(x, y, NECK_R, nz + NECK_H - 2.6, P, 12), { tone: "mid" }) }));
  if (state === "empty") out.push(L(k.ring(x, y, NECK_R - 1.1, z0 + NECK_TOP, P, 16), { tone: "mid" }));
  const svg = glass(out.join(""));
  return state === "empty" ? svg : svg + cap(x, y, z0 + NECK_TOP);
}

// k.knurl with a phase, so the ribs can be stepped round for a spinning part.
function knurlAt(cx, cy, r, z0, z1, count, phase) {
  const [vx, vy] = k.towardViewer(P);
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = phase + (i / count) * Math.PI * 2;
    const nx = Math.cos(t);
    const ny = Math.sin(t);
    if (nx * vx + ny * vy < 0.15) continue;
    out.push(k.segment([cx + r * nx, cy + r * ny, z0 + 0.3], [cx + r * nx, cy + r * ny, z1 - 0.3], P));
  }
  return out.join("");
}

function cap(x, y, z, lit = false) {
  return accent([
    S(cyl(x, y, CAP_R, z, CAP_H, 16, 0.5), { tone: "hi", lit }),
    L(k.knurl(x, y, CAP_R, z, z + CAP_H - 1.2, 22, P, 0.3), { tone: "lo" }),
    L(k.sideArc(x, y, CAP_R, z + CAP_H - 1.2, P, 14), { tone: "faint" }),
    L(k.ring(x, y, CAP_R - 1.4, z + CAP_H, P, 16), { tone: "faint" }),
  ].join(""));
}

const FILL_X = -230;
const CAP_X = -110;
const LAB_X = 10;
// Bottle slots on the belt, one pitch apart, from one hidden off the left edge to one that is
// entering the tunnel. The whole row slides one pitch and jumps back (amLoop): each bottle
// then stands where the next one was, so the conveyor runs endlessly. A bottle's state follows
// its slot: empty up to the capper, capped up to the labeller, labelled from there on.
const SLOTS = Array.from({ length: 12 }, (_, i) => -350 + i * PITCH);
const CAP_LIFT = 7;
// The infeed cabinet stands in front of the belt's upstream end. The bottle in the first slot
// waits behind it and comes out past its edge as the belt moves, so no gap opens upstream.
const INFEED = { x: -382, y: 22, w: 70, d: 30, r: 1.6 };
const INFEED_Z = 98;
function infeedCabinet() {
  const out = [];
  const c = INFEED;
  out.push(S(slab({ x: c.x - 2, y: c.y - 2, w: c.w + 4, d: c.d + 4, r: 2 }, 0, 4, 3, 0.5), { tone: "mid" }));
  out.push(S(slab(c, 4, INFEED_Z - 4, 3, 1), { tone: "hi", inner: L(seam(c, 10, 3) + seam(c, INFEED_Z - 8, 3), { tone: "mid" }) }));
  const fy = c.y + c.d;
  const x0 = c.x + 5;
  const x1 = c.x + c.w - 5;
  out.push(L(faceY(fy, [[x0, 14], [x1, 14], [x1, INFEED_Z - 12], [x0, INFEED_Z - 12]], true), { tone: "mid" }));
  out.push(L(faceY(fy, [[x1 - 6, 44], [x1 - 3, 44], [x1 - 3, 60], [x1 - 6, 60]], true), { tone: "hi" }));
  out.push(screwsY(fy, [[x0 + 4, 22], [x0 + 4, INFEED_Z - 20]], 1.2));
  out.push(facePlate(x0 + 10, fy, INFEED_Z - 30, 34, 10, [24, 16]));
  out.push(L([0, 1, 2, 3].map((i) => faceY(fy, slotPts(x0 + 10, x0 + 34, 30 - i * 3.6, 1.6), true)).join(""), { tone: "lo" }));
  out.push(L(faceX(c.x + c.w, slotPts(c.y + 6, c.y + c.d - 6, 70, 2), true) + faceX(c.x + c.w, slotPts(c.y + 6, c.y + c.d - 6, 74, 2), true), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(c, 4), INFEED_Z, P, 3), { tone: "mid" }));
  out.push(screwsTop(k.corners(c, 7), INFEED_Z, 1.3));
  // an emergency stop on the roof: a mushroom head on a collar
  const [ex, ey] = [c.x + c.w - 16, c.y + c.d / 2];
  out.push(S(cyl(ex, ey, 6.5, INFEED_Z, 3, 28, 0.4), { tone: "mid" }));
  out.push(S(cyl(ex, ey, 4.5, INFEED_Z + 3, 4, 24, 0.4), { tone: "hi", inner: L(k.sideArc(ex, ey, 4.5, INFEED_Z + 5, P, 18), { tone: "mid" }) }));
  return out.join("");
}

function bottles() {
  const out = [];
  for (const x of byDepth(SLOTS, (x) => [x, 0, 20])) {
    const state = x <= CAP_X ? "empty" : x < LAB_X ? "capped" : "labelled";
    out.push(bottle(x, 0, BELT_Z, state));
    // Under the capper: the violet cap leaves the chuck and settles onto the neck while the
    // bottle travels one pitch, so it is seated exactly when the row jumps back.
    if (x === CAP_X) out.push(a.amLoop(cap(x, 0, BELT_Z + NECK_TOP + CAP_LIFT, true), [0, 0, -CAP_LIFT], P, { period: LOOP_MS }));
  }
  return a.amLoop(out.join(""), [PITCH, 0, 0], P, { period: LOOP_MS });
}

// ---------- conveyor ----------
const LEG_X = [-290, -130, 24, 206];
const LEG_Y = 16;
const LEG = (x, y) => ({ x: x - 3, y: y - 3, w: 6, d: 6, r: 0.8 });

function legs() {
  const out = [];
  for (const x of byDepth(LEG_X, (x) => [x, 0, 0])) {
    for (const y of [-LEG_Y, LEG_Y]) {
      if (y > 0) out.push(S(slab({ x: x - 2, y: -LEG_Y + 3, w: 4, d: 2 * LEG_Y - 6, r: 0.5 }, 9, 4, 2, 0.4), { tone: "mid" }));
      out.push(S(cyl(x, y, 5, 0, 1.8, 16), { tone: "mid" }));
      out.push(S(slab(LEG(x, y), 1.8, BEAM_Z0 - 1.8, 2, 0.5), { tone: "hi", inner: L(seam(LEG(x, y), 8, 2), { tone: "faint" }) }));
    }
  }
  return out.join("");
}

function beam(plan, front) {
  const inner = L(seam(plan, 29.5, 2) + seam(plan, 38.5, 2), { tone: "mid" });
  const out = [S(slab(plan, BEAM_Z0, BEAM_Z1 - BEAM_Z0, 2, 0.5), { tone: "hi", inner })];
  if (front) {
    const y = plan.y + plan.d;
    const bolts = [];
    for (const x of LEG_X) if (x > plan.x + 6 && x < Math.min(BELT_END, plan.x + plan.w - 6)) bolts.push([x - 5, 34], [x + 5, 34]);
    out.push(screwsY(y, bolts, 1.1));
  }
  return out.join("");
}

function belt() {
  const out = [S(slab(BELT, BELT_Z - 3, 3, 3, 0.4), { tone: "mid", crease: "mid" })];
  // lacing marks between the bottles, one pitch apart, running with them
  const marks = [];
  for (let x = -390; x < BELT_END - 8; x += PITCH) marks.push(k.planOutline({ x: x - 1.4, y: -12.5, w: 2.8, d: 25, r: 1.2 }, BELT_Z, P, 2));
  out.push(a.amLoop(L(marks.join(""), { tone: "lo" }), [PITCH, 0, 0], P, { period: LOOP_MS }));
  return out.join("");
}

const ROLLERS = [160, 173, 186, 199, 212];
function rollers() {
  const out = [];
  for (const x of byDepth(ROLLERS, (x) => [x, 0, 0])) {
    const plan = { x: x - 5, y: -14, w: 10, d: 28, r: 5 };
    out.push(S(slab(plan, BELT_Z - 7, 7, 4), { tone: "hi", inner: L(seam(plan, BELT_Z - 3.5, 4), { tone: "faint" }) }));
  }
  return out.join("");
}

// Guide rails along both sides of the belt, held by clamp blocks standing on the beams.
const CLAMPS = [-330, -210, -90, 34];
const RAIL = (y) => ({ x: X0 + 8, y, w: BELT_END - X0 - 14, d: 1.4, r: 0.6 });
function railBack() {
  const out = [];
  for (const x of byDepth(CLAMPS, (x) => [x, -14, 0])) {
    out.push(S(slab({ x: x - 3, y: -17.5, w: 6, d: 7, r: 0.6 }, BEAM_Z1, RAIL_Z1 - BEAM_Z1, 2, 0.4), { tone: "mid" }));
    out.push(D([at([x, -15.5, RAIL_Z1])], { size: 0.55 }));
  }
  out.push(S(slab(RAIL(-11), RAIL_Z0, RAIL_Z1 - RAIL_Z0, 2), { tone: "hi" }));
  return out.join("");
}
function railFront() {
  const out = [S(slab(RAIL(9.6), RAIL_Z0, RAIL_Z1 - RAIL_Z0, 2), { tone: "hi" })];
  for (const x of byDepth(CLAMPS, (x) => [x, 14, 0])) {
    out.push(S(slab({ x: x - 3, y: 11, w: 6, d: 6.5, r: 0.6 }, BEAM_Z1, RAIL_Z1 - BEAM_Z1, 2, 0.4), { tone: "mid" }));
    out.push(D([at([x, 14.5, RAIL_Z1])], { size: 0.55 }));
  }
  return out.join("");
}

// Things on the front beam's face: roller bearing caps, a scale strip, a label plate, end plate.
function beamFace() {
  const y = FRONT_BEAM.y + FRONT_BEAM.d;
  const out = [];
  const strip = { x: 34, y, w: 52, d: 0.7, r: 0.2 };
  out.push(S(slab(strip, 32, 7.5, 2), { tone: "mid", crease: "none" }));
  const t = k.sideTicks(36, 84, 3, 5, y + 0.7, 39.5, [2, 3.8], P, "x");
  out.push(L(t.minor, { tone: "mid" }), L(t.major, { tone: "hi" }));
  out.push(facePlate(-205, y, 29.5, 42, 10, [30, 20]));
  out.push(D([at([-202.5, y + 0.7, 34.5]), at([-165.5, y + 0.7, 34.5])], { size: 0.5 }));
  return out.join("");
}
function beamFaceRight() {
  const y = FRONT_BEAM_R.y + FRONT_BEAM_R.d;
  const out = [screwsY(y, ROLLERS.map((x) => [x, 36.5]), 1.8)];
  const end = { x: X1, y: -18, w: 3, d: 36, r: 0.5 };
  out.push(S(slab(end, BEAM_Z0, BEAM_Z1 - BEAM_Z0, 2, 0.4), { tone: "hi" }));
  out.push(screwsX(X1 + 3, [[-12, 30], [12, 30], [-12, 38], [12, 38]], 1));
  return out.join("");
}

// Gear motor hanging under the front beam at the infeed end.
function driveMotor() {
  const out = [];
  const mx = -270;
  const my = 28;
  const shelf = { x: mx - 16, y: 18, w: 32, d: 20, r: 1.2 };
  const box = { x: mx - 12, y: 18, w: 24, d: 14, r: 1.4 };
  out.push(S(cyl(mx, my, 8.5, 6, 2, 28), { tone: "mid" }));
  out.push(S(cyl(mx, my, 9, 8, 15.5, 32, 0.5), { tone: "hi", inner: L(k.sideArc(mx, my, 9, 21, P, 28), { tone: "mid" }) }));
  out.push(L(k.knurl(mx, my, 9, 8, 21, 32, P, 0), { tone: "mid" }));
  out.push(S(slab({ x: mx - 4.5, y: my + 8.6, w: 9, d: 4.5, r: 0.6 }, 11, 7, 2, 0.4), { tone: "mid" }));
  out.push(D([at([mx - 2.6, my + 13.1, 18]), at([mx + 2.6, my + 13.1, 18])], { size: 0.5 }));
  out.push(S(slab(shelf, 23.5, 2.5, 2, 0.4), { tone: "mid" }));
  out.push(S(slab(box, 26, 12, 3, 0.6), { tone: "hi", inner: L(seam(box, 31, 3), { tone: "mid" }) }));
  out.push(screwsTop([[box.x + 3.5, box.y + 10], [box.x + box.w - 3.5, box.y + 10]], 38, 1.2));
  return out.join("");
}

// ---------- stations ----------
function column(x, y, w, d, h) {
  const plan = { x: x - w / 2, y: y - d / 2, w, d, r: 1 };
  const bp = { x: plan.x - 6, y: plan.y - 6, w: w + 12, d: d + 12, r: 1.4 };
  const out = [S(slab(bp, 0, 3, 3, 0.5), { tone: "mid" })];
  out.push(screwsTop(k.corners(bp, 3.2), 3, 1.3));
  out.push(S(slab(plan, 3, h - 3, 2, 0.7), { tone: "hi", inner: L(seam(plan, h * 0.3, 2) + seam(plan, h * 0.68, 2), { tone: "mid" }) }));
  out.push(S(slab(k.insetPlan(plan, -1), h, 2, 2, 0.4), { tone: "mid" }));
  return out.join("");
}

// Filler: two columns carry a manifold head over the belt; a nozzle bar under it with three
// nozzles over three bottles; a product tank on top.
const FILL_HEAD = { x: FILL_X - 62, y: -36, w: 124, d: 46, r: 2 };
const FILL_Z = 114;
const FILL_TOP = FILL_Z + 16;
const COLS = [FILL_X - 48, FILL_X + 48];
function fillerBack() {
  const out = [];
  out.push(column(COLS[0], -43, 16, 14, FILL_TOP));
  const hmi = { x: COLS[0] - 18, y: -36, w: 36, d: 7, r: 1.2 };
  out.push(S(slab(hmi, 58, 24, 3, 0.6), { tone: "hi" }));
  const fy = -29;
  const x0 = hmi.x;
  out.push(L(faceY(fy, [[x0 + 3, 62], [x0 + 23, 62], [x0 + 23, 78], [x0 + 3, 78]], true), { tone: "mid" }));
  out.push(L(faceY(fy, [[x0 + 4.6, 63.6], [x0 + 21.4, 63.6], [x0 + 21.4, 76.4], [x0 + 4.6, 76.4]], true), { tone: "lo" }));
  out.push(L(faceY(fy, [[x0 + 7, 72], [x0 + 15, 72]]) + faceY(fy, [[x0 + 7, 69], [x0 + 12, 69]]), { tone: "mid", free: true }));
  out.push(L(k.sideRing([x0 + 29.5, fy, 74], 2, "y", P, 16) + k.sideRing([x0 + 29.5, fy, 66], 2, "y", P, 16), { tone: "mid" }));
  out.push(D([at([x0 + 29.5, fy, 66])], { size: 0.6 }));
  out.push(ink(D([at([x0 + 29.5, fy, 74])], { size: 1, tone: "lit" })));
  out.push(column(COLS[1], -43, 16, 14, FILL_TOP));
  return out.join("");
}
function fillerTop() {
  const out = [];
  // Nozzles: the stem and tip dip out of the fixed collar as the bottles pass under them,
  // timed with the belt (the dip is centred on the moment the bottles stand under the nozzles).
  for (const [i, x] of [FILL_X - PITCH, FILL_X, FILL_X + PITCH].entries()) {
    const stem = [
      S(cyl(x, 0, 3.4, FILL_Z - 27, 2, 18, 0.3), { tone: "mid" }),
      S(cyl(x, 0, 2.4, FILL_Z - 25, 15, 16), { tone: "hi", inner: L(k.sideArc(x, 0, 2.4, FILL_Z - 21, P, 12), { tone: "mid" }) }),
    ].join("");
    out.push(a.amPress(stem, [0, 0, -4], P, { period: LOOP_MS, delay: LOOP_MS * 0.18 + i * 60 }));
    out.push(S(cyl(x, 0, 5, FILL_Z - 15, 7, 24, 0.4), { tone: "hi", inner: L(k.sideArc(x, 0, 5, FILL_Z - 11.5, P, 18), { tone: "mid" }) }));
  }
  const bar = { x: FILL_X - PITCH - 10, y: -7, w: 2 * PITCH + 20, d: 14, r: 1.6 };
  out.push(S(slab(bar, FILL_Z - 8, 8, 3, 0.6), { tone: "hi", inner: L(seam(bar, FILL_Z - 4, 3), { tone: "mid" }) }));
  out.push(screwsY(bar.y + bar.d, [[bar.x + 6, FILL_Z - 2], [FILL_X - 16, FILL_Z - 2], [FILL_X + 16, FILL_Z - 2], [bar.x + bar.w - 6, FILL_Z - 2]], 1));
  const h = FILL_HEAD;
  out.push(S(slab(h, FILL_Z, 16, 3, 1), { tone: "hi", inner: L(seam(h, FILL_Z + 4, 3), { tone: "mid" }) }));
  out.push(L(k.planOutline(k.insetPlan(h, 4), FILL_TOP, P, 3), { tone: "mid" }));
  out.push(screwsTop(k.corners(h, 7.5), FILL_TOP, 1.5));
  const fy = h.y + h.d;
  out.push(facePlate(FILL_X + 12, fy, FILL_Z + 5, 36, 8.5, [26, 16]));
  out.push(screwsY(fy, [[COLS[0], FILL_Z + 10], [COLS[1] + 8, FILL_Z + 10]], 1.2));
  // product tank
  const tx = FILL_X - 10;
  const ty = -13;
  const tz = FILL_TOP;
  out.push(S(cyl(tx, ty, 23, tz, 3, 36, 0.5), { tone: "mid" }));
  out.push(S(cyl(tx, ty, 21, tz + 3, 22, 36, 0.8), {
    tone: "hi",
    inner: L(k.sideArc(tx, ty, 21, tz + 10, P, 40) + k.sideArc(tx, ty, 21, tz + 18, P, 40), { tone: "mid" }),
  }));
  const top = tz + 25;
  out.push(L(k.ring(tx, ty, 17.5, top, P, 48), { tone: "mid" }));
  out.push(D(k.circleRing(tx, ty, 19.2, 14).map(([x, y]) => at([x, y, top])), { size: 0.55 }));
  // inlet stub with flanges, and a gauge
  const ix = tx - 7;
  const iy = ty - 4;
  out.push(S(cyl(ix, iy, 5, top, 1.6, 22), { tone: "mid" }));
  out.push(S(cyl(ix, iy, 3, top + 1.6, 8, 18), { tone: "hi" }));
  out.push(S(cyl(ix, iy, 4.6, top + 9.6, 1.6, 22), { tone: "mid" }));
  out.push(L(k.ring(ix, iy, 1.8, top + 11.2, P, 14), { tone: "mid" }));
  const gx = tx + 9;
  const gy = ty + 6;
  out.push(S(cyl(gx, gy, 1.8, top, 3, 12), { tone: "mid" }));
  out.push(S(cyl(gx, gy, 5.5, top + 3, 2.6, 28, 0.4), { tone: "hi" }));
  const g = k.radialTicks(gx, gy, 4.8, 12, 3, top + 5.6, [0.7, 1.3], P, -2.4, 4.8);
  out.push(L(g.minor, { tone: "mid" }), L(g.major, { tone: "hi" }));
  out.push(L(k.lineOnTop([gx, gy], [gx + 3.2, gy - 1.6], top + 5.6, P), { tone: "hi" }));
  out.push(D([at([gx, gy, top + 5.6])], { size: 0.6, tone: "hi" }));
  return out.join("");
}

// Capper: a column, an arm over the belt, a finned spindle motor on top, a spindle, a chuck;
// the cap hovers between the chuck and the bottle neck.
const ARM = { x: CAP_X - 11, y: -40, w: 22, d: 52, r: 1.6 };
const ARM_Z = 118;
function capperBack() {
  return column(CAP_X, -47, 20, 14, ARM_Z + 12);
}
function capperTop() {
  const out = [];
  const nz = BELT_Z + NECK_TOP;
  const chuckZ = nz + CAP_LIFT + CAP_H + 7;
  out.push(S(cyl(CAP_X, 0, 6.5, chuckZ, 6, 28, 0.4), { tone: "hi", inner: L(k.sideArc(CAP_X, 0, 6.5, chuckZ + 4.4, P, 20), { tone: "mid" }) }));
  // The chuck spins: its knurl is a flipbook of the ribs stepped round by quarter pitches.
  const frames = [0, 1, 2, 3].map((f) => L(knurlAt(CAP_X, 0, 6.5, chuckZ, chuckZ + 4.4, 26, (f / 4) * ((2 * Math.PI) / 26)), { tone: "mid" }));
  out.push(a.amFlip(frames, { period: 360 }));
  out.push(S(cyl(CAP_X, 0, 4, chuckZ + 6, 2, 20), { tone: "mid" }));
  const houseZ = ARM_Z - 10;
  out.push(S(cyl(CAP_X, 0, 3, chuckZ + 8, houseZ - chuckZ - 8, 16), { tone: "hi", inner: L(k.sideArc(CAP_X, 0, 3, chuckZ + 11, P, 12), { tone: "mid" }) }));
  out.push(S(cyl(CAP_X, 0, 9, houseZ, 10, 32, 0.5), { tone: "hi", inner: L(k.sideArc(CAP_X, 0, 9, houseZ + 5, P, 24), { tone: "mid" }) }));
  out.push(S(slab(ARM, ARM_Z, 12, 3, 0.8), { tone: "hi", inner: L(seam(ARM, ARM_Z + 4, 3), { tone: "mid" }) }));
  out.push(screwsTop([[CAP_X - 6, -35], [CAP_X + 6, -35], [CAP_X - 6, -24], [CAP_X + 6, -24]], ARM_Z + 12, 1.3));
  out.push(facePlate(CAP_X - 8, ARM.y + ARM.d, ARM_Z + 2, 16, 8, [9, 6]));
  const mz = ARM_Z + 12;
  out.push(S(cyl(CAP_X, 0, 10, mz, 2.5, 36, 0.4), { tone: "mid" }));
  out.push(S(cyl(CAP_X, 0, 9, mz + 2.5, 15, 36, 0.5), { tone: "hi", inner: L(k.sideArc(CAP_X, 0, 9, mz + 14.5, P, 28), { tone: "mid" }) }));
  out.push(L(k.knurl(CAP_X, 0, 9, mz + 2.5, mz + 14.5, 36, P, 0), { tone: "mid" }));
  out.push(L(k.ring(CAP_X, 0, 6, mz + 17.5, P, 28), { tone: "mid" }));
  out.push(S(cyl(CAP_X, 0, 2.6, mz + 17.5, 2, 16), { tone: "mid" }));
  return out.join("");
}

// Labeller: a cabinet behind the belt with a deck of reels, and an applicator head reaching
// to the bottle.
const CAB = { x: LAB_X - 44, y: -64, w: 88, d: 34, r: 1.6 };
const CAB_TOP = 56;
function labellerBack() {
  const out = [];
  out.push(S(slab(CAB, 0, CAB_TOP, 3, 0.8), { tone: "hi", inner: L(seam(CAB, 5, 3), { tone: "mid" }) }));
  const fy = CAB.y + CAB.d;
  const x0 = CAB.x;
  out.push(L(faceY(fy, [[x0 + 4, 9], [x0 + 42, 9], [x0 + 42, 51], [x0 + 4, 51]], true) + faceY(fy, [[x0 + 46, 9], [x0 + 84, 9], [x0 + 84, 51], [x0 + 46, 51]], true), { tone: "mid" }));
  out.push(L([0, 1, 2, 3].map((i) => faceY(fy, slotPts(x0 + 9, x0 + 27, 45 - i * 3.4, 1.6), true)).join(""), { tone: "lo" }));
  out.push(L(faceY(fy, slotPts(x0 + 36, x0 + 38.4, 30, 12), true) + faceY(fy, slotPts(x0 + 49.6, x0 + 52, 30, 12), true), { tone: "hi" }));
  const deck = { x: CAB.x - 2, y: CAB.y - 2, w: CAB.w + 4, d: CAB.d + 4, r: 1.8 };
  out.push(S(slab(deck, CAB_TOP, 3, 3, 0.6), { tone: "mid" }));
  const dz = CAB_TOP + 3;
  out.push(screwsTop(k.corners(deck, 4), dz, 1.2));
  const reel = (x, y, r, hub) => {
    out.push(S(cyl(x, y, hub + 1.6, dz, 2, 20), { tone: "mid" }));
    out.push(S(cyl(x, y, r, dz + 2, 1.4, 30), { tone: "mid" }));
    out.push(S(cyl(x, y, r - 2.6, dz + 3.4, 7, 30, 0.4), { tone: "hi", inner: L(k.sideArc(x, y, r - 2.6, dz + 7, P, 28), { tone: "faint" }) }));
    out.push(L(k.ring(x, y, r - 5.6, dz + 10.4, P, 32), { tone: "mid" }));
    out.push(S(cyl(x, y, hub, dz + 10.4, 2.6, 18), { tone: "mid" }));
    out.push(L(k.planOutline({ x: x - hub * 0.6, y: y - 0.5, w: hub * 1.2, d: 1, r: 0.5 }, dz + 13, P, 3), { tone: "mid" }));
  };
  reel(LAB_X - 22, -48, 16, 4);
  reel(LAB_X + 24, -48, 11, 3);
  for (const gx of [LAB_X - 3, LAB_X + 9]) {
    out.push(S(cyl(gx, -33, 2, dz, 10, 14), { tone: "hi" }));
    out.push(D([at([gx, -33, dz + 10])], { size: 0.55 }));
  }
  return out.join("");
}
function labellerHead() {
  const out = [];
  const arm = { x: LAB_X - 7, y: -30, w: 14, d: 9.8, r: 0.8 };
  out.push(S(slab(arm, 49, 7, 2, 0.5), { tone: "mid" }));
  const head = { x: LAB_X - 11, y: -20.2, w: 22, d: 10.4, r: 1.2 };
  out.push(S(slab(head, 52, 13, 3, 0.6), { tone: "hi", inner: L(seam(head, 56, 3), { tone: "mid" }) }));
  out.push(D([at([LAB_X - 6, head.y + 5, 65]), at([LAB_X + 6, head.y + 5, 65])], { size: 0.55 }));
  return out.join("");
}

// Inspection tunnel: a housing on feet that the belt runs into. Bottles enter through its far
// (hidden) side, so it is drawn after them and covers them; the roller table leaves through its
// near end face and is drawn after it.
function tunnel() {
  const out = [];
  for (const [x, y] of byDepth(k.corners(TUN, 5))) out.push(S(cyl(x, y, 4.5, 0, 4, 16), { tone: "mid" }));
  const t = TUN;
  out.push(S(slab(t, 4, TUN_Z - 4, 3, 1), { tone: "hi", inner: L(seam(t, 22, 3) + seam(t, 96, 3), { tone: "mid" }) }));
  const fy = t.y + t.d;
  // inspection window, label plate and screws on the front face
  const wx0 = t.x + 6;
  const wx1 = t.x + t.w - 6;
  out.push(L(faceY(fy, [[wx0, 50], [wx1, 50], [wx1, 88], [wx0, 88]], true), { tone: "mid" }));
  out.push(L(faceY(fy, [[wx0 + 2, 52], [wx1 - 2, 52], [wx1 - 2, 86], [wx0 + 2, 86]], true), { tone: "lo" }));
  out.push(screwsY(fy, [[wx0 + 3, 47], [wx1 - 3, 47], [wx0 + 3, 91], [wx1 - 3, 91]], 1));
  out.push(facePlate(t.x + 10, fy, 28, 30, 11, [20, 13]));
  out.push(L([0, 1, 2].map((i) => faceY(fy, slotPts(t.x + 10, t.x + 26, 15 - i * 3.4, 1.6), true)).join(""), { tone: "lo" }));
  // the exit opening on the near end face
  const ex = t.x + t.w;
  out.push(L(faceX(ex, [[-22, 24], [22, 24], [22, 96 - 6], [-22, 96 - 6]], true), { tone: "mid" }));
  // roof: cap plate, camera box, stack lamp with the blinking violet LED ring
  const roof = k.insetPlan(t, 3);
  out.push(L(k.planOutline(roof, TUN_Z, P, 3), { tone: "mid" }));
  out.push(screwsTop(k.corners(t, 6), TUN_Z, 1.3));
  const cam = { x: t.x + 10, y: -12, w: 18, d: 14, r: 1.6 };
  out.push(S(slab(cam, TUN_Z, 9, 3, 0.6), { tone: "hi", inner: L(seam(cam, TUN_Z + 3, 3), { tone: "mid" }) }));
  out.push(D(k.dotGrid(cam.x + 4, cam.y + 4, 4, 3, 3, TUN_Z + 9, P), { size: 0.5, tone: "mid" }));
  const lx = t.x + 38;
  const ly = -14;
  const lz = TUN_Z;
  out.push(S(cyl(lx, ly, 6, lz, 2.4, 28, 0.4), { tone: "mid" }));
  out.push(S(cyl(lx, ly, 2.6, lz + 2.4, 4.5, 16), { tone: "hi" }));
  out.push(S(cyl(lx, ly, 4.8, lz + 6.9, 9, 28, 0.4), { tone: "hi", inner: L(k.sideArc(lx, ly, 4.8, lz + 11.4, P, 20), { tone: "mid" }) }));
  const ledDot = [lx + 4.8 * Math.cos(1.1), ly + 4.8 * Math.sin(1.1), lz + 11.4];
  out.push(a.amBlink(ink(L(k.sideArc(lx, ly, 4.8, lz + 9, P, 20) + k.sideArc(lx, ly, 4.8, lz + 13.8, P, 20), { tone: "lit" }) + D([at(ledDot)], { size: 1.3, tone: "lit" })), { period: 2800, delay: 600 }));
  out.push(S(cyl(lx, ly, 5.2, lz + 15.9, 2, 28, 0.4), { tone: "mid" }));
  out.push(D([at([lx, ly, lz + 17.9])], { size: 0.55 }));
  return out.join("");
}

// ---------- crate on its table ----------
const TABLE = { x: 236, y: -32, w: 76, d: 64, r: 1.6 };
const CRATE = { x: 248, y: -23, w: 50, d: 46, r: 1.6 };
const CRATE_Z = STAND_TOP + 1;
const CRATE_H = 30;
function crate() {
  const out = [halo(k.insetPlan(TABLE, -4), 0, 1, 4)];
  for (const [x, y] of byDepth(k.corners(TABLE, 6))) {
    out.push(S(cyl(x, y, 4, 0, 1.8, 14), { tone: "mid" }));
    out.push(S(slab({ x: x - 2.5, y: y - 2.5, w: 5, d: 5, r: 0.6 }, 1.8, STAND_TOP - 3 - 1.8, 2, 0.4), { tone: "hi" }));
  }
  out.push(S(slab(TABLE, STAND_TOP - 3, 3, 3, 0.7), { tone: "hi", inner: L(seam(TABLE, STAND_TOP - 1.5, 3), { tone: "mid" }) }));
  out.push(screwsTop(k.corners(TABLE, 4), STAND_TOP, 1.2));
  const c = CRATE;
  const t = 2.4;
  const z0 = CRATE_Z;
  out.push(S(slab(c, STAND_TOP, 1, 3), { tone: "mid" }));
  out.push(S(slab({ x: c.x, y: c.y, w: c.w, d: t, r: 0.6 }, z0, CRATE_H, 2, 0.5), { tone: "hi" }));
  out.push(S(slab({ x: c.x, y: c.y + t, w: t, d: c.d - 2 * t, r: 0.4 }, z0, CRATE_H, 2, 0.5), { tone: "hi" }));
  const xs = [c.x + t + 10.4, c.x + c.w - t - 10.4];
  for (const x of xs) out.push(bottle(x, -11, z0, "labelled"));
  out.push(S(slab({ x: c.x + t, y: -0.7, w: c.w - 2 * t, d: 1.4, r: 0.3 }, z0, CRATE_H - 8, 2), { tone: "mid" }));
  for (const x of xs) out.push(bottle(x, 11, z0, "labelled"));
  const right = { x: c.x + c.w - t, y: c.y + t, w: t, d: c.d - 2 * t, r: 0.4 };
  const fx = c.x + c.w;
  out.push(S(slab(right, z0, CRATE_H, 2, 0.5), { tone: "hi", inner: L(faceX(fx, slotPts(-9, 9, z0 + CRATE_H - 6.5, 5.4), true) + seam(right, z0 + 5, 2), { tone: "mid" }) }));
  const front = { x: c.x, y: c.y + c.d - t, w: c.w, d: t, r: 0.6 };
  const fy = c.y + c.d;
  const ribs = [c.x + 12.5, c.x + 25, c.x + 37.5].map((x) => faceY(fy, [[x, z0], [x, z0 + CRATE_H - 11]])).join("");
  out.push(S(slab(front, z0, CRATE_H, 2, 0.5), {
    tone: "hi",
    inner: L(seam(front, z0 + CRATE_H - 11, 2), { tone: "mid" }) + L(ribs, { tone: "mid" }) + L(faceY(fy, slotPts(c.x + 16, c.x + 34, z0 + CRATE_H - 5.5, 5.4), true), { tone: "mid" }),
  }));
  out.push(D([at([c.x + 5, fy, z0 + 4]), at([c.x + c.w - 5, fy, z0 + 4])], { size: 0.5 }));
  return out.join("");
}

// ---------- assemble ----------
function back() {
  const items = [
    { key: [FILL_X, -43, 0], svg: fillerBack() },
    { key: [CAP_X, -47, 0], svg: capperBack() },
    { key: [LAB_X, -47, 0], svg: labellerBack() },
  ];
  return byDepth(items, (i) => i.key).map((i) => i.svg).join("");
}

const body = [
  halo({ x: X0 - 6, y: -24, w: X1 - X0 + 12, d: 48, r: 6 }, 0, 1, 6),
  halo({ x: FILL_X - 72, y: -58, w: 144, d: 30, r: 4 }, 0, 1, 4),
  halo(k.insetPlan(CAB, -3), 0, 1, 4),
  back(),
  legs(),
  beam(BACK_BEAM, false),
  belt(),
  railBack(),
  labellerHead(),
  bottles(),
  railFront(),
  beam(FRONT_BEAM, true),
  beamFace(),
  driveMotor(),
  infeedCabinet(),
  fillerTop(),
  capperTop(),
  tunnel(),
  beam(BACK_BEAM_R, false),
  rollers(),
  bottle(186, 0, BELT_Z, "labelled"),
  beam(FRONT_BEAM_R, true),
  beamFaceRight(),
  crate(),
];
if (process.env.SIZES) {
  const names = ["halo", "halo", "halo", "back", "legs", "beamB", "belt", "railBack", "labHead", "bottles", "railFront", "beamF", "beamFace", "motor", "infeed", "filler", "capper", "tunnel", "beamBR", "rollers", "rbottle", "beamFR", "faceR", "crate"];
  body.forEach((b, i) => console.log(names[i], (b.length / 1024).toFixed(1), (b.match(/iso-solid/g) || []).length));
}

const name = light ? "bottling-line-light" : "bottling-line";
const svg = a.assetSvg({
  width: W,
  height: H,
  label: "An isometric bottling line: a belt conveyor carries bottles through a filler, a capper, a labeller and an inspection tunnel to a crate, running: bottles travel along the belt, the filler nozzles dip, a violet cap drops from the spinning capper chuck onto a bottle, and the inspection tunnel's violet light blinks.",
  body: body.join(""),
  paper: PAPER,
  accents: { brand: BRAND, glass: GLASS, led: { hex: BRAND, mode: "ink" } },
  weight: 0.9,
  id: name,
});
writeFileSync(join(HERE, `${name}.svg`), svg);
writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W }));
console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB) and ${name}.html, scale ${P.scale.toFixed(3)}`);
