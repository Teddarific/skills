// A feature tile for Halden, a clean-energy company ("Power that renews itself"): the corner
// of a small modern house as a diorama on a cut ground slab. Solar panels on low-tilt racks
// on the flat roof, a wall-mounted home battery whose LED gauge fills segment by segment, an
// outdoor heat pump on its pad, a wooden deck with a planter tree and a stepping-stone path,
// and a small electric car on the drive, plugged into a wall charger on a post by a coiled
// cable. The battery and the charger carry the green accent.
//
// Every part is recorded with the audit's recorder, so the painter's keys are settled from
// geometry (`A.settle`) and `node build.mjs --audit` proves the cable, the wheels and the
// supports.
//
//   node build.mjs          light → energy-home.svg, energy-home.html
//   node build.mjs --dark   dark  → energy-home-dark.svg, energy-home-dark.html

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const dark = process.argv.includes("--dark");
const PAPER = dark ? "#0d100e" : "#f4f3ee";
const BRAND = "#1f8f5f";

const W = 640;
const H = 480;
const REGION = { x: 0, y: 0, w: W, h: H };
const DEG = Math.PI / 180;

// ---------- world ----------
// +x runs to the screen right (the drive), +y to the screen left (the garden). The house is
// cut by the slab's back edges, so its outer walls are the +y front and the +x side.
const BASE = { x: -124, y: -124, w: 210, d: 129, r: 3 };      // x -124..86, y -124..5
const BASE_Z = -14;
const HOUSE = { x: -124, y: -124, w: 104, d: 94, r: 1 };      // x -124..-20, y -124..-30
const PLINTH_H = 8;
const EAVE = 64;                                               // wall top / roof underside
const ROOF_T = 3.5;
const RT = EAVE + ROOF_T;                                      // roof surface 67.5
const FRONT = HOUSE.y + HOUSE.d;                               // y = -30
const SIDE = HOUSE.x + HOUSE.w;                                // x = -20

const P = a.fitInto(
  [
    ...k.boxCorners(BASE, BASE_Z, 0),
    ...k.boxCorners({ ...HOUSE, w: HOUSE.w + 2, d: HOUSE.d + 2 }, 0, RT + 9),
    [-116, -14, 48],
  ],
  REGION,
  { pad: 30, azimuth: 52, elevation: 32 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const ac = (name) => (svg) => `<g class="ac-${name}">${svg}</g>`;
const brand = ac("brand");
const led = ac("led");
const wood = ac("wood");
const grass = ac("grass");
const brick = ac("brick");
const glass = ac("glass");
const cell = ac("cell");
const ebony = ac("ebony");
const leaf = ac("leaf");
const halo = (plan, z, blur = 0, h = 0.1) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ""}/>`;

// Closed outlines and points in a vertical face plane.
// face "y": the plane y = c, u along x.  face "x": the plane x = c, u along y.
const fp = (face, c, u, z) => at(face === "y" ? [u, c, z] : [c, u, z]);
function faceRect(face, c, u0, u1, z0, z1, r = 0, steps = 3) {
  const ring = k.roundedPlan({ x: u0, y: z0, w: u1 - u0, d: z1 - z0, r }, steps);
  return k.pathOf(ring.map(([u, v]) => fp(face, c, u, v)), true);
}
const faceLine = (face, c, u0, z0, u1, z1) => k.pathOf([fp(face, c, u0, z0), fp(face, c, u1, z1)]);

// ---------- recorder ----------
const R = A.recorder(P);
const GROUND = "stand.ground";
function box(name, plan, z, h, { tone = "mid", steps = 3, bevel = 0.4, inner = "", extra = "", owner, bias = 0, wrap = (s) => s, lit, crease } = {}) {
  const id = R.nameFor(name);
  const svg = wrap(S(k.slabOf(plan, z, h, P, steps, bevel), { tone, inner, lit, crease })) + extra;
  return R.put({ name: id, at: [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], bias, svg, shapes: [R.solid(A.slab(plan, z, h, { name: id, owner }, steps))] });
}
function cyl(name, cx, cy, r, z, h, { tone = "mid", steps = 24, bevel = 0, inner = "", extra = "", owner, bias = 0, wrap = (s) => s } = {}) {
  const id = R.nameFor(name);
  const svg = wrap(S(k.cylinder(cx, cy, r, z, h, P, steps, bevel), { tone, inner })) + extra;
  return R.put({ name: id, at: [cx, cy, z + h / 2], bias, svg, shapes: [R.solid(A.cylinder(cx, cy, r, z, h, { name: id, owner }))] });
}
function ball(name, c, r, { tone = "mid", owner, wrap = (s) => s, bias = 0, extra = "" } = {}) {
  const id = R.nameFor(name);
  const svg = wrap(S(G.sphereOf(c, r, P, { steps: 56 }), { tone })) + extra;
  return R.put({ name: id, at: c, bias, svg, shapes: [R.solid(A.ball(c, r, { name: id, owner }))] });
}
function prism(name, F, poly, s0, s1, { tone = "mid", extra = "", owner, bias = 0, wrap = (s) => s, inner = "" } = {}) {
  const id = R.nameFor(name);
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  const c = G.add3(F.o, G.add3(G.mul3(F.a, (s0 + s1) / 2), G.add3(G.mul3(F.u, cx), G.mul3(F.v, cy))));
  const svg = wrap(S(G.prismOf(F, poly, s0, s1, P), { tone, inner })) + extra;
  return R.put({ name: id, at: c, bias, svg, shapes: [R.solid(A.prism(F, poly, s0, s1, { name: id, owner }))] });
}
function disc(name, F, s0, s1, r, { tone = "mid", extra = "", owner, bias = 0, wrap = (s) => s, bevel = 0 } = {}) {
  const id = R.nameFor(name);
  const svg = wrap(S(G.disc(s0, s1, r, F, P, { bevel }), { tone })) + extra;
  return R.put({ name: id, at: G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), bias, svg, shapes: [R.solid(A.disc(F, s0, s1, r, { name: id, owner }))] });
}
function cable(name, points, r, { tone = "mid", rims, owner, maxLength = 10 } = {}) {
  const id = R.nameFor(name);
  const route = G.fillet(points, 3.2, 7, { P, tube: r });
  R.route(id, route, r, { owner: owner ?? id, limp: true, rims });
  for (const [index, part] of tubePieces(route, r, P, { maxLength, spacing: 0.8, rings: { pitch: 1.3, fade: [0.1, 0.55], tone: "lo" } }).entries())
    R.put({ name: `${id}:${index}`, at: part.mid, svg: tubeSvg(part, { tone }), route: id, chunk: index, shapes: [A.tube(part.points, part.radii)] });
  return { id, route };
}
const YF = (o) => G.frameOf(o, [0, 1, 0], [0, 0, 1], [1, 0, 0]);   // axis +y

// ---------- ground (back layer, recorded as the stand) ----------
const back = [];
const LAWN = { x: BASE.x, y: FRONT, w: SIDE + 6 - BASE.x, d: BASE.y + BASE.d - FRONT, r: 0 };  // x -124..-14
const DRIVE = { x: SIDE + 6, y: BASE.y, w: BASE.x + BASE.w - SIDE - 6, d: BASE.d, r: 0 };       // x -14..112
function ground() {
  back.push(halo(k.insetPlan(BASE, -6), BASE_Z, 8, 2));
  const seams = [-5, -9.5].map((z) => L(k.sideSeam(BASE, z, P, 3), { tone: "faint" })).join("");
  back.push(S(k.slabOf(BASE, BASE_Z, -2 - BASE_Z, P, 3, 0), { tone: "lo", crease: "none", inner: seams }));
  R.solid(A.slab(BASE, BASE_Z, -2 - BASE_Z, { name: "stand.base", owner: GROUND }, 3));
  back.push(grass(S(k.slabOf(LAWN, -2, 2, P, 2, 0), { tone: "mid" })));
  R.solid(A.slab(LAWN, -2, 2, { name: "stand.lawn", owner: GROUND }, 2));
  // the drive: concrete bays with saw-cut joints that run edge to edge
  const joints = [];
  for (const x of [36]) joints.push(k.lineOnTop([x, DRIVE.y], [x, DRIVE.y + DRIVE.d], 0, P));
  joints.push(k.lineOnTop([DRIVE.x, -24], [DRIVE.x + DRIVE.w, -24], 0, P));
  back.push(S(k.slabOf(DRIVE, -2, 2, P, 2, 0), { tone: "mid", inner: "" }) + L(joints.join(""), { tone: "faint" }));
  R.solid(A.slab(DRIVE, -2, 2, { name: "stand.drive", owner: GROUND }, 2));
}

// ---------- house ----------
function house() {
  const plinth = k.insetPlan(HOUSE, -0.8);
  const courses = [2, 4, 6].map((z) => L(k.sideSeam(plinth, z, P, 2), { tone: "faint" })).join("");
  box("house.plinth", { ...plinth, x: HOUSE.x, y: HOUSE.y, w: HOUSE.w + 0.8, d: HOUSE.d + 0.8 }, 0, PLINTH_H, { tone: "mid", steps: 2, bevel: 0, inner: courses, wrap: brick, owner: "house" });
  // render walls with a band joint at the floor line and the corner's quoin joints
  const band = L(k.sideSeam(HOUSE, 36, P, 2), { tone: "faint" });
  box("house.walls", HOUSE, PLINTH_H, EAVE - PLINTH_H, { tone: "mid", steps: 2, bevel: 0, inner: band, owner: "house" });
  // the roof slab with a fascia line, the parapet on the two outer edges
  const roof = { x: HOUSE.x, y: HOUSE.y, w: HOUSE.w + 2.5, d: HOUSE.d + 2.5, r: 1 };
  box("house.roof", roof, EAVE, ROOF_T, { tone: "mid", steps: 2, bevel: 0, inner: L(k.sideSeam(roof, EAVE + 1.2, P, 2), { tone: "faint" }), owner: "house" });
  const RX1 = roof.x + roof.w;
  const RY1 = roof.y + roof.d;
  box("house.parapet", { x: roof.x, y: RY1 - 2.6, w: roof.w, d: 2.6, r: 0.4 }, RT, 2.4, { tone: "mid", steps: 2, bevel: 0.4, owner: "house" });
  box("house.parapet", { x: RX1 - 2.6, y: roof.y, w: 2.6, d: roof.d - 2.6, r: 0.4 }, RT, 2.4, { tone: "mid", steps: 2, bevel: 0.4, owner: "house" });
  // downpipe at the corner, with two wall clips
  const dp = [SIDE + 1.3, FRONT + 1.3];
  const clips = [16, 40].map((z) => L(k.sideArc(dp[0], dp[1], 1.3, z, P, 12), { tone: "lo" }) + L(k.sideArc(dp[0], dp[1], 1.3, z + 1.2, P, 12), { tone: "lo" })).join("");
  cyl("house.downpipe", dp[0], dp[1], 1.3, 2, EAVE - 8, { tone: "mid", steps: 16, owner: "house", inner: clips });
  box("house.hopper", { x: dp[0] - 2.2, y: dp[1] - 2.2, w: 4.4, d: 4.4, r: 0.6 }, EAVE - 6, 6, { tone: "mid", steps: 2, bevel: 0.3, owner: "house" });
  cyl("house.shoe", dp[0], dp[1], 1.8, 0, 2, { tone: "mid", steps: 16, owner: "house" });
}

// The big window in the front wall, and a tall narrow one in the side wall.
function windows() {
  const fy = FRONT;
  const [x0, x1, z0, z1] = [-112, -84, 22, 54];
  box("window.frame", { x: x0, y: fy, w: x1 - x0, d: 1.2, r: 0 }, z0, z1 - z0, { tone: "mid", steps: 1, bevel: 0, wrap: ebony, owner: "window" });
  const gy = fy + 1.2;
  const glare = L(faceLine("y", gy + 0.3, -110.2, 31, -103.6, 44) + faceLine("y", gy + 0.3, -107.6, 23.8, -98.8, 38.6), { tone: "lo" });
  box("window.glass", { x: x0 + 1.8, y: gy, w: x1 - x0 - 3.6, d: 0.3, r: 0 }, z0 + 1.8, z1 - z0 - 3.6, { tone: "faint", steps: 1, bevel: 0, crease: "none", wrap: glass, owner: "window", extra: glass(glare) });
  box("window.mullion", { x: -98.8, y: gy, w: 1.6, d: 0.8, r: 0 }, z0 + 1.8, z1 - z0 - 3.6, { tone: "mid", steps: 1, bevel: 0, wrap: ebony, owner: "window" });
  box("window.transom", { x: x0 + 1.8, y: gy, w: -98.8 - x0 - 1.8, d: 0.8, r: 0 }, 44, 1.4, { tone: "mid", steps: 1, bevel: 0, wrap: ebony, owner: "window" });
  box("window.transom", { x: -97.2, y: gy, w: x1 - 1.8 + 97.2, d: 0.8, r: 0 }, 44, 1.4, { tone: "mid", steps: 1, bevel: 0, wrap: ebony, owner: "window" });
  box("window.sill", { x: x0 - 2, y: fy, w: x1 - x0 + 4, d: 3.4, r: 0.4 }, z0 - 1.6, 1.6, { tone: "mid", steps: 2, bevel: 0.3, owner: "window" });

  const sx = SIDE;
  const [y0, y1, w0, w1] = [-108, -96, 20, 56];
  box("window.side-frame", { x: sx, y: y0, w: 1.2, d: y1 - y0, r: 0 }, w0, w1 - w0, { tone: "mid", steps: 1, bevel: 0, wrap: ebony, owner: "window2" });
  box("window.side-glass", { x: sx + 1.2, y: y0 + 1.6, w: 0.3, d: y1 - y0 - 3.2, r: 0 }, w0 + 1.6, w1 - w0 - 3.2, { tone: "faint", steps: 1, bevel: 0, crease: "none", wrap: glass, owner: "window2", extra: glass(L(faceLine("x", sx + 1.5, -106.4, 30, -97.6, 45), { tone: "lo" })) });
  box("window.side-sill", { x: sx, y: y0 - 1.5, w: 3, d: y1 - y0 + 3, r: 0.4 }, w0 - 1.4, 1.4, { tone: "mid", steps: 2, bevel: 0.3, owner: "window2" });
}

// An isolator for the charger circuit and a wall lamp, on the side wall.
function sideFittings() {
  const sx = SIDE;
  // isolator: a box with a rotary handle on its face, a conduit down into the plinth
  const iso = { x: sx, y: -58, w: 2.8, d: 6, r: 0.6 };
  const fx = sx + iso.w;
  box("side.isolator", iso, 22, 8, { tone: "hi", steps: 2, bevel: 0.3, owner: "side", extra: L(faceRect("x", fx, -56.8, -53.2, 23.4, 25.4, 0.4, 2), { tone: "lo" }) + D([fp("x", fx, -56.6, 29), fp("x", fx, -53.4, 29)], { size: 0.32 }) });
  box("side.handle", { x: fx, y: -55.6, w: 1.4, d: 1.2, r: 0.4 }, 25.8, 3.4, { tone: "hi", steps: 2, owner: "side", wrap: brand });
  box("side.conduit", { x: sx, y: -55.8, w: 1.6, d: 1.6, r: 0.5 }, PLINTH_H, 22 - PLINTH_H, { tone: "mid", steps: 2, owner: "side" });
  // wall lamp: back plate, a hood and a glass
  box("side.lamp-plate", { x: sx, y: -80, w: 0.8, d: 5, r: 0.4 }, 40, 8, { tone: "mid", steps: 2, owner: "side", wrap: ebony });
  box("side.lamp-hood", { x: sx + 0.8, y: -79.5, w: 4, d: 4, r: 0.6 }, 45.4, 2, { tone: "mid", steps: 2, bevel: 0.3, owner: "side", wrap: ebony });
  box("side.lamp-glass", { x: sx + 1.2, y: -79, w: 3, d: 3, r: 0.6 }, 41.4, 4, { tone: "hi", steps: 2, owner: "side", wrap: glass });
}

// ---------- the home battery ----------
const BAT = { x: -72, y: FRONT, w: 11, d: 5, r: 1.6 };
const BAT_Z = [12, 52];
const SEGS = 5;
function battery() {
  const [z0, z1] = BAT_Z;
  const fy = BAT.y + BAT.d;
  const seams = L(k.sideSeam(BAT, z1 - 3, P, 3), { tone: "faint" });
  const id = R.nameFor("battery.case");
  const out = [];
  out.push(S(k.slabOf(BAT, z0, z1 - z0, P, 3, 0.5), { tone: "hi", inner: seams }));
  // cap screws and the vent slots under the cap seam
  out.push(L([0, 1, 2, 3].map((i) => faceRect("y", fy, -70.2 + i * 2.2, -69.2 + i * 2.2, z0 + 3, z0 + 6.5, 0.4, 2)).join(""), { tone: "lo" }));
  out.push(D([fp("y", fy, -70.4, z1 - 1.5), fp("y", fy, -62.6, z1 - 1.5)], { size: 0.4 }));
  R.put({ name: id, at: [BAT.x + BAT.w / 2, BAT.y + BAT.d / 2, (z0 + z1) / 2], svg: out.join(""), shapes: [R.solid(A.slab(BAT, z0, z1 - z0, { name: id, owner: "battery" }, 3))] });

  // the LED gauge: a dark strip, five cells in recesses, filling in sequence
  const strip = { x: -68.4, y: fy, w: 4.4, d: 0.5, r: 0.4 };
  const SZ = [22, 41.4];
  const sy = fy + 0.5;
  const cellZ = (i) => [SZ[0] + 1.2 + i * 3.6, SZ[0] + 1.2 + i * 3.6 + 2.6];
  const lit = [];
  for (let i = 0; i < SEGS; i++) {
    const [c0, c1] = cellZ(i);
    lit.push(`<g class="eh-seg eh-seg-${i}">${brand(S(k.slabOf({ x: -67.4, y: sy, w: 2.4, d: 0.25, r: 0.3 }, c0, c1 - c0, P, 2), { tone: "hi", crease: "none", lit: true }))}</g>`);
  }
  const holes = L(Array.from({ length: SEGS }, (_, i) => faceRect("y", sy, -67.4, -65, ...cellZ(i), 0.3, 2)).join(""), { tone: "lo" });
  box("battery.strip", strip, SZ[0], SZ[1] - SZ[0], { tone: "mid", steps: 2, bevel: 0, wrap: ebony, owner: "battery", extra: ebony(holes) + lit.join("") });
  // the badge: a green plate with a leaf mark, two screws
  const by = sy;
  const BZ = 45.1;
  const mark = k.pathOf([[-65.5, BZ + 1.5], [-67, BZ - 0.1], [-65.4, BZ + 0.1], [-66.9, BZ - 1.5]].map(([u, z]) => fp("y", by + 0.6, u, z)));
  const ring = k.sideRing([-66.2, by + 0.6, BZ], 2.2, "y", P, 24);
  box("battery.badge", { x: -68.8, y: fy, w: 5.2, d: 1.1, r: 0.6 }, BZ - 2.9, 5.8, { tone: "hi", steps: 2, bevel: 0.3, wrap: brand, owner: "battery", extra: brand(L(ring, { tone: "hi" }) + L(mark, { tone: "hi", free: true })) });
  // wall bracket lugs, a cable gland and the PV conduit up to the roof
  box("battery.lug", { x: -71, y: FRONT - 0, w: 2, d: 5.6, r: 0.4 }, z1, 1.4, { tone: "lo", steps: 2, owner: "battery" });
  box("battery.lug", { x: -63, y: FRONT - 0, w: 2, d: 5.6, r: 0.4 }, z1, 1.4, { tone: "lo", steps: 2, owner: "battery" });
  box("battery.gland", { x: -68.5, y: FRONT, w: 4, d: 3.6, r: 0.8 }, z0 - 3, 3, { tone: "mid", steps: 2, owner: "battery" });
  box("battery.conduit", { x: -67.6, y: FRONT, w: 2.2, d: 1.8, r: 0.6 }, z1, EAVE - z1, { tone: "mid", steps: 2, owner: "battery" });
  box("battery.conduit", { x: -67.6, y: FRONT, w: 2.2, d: 1.8, r: 0.6 }, PLINTH_H, z0 - 3 - PLINTH_H, { tone: "mid", steps: 2, owner: "battery" });
}

// ---------- heat pump ----------
const HP = { x: -55, y: -25, w: 27, d: 12, r: 1.4 };
const HP_Z = [4.4, 28];
function heatPump() {
  const pad = { x: -58, y: -29.6, w: 33, d: 20, r: 0.8 };
  back.push(halo(k.insetPlan(pad, -2), 0, 2));
  box("hp.pad", pad, 0, 1.6, { tone: "lo", steps: 2, bevel: 0.3, owner: "hp" });
  for (const [x, y] of k.corners(HP, 3)) box("hp.foot", { x: x - 1.8, y: y - 2.5, w: 3.6, d: 5, r: 0.5 }, 1.6, HP_Z[0] - 1.6, { tone: "lo", steps: 2, owner: "hp", wrap: ebony });
  const [z0, z1] = HP_Z;
  const fy = HP.y + HP.d;
  const sx = HP.x + HP.w;
  const id = R.nameFor("hp.case");
  const out = [];
  out.push(S(k.slabOf(HP, z0, z1 - z0, P, 3, 0.6), { tone: "hi", inner: L(k.sideSeam(HP, z0 + 2, P, 3), { tone: "faint" }) }));
  // fan: shroud ring, grille rings and spokes rooted on the hub and the shroud
  const c = [-44.6, 16];
  const RR = 8.2;
  // the fan behind the grille: a finished rotor in the face plane (its thickness goes into the
  // unit), clipped to the opening; the grille rings, spokes and hub are drawn over it
  out.push(`<g transform="${a.planeMatrix([c[0], fy - 0.1, c[1]], [1, 0, 0], [0, 0, -1], P)}"><circle r="${RR - 0.9}" style="fill:var(--anatomy-shade-0)"/></g>`);
  out.push(a.amRotor([c[0], fy - 0.3, c[1]], [1, 0, 0], [0, 0, -1], P, { count: 5, r0: 1.6, r1: RR - 1.8, chord: 3.2, tip: 2.2, sweep: 0.35, period: 520, thickness: 0.8, clip: RR - 0.9 }));
  const rings = [RR, RR - 0.9, 6, 4.1].map((r) => k.sideRing([c[0], fy, c[1]], r, "y", P, 48)).join("");
  out.push(L(rings, { tone: "lo" }));
  const spokes = [];
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * Math.PI * 2 + 0.2;
    spokes.push(faceLine("y", fy, c[0] + Math.cos(t) * 1.8, c[1] + Math.sin(t) * 1.8, c[0] + Math.cos(t) * (RR - 0.9), c[1] + Math.sin(t) * (RR - 0.9)));
  }
  out.push(L(spokes.join(""), { tone: "lo" }));
  out.push(L(k.sideRing([c[0], fy, c[1]], 1.8, "y", P, 20), { tone: "mid" }));
  out.push(D([fp("y", fy, c[0], c[1])], { size: 0.6, tone: "mid" }));
  // service panel right of the fan: inset outline, a status window, four screws
  out.push(L(faceRect("y", fy, -35.6, -30, 8, 24, 0.6), { tone: "faint" }));
  out.push(L(faceRect("y", fy, -34.4, -31.2, 19.4, 22, 0.5, 2), { tone: "lo" }));
  out.push(D([[-34.8, 9.2], [-30.8, 9.2], [-34.8, 22.8], [-30.8, 22.8]].map(([u, z]) => fp("y", fy, u, z)), { size: 0.38 }));
  // fins on the +x end: vertical slots
  out.push(L(Array.from({ length: 6 }, (_, i) => faceRect("x", sx, -23.4 + i * 1.75, -22.6 + i * 1.75, 8, 23, 0.35, 2)).join(""), { tone: "lo" }));
  R.put({ name: id, at: [HP.x + HP.w / 2, HP.y + HP.d / 2, (z0 + z1) / 2], svg: out.join(""), shapes: [R.solid(A.slab(HP, z0, z1 - z0, { name: id, owner: "hp" }, 3))] });
  // lid, and the refrigerant trunking to the wall
  const lid = k.insetPlan(HP, -0.8);
  box("hp.lid", lid, z1, 1.4, { tone: "mid", steps: 3, bevel: 0.5, owner: "hp", inner: "" , extra: L(k.planOutline(k.insetPlan(lid, 2.2), z1 + 1.4, P, 2), { tone: "faint" }) });
}

// ---------- roof solar ----------
const TILT = 14 * DEG;
const PANEL_L = 20;
const PANEL_T = 1.2;
const ROWS = [-37, -62, -87];
const COLS = [[-112, -86], [-84, -58], [-56, -30]];
const NORMAL = [0, Math.sin(TILT), Math.cos(TILT)];
const UPSLOPE = [0, -Math.cos(TILT), Math.sin(TILT)];
function solar() {
  const FB = 2.4;                                        // front beam height
  for (const y0 of ROWS) {
    const yb = y0 - PANEL_L * Math.cos(TILT);
    const zFront = RT + FB;
    const backTop = zFront + (PANEL_L - 1 / Math.cos(TILT)) * Math.sin(TILT) - 0.02;
    box("solar.rail", { x: -113, y: y0 - 2.4, w: 84, d: 1.8, r: 0.3 }, RT, FB + (0.6 * Math.tan(TILT)) - 0.02, { tone: "mid", steps: 1, bevel: 0, owner: "solar" });
    box("solar.rail", { x: -113, y: yb + 0.6, w: 84, d: 1.8, r: 0.3 }, RT, backTop - RT - 0.8 * Math.tan(TILT), { tone: "mid", steps: 1, bevel: 0, owner: "solar" });
    for (const [x0, x1] of COLS) {
      const F = G.frameOf([(x0 + x1) / 2, y0, zFront], NORMAL, [1, 0, 0], UPSLOPE);
      const hw = (x1 - x0) / 2;
      const top = (u, v) => at(G.add3(F.o, G.add3(G.mul3(NORMAL, PANEL_T), G.add3([u, 0, 0], G.mul3(UPSLOPE, v)))));
      const lines = [];
      // cell grid: a frame line inset 0.8, then cell rows and columns running frame to frame
      const fr = 0.9;
      lines.push(k.pathOf([top(-hw + fr, fr), top(hw - fr, fr), top(hw - fr, PANEL_L - fr), top(-hw + fr, PANEL_L - fr)], true));
      for (let i = 1; i < 6; i++) { const u = -hw + fr + ((2 * hw - 2 * fr) * i) / 6; lines.push(k.pathOf([top(u, fr), top(u, PANEL_L - fr)])); }
      for (let j = 1; j < 4; j++) { const v = fr + ((PANEL_L - 2 * fr) * j) / 4; lines.push(k.pathOf([top(-hw + fr, v), top(hw - fr, v)])); }
      const extra = cell(L(lines.join(""), { tone: "lo" }));
      prism("solar.panel", F, [[-hw, 0], [hw, 0], [hw, PANEL_L], [-hw, PANEL_L]], 0, PANEL_T, { tone: "hi", wrap: cell, extra, owner: "solar" });
    }
  }
  // the junction box and a combiner on the roof, where the conduit comes up
  box("solar.combiner", { x: -70, y: -34.6, w: 7, d: 3.2, r: 0.6 }, RT, 4, { tone: "mid", steps: 2, bevel: 0.3, owner: "solar" });
}

// ---------- deck, planter, path ----------
const DECK = { x: -124, y: FRONT + 0.8, w: 46, d: 23.2, r: 0 };   // x -124..-78, y -30..-6
const DECK_Z = 1.6;
const BOARD_Z = 3.6;
function deck() {
  box("deck.frame", DECK, 0, DECK_Z, { tone: "lo", steps: 1, bevel: 0, wrap: wood, owner: "deck" });
  const n = 6;
  const bd = (DECK.d - (n - 1) * 0.5) / n;
  for (let i = 0; i < n; i++) {
    const plan = { x: DECK.x, y: DECK.y + i * (bd + 0.5), w: DECK.w, d: bd, r: 0.3 };
    const screws = D([-118, -101, -84].flatMap((x) => [at([x, plan.y + 0.9, BOARD_Z]), at([x, plan.y + bd - 0.9, BOARD_Z])]), { size: 0.32, tone: "lo" });
    box("deck.board", plan, DECK_Z, BOARD_Z - DECK_Z, { tone: "mid", steps: 2, bevel: 0.3, wrap: wood, owner: "deck", extra: wood(screws) });
  }
  // a step down to the path
  box("deck.step", { x: -100, y: DECK.y + DECK.d, w: 18, d: 5, r: 0.3 }, 0, 1.8, { tone: "mid", steps: 2, bevel: 0.3, wrap: wood, owner: "deck" });
  // planter with a tree on the deck
  const pl = { x: -122.5, y: -24, w: 13, d: 13, r: 0.6 };
  const top = BOARD_Z + 10;
  const slats = [BOARD_Z + 3.4, BOARD_Z + 6.8].map((z) => L(k.sideSeam(pl, z, P, 2), { tone: "faint" })).join("");
  box("planter.box", pl, BOARD_Z, 10, { tone: "mid", steps: 2, bevel: 0.4, wrap: wood, owner: "planter", inner: slats });
  box("planter.soil", k.insetPlan(pl, 1.2), top, 0.3, { tone: "lo", steps: 2, bevel: 0, wrap: ebony, owner: "planter", crease: "none" });
  const [tx, ty] = [-116, -17.5];
  cyl("planter.trunk", tx, ty, 1.1, top + 0.3, 18, { tone: "mid", steps: 14, owner: "planter", wrap: wood });
  ball("planter.crown", [tx, ty, top + 0.3 + 18 + 8], 9, { tone: "mid", owner: "planter", wrap: leaf });
  // stepping stones to the front edge
  for (const [i, x] of [-75, -62, -49, -36, -23].entries()) {
    const y = -3.6 + (i % 2 ? 1 : -0.6);
    box("path.stone", { x, y, w: 10, d: 6, r: 1.2 }, 0, 0.9, { tone: "mid", steps: 3, bevel: 0.3, owner: "path" });
  }
  // lawn kerb along the drive, and two shrubs
  box("lawn.kerb", { x: -15.2, y: FRONT + 2, w: 2.4, d: BASE.y + BASE.d - FRONT - 2, r: 0.3 }, 0, 1.4, { tone: "mid", steps: 1, bevel: 0.2, owner: "kerb" });
  ball("shrub", [-115, 0, 4.2], 4.4, { tone: "mid", owner: "shrub", wrap: leaf });
  ball("shrub", [-107, 1.4, 3.4], 3.6, { tone: "mid", owner: "shrub2", wrap: leaf });
}

// ---------- charger on a post ----------
let CABLE = null;
const POST = { x: -4, y: -18, w: 4, d: 4, r: 0.6 };
const CH = { x: -6, y: -14, w: 8, d: 4.2, r: 1.4 };       // on the post's +y face
const CH_Z = [26, 42];
const PLUG = { x: 10.5, y: -14, w: 5, d: 3.4, r: 1 };    // on the car's +y side
const PLUG_Z = [15.4, 19];
function charger() {
  box("charger.foot", { x: -6, y: -20, w: 8, d: 8, r: 1 }, 0, 1.2, { tone: "lo", steps: 2, bevel: 0.3, owner: "charger", extra: D(k.corners({ x: -6, y: -20, w: 8, d: 8 }, 1.4).map(([x, y]) => at([x, y, 1.2])), { size: 0.35 }) });
  box("charger.post", POST, 1.2, 46, { tone: "mid", steps: 2, bevel: 0.3, owner: "charger", inner: L(k.sideSeam(POST, 8, P, 2), { tone: "faint" }) });
  box("charger.cap", k.insetPlan(POST, -0.6), 47.2, 1.2, { tone: "mid", steps: 2, bevel: 0.3, owner: "charger" });
  const [z0, z1] = CH_Z;
  const fy = CH.y + CH.d;
  const id = R.nameFor("charger.box");
  const out = [];
  out.push(S(k.slabOf(CH, z0, z1 - z0, P, 3, 0.5), { tone: "hi", inner: L(k.sideSeam(CH, z0 + 1.6, P, 3), { tone: "faint" }) }));
  out.push(brand(L(faceRect("y", fy, -4.6, 0.6, z0 + 4, z1 - 2.2, 1.2), { tone: "faint" })));
  out.push(L(faceRect("y", fy, -3.6, -0.4, z0 + 4.8, z0 + 7.2, 0.5, 2), { tone: "lo" }));
  // the status LED ring, which breathes
  const c = [-2, fy, z1 - 5.4];
  const ring = led(L(k.sideRing(c, 1.9, "y", P, 28), { tone: "lit" }) + L(k.sideRing(c, 1.1, "y", P, 20), { tone: "mid" }) + D([fp("y", fy, c[0], c[2])], { size: 0.6, tone: "lit" }));
  out.push(a.amPulse(ring, { period: 2600, min: 0.3 }));
  R.put({ name: id, at: [CH.x + CH.w / 2, CH.y + CH.d / 2, (z0 + z1) / 2], svg: out.join(""), shapes: [R.solid(A.slab(CH, z0, z1 - z0, { name: id, owner: "charger" }, 3))] });
  // cable gland under the box, and the coiled cable to the car's plug
  cyl("charger.gland", -2, CH.y + 2, 1.3, z0 - 1.6, 1.6, { tone: "mid", steps: 16, owner: "charger" });
  const plugFront = [PLUG.x + PLUG.w / 2, PLUG.y + PLUG.d, (PLUG_Z[0] + PLUG_Z[1]) / 2];
  CABLE = cable("charger.cable", [
    [-2, CH.y + 2, z0 - 1.6],
    [-2, CH.y + 2, 16],
    [0, -4, 11.5],
    [7.5, -1.5, 10],
    [plugFront[0], -3, plugFront[2]],
    plugFront,
  ], 0.75, { tone: "mid" });
}

// ---------- car ----------
const CAR = { x: 2, y: -48, w: 76, d: 34, r: 7 };          // x 2..78, y -48..-14
const BODY_Z = [4, 13];
const SHOULDER_Z = [13, 21.5];
const CAB = { x: 20, y: -45, w: 40, d: 28, r: 6 };
const CAB_Z = [21.5, 32];
function car() {
  const owner = "car";
  // wheels sit outboard of the lower body, under the shoulder: far pair first
  const WR = 6.5;
  for (const [x, y0, y1] of [[27, -48.5, -45], [65, -48.5, -45], [27, -17, -13.5], [65, -17, -13.5]]) {
    const F = YF([x, 0, WR]);
    disc("car.tyre", F, y0, y1, WR, { tone: "mid", owner, wrap: ebony });
    if (y1 > -40) {
      const nuts = D(Array.from({ length: 5 }, (_, n) => { const t = (n / 5) * Math.PI * 2; return at([x + Math.cos(t) * 2.4, y1 + 0.4, WR + Math.sin(t) * 2.4]); }), { size: 0.3, tone: "lo" });
      disc("car.hub", F, y1, y1 + 0.4, 4.4, { tone: "hi", owner, extra: nuts + D([at([x, y1 + 0.4, WR])], { size: 0.6, tone: "lo" }) });
    }
  }
  // lower body between the wheels, with a grille slot on the nose
  const LO = { x: 5, y: -45, w: 71, d: 28, r: 5 };
  box("car.sill", LO, BODY_Z[0], BODY_Z[1] - BODY_Z[0], { tone: "mid", steps: 4, bevel: 0.4, owner, inner: L(k.sideSeam(LO, 9, P, 4), { tone: "faint" }) });
  box("car.grille", { x: LO.x + LO.w - 0.2, y: -36, w: 0.8, d: 10, r: 0.4 }, 9.4, 2.4, { tone: "mid", steps: 2, owner, wrap: ebony });
  // shoulder: the door seam edge to edge, a handle, the green charge flap round the plug
  const fy = CAR.y + CAR.d;
  const [s0, s1] = SHOULDER_Z;
  const bodyLines = L(faceLine("y", fy, 45, s0, 45, s1) + faceLine("y", fy, 20, s0, 20, s1), { tone: "lo" });
  const flap = led(L(faceRect("y", fy, 9.6, 16.4, s0 + 1.4, s1 - 1.4, 1.2), { tone: "mid" }));
  box("car.body", CAR, s0, s1 - s0, { tone: "hi", steps: 4, bevel: 0.8, owner, inner: bodyLines, extra: flap });
  box("car.handle", { x: 47.5, y: fy, w: 4.2, d: 0.6, r: 0.3 }, s1 - 2.6, 1.1, { tone: "mid", steps: 2, owner, wrap: ebony });
  const nx = CAR.x + CAR.w;
  for (const [y0, y1] of [[-43, -38], [-24, -19]]) box("car.lamp", { x: nx - 0.5, y: y0, w: 1, d: y1 - y0, r: 0.4 }, s0 + 2, 2.6, { tone: "hi", steps: 2, owner, wrap: glass });
  // cabin: glass all round as a band, a B-pillar, the roof, a mirror
  const cabLines = "";
  box("car.cabin", CAB, CAB_Z[0], CAB_Z[1] - CAB_Z[0], { tone: "hi", steps: 4, bevel: 0.6, owner, wrap: glass, inner: cabLines });
  box("car.roof", k.insetPlan(CAB, 1.2), CAB_Z[1], 1.2, { tone: "hi", steps: 4, bevel: 0.6, owner });
  box("car.pillar", { x: 44, y: CAB.y + CAB.d, w: 2, d: 0.4, r: 0 }, CAB_Z[0], CAB_Z[1] - CAB_Z[0], { tone: "hi", steps: 1, bevel: 0, owner });
  box("car.mirror", { x: 53, y: CAB.y + CAB.d, w: 3.4, d: 3, r: 0.8 }, CAB_Z[0] + 1.6, 2.4, { tone: "hi", steps: 2, bevel: 0.3, owner });
  // the plug in the charge port
  box("car.plug", PLUG, PLUG_Z[0], PLUG_Z[1] - PLUG_Z[0], { tone: "mid", steps: 3, bevel: 0.3, owner, wrap: ebony });
}

// ---------- assemble ----------
ground();
house();
windows();
sideFittings();
battery();
heatPump();
solar();
deck();
charger();
car();
// the car's floor shadow sits in the back layer
back.push(halo(k.insetPlan(CAR, 1), 0, 3));

A.settle(R, P);
R.items.sort((p, q) => p.key - q.key);
// power flowing to the car: a green pulse that runs down the cable's centreline, drawn with
// the last cable chunk so it sits over the whole run
// (it is added to the body, not to the item, so the audit still sees the chunk as drawn)
const PULSE_AFTER = R.items.reduce((m, it, i) => (it.route === CABLE.id ? i : m), -1);
const PULSE = led(a.amDraw(k.pathOf(CABLE.route.map(at)), { tone: "mid", period: 2800 }).replace('style="', 'style="stroke-width:1.3px;'));

const name = dark ? "energy-home-dark" : "energy-home";
const fill = Array.from({ length: SEGS }, (_, i) => {
  const on = 8 + i * 13;
  return `@keyframes eh-fill-${i}{0%,${on}%{opacity:0}${on + 3}%,84%{opacity:1}92%,100%{opacity:0}}
#${name} .eh-seg-${i}{animation:eh-fill-${i} 6.4s cubic-bezier(.45,0,.55,1) 0s infinite}`;
}).join("\n");
const css = `${fill}
@media (prefers-reduced-motion:reduce){#${name} .eh-seg{animation:none}}`;

const svg = a.assetSvg({
  width: W,
  height: H,
  label: "An isometric diorama of the corner of a small modern house: solar panels on the flat roof, a home battery on the wall whose green gauge fills up, a heat pump on its pad, a wooden deck with a planter tree, and a small electric car charging from a wall charger on a post.",
  body: [...back, ...R.items.map((it, i) => (i === PULSE_AFTER ? it.svg + PULSE : it.svg))].join(""),
  paper: PAPER,
  accents: {
    brand: BRAND,
    led: { hex: BRAND, mode: "ink" },
    wood: dark ? "#6a4c34" : "#b98a5c",
    grass: dark ? "#3c5a34" : "#a9c08a",
    leaf: dark ? "#3f6a3c" : "#8db07a",
    brick: dark ? "#6e3e30" : "#c48468",
    glass: dark ? "#1b2731" : "#7f93a3",
    cell: dark ? "#0f1822" : "#2c3b4c",
    ebony: dark ? "#0a0b0c" : "#3b3d40",
  },
  weight: 0.65,
  css,
  id: name,
});
writeFileSync(join(HERE, `${name}.svg`), svg);
writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W }));
const solids = (svg.match(/class="iso-solid/g) || []).length;
console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB, ${solids} solids, ${R.items.length} items) scale ${P.scale.toFixed(3)}`);
A.auditOrExit(R, P);
