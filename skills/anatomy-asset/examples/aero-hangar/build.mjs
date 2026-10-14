// A wide section banner for "Aether — Electric flight, everywhere.": a final-assembly hangar
// bay seen as a cutaway (no roof, the side wall cut low) with a long-range electric jet on its
// gear. A gantry crane on floor rails straddles the near wing; its hoist lowers an ice-blue
// fan pod onto the outboard pylon. Around the jet: rolling stairs and a work platform, tool
// carts, a parts rack with crates, cable reels, a tow tug at the nose, painted bay lines and a
// ruler strip on the floor, and light bars on brackets off the back wall.
//
//   node build.mjs            dark   → aero-hangar.svg, aero-hangar.html
//   node build.mjs --light    light  → aero-hangar-light.svg, aero-hangar-light.html
//   node build.mjs --audit    also runs the audit (round parts and cables are recorded)

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const light = process.argv.includes("--light");
const PAPER = light ? "#f2f4f7" : "#07090d";
const ICE = "#4cc9ff";
const DEG = Math.PI / 180;

const W = 1600;
const H = 560;
const REGION = { x: 40, y: 20, w: 1520, h: 520 };
const AZ = Number(process.env.AZ ?? 66);
const EL = Number(process.env.EL ?? 25);

// ---------- world ----------
// The jet's axis runs along +x (nose at +x), on y = 0. The near wing points at +y.
const FLOOR = { x: -318, y: -166, w: 636, d: 340, r: 4 };
const FLOOR_H = 10;
const WALL_T = 8;
const WALL_H = 30;
const GZ = 124;              // gantry girder underside
const GIRDER_H = 16;
const GT = GZ + GIRDER_H;    // girder top
const TROLLEY_TOP = GT + 26;

const P = a.fitInto(
  [
    ...k.boxCorners(FLOOR, -FLOOR_H, 0),
    ...k.boxCorners({ x: FLOOR.x, y: FLOOR.y, w: FLOOR.w, d: WALL_T, r: 0 }, 0, WALL_H),
    [-272, 130, TROLLEY_TOP], [-60, 80, TROLLEY_TOP], [0, FLOOR.y + 2, WALL_H + 44], [-309, -157, 50], [-189, -137, 50],
  ],
  REGION,
  { pad: 6, azimuth: AZ, elevation: EL },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const accent = (svg) => `<g class="ac-ice">${svg}</g>`;
const ink = (svg) => `<g class="ac-led">${svg}</g>`;
const faceY = (y, pts, closed = false) => k.pathOf(pts.map(([x, z]) => at([x, y, z])), closed);
const faceX = (x, pts, closed = false) => k.pathOf(pts.map(([yy, z]) => at([x, yy, z])), closed);
const halo = (plan, z, h, blur = 0) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ""}/>`;
const XF = (o) => G.frameOf(o, [1, 0, 0], [0, 1, 0], [0, 0, 1]);    // axis +x, angle 0 → +y, 90° → +z
const YF = (o) => G.frameOf(o, [0, 1, 0], [0, 0, 1], [1, 0, 0]);    // axis +y
const YZ = (x) => G.frameOf([x, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);   // prisms drawn in the y-z plane, thickness toward +x
const XZ = (y) => G.frameOf([0, y, 0], [0, -1, 0], [1, 0, 0], [0, 0, 1]); // prisms drawn in the x-z plane, thickness toward -y

// ---------- recorder ----------
const R = A.recorder(P);
const record = R.solid;
function put(name, ref, svg, shapes, { bias = 0, wrap } = {}) {
  return R.put({ piece: "scene", name: R.nameFor(name), at: ref, bias, svg, shapes, wrap });
}
function box(name, plan, z, h, { tone = "mid", steps = 3, bevel = 0.5, inner = "", extra = "", owner, bias = 0, wrap, lit, crease } = {}) {
  const id = R.nameFor(name);
  const svg = S(k.slabOf(plan, z, h, P, steps, bevel), { tone, inner, lit, crease }) + extra;
  return R.put({ piece: "scene", name: id, at: [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], bias, svg, wrap, shapes: [record(A.slab(plan, z, h, { name: id, owner }, steps))] });
}
function cyl(name, cx, cy, r, z, h, { tone = "mid", steps = 24, bevel = 0, inner = "", extra = "", owner, bias = 0, wrap } = {}) {
  const id = R.nameFor(name);
  const svg = S(k.cylinder(cx, cy, r, z, h, P, steps, bevel), { tone, inner }) + extra;
  return R.put({ piece: "scene", name: id, at: [cx, cy, z + h / 2], bias, svg, wrap, shapes: [record(A.cylinder(cx, cy, r, z, h, { name: id, owner }))] });
}
function ext(name, ring, z, h, { tone = "mid", bevel = 0, inner = "", extra = "", owner, bias = 0, wrap, ref } = {}) {
  const id = R.nameFor(name);
  const svg = S(k.extrude(ring, z, h, P, { bevel }), { tone, inner }) + extra;
  const c = ref ?? [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length, z + h / 2];
  return R.put({ piece: "scene", name: id, at: c, bias, svg, wrap, shapes: [record(A.extruded(ring, z, h, { name: id, owner }))] });
}
function prism(name, F, poly, s0, s1, { tone = "mid", inner = "", extra = "", owner, bias = 0, wrap } = {}) {
  const id = R.nameFor(name);
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  const c = G.add3(F.o, G.add3(G.mul3(F.a, (s0 + s1) / 2), G.add3(G.mul3(F.u, cx), G.mul3(F.v, cy))));
  const svg = S(G.prismOf(F, poly, s0, s1, P), { tone, inner }) + extra;
  return R.put({ piece: "scene", name: id, at: c, bias, svg, wrap, shapes: [record(A.prism(F, poly, s0, s1, { name: id, owner }))] });
}
function disc(name, F, s0, s1, r, { tone = "mid", inner = "", extra = "", owner, bias = 0, wrap, bevel = 0 } = {}) {
  const id = R.nameFor(name);
  const svg = S(G.disc(s0, s1, r, F, P, { bevel }), { tone, inner }) + extra;
  return R.put({ piece: "scene", name: id, at: G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), bias, svg, wrap, shapes: [record(A.disc(F, s0, s1, r, { name: id, owner }))] });
}
function rope(name, points, r, { tone = "mid", limp = false, owner, wrap, maxLength = 40 } = {}) {
  const id = R.nameFor(name);
  R.route(id, points, r, { owner: owner ?? id, limp, piece: "scene" });
  for (const [index, part] of tubePieces(points, r, P, { maxLength, spacing: 1 }).entries())
    R.put({ piece: "scene", name: `${id}:${index}`, at: part.mid, svg: tubeSvg(part, { tone }), route: id, chunk: index, wrap, shapes: [A.tube(part.points, part.radii)] });
  return id;
}
const screwsTop = (pts, z, r = 1.2) => L(pts.map(([x, y]) => k.ring(x, y, r, z, P, 14)).join(""), { tone: "mid" }) + D(pts.map(([x, y]) => at([x, y, z])), { size: 0.5 });
const screwsY = (y, pts, r = 1.1) => L(pts.map(([x, z]) => k.sideRing([x, y, z], r, "y", P, 14)).join(""), { tone: "mid" }) + D(pts.map(([x, z]) => at([x, y, z])), { size: 0.5 });
const screwsX = (x, pts, r = 1.1) => L(pts.map(([yy, z]) => k.sideRing([x, yy, z], r, "x", P, 14)).join(""), { tone: "mid" }) + D(pts.map(([yy, z]) => at([x, yy, z])), { size: 0.5 });

// ---------- back layer: floor, bay markings, walls ----------
const back = [];
const GROUND = { owner: "stand.hangar" };
back.push(halo(k.insetPlan(FLOOR, -8), -FLOOR_H, 2, 10));
back.push(S(k.slabOf(FLOOR, -FLOOR_H, FLOOR_H, P, 4, 1.2), { tone: "mid", crease: "lo", inner: L(k.sideSeam(FLOOR, -4, P, 4), { tone: "faint" }) }));
record(A.slab(FLOOR, -FLOOR_H, FLOOR_H, { name: "stand.floor", ...GROUND }, 4));

// painted bay: an outline, the centreline, station bars and gear spots
const BAY = { x: -244, y: -150, w: 500, d: 300, r: 3 };
const bay = [k.planOutline(BAY, 0, P, 3), k.planOutline(k.insetPlan(BAY, 5), 0, P, 3)];
bay.push(k.lineOnTop([BAY.x + 5, 0], [BAY.x + BAY.w - 5, 0], 0, P));
for (const x of [-150, -66, 186]) bay.push(k.lineOnTop([x, BAY.y + 5], [x, BAY.y + BAY.d - 5], 0, P));
back.push(L(bay.join(""), { tone: "faint" }));
// ruler strip along the floor's near edge
const STRIP = { x: -296, y: FLOOR.y + FLOOR.d - 16, w: 592, d: 8, r: 1 };
back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
const TICKS = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 8, 5, STRIP.y + 0.8, 0.6, [2.4, 4.6], P);
back.push(L(TICKS.minor, { tone: "lo" }), L(TICKS.major, { tone: "mid" }));
back.push(D([at([STRIP.x + 2, STRIP.y + 4, 0.6]), at([STRIP.x + STRIP.w - 2, STRIP.y + 4, 0.6])], { size: 0.45 }));

// back wall (far, y = FLOOR.y) with pilasters and girts; side wall (x = FLOOR.x) cut low
const BACK_WALL = { x: FLOOR.x, y: FLOOR.y, w: FLOOR.w, d: WALL_T, r: 0.5 };
{
  const fy = BACK_WALL.y + WALL_T;
  const panel = [];
  for (const z of [16, 30]) panel.push(k.sideSeam(BACK_WALL, z, P, 2));
  for (let x = BACK_WALL.x + 26; x < BACK_WALL.x + BACK_WALL.w; x += 26) panel.push(faceY(fy, [[x, 0], [x, WALL_H]]));
  back.push(S(k.slabOf(BACK_WALL, 0, WALL_H, P, 2, 0.6), { tone: "mid", inner: L(panel.join(""), { tone: "faint" }) }));
  record(A.slab(BACK_WALL, 0, WALL_H, { name: "stand.wall-back", ...GROUND }, 2));
}
const SIDE_WALL = { x: FLOOR.x, y: FLOOR.y + WALL_T, w: WALL_T, d: FLOOR.d - WALL_T, r: 0.5 };
{
  // stepped cut: full height for the first 90, then low
  const tall = { ...SIDE_WALL, d: 90 };
  const low = { ...SIDE_WALL, y: SIDE_WALL.y + 90, d: SIDE_WALL.d - 90 };
  const fx = SIDE_WALL.x + WALL_T;
  const seamsTall = [];
  for (let y = tall.y + 26; y < tall.y + tall.d; y += 26) seamsTall.push(faceX(fx, [[y, 0], [y, WALL_H]]));
  for (const z of [16, 30]) seamsTall.push(k.sideSeam(tall, z, P, 2));
  back.push(S(k.slabOf(tall, 0, WALL_H, P, 2, 0.6), { tone: "mid", inner: L(seamsTall.join(""), { tone: "faint" }) }));
  const seamsLow = [];
  for (let y = low.y + 26; y < low.y + low.d; y += 26) seamsLow.push(faceX(fx, [[y, 0], [y, 12]]));
  back.push(S(k.slabOf(low, 0, 12, P, 2, 0.6), { tone: "mid", inner: L(seamsLow.join(""), { tone: "faint" }) }));
  record(A.slab(tall, 0, WALL_H, { name: "stand.wall-side", ...GROUND }, 2));
  record(A.slab(low, 0, 12, { name: "stand.wall-low", ...GROUND }, 2));
}

// ---------- the jet ----------
const AIR = { owner: "jet" };
const FZ = 44;
const FR = 18;
const S_TAIL = -214;
const S_T1 = -78;
const S_N0 = 150;
const S_TIP = 236;
const RT = 2.6;
function fr(s) {
  if (s <= S_T1) {
    const u = Math.max(0, (s - S_TAIL) / (S_T1 - S_TAIL));
    return RT + (FR - RT) * (1 - (1 - u) ** 2);
  }
  if (s <= S_N0) return FR;
  const v = Math.min(1, (s - S_N0) / (S_TIP - S_N0));
  return FR * Math.max(0, 1 - v ** 1.9) ** 0.55;
}
const frSlope = (s) => {
  const h = 0.05;
  const lo = Math.max(S_TAIL, s - h);
  const hi = Math.min(S_TIP - 0.02, s + h);
  return (fr(hi) - fr(lo)) / (hi - lo || 1);
};
const FUSE = XF([0, 0, FZ]);
const FUSE_PROFILE = (() => {
  const out = [[S_TAIL, RT]];
  for (let i = 1; i <= 8; i++) {
    const s = S_TAIL + (S_T1 - S_TAIL) * (i / 8);
    out.push([s, fr(s), 1]);
  }
  out.push([S_N0, FR, 1]);
  for (let i = 1; i < 12; i++) {
    const v = 1 - (1 - i / 12) ** 1.6;
    const s = S_N0 + (S_TIP - S_N0) * v;
    out.push([s, fr(s), 1]);
  }
  out.push([S_TIP, 0]);
  return out;
})();

// surface helpers on the fuselage: a point at station s, angle t (0 → +y, 90° → up)
const onFuse = (s, t, lift = 0) => G.pointOf(FUSE, s, fr(s) + lift, t);
const fusePath = (pts, closed) => k.pathOf(pts.map(([s, t]) => at(onFuse(s, t * DEG))), closed);

function fuselage() {
  const seams = [-150, -40, 60, 150].map((s) => G.arcOf(FUSE, s, fr(s), P, { slope: frSlope(s) })).join("");
  const paths = G.solidOf(FUSE_PROFILE, FUSE, P, { smooth: { slope: frSlope, radius: fr, rows: 6 } });
  const extra = [];
  // livery stripe: a band below the window line, swept up toward the tail
  const STRIPE = [];
  const top = [];
  const bottom = [];
  for (let s = -190; s <= 200; s += 4) {
    const rise = s < -70 ? ((-70 - s) / 120) * 34 : 0;
    top.push([s, -4 + rise]);
    bottom.push([s, -13 + rise * 0.8]);
  }
  STRIPE.push(...top, ...bottom.reverse());
  extra.push(accent(`<path class="iso-top" d="${fusePath(STRIPE, true)}"/>` + L(fusePath(STRIPE, true), { tone: "mid" })));
  // cabin windows
  const wins = [];
  for (let s = -64; s <= 128; s += 7.2) if (Math.abs(s - 133) > 10) wins.push(at(onFuse(s, 22 * DEG)));
  extra.push(D(wins, { size: 0.75, tone: "mid" }));
  // doors (closed outlines on the skin)
  const door = (s0, s1, t0, t1) => {
    const pts = [];
    for (let t = t0; t <= t1; t += 4) pts.push([s0, t]);
    for (let t = t1; t >= t0; t -= 4) pts.push([s1, t]);
    return fusePath(pts, true);
  };
  extra.push(L(door(132, 140, -6, 40) + door(-62, -55, -6, 36), { tone: "mid" }));
  // windscreen
  const ws = [];
  for (let t = 24; t <= 112; t += 4) ws.push([201 + ((t - 68) / 44) ** 2 * 3, t]);
  for (let t = 112; t >= 24; t -= 4) ws.push([210 - ((t - 68) / 44) ** 2 * 2, t]);
  extra.push(`<g class="ac-glass"><path class="iso-top" d="${fusePath(ws, true)}"/></g>` + L(fusePath(ws, true), { tone: "hi" }));
  put("jet.fuselage", [0, 0, FZ], S(paths, { tone: "hi", inner: L(seams, { tone: "faint" }) }) + extra.join(""), [record(A.solid(FUSE, FUSE_PROFILE, { radius: fr, name: "jet.fuselage", ...AIR }))]);
}

// wings: flat floor polygons, a main plate and a thinner upper skin inset from the edges
const WZ = FZ - 10;
const WH = 2.6;
const ROOT_Y = 16.5;
const TIP_Y = 150;
const SWEEP = Math.tan(28 * DEG);
const LE = (y) => -8 - SWEEP * (Math.abs(y) - ROOT_Y);
const TE = (y) => -96 - ((122 - 96) / (TIP_Y - ROOT_Y)) * (Math.abs(y) - ROOT_Y);
function wing(sign) {
  const ring = [[LE(ROOT_Y), sign * ROOT_Y], [LE(TIP_Y), sign * TIP_Y], [TE(TIP_Y), sign * TIP_Y], [TE(ROOT_Y), sign * ROOT_Y]];
  const z1 = WZ + WH;
  const lines = [];
  // flap and aileron hinge line, parallel to the trailing edge, and their cuts
  const hinge = (y) => [TE(y) + 13, sign * y];
  lines.push(k.onTop([hinge(ROOT_Y), hinge(TIP_Y)], z1, P));
  for (const y of [62, 100]) lines.push(k.lineOnTop(hinge(y), [TE(y), sign * y], z1, P));
  // spar line
  const spar = (y) => [LE(y) - (LE(y) - TE(y)) * 0.3, sign * y];
  lines.push(k.onTop([spar(ROOT_Y), spar(TIP_Y)], z1, P));
  const inner = L(lines.join(""), { tone: "faint" });
  ext(sign > 0 ? "jet.wing-near" : "jet.wing-far", ring, WZ, WH, { tone: "hi", bevel: 0.5, inner, owner: "jet" });
  // winglet in the x-z plane at the tip
  const y0 = sign * TIP_Y + (sign > 0 ? 2.2 : 0);
  const poly = [[LE(TIP_Y) - 2, z1], [TE(TIP_Y) + 2, z1], [TE(TIP_Y) - 8, z1 + 15], [LE(TIP_Y) - 17, z1 + 15]];
  prism(sign > 0 ? "jet.winglet-near" : "jet.winglet-far", XZ(y0), poly, 0, 2.2, { tone: "hi", owner: "jet" });
}

// V-tail: two fins in planes tilted 40° from vertical
function vtail(sign) {
  const tilt = 40 * DEG;
  const d = [0, sign * Math.sin(tilt), Math.cos(tilt)];
  const x = [1, 0, 0];
  const n = G.cross3(x, d);
  const F = G.frameOf([0, 0, FZ], n, x, d);
  const ra = fr(-196) + 0.15;
  const rb = fr(-150) + 0.15;
  const poly = [[-150, rb], [-196, 58], [-216, 58], [-196, ra]];
  prism(sign > 0 ? "jet.vtail-near" : "jet.vtail-far", F, poly, -1.1, 1.1, { tone: "hi", owner: "jet" });
}

// fan pods: over-wing nacelles on pylons
const POD_L = 46;
const podR = (s) => {
  const u = Math.max(0, Math.min(1, s / POD_L));
  return u <= 0.6 ? 5.2 + 3.6 * (1 - (1 - u / 0.6) ** 2) : 8.8 - 1.4 * ((u - 0.6) / 0.4) ** 2;
};
const podSlope = (s) => {
  const h = 0.05;
  return (podR(Math.min(POD_L, s + h)) - podR(Math.max(0, s - h))) / (Math.min(POD_L, s + h) - Math.max(0, s - h));
};
const POD_PROFILE = [[0, podR(0)], ...Array.from({ length: 7 }, (_, i) => { const s = (POD_L * (i + 1)) / 8; return [s, podR(s), 1]; }), [POD_L, podR(POD_L)]];
const PYLON_X = [17, 36];      // along the pod, where the pylon meets it
const PYLON_H = 5;
const PODS = [
  { y: 56, x0: -100 },
  { y: 104, x0: -120, lowered: true },
  { y: -56, x0: -100 },
  { y: -104, x0: -120 },
].map((p) => ({ ...p, z: WZ + WH + PYLON_H + podR(28) }));
const LOWER = 14;              // how far the lowered pod hangs above its seat

function pylon(p) {
  const z0 = WZ + WH;
  const top = p.z - Math.min(podR(PYLON_X[0]), podR(PYLON_X[1])) + 0.15;
  const xa = p.x0 + PYLON_X[0];
  const xb = p.x0 + PYLON_X[1];
  const poly = [[xa - 6, z0], [xb + 4, z0], [xb, top], [xa, top]];
  const extra = p.lowered ? D([at([xa + 4, p.y, top]), at([xb - 4, p.y, top])], { size: 0.55, tone: "hi" }) : "";
  prism("jet.pylon", XZ(p.y + 1.3), poly, 0, 2.6, { tone: "mid", owner: "jet", extra });
}

function pod(p, z, { wrap, name = "jet.pod", owner } = {}) {
  const F = XF([p.x0, p.y, z]);
  const seams = [12, 31].map((s) => G.arcOf(F, s, podR(s), P, { slope: podSlope(s) })).join("");
  const paths = G.solidOf(POD_PROFILE, F, P, { smooth: { slope: podSlope, radius: podR, rows: 4 } });
  const face = [];
  const rIn = podR(POD_L) - 1.5;
  face.push(`<g class="ac-glass"><path class="iso-shade" data-shade="0" d="${G.circleOf(F, POD_L, rIn, P)}"/></g>`);
  face.push(`<g class="ac-fan">` + a.amRotor(G.pointOf(F, POD_L - 0.2, 0, 0), [0, 1, 0], [0, 0, 1], P, { count: 13, r0: 1.6, r1: rIn - 1.1, chord: 1.9, tip: 1.1, sweep: 0.32, period: 1200 + (Math.abs(p.y * 7 + p.x0) % 6) * 120, reverse: p.y < 0, delay: Math.abs(p.y * 13) % 1500, thickness: 0.8, clip: rIn }) + "</g>");
  face.push(L(G.circleOf(F, POD_L, rIn, P), { tone: "mid" }));
  const spin = G.sphereOf(G.pointOf(F, POD_L - 0.6, 0, 0), 2.4, P);
  face.push(S(spin, { tone: "mid" }));
  let svg = S(paths, { tone: "hi", inner: L(seams, { tone: "faint" }) }) + face.join("");
  if (p.lowered) svg = accent(svg);
  const id = R.nameFor(name);
  const shapes = [record(A.solid(F, POD_PROFILE, { radius: podR, name: id, owner: owner ?? (p.lowered ? "rig" : "jet") }))];
  return R.put({ piece: "scene", name: id, at: G.add3(F.o, [POD_L / 2, 0, 0]), svg, wrap, shapes });
}

// landing gear: struts, axles and twin wheels on +y axes
function wheel(name, x, y, r, w, { tone = "mid" } = {}) {
  const F = YF([x, y - w / 2, r - 0.1]);
  const hub = [G.circleOf(F, w, r * 0.55, P), G.circleOf(F, w, r * 0.28, P)].join("");
  const dots = D(G.dotsOf(F, w, r * 0.42, 6, P, { all: true }), { size: 0.45 });
  disc(name, F, 0, w, r, { tone, bevel: 0.3, extra: L(hub, { tone: "lo" }) + dots, owner: "jet" });
}
function gearLeg(name, x, y, r, w, topZ, { gap = 2.2 } = {}) {
  const az = r - 0.1;
  const axleR = 1.8;
  for (const yy of [y - gap / 2 - w, y + gap / 2]) wheel(`${name}.wheel`, x, yy + w / 2, r, w);
  disc(`${name}.axle`, YF([x, y - gap / 2, az]), 0, gap, axleR, { owner: "jet" });
  const strutBottom = az + axleR - 0.2;
  cyl(`${name}.strut`, x, y, 1.5, strutBottom, topZ - strutBottom, { tone: "mid", steps: 16, owner: "jet", inner: L(k.sideArc(x, y, 1.5, strutBottom + (topZ - strutBottom) * 0.45, P, 12), { tone: "faint" }) });
  cyl(`${name}.oleo`, x, y, 2.4, az + (topZ - az) * 0.45, (topZ - az) * 0.55 - 0.1, { tone: "mid", steps: 18, owner: "jet" });
}

// ---------- gantry crane ----------
// A cantilever gantry aft of the near wing: two A-frame portals in the y-z plane ride on floor
// rails that run along x outboard of the tail, and a pair of box girders runs forward over the
// near wing, parallel to the fuselage, to carry the trolley over the outboard pylon.
const XG = PODS[1].x0 + POD_L / 2 + 1;      // the lowered pod's centre
const YP = PODS[1].y;
const YA = 62;                               // inner rail line
const YB = 146;                              // outer rail line
const XA = -236;                             // portal centre
const PORTALS = [XA - 20, XA + 20];
const SILL = 34;
const HEAD_H = 8;
const GY = [YP - 14, YP + 6];                // girder plans start here, 8 wide
function gantryRails() {
  for (const y of [YA, YB]) {
    const rail = { x: XA - 70, y: y - 4, w: 150, d: 8, r: 0.6 };
    box("gantry.railbed", rail, 0, 1.2, { tone: "lo", steps: 2, bevel: 0 });
    box("gantry.rail", { x: rail.x + 5, y: y - 1.5, w: rail.w - 10, d: 3, r: 0.4 }, 1.2, 2.6, { tone: "mid", steps: 2, bevel: 0.3 });
    for (const x of [rail.x + 1, rail.x + rail.w - 5]) box("gantry.railstop", { x, y: y - 4, w: 4, d: 8, r: 0.5 }, 1.2, 5, { tone: "mid", steps: 2 });
    // end truck: two wheel boxes and a sill beam along x
    const z0 = 3.8;
    for (const x of [XA - SILL + 1, XA + SILL - 13]) {
      const wb = { x, y: y - 6, w: 12, d: 12, r: 0.8 };
      box("gantry.wheelbox", wb, z0, 11, { tone: "mid", extra: screwsY(y + 6, [[x + 6, z0 + 5.5]], 3.2), steps: 2 });
    }
    const sill = { x: XA - SILL, y: y - 7, w: SILL * 2, d: 14, r: 1 };
    const sz = z0 + 11;
    box("gantry.sill", sill, sz, 10, { tone: "mid", inner: L(k.sideSeam(sill, sz + 5, P, 3), { tone: "faint" }), extra: screwsTop(k.corners(sill, 4), sz + 10) });
  }
}
const Z1 = 3.8 + 11 + 10;                    // sill tops
function portal(px) {
  const O = `gantry.portal${px}`;
  const zh = GZ - HEAD_H;
  const legs = [
    [[YA - 5, Z1], [YA + 5, Z1], [GY[0] + 2, zh], [GY[0] - 7, zh]],
    [[YB - 5, Z1], [YB + 5, Z1], [GY[1] + 15, zh], [GY[1] + 6, zh]],
  ];
  for (const poly of legs) prism("gantry.leg", YZ(px - 4), poly, 0, 8, { tone: "mid", owner: O });
  const tz = Z1 + (zh - Z1) * 0.4;
  const yAt = (poly, z, side) => {
    const t = (z - Z1) / (zh - Z1);
    return side === "in0" ? poly[1][0] + (poly[2][0] - poly[1][0]) * t : poly[0][0] + (poly[3][0] - poly[0][0]) * t;
  };
  const tie = [[yAt(legs[0], tz, "in0"), tz], [yAt(legs[1], tz, "in1"), tz], [yAt(legs[1], tz + 7, "in1"), tz + 7], [yAt(legs[0], tz + 7, "in0"), tz + 7]];
  prism("gantry.tie", YZ(px - 3), tie, 0, 6, { tone: "mid", owner: O });
  const head = { x: px - 5, y: GY[0] - 9, w: 10, d: GY[1] + 17 - GY[0], r: 0.6 };
  box("gantry.head", head, zh, HEAD_H, { tone: "mid", steps: 2, owner: O, inner: L(k.sideSeam(head, zh + HEAD_H / 2, P, 2), { tone: "faint" }) });
}
const GX0 = XA - 30;
const GX1 = XG + 28;
function girders() {
  for (const gy of GY) {
    const plan = { x: GX0, y: gy, w: GX1 - GX0, d: 8, r: 0.6 };
    const fy = gy + 8;
    const ribs = [];
    for (let x = GX0 + 14; x < GX1 - 4; x += 20) ribs.push(faceY(fy, [[x, GZ], [x, GT]]));
    box("gantry.girder", plan, GZ, GIRDER_H, { tone: "mid", steps: 2, bevel: 0.4, inner: L(ribs.join(""), { tone: "faint" }) });
    box("gantry.trolleyrail", { x: plan.x + 4, y: gy + 2.5, w: plan.w - 8, d: 3, r: 0.3 }, GT, 1.6, { tone: "lo", steps: 2, bevel: 0 });
  }
  // an end stop tying the girders at the cantilever tip
  box("gantry.endtie", { x: GX1 - 4, y: GY[0] + 8, w: 4, d: GY[1] - GY[0] - 8, r: 0.4 }, GZ + 4, GIRDER_H - 4, { tone: "mid", steps: 2 });
}

// trolley with the hoist drum, motor and gearbox; a beacon
function trolley() {
  const z = GT + 1.6;
  const frame = { x: XG - 12, y: GY[0] + 1, w: 24, d: GY[1] + 7 - GY[0] - 1, r: 1 };
  box("hoist.frame", frame, z, 5, { tone: "mid", inner: L(k.sideSeam(frame, z + 2.5, P, 3), { tone: "faint" }), extra: screwsTop(k.corners(frame, 3), z + 5) });
  const zt = z + 5;
  // drum along x between two bearing blocks
  for (const x of [XG - 11, XG + 7]) box("hoist.bearing", { x, y: YP - 5, w: 4, d: 10, r: 0.5 }, zt, 9, { tone: "mid", steps: 2 });
  const DF = XF([XG - 7, YP, zt + 9]);
  disc("hoist.drum", DF, 0, 14, 6.5, { tone: "hi", inner: L([3.5, 7, 10.5].map((s) => G.arcOf(DF, s, 6.5, P)).join(""), { tone: "faint" }) });
  // gearbox and motor
  box("hoist.gearbox", { x: XG - 8, y: YP + 6.5, w: 16, d: 6.5, r: 1 }, zt, 12, { tone: "mid" });
  const MF = XF([XG + 8, YP + 9.75, zt + 6.5]);
  disc("hoist.motor", MF, 0, 11, 3.2, { tone: "hi", extra: L(G.circleOf(MF, 11, 1.8, P), { tone: "faint" }) });
  // beacon
  box("hoist.beaconbase", { x: XG + 4, y: YP - 13, w: 6, d: 5, r: 0.8 }, zt, 2, { tone: "mid", steps: 2 });
  cyl("hoist.beacon", XG + 7, YP - 10.5, 2.2, zt + 2, 4, { tone: "hi", steps: 18, extra: a.amBlink(ink(L(k.sideArc(XG + 7, YP - 10.5, 2.2, zt + 4, P, 14), { tone: "lit" }) + D([at([XG + 7, YP - 10.5, zt + 6])], { size: 1.2, tone: "lit" })), { period: 2600, delay: 400 }) });
}

// the lift: ropes, hook block, spreader, slings and the pod
const POD_LOW = PODS[1];
const POD_Z = POD_LOW.z + LOWER;
const SPREAD_Z = POD_Z + 22;
const BLOCK_Z = SPREAD_Z + 11;
const SLIDE = [0, 0, -7];
function lift() {
  const pz = POD_Z;
  const x0 = POD_LOW.x0;
  const y = POD_LOW.y;
  // lugs on top of the pod
  const lugs = [x0 + 14, x0 + 34];
  for (const x of lugs) {
    const s = x - x0;
    const zt = pz + podR(s);
    box("rig.lug", { x: x - 1.6, y: y - 0.8, w: 3.2, d: 1.6, r: 0.3 }, zt - 0.1, 3.5, { tone: "mid", steps: 2, bevel: 0, owner: "rig", wrap: "slide" });
  }
  pod(POD_LOW, pz, { wrap: "slide", name: "rig.pod" });
  // spreader bar
  const sp = { x: x0 + 6, y: y - 2, w: 36, d: 4, r: 0.8 };
  box("rig.spreader", sp, SPREAD_Z, 4, { tone: "mid", wrap: "slide", owner: "rig", extra: screwsY(y + 2, [[x0 + 9, SPREAD_Z + 2], [x0 + 39, SPREAD_Z + 2]], 0.9) });
  // slings from lug tops to spreader ends
  for (const [i, x] of lugs.entries()) {
    const s = x - x0;
    const from = [x, y, pz + podR(s) + 3.4];
    const to = [i ? x0 + 39 : x0 + 9, y, SPREAD_Z];
    rope("rig.sling", G.fillet([from, G.add3(from, [0, 0, 2.5]), G.add3(to, [0, 0, -2.5]), to], 1.5, 6), 0.45, { tone: "mid", wrap: "slide" });
  }
  // shank and hook block
  cyl("rig.shank", XG, y, 1.4, SPREAD_Z + 4, 3, { tone: "mid", steps: 14, wrap: "slide", owner: "rig" });
  const blk = { x: XG - 5, y: y - 3.5, w: 10, d: 7, r: 1.2 };
  box("rig.block", blk, SPREAD_Z + 7, BLOCK_Z - SPREAD_Z - 7 + 6, { tone: "hi", wrap: "slide", owner: "rig", extra: L(k.sideRing([XG, y + 3.5, BLOCK_Z + 1], 3, "y", P, 20), { tone: "faint" }) + D([at([XG, y + 3.5, BLOCK_Z + 1])], { size: 0.5 }) });
  // ropes from the block up between the girders to the drum frame
  for (const dx of [-2, 2]) rope("rig.rope", [[XG + dx, y, BLOCK_Z + 6], [XG + dx, y, GT + 1.6]], 0.55, { tone: "mid", wrap: "rope", maxLength: 200 });
}

// ---------- around the jet ----------
const caster = (name, x, y, owner, r = 2.2, h = 3.6) => cyl(name, x, y, r, 0, h, { tone: "lo", steps: 14, owner });

// rolling stairs at the forward door: a chassis on casters, two side panels, steps, a top deck and rails
function stairs() {
  const O = "stairs";
  const X0 = 124;
  const X1 = 148;
  const CH = { x: X0, y: 22, w: X1 - X0, d: 72, r: 1 };
  for (const [x, y] of k.corners(CH, 3)) caster("stairs.caster", x, y, O);
  box("stairs.chassis", CH, 3.6, 3.4, { tone: "mid", owner: O, inner: L(k.sideSeam(CH, 5.3, P, 3), { tone: "faint" }) });
  const z0 = 7;
  const TOP = 38;
  const N = 6;
  const RUN = 8;
  const rise = (TOP - z0) / (N + 1);
  const sidePanel = (x) => prism("stairs.panel", YZ(x), [[22, z0], [94, z0], [36 + N * RUN, z0 + rise + 1], [36, TOP], [22, TOP]], 0, 2, { tone: "mid", owner: O });
  sidePanel(X0);
  for (let i = 1; i <= N; i++) {
    const zt = TOP - i * rise;
    box("stairs.step", { x: X0 + 2, y: 36 + (i - 1) * RUN, w: X1 - X0 - 4, d: RUN, r: 0.4 }, zt - 1.4, 1.4, { tone: "hi", steps: 2, bevel: 0.3, owner: O, inner: L(k.sideSeam({ x: X0 + 2, y: 36 + (i - 1) * RUN, w: X1 - X0 - 4, d: RUN, r: 0.4 }, zt - 0.7, P, 2), { tone: "faint" }) });
  }
  const deck = { x: X0 + 2, y: 22, w: X1 - X0 - 4, d: 14, r: 0.4 };
  box("stairs.deck", deck, TOP - 1.6, 1.6, { tone: "hi", steps: 2, owner: O, extra: D(k.dotGrid(deck.x + 3, deck.y + 3, 6, 3, 3.6, TOP, P), { size: 0.4, tone: "lo" }) });
  sidePanel(X1 - 2);
  // handrails on the outer panels: posts and a sloped top rail
  for (const x of [X0 + 1, X1 - 1]) {
    for (const [yy, zz] of [[36, TOP], [92, z0 + 3.2]]) cyl("stairs.post", x, yy, 0.7, zz, 14 - (yy === 92 ? 0 : 0), { tone: "mid", steps: 10, owner: O });
    const rail = [[23.3, TOP + 14], [36.7, TOP + 14], [92.7, z0 + 17.2], [91.3, z0 + 17.2 - 1.4], [36, TOP + 12.6], [23.3, TOP + 12.6]];
    prism("stairs.rail", YZ(x - 0.7), [[23.3, TOP + 12.6], [36.7, TOP + 12.6], [36.7, TOP + 14], [23.3, TOP + 14]], 0, 1.4, { tone: "mid", owner: O });
    prism("stairs.rail", YZ(x - 0.7), [[36.7, TOP + 12.6], [92.7, z0 + 15.8], [92.7, z0 + 17.2], [36.7, TOP + 14]], 0, 1.4, { tone: "mid", owner: O });
  }
}

// work platform at the tail: a rolling tower with a deck, guard rail and ladder
function tower() {
  const O = "tower";
  const T = { x: 146, y: -104, w: 30, d: 26, r: 1 };
  const DZ = 46;
  const base = k.insetPlan(T, -2);
  for (const [x, y] of k.corners(base, 3)) caster("tower.caster", x, y, O);
  box("tower.base", base, 3.6, 3, { tone: "mid", owner: O });
  for (const [x, y] of k.corners(T, 1.5)) cyl("tower.post", x, y, 1.1, 6.6, DZ - 6.6, { tone: "mid", steps: 12, owner: O });
  const deck = { ...T };
  box("tower.deck", deck, DZ, 2, { tone: "hi", owner: O, inner: L(k.sideSeam(deck, DZ + 1, P, 3), { tone: "faint" }) });
  for (const [x, y] of k.corners(T, 1.5)) cyl("tower.rpost", x, y, 0.7, DZ + 2, 12, { tone: "mid", steps: 10, owner: O });
  for (const yy of [T.y + 0.8, T.y + T.d - 2.2]) box("tower.rail", { x: T.x + 0.8, y: yy, w: T.w - 1.6, d: 1.4, r: 0.4 }, DZ + 14, 1.4, { tone: "mid", steps: 2, bevel: 0, owner: O });
  // ladder on the near face: two stiles and rungs between them
  const ly = T.y + T.d + 0.3;
  const stile = (x) => box("tower.stile", { x: x - 0.7, y: ly - 0.3, w: 1.4, d: 1.4, r: 0.3 }, 6.6, DZ - 6.6, { tone: "mid", steps: 2, bevel: 0, owner: O });
  stile(T.x + 9);
  const rungs = [];
  for (let z = 12; z < DZ; z += 6) rungs.push(k.segment([T.x + 9.7, ly + 1.1, z], [T.x + 19.3, ly + 1.1, z], P));
  const s2 = stile(T.x + 20);
  s2.svg = L(rungs.join(""), { tone: "mid" }) + s2.svg;
  s2.shapes.push(record(A.box([T.x + 9.7, ly + 0.9, 12], [T.x + 19.3, ly + 1.1, DZ - 4], { name: "tower.rungs", owner: O })));
}

// tool cart: drawers on the near face, a tray top, a push handle
function cart(x, y, name = "cart") {
  const C = { x, y, w: 26, d: 15, r: 1.2 };
  for (const [cx, cy] of k.corners(C, 2.6)) caster(`${name}.caster`, cx, cy, name, 2, 3.6);
  const fy = C.y + C.d;
  const drawers = [];
  for (const z of [10, 15.5, 21]) drawers.push(k.sideSeam(C, z, P, 3));
  const pulls = [];
  for (const z of [7, 12.7, 18.2, 23.5]) pulls.push(faceY(fy, [[C.x + 9, z], [C.x + 17, z]], false));
  box(`${name}.body`, C, 3.6, 22.4, { tone: "hi", owner: name, inner: L(drawers.join(""), { tone: "faint" }) + L(k.sideSeam(C, 6, P, 3), { tone: "faint" }), extra: L(pulls.join(""), { tone: "mid", free: true }) });
  const tray = k.insetPlan(C, 0.5);
  box(`${name}.tray`, tray, 26, 1.6, { tone: "mid", owner: name, extra: L(k.planOutline(k.insetPlan(tray, 2), 27.6, P, 3), { tone: "faint" }) + D([at([tray.x + 6, tray.y + 5, 27.6]), at([tray.x + 15, tray.y + 9, 27.6])], { size: 0.6, tone: "hi" }) });
  box(`${name}.handle`, { x: C.x - 3, y: C.y + 2, w: 3, d: C.d - 4, r: 0.6 }, 18, 2, { tone: "mid", steps: 2, bevel: 0, owner: name });
}

// parts rack against the back wall, with crates
function rack() {
  const O = "rack";
  const X0 = -309;
  const X1 = -189;
  const Y0 = -157;
  const Y1 = -137;
  const UP = 2.6;
  const H = 50;
  const ups = [[X0, Y0], [X0, Y1 - UP], [X1 - UP, Y0], [X1 - UP, Y1 - UP]];
  for (const [x, y] of ups) box("rack.upright", { x, y, w: UP, d: UP, r: 0.3 }, 0, H, { tone: "mid", steps: 2, bevel: 0, owner: O, extra: D([at([x + UP / 2, y + UP, 20]), at([x + UP / 2, y + UP, 40])].filter(() => y > Y0), { size: 0.4 }) });
  const shelves = [2, 20, 38];
  for (const z of shelves) {
    const sh = { x: X0 + UP, y: Y0, w: X1 - X0 - 2 * UP, d: Y1 - Y0, r: 0.3 };
    box("rack.shelf", sh, z, 2, { tone: "mid", steps: 2, bevel: 0.3, owner: O });
  }
  const crate = (x, y, w, d, z, h, lid = true) => {
    const c = { x, y, w, d, r: 0.6 };
    box("rack.crate", c, z, h, { tone: "hi", owner: O, inner: L(k.sideSeam(c, z + h * 0.5, P, 2), { tone: "faint" }), extra: lid ? L(k.planOutline(k.insetPlan(c, 1.6), z + h, P, 2), { tone: "faint" }) : "" });
  };
  crate(X0 + 6, Y0 + 2, 30, 16, 4, 14);
  crate(X0 + 70, Y0 + 2, 40, 16, 4, 15);
  crate(X0 + 8, Y0 + 3, 20, 14, 22, 12);
  crate(X0 + 74, Y0 + 2, 30, 16, 22, 14);
  crate(X0 + 20, Y0 + 3, 36, 15, 40, 10);
  // floor pallet with crates
  const pal = { x: -180, y: -156, w: 40, d: 32, r: 0.6 };
  box("rack.pallet", pal, 0, 4, { tone: "lo", owner: O, inner: L(k.sideSeam(pal, 2, P, 3), { tone: "faint" }) });
  crate(pal.x + 2, pal.y + 2, 22, 28, 4, 16);
  crate(pal.x + 25, pal.y + 4, 13, 14, 4, 10);
}

// cable reels on their flanges
function reel(x, y, name = "reel") {
  const R0 = 11;
  const Wd = 12;
  const F = YF([x, y, R0]);
  disc(`${name}.flange`, F, 0, 1.5, R0, { tone: "mid", owner: name });
  const wraps = [3.5, 5.5, 7.5, 9.5].map((s) => G.arcOf(F, s, 7.6, P)).join("");
  disc(`${name}.drum`, F, 1.5, Wd - 1.5, 7.6, { tone: "hi", owner: name, inner: L(wraps, { tone: "faint" }) });
  disc(`${name}.flange`, F, Wd - 1.5, Wd, R0, { tone: "mid", owner: name, extra: L(G.circleOf(F, Wd, 3, P), { tone: "lo" }) + D(G.dotsOf(F, Wd, 6.5, 6, P, { all: true }), { size: 0.45 }) });
}

// tow tug at the nose, with its tow bar on the nose gear
function tug() {
  const O = "tug";
  const B = { x: 256, y: -15, w: 48, d: 30, r: 3 };
  for (const yy of [B.y - 4.6, B.y + B.d]) for (const xx of [266, 294]) {
    const F = YF([xx, yy, 5.4]);
    disc("tug.wheel", F, 0, 4.6, 5.5, { tone: "lo", owner: O, extra: yy > 0 ? L(G.circleOf(F, 4.6, 2.6, P), { tone: "mid" }) + D([at([xx, yy + 4.6, 5.4])], { size: 0.5 }) : "" });
  }
  box("tug.body", B, 3, 12, { tone: "hi", owner: O, bevel: 0.8, inner: L(k.sideSeam(B, 8, P, 3), { tone: "faint" }), extra: L(k.planOutline(k.insetPlan({ ...B, w: 26 }, 3), 15, P, 3), { tone: "faint" }) });
  const cab = { x: 286, y: -11, w: 14, d: 22, r: 2 };
  box("tug.console", cab, 15, 9, { tone: "mid", owner: O });
  box("tug.seat", { x: 290, y: -6, w: 8, d: 12, r: 1.4 }, 24, 3, { tone: "mid", owner: O });
  box("tug.wheelpost", { x: 287, y: -1, w: 2, d: 2, r: 0.4 }, 24, 7, { tone: "mid", steps: 2, bevel: 0, owner: O });
  cyl("tug.steer", 284.5, 0, 3.6, 31, 1.2, { tone: "hi", steps: 20, owner: O });
  box("tug.beaconbase", { x: 296, y: 6, w: 4, d: 4, r: 0.6 }, 24, 1.5, { tone: "mid", steps: 2, owner: O });
  cyl("tug.beacon", 298, 8, 1.8, 25.5, 3.4, { tone: "hi", steps: 16, owner: O, extra: a.amBlink(ink(L(k.sideArc(298, 8, 1.8, 27, P, 12), { tone: "lit" }) + D([at([298, 8, 28.9])], { size: 1.1, tone: "lit" })), { period: 3400, delay: 1900 }) });
  // tow bar to a fitting on the nose gear strut
  box("tug.fitting", { x: 187.4, y: -2, w: 4, d: 4, r: 0.5 }, 12.6, 3, { tone: "mid", steps: 2, bevel: 0, owner: "jet" });
  box("tug.towbar", { x: 191.4, y: -1.2, w: B.x - 191.4, d: 2.4, r: 0.6 }, 13, 2, { tone: "mid", steps: 2, bevel: 0.3, owner: O });
}

// charger cart: a cabinet on casters with a screen outline and a status LED
function charger() {
  const O = "charger";
  const C = { x: 214, y: 44, w: 24, d: 20, r: 1.6 };
  for (const [cx, cy] of k.corners(C, 3)) caster("charger.caster", cx, cy, O);
  const fy = C.y + C.d;
  const scr = faceY(fy, [[C.x + 4, 20], [C.x + 16, 20], [C.x + 16, 28], [C.x + 4, 28]], true);
  const vents = [0, 1, 2, 3].map((i) => faceY(fy, [[C.x + 4, 8 + i * 2.4], [C.x + 20, 8 + i * 2.4], [C.x + 20, 9 + i * 2.4], [C.x + 4, 9 + i * 2.4]], true)).join("");
  // charging port on the fuselage and the cable to it
  const t = -35 * DEG;
  const PS = 202;
  const n = [0, Math.cos(t), Math.sin(t)];
  const base = onFuse(PS, t, -0.6);
  const PF = G.frameAlong(base, n);
  disc("jet.port", PF, 0, 2.2, 2.6, { tone: "mid", owner: "jet", extra: L(G.circleOf(PF, 2.2, 1.4, P), { tone: "lo" }) });
  const tip = G.add3(base, G.mul3(n, 2.2));
  const out = G.add3(tip, G.mul3(n, 7));
  const start = [C.x + C.w / 2, C.y, 24];
  const route = G.fillet([start, [start[0], start[1] - 6, 24], [out[0] + 6, out[1] + 4, out[2] - 6], out, tip], 4, 8, { P, tube: 0.8 });
  rope("charger.cable", route, 0.8, { tone: "hi", maxLength: 12 });
  box("charger.body", C, 3.6, 28, { tone: "hi", owner: O, bevel: 0.6, inner: L(scr + vents, { tone: "mid" }), extra: a.amBlink(ink(D([at([C.x + 20, fy, 26])], { size: 1.2, tone: "lit" })), { period: 2400, delay: 900 }) });
}

// spare pod on a transport cradle
function spare() {
  const O = "spare";
  const C = { x: 226, y: -150, w: 52, d: 22, r: 1.6 };
  for (const [cx, cy] of k.corners(C, 3)) caster("spare.caster", cx, cy, O);
  box("spare.cradle", C, 3.6, 4, { tone: "mid", owner: O, inner: L(k.sideSeam(C, 5.6, P, 3), { tone: "faint" }) });
  const x0 = C.x + 3;
  const yc = C.y + C.d / 2;
  const pz = 7.6 + 6 + 8.8;
  for (const s of [12, 34]) box("spare.saddle", { x: x0 + s - 3, y: yc - 6, w: 6, d: 12, r: 0.8 }, 7.6, pz - podR(s) - 7.6 + 0.2, { tone: "mid", steps: 2, owner: O });
  pod({ x0, y: yc }, pz, { name: "spare.pod", owner: O });
}

// light bars on masts off the back wall
function lights() {
  for (const x of [-110, 80, 250]) {
    const O = `light${x}`;
    const yw = FLOOR.y + 2;
    box("light.mast", { x: x - 2, y: yw, w: 4, d: 4, r: 0.4 }, WALL_H, 44, { tone: "mid", steps: 2, bevel: 0, owner: O });
    const arm = { x: x - 2, y: yw + 4, w: 4, d: 46, r: 0.4 };
    box("light.arm", arm, WALL_H + 40, 4, { tone: "mid", steps: 2, bevel: 0, owner: O });
    const bar = { x: x - 38, y: yw + 42, w: 76, d: 6, r: 1.4 };
    const zb = WALL_H + 35;
    box("light.bar", bar, zb, 5, { tone: "hi", owner: O, bevel: 0.4, extra: a.amPulse(ink(L(k.segment([bar.x + 1.4, bar.y + bar.d, zb], [bar.x + bar.w - 1.4, bar.y + bar.d, zb], P), { tone: "lit" })), { period: 4800, delay: x * 7, min: 0.55 }) });
  }
}

// ---------- assemble ----------
fuselage();
wing(1);
wing(-1);
vtail(1);
vtail(-1);
for (const p of PODS) {
  pylon(p);
  if (!p.lowered) pod(p, p.z);
}
gearLeg("jet.nose", 186, 0, 6.2, 3.4, FZ - fr(186) + 0.4, { gap: 1.6 });
for (const sign of [-1, 1]) gearLeg("jet.main", -66, sign * 26, 8.6, 4.2, WZ + 0.1);
gantryRails();
for (const px of PORTALS) portal(px);
girders();
trolley();
lift();
stairs();
tower();
cart(70, 140, "cart");
cart(214, -100, "cart2");
rack();
reel(-176, 154, "reel");
reel(276, 118, "reel2");
tug();
charger();
spare();
lights();

A.settle(R, P);
R.items.sort((p, q) => p.key - q.key);

// motion wrappers: the lifted parts slide together; the ropes stretch from the drum frame
const PERIOD = 7600;
const ROPE_TOP = at([XG, YP, GT + 1.6]);
const ROPE_LEN = (GT + 1.6 - BLOCK_Z - 6) * k.cameraOf(P).cosE * k.cameraOf(P).k;
const DROP = at(SLIDE)[1] - at([0, 0, 0])[1];
const ropeCss = `
@keyframes ah-stretch{0%,100%{transform:scale(1,1)}50%{transform:scale(1,${((ROPE_LEN + DROP) / ROPE_LEN).toFixed(4)})}}
.ah-rope{transform-box:view-box;transform-origin:${ROPE_TOP[0].toFixed(2)}px ${ROPE_TOP[1].toFixed(2)}px;animation:ah-stretch ${(PERIOD / 1000).toFixed(2)}s cubic-bezier(.45,0,.55,1) 0s infinite}
@media (prefers-reduced-motion:reduce){.ah-rope{animation:none}}`;
const HULL = /^(jet\.(fuselage|wing|winglet|vtail|pod|pylon|port)|spare\.pod)/;
const wrapped = (item) => {
  if (HULL.test(item.name)) return `<g class="ac-hull">${item.svg}</g>`;
  if (item.wrap === "slide") return a.amSlide(item.svg, SLIDE, P, { period: PERIOD });
  if (item.wrap === "rope") return `<g class="ah-rope">${item.svg}</g>`;
  return item.svg;
};

// lossless path minifier (as in feature-spots): relative commands in integer tenths
const num = (t) => (t / 10).toString().replace(/^(-?)0\./, "$1.");
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
const body = minify([...back, ...R.items.map(wrapped)].join(""));
const name = light ? "aero-hangar-light" : "aero-hangar";
const svg = a.assetSvg({
  width: W,
  height: H,
  label: "An isometric cutaway of an aircraft final-assembly hangar: a long-range electric jet on its gear, a gantry crane lowering an ice-blue fan pod onto its wing, with stairs, tool carts, a parts rack, cable reels and a tow tug around it.",
  body,
  paper: PAPER,
  accents: { ice: ICE, led: { hex: ICE, mode: "ink" }, hull: light ? "#f6f8fa" : "#c9d2dc", glass: light ? "#3c4a5c" : "#0d1520", fan: light ? "#7d8896" : "#4a5563" },
  weight: 0.85,
  css: ropeCss,
  id: name,
});
writeFileSync(join(HERE, `${name}.svg`), svg);
writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W }));
const solids = (svg.match(/class="iso-solid/g) || []).length;
if (process.env.SIZES) [...R.items].sort((p, q) => q.svg.length - p.svg.length).slice(0, 12).forEach((i) => console.log(i.name, (i.svg.length / 1024).toFixed(1)));
console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB, ${solids} solids, ${R.items.length} items) scale ${P.scale.toFixed(3)}`);

A.auditOrExit(R, P, { crowd: [["rig.rope*", "jet.fuselage"], ["rig.rope*", "gantry.girder*"], ["rig.sling*", "jet.pod*"]] });
