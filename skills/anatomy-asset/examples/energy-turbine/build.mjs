// The landing-page hero for "Halden", a clean-energy company ("Power that renews itself"):
// a modern three-bladed wind turbine on a small grassy hill plot, built like a diorama. The
// plot is a turf block over earth and bedrock with a raised upper tier; the tapered tower
// stands on a concrete plinth with a door, a landing and steps; the nacelle carries a cooler,
// a met mast with an anemometer, a wind vane and an aviation light; three long blades lie
// in the vertical rotor plane and turn slowly in it (amSpin in the rotor's plane). Around the
// base: a gravel access road, a fenced transformer kiosk, a service van, trees, shrubs and
// rocks. The green band on the nacelle and tower carries the brand; the aviation light
// blinks, the wind vane swings, and a small inspection drone, its propellers spinning, hovers by
// the rotor.
//
//   node build.mjs           light → energy-turbine.svg, energy-turbine.html
//   node build.mjs --dark    dark  → energy-turbine-dark.svg, energy-turbine-dark.html
//   node build.mjs --audit   also runs the geometry audit (painter's order, supports, cover)

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";
import * as a from "../../kit/asset.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const dark = process.argv.includes("--dark");
const PAPER = dark ? "#0d100e" : "#f4f3ee";
const BRAND = "#1f8f5f";
const DEG = Math.PI / 180;

const W = 1200;
const H = 640;
const SAFE = { x: 0, y: 0, w: 470, h: H };
const REGION = { x: 500, y: 24, w: 670, h: 592 };
const AZIMUTH = 50;

// ---------- world ----------
const PLOT = { x: -142, y: -124, w: 284, d: 238, r: 26 };
const ROCK_Z = [-40, -31];
const EARTH_Z = [-31, -6];
const TURF_Z = [-6, 0];
const UPPER = { x: -125, y: -118, w: 150, d: 150, r: 36 };
const UPPER_Z = [0, 8, 12];                       // earth bottom, turf bottom, turf top
const TX = -50;
const TY = -45;
const PLINTH = { x: TX - 28, y: TY - 28, w: 56, d: 56, r: 6 };
const PLINTH_TOP = 20;
const TOWER_Z0 = 22.5;
const TOWER_TOP = 222;
const towerR = (z) => 14 - ((z - TOWER_Z0) * 5.4) / (TOWER_TOP - TOWER_Z0);
const HZ = 240;                                   // hub axis height
const NAC = { y0: TY - 44, y1: TY + 20, half: 13, tall: 15, r: 6 };
const NAC_TOP = HZ + NAC.tall;
const HUB_R = 14;
const HUB_S = 14;                                 // sphere centre, from the nacelle front
const D = [0, 1, 0];                              // rotor axis
const C = [TX, NAC.y1 + HUB_S, HZ];               // hub centre
const BLADE_AT = [76, 196, 316];                  // degrees in the rotor plane (x–z), 90 is up
const SPAN = 152;
const radial = (deg) => [Math.cos(deg * DEG), 0, Math.sin(deg * DEG)];
const tip = (deg, r = SPAN) => G.add3(C, G.mul3(radial(deg), r));
const DRONE = G.add3(tip(208, 172), [0, 26, 0]);

const P = a.fitInto(
  [
    ...k.boxCorners(PLOT, ROCK_Z[0], 0),
    ...Array.from({ length: 36 }, (_, i) => tip(i * 10, SPAN + 2)),
    [TX, TY - 40, NAC_TOP + 40],
    G.add3(C, [0, 42, 0]),
    G.add3(DRONE, [-12, 0, 6]),
    G.add3(DRONE, [12, 0, -8]),
  ],
  REGION,
  { pad: 6, azimuth: AZIMUTH, elevation: 30 },
);

const V = G.viewOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const Dt = (pts, style) => k.dotsSvg(pts, style);
const depth = (p) => k.depthOf(p, P);
const byDepth = (list, key = (i) => i) => [...list].sort((p, q) => depth(key(p)) - depth(key(q)));
const cls = (name) => (svg) => `<g class="ac-${name}">${svg}</g>`;
const brand = cls("brand");
const turf = cls("turf");
const leaf = cls("leaf");
const earth = cls("earth");
const rock = cls("rock");
const ebony = cls("ebony");
const glass = cls("glass");
const path = (pts, closed = false) => k.pathOf(pts.map(at), closed);

// Closed outlines in a vertical face plane. face "y": the plane y = c, u along x.
// face "x": the plane x = c, u along y.
function faceRect(face, c, u0, u1, z0, z1, r = 0, steps = 3) {
  const ring = k.roundedPlan({ x: u0, y: z0, w: u1 - u0, d: z1 - z0, r }, steps);
  return k.pathOf(ring.map(([u, v]) => at(face === "y" ? [u, c, v] : [c, u, v])), true);
}
const facePt = (face, c, u, z) => at(face === "y" ? [u, c, z] : [c, u, z]);

// ---------- the recorder: every part is a sorted item with its true shape ----------
const R = A.recorder(P);
const record = (shape) => R.solid(shape);
// In the dark theme the turbine's white composite (and the van and kiosk) keeps a light ramp.
const WHITE = /^(tower\.(s\d|ring\d)|nacelle$|nacelle\.nose|cooler|hub|blade|van\.(body|cab)|kiosk$|kiosk\.roof)/;
function put(name, centre, svg, shapes, bias = 0) {
  if (dark && WHITE.test(name)) svg = `<g class="ac-white">${svg}</g>`;
  R.put({ piece: "scene", name: R.nameFor(name), at: centre, bias, svg, shapes });
}
const mid = (plan, z, h) => [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2];

function slabItem(name, plan, z, h, { tone = "mid", steps = 3, bevel = 0.5, wrap = (s) => s, extra = "", inner = "", lit, crease, owner } = {}) {
  const svg = wrap(S(k.slabOf(plan, z, h, P, steps, bevel), { tone, lit, crease, inner }) + extra);
  put(name, mid(plan, z, h), svg, [record(A.slab(plan, z, h, { name, owner }, steps))]);
}

function cylItem(name, cx, cy, r, z, h, { tone = "mid", steps = 28, bevel = 0, wrap = (s) => s, extra = "", inner = "", lit, owner } = {}) {
  const svg = wrap(S(k.cylinder(cx, cy, r, z, h, P, steps, bevel), { tone, lit, inner }) + extra);
  put(name, [cx, cy, z + h / 2], svg, [record(A.cylinder(cx, cy, r, z, h, { name, owner }))]);
}

function rotate(cx, cy, w, d, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([u, v]) => [cx + u * c - v * s, cy + u * s + v * c]);
}

// ---------- the plot: bedrock, earth and turf, drawn first ----------
const pebbles = [];
function pebble(face, c, u, z, rx, rz) {
  const pts = [];
  for (let i = 0; i < 14; i++) {
    const t = (i / 14) * Math.PI * 2;
    pts.push(face === "y" ? [u + Math.cos(t) * rx, c, z + Math.sin(t) * rz] : [c, u + Math.cos(t) * rx, z + Math.sin(t) * rz]);
  }
  pebbles.push(path(pts, true));
}
function plot() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(PLOT, -8), ROCK_Z[0], 5, P)}"/>`];
  const seam = (z) => k.sideSeam(PLOT, z, P, 8);
  out.push(rock(S(k.slabOf(PLOT, ROCK_Z[0], ROCK_Z[1] - ROCK_Z[0], P, 8), { tone: "mid", inner: L(seam(ROCK_Z[0] + 5), { tone: "faint" }) })));
  record(A.slab(PLOT, ROCK_Z[0], ROCK_Z[1] - ROCK_Z[0], { name: "stand.rock" }));
  // Stones in the earth: closed outlines on the two visible faces.
  const fx = PLOT.x + PLOT.w;
  const fy = PLOT.y + PLOT.d;
  [[-96, -16, 3.2, 2], [-58, -27, 4.4, 2.6], [-20, -12, 2.6, 1.6], [24, -22, 3.6, 2.2], [66, -15, 2.4, 1.5], [96, -28, 4, 2.4]].forEach(([u, z, rx, rz]) => pebble("y", fy, u, z, rx, rz));
  [[-92, -20, 3.4, 2], [-70, -13, 2.4, 1.5], [-30, -26, 4.2, 2.5], [6, -17, 2.8, 1.7], [44, -24, 3.6, 2.2], [80, -14, 2.6, 1.6]].forEach(([u, z, rx, rz]) => pebble("x", fx, u, z, rx, rz));
  out.push(earth(S(k.slabOf(PLOT, EARTH_Z[0], EARTH_Z[1] - EARTH_Z[0], P, 8), { tone: "mid", inner: L(seam(EARTH_Z[0] + 10), { tone: "faint" }) + L(pebbles.join(""), { tone: "lo" }) })));
  record(A.slab(PLOT, EARTH_Z[0], EARTH_Z[1] - EARTH_Z[0], { name: "stand.earth" }));
  out.push(turf(S(k.slabOf(PLOT, TURF_Z[0], TURF_Z[1] - TURF_Z[0], P, 8, 1.2), { tone: "mid" })));
  record(A.slab(PLOT, TURF_Z[0], TURF_Z[1] - TURF_Z[0], { name: "stand.turf" }));
  return out.join("");
}

// The gravel road: from the plot's +x edge to the foot of the upper tier, with a branch to
// the kiosk gate. Thin flat slabs on the turf, gravel as sparse dots.
const ROAD = { x: 37, y: -26, w: 105, d: 16, r: 0 };
const BRANCH = { x: 80, y: -10, w: 13, d: 28, r: 0 };
const ROAD_TOP = 0.5;
function gravel(plan, seed, count) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts = [];
  for (let i = 0; i < count; i++) pts.push(at([plan.x + 1.5 + rnd() * (plan.w - 3), plan.y + 1.5 + rnd() * (plan.d - 3), ROAD_TOP]));
  return Dt(pts, { size: 0.4, tone: "lo" });
}
function road() {
  const out = [];
  for (const [i, plan] of [ROAD, BRANCH].entries()) {
    out.push(S(k.slabOf(plan, 0, ROAD_TOP, P, 1), { tone: "lo", crease: "none" }));
    out.push(gravel(plan, 17 + i * 31, Math.round((plan.w * plan.d) / 26)));
    record(A.slab(plan, 0, ROAD_TOP, { name: `stand.road${i}` }, 1));
  }
  return out.join("");
}

// ---------- the upper tier, its stone steps ----------
function upperTier() {
  const svg =
    earth(S(k.slabOf(UPPER, UPPER_Z[0], UPPER_Z[1] - UPPER_Z[0], P, 8), { tone: "mid", inner: L(k.sideSeam(UPPER, 3.5, P, 8), { tone: "faint" }) })) +
    turf(S(k.slabOf(UPPER, UPPER_Z[1], UPPER_Z[2] - UPPER_Z[1], P, 8, 1), { tone: "mid" }));
  put("tier", mid(UPPER, 0, 12), svg, [record(A.slab(UPPER, UPPER_Z[0], UPPER_Z[1] - UPPER_Z[0], { name: "tier.earth", owner: "tier" })), record(A.slab(UPPER, UPPER_Z[1], UPPER_Z[2] - UPPER_Z[1], { name: "tier.turf", owner: "tier" }))]);
  // Three stone steps from the road up on to the tier, against its +x face.
  const x0 = UPPER.x + UPPER.w;
  for (let i = 0; i < 3; i++) {
    const plan = { x: x0 + i * 4, y: ROAD.y + 1, w: 4, d: ROAD.d - 2, r: 0.4 };
    slabItem("steps", plan, ROAD_TOP, 4 * (3 - i) - ROAD_TOP, { tone: "mid", steps: 2, bevel: 0.4 });
  }
  // A short gravel path on the tier, from the steps to the plinth.
  const top = { x: PLINTH.x + PLINTH.w, y: ROAD.y + 1, w: x0 - PLINTH.x - PLINTH.w, d: ROAD.d - 2, r: 0 };
  put("tier.path", mid(top, UPPER_Z[2], 0.5), S(k.slabOf(top, UPPER_Z[2], 0.5, P, 1), { tone: "lo", crease: "none" }) + Dt(Array.from({ length: 22 }, (_, i) => at([top.x + 1.5 + ((i * 7.3) % (top.w - 3)), top.y + 1.5 + ((i * 4.9) % (top.d - 3)), UPPER_Z[2] + 0.5])), { size: 0.4, tone: "lo" }), [record(A.slab(top, UPPER_Z[2], 0.5, { name: "tier.path" }, 1))]);
}

// ---------- tower ----------
const VF = G.frameOf([TX, TY, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const seg = (z0, z1, dr = 0) => [[z0, towerR(z0) + dr], [z1, towerR(z1) + dr]];

function turned(name, F, profile, style = {}, { inner = "", extra = "", wrap = (s) => s, owner, bias = 0, smooth } = {}) {
  const paths = G.solidOf(profile, F, P, smooth ? { smooth } : {});
  const s = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const svg = wrap(S(paths, { tone: "hi", ...style, inner }) + extra);
  put(name, G.add3(F.o, G.mul3(F.a, s)), svg, [record(A.solid(F, profile, { name, owner }))], bias);
}
function discItem(name, F, s0, s1, r, style = {}, { extra = "", wrap = (s) => s, owner, inner = "" } = {}) {
  const svg = wrap(S(G.disc(s0, s1, r, F, P), { tone: "mid", ...style, inner }) + extra);
  put(name, G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), svg, [record(A.disc(F, s0, s1, r, { name, owner }))]);
}

// The door on the +x side of the bottom section: a closed outline on the conical surface.
const DOOR = { a: 0.33, z0: 30, z1: 54 };
function doorLines() {
  const pts = [];
  const on = (ang, z) => G.pointOf(VF, z, towerR(z) + 0.05, ang);
  for (let i = 0; i <= 10; i++) pts.push(on(-DOOR.a + (2 * DOOR.a * i) / 10, DOOR.z0));
  for (let i = 0; i <= 10; i++) pts.push(on(DOOR.a, DOOR.z0 + ((DOOR.z1 - DOOR.z0) * i) / 10));
  for (let i = 0; i <= 10; i++) pts.push(on(DOOR.a - (2 * DOOR.a * i) / 10, DOOR.z1));
  for (let i = 0; i <= 10; i++) pts.push(on(-DOOR.a, DOOR.z1 - ((DOOR.z1 - DOOR.z0) * i) / 10));
  const frame = path(pts, true);
  // A small louvre above the door, also closed.
  const vent = [];
  for (let i = 0; i <= 6; i++) vent.push(G.pointOf(VF, 60, towerR(60) + 0.05, -0.2 + (0.4 * i) / 6));
  for (let i = 0; i <= 6; i++) vent.push(G.pointOf(VF, 64, towerR(64) + 0.05, 0.2 - (0.4 * i) / 6));
  return L(frame, { tone: "mid" }) + L(path(vent, true), { tone: "lo" }) + Dt([at(G.pointOf(VF, 42, towerR(42) + 0.1, 0.25))], { size: 0.55, tone: "hi" }) + Dt([35, 49].map((z) => at(G.pointOf(VF, z, towerR(z) + 0.1, -DOOR.a + 0.04))), { size: 0.4 });
}

const RINGS = [88, 156];
const BAND = [186, 196];
function tower() {
  // Plinth and base flange.
  slabItem("plinth", PLINTH, UPPER_Z[2], PLINTH_TOP - UPPER_Z[2], { tone: "mid", steps: 4, bevel: 0.8, extra: Dt(k.corners(PLINTH, 5).map(([x, y]) => at([x, y, PLINTH_TOP])), { size: 0.5 }) + L(k.corners(PLINTH, 5).map(([x, y]) => k.ring(x, y, 1.8, PLINTH_TOP, P, 14)).join(""), { tone: "lo" }) });
  discItem("tower.flange", VF, PLINTH_TOP, TOWER_Z0, 16.4, { tone: "mid" }, { extra: Dt(G.dotsOf(VF, TOWER_Z0, 15.3, 28, P, { all: true }), { size: 0.4 }) });
  // Sections with flange rings between them; a brand band wraps the top section.
  const cuts = [TOWER_Z0, RINGS[0], RINGS[0] + 1.8, RINGS[1], RINGS[1] + 1.8, TOWER_TOP];
  turned("tower.s0", VF, seg(cuts[0], cuts[1]), { tone: "hi" }, { extra: doorLines() });
  discItem("tower.ring0", VF, cuts[1], cuts[2], towerR(cuts[1]) + 0.9, { tone: "mid" });
  turned("tower.s1", VF, seg(cuts[2], cuts[3]), { tone: "hi" });
  discItem("tower.ring1", VF, cuts[3], cuts[4], towerR(cuts[3]) + 0.9, { tone: "mid" });
  turned("tower.s2", VF, seg(cuts[4], BAND[0]), { tone: "hi" });
  turned("tower.band", VF, seg(BAND[0], BAND[1], 0.3), { tone: "hi" }, { wrap: brand });
  turned("tower.s3", VF, seg(BAND[1], cuts[5]), { tone: "hi" });
  discItem("tower.yaw", VF, TOWER_TOP, NAC_TOP - 2 * NAC.tall, 10, { tone: "mid" }, { extra: Dt(G.dotsOf(VF, TOWER_TOP, 9.2, 18, P, { fade: [0.04, 0.42] }), { size: 0.4 }) });

  // Landing in front of the door on two legs, a rail and three steps down to the plinth.
  const deck = { x: TX + towerR(29) - 0.3, y: TY - 8, w: 12, d: 16, r: 0.6 };
  const legs = [[deck.x + deck.w - 2, deck.y + 0.6], [deck.x + deck.w - 2, deck.y + deck.d - 2]];
  for (const [x, y] of legs) slabItem("landing.leg", { x, y, w: 1.4, d: 1.4, r: 0.3 }, PLINTH_TOP, DOOR.z0 - 2 - PLINTH_TOP, { tone: "lo", steps: 2, bevel: 0 });
  slabItem("landing", deck, DOOR.z0 - 2, 2, { tone: "mid", steps: 2, bevel: 0.4, inner: "", extra: L(k.planOutline(k.insetPlan(deck, 1.6), DOOR.z0, P, 2), { tone: "faint" }) });
  for (const y of [deck.y + 0.6, deck.y + deck.d - 1.8]) cylItem("landing.post", deck.x + deck.w - 1.4, y + 0.6, 0.6, DOOR.z0, 10, { tone: "mid", steps: 12 });
  slabItem("landing.rail", { x: deck.x + deck.w - 2.2, y: deck.y, w: 1.6, d: deck.d, r: 0.5 }, DOOR.z0 + 10, 1.2, { tone: "hi", steps: 2, bevel: 0 });
  for (let i = 0; i < 3; i++) {
    const plan = { x: deck.x + 1.6, y: deck.y + deck.d + 4 * i, w: 9, d: 4, r: 0.3 };
    slabItem("landing.step", plan, PLINTH_TOP, DOOR.z0 - 2.5 * (i + 1) - PLINTH_TOP, { tone: "mid", steps: 2, bevel: 0.3 });
  }
}

// ---------- nacelle ----------
const NF = G.frameOf([TX, NAC.y0, HZ], D, [1, 0, 0], [0, 0, 1]);
const NAC_LEN = NAC.y1 - NAC.y0;
const section = (grow = 0) => k.roundedPlan({ x: -NAC.half - grow, y: -NAC.tall - grow, w: 2 * (NAC.half + grow), d: 2 * (NAC.tall + grow), r: NAC.r + grow }, 4);

let VANE = "";
function nacelle() {
  const side = TX + NAC.half;
  const vents = [0, 1, 2, 3].map((i) => faceRect("x", side, NAC.y0 + 8, NAC.y0 + 24, HZ - 6 + i * 3.6, HZ - 4.4 + i * 3.6, 0.8)).join("");
  const hatch = faceRect("x", side, NAC.y0 + 30, NAC.y0 + 46, HZ - 8, HZ + 7, 1.2);
  const lines = L(vents, { tone: "lo" }) + L(hatch, { tone: "mid" }) + Dt([facePt("x", side, NAC.y0 + 32, HZ + 5), facePt("x", side, NAC.y0 + 32, HZ - 6), facePt("x", side, NAC.y0 + 44, HZ - 0.5)], { size: 0.45 });
  const roofHatch = L(k.planOutline({ x: TX - 5, y: NAC.y0 + 30, w: 10, d: 14, r: 1 }, NAC_TOP, P, 2), { tone: "mid" }) + Dt([at([TX - 3, NAC.y0 + 32, NAC_TOP]), at([TX + 3, NAC.y0 + 32, NAC_TOP])], { size: 0.45 });
  // The shell in three lengths: the back, the brand band, the nose behind the hub.
  const cuts = [0, NAC_LEN - 13, NAC_LEN - 6, NAC_LEN];
  const shell = (nm, i, svg, wrap = (x) => x) => put(nm, G.add3(NF.o, G.mul3(D, (cuts[i] + cuts[i + 1]) / 2)), wrap(S(G.prismOf(NF, section(), cuts[i], cuts[i + 1], P), { tone: "hi" }) + svg), [record(A.prism(NF, section(), cuts[i], cuts[i + 1], { name: nm, owner: "nacelle" }))]);
  shell("nacelle", 0, lines + roofHatch);
  shell("nacelle.band", 1, "", brand);
  shell("nacelle.nose", 2, "");
  // Cooler on the roof at the back, its fins on the visible side.
  const cooler = { x: TX - 7, y: NAC.y0 + 2, w: 14, d: 16, r: 0.8 };
  const fins = [];
  for (let y = cooler.y + 2; y < cooler.y + cooler.d - 1; y += 2) fins.push(k.segment([cooler.x + cooler.w, y, NAC_TOP], [cooler.x + cooler.w, y, NAC_TOP + 10], P));
  slabItem("cooler", cooler, NAC_TOP, 10, { tone: "mid", steps: 2, bevel: 0.5, inner: L(fins.join(""), { tone: "lo" }) });
  // Met mast: post, crossbar, anemometer, wind vane and the aviation light.
  const mx = TX;
  const my = NAC.y0 + 7;
  const MZ = NAC_TOP + 10;
  cylItem("mast.post", mx, my, 1, MZ, 18, { tone: "mid", steps: 14 });
  const bar = { x: mx - 9, y: my - 0.7, w: 18, d: 1.4, r: 0.4 };
  const BZ = MZ + 18;
  slabItem("mast.bar", bar, BZ, 1.2, { tone: "mid", steps: 2, bevel: 0 });
  // Anemometer on the -x end: post, hub and three cups on arms.
  const ax = mx - 7.6;
  cylItem("anemo.post", ax, my, 0.5, BZ + 1.2, 4, { tone: "mid", steps: 10 });
  const cups = [20, 140, 260].map((deg) => [ax + 4.4 * Math.cos(deg * DEG), my + 4.4 * Math.sin(deg * DEG)]);
  const anemo = [];
  const anemoShapes = [];
  const HZA = BZ + 5.2;
  anemo.push(S(k.cylinder(ax, my, 1.2, HZA, 1.6, P, 14), { tone: "mid" }));
  anemoShapes.push(A.cylinder(ax, my, 1.2, HZA, 1.6, { name: "anemo.hub", owner: "anemo" }));
  for (const [cx, cy] of byDepth(cups, (c) => [c[0], c[1], HZA])) {
    const ang = Math.atan2(cy - my, cx - ax);
    const ring = rotate((ax + cx) / 2, (my + cy) / 2, 4.4, 0.5, ang);
    anemo.push(S(k.extrude(ring, HZA + 0.6, 0.4, P), { tone: "mid", crease: "none" }));
    anemo.push(S(k.cylinder(cx, cy, 1.1, HZA, 1.6, P, 12), { tone: "hi" }));
    anemoShapes.push(A.extruded(ring, HZA + 0.6, 0.4, { name: "anemo.arm", owner: "anemo" }), A.cylinder(cx, cy, 1.1, HZA, 1.6, { name: "anemo.cup", owner: "anemo" }));
  }
  put("anemo", [ax, my, HZA + 1], anemo.join(""), anemoShapes.map(record));
  // Wind vane on the +x end.
  const vx = mx + 7.6;
  cylItem("vane.post", vx, my, 0.5, BZ + 1.2, 3.4, { tone: "mid", steps: 10 });
  // The vane itself: a flat arrow on the post top that swings gently about the post.
  const arrow = "M0 -6.5L1.4 -4.2L0.35 -4.2L0.35 2.6L2 4.8L2 6.4L0 5.6L-2 6.4L-2 4.8L-0.35 2.6L-0.35 -4.2L-1.4 -4.2Z";
  VANE = a.amSwing(`<path class="et-vane" d="${arrow}"/><circle class="et-vane" r="0.7"/>`, a.topPlane([vx, my, BZ + 4.6], P), { from: -14, to: 12, period: 4600, delay: 900 });
  // Aviation light on the crossbar centre.
  cylItem("beacon.base", mx, my, 1.6, BZ + 1.2, 1.2, { tone: "mid", steps: 16 });
  const lampZ = BZ + 2.4;
  cylItem("beacon", mx, my, 1.2, lampZ, 2.4, { tone: "hi", steps: 16, wrap: cls("beacon") });
}

// ---------- rotor ----------
const HF = G.frameOf([TX, NAC.y1, HZ], D, [1, 0, 0], [0, 0, 1]);
const NOSE_S = HUB_S + 5;
const NOSE_R = Math.sqrt(HUB_R ** 2 - 25);
const NOSE_LEN = 20.5;
const NOSE_P = 0.6;
const noseR = (s) => NOSE_R * Math.max(0, 1 - (s - NOSE_S) / NOSE_LEN) ** NOSE_P;
const noseSlope = (s) => {
  const x = Math.min(0.995, Math.max(0, (s - NOSE_S) / NOSE_LEN));
  return (-NOSE_P * NOSE_R) / NOSE_LEN / (1 - x) ** (1 - NOSE_P);
};

// The planform in (radial, chord): a narrow root under the hub, the widest chord near the
// root, a long straight taper to a rounded tip.
const LEADING = [[16, 3.4], [25, 3.6], [40, 5.3], [90, 3.2], [SPAN - 6, 0.8]];
const PLANFORM = [[8, 4.2], [25, 4.4], [40, 6.2], [90, 4.0], [SPAN - 6, 1.5], [SPAN - 1.3, 0.8], [SPAN, 0], [SPAN - 1.3, -0.9], [SPAN - 6, -1.8], [90, -6.4], [46, -10], [33, -8.6], [25, -4.4], [8, -4.2]];

function rotor() {
  discItem("hub.neck", HF, 0, HUB_S - Math.sqrt(HUB_R ** 2 - 81), 9, { tone: "mid" }, { owner: "rotor" });
  put("hub", C, S(G.sphereOf(C, HUB_R, P), { tone: "hi" }), [record(A.ball(C, HUB_R, { name: "hub", owner: "rotor" }))]);
  const nose = [];
  for (let i = 0; i <= 24; i++) {
    const x = i / 24;
    const s = NOSE_S + NOSE_LEN * x;
    nose.push(i === 24 ? [s, 0] : [s, noseR(s), i > 0 ? 1 : 0]);
  }
  turned("hub.nose", HF, nose, { tone: "hi" }, { owner: "rotor", smooth: { slope: noseSlope, radius: noseR, rows: 4 } });
}

// ---------- the yard: kiosk, fence, van ----------
const YARD = { x: 60, y: 14, w: 66, d: 70 };
const KPAD = { x: 72, y: 32, w: 42, d: 34, r: 1 };
const KIOSK = { x: 76, y: 36, w: 32, d: 24, r: 1.2 };
const KZ = [2, 30];

function kiosk() {
  slabItem("kiosk.pad", KPAD, 0, KZ[0], { tone: "lo", steps: 2, bevel: 0.4 });
  const fy = KIOSK.y + KIOSK.d;
  const fx = KIOSK.x + KIOSK.w;
  const doors = [faceRect("y", fy, KIOSK.x + 3, KIOSK.x + 15, KZ[0] + 1, KZ[1] - 4, 0.6), faceRect("y", fy, KIOSK.x + 17, KIOSK.x + 29, KZ[0] + 1, KZ[1] - 4, 0.6)];
  const louvres = [];
  for (const x0 of [KIOSK.x + 5, KIOSK.x + 19]) for (let i = 0; i < 5; i++) louvres.push(faceRect("y", fy, x0, x0 + 8, KZ[0] + 4 + i * 2.4, KZ[0] + 5.2 + i * 2.4, 0.5));
  for (let i = 0; i < 6; i++) louvres.push(faceRect("x", fx, KIOSK.y + 5, KIOSK.y + 19, KZ[0] + 12 + i * 2.4, KZ[0] + 13.2 + i * 2.4, 0.5));
  const handles = Dt([facePt("y", fy, KIOSK.x + 13.6, 16), facePt("y", fy, KIOSK.x + 18.4, 16)], { size: 0.6, tone: "hi" });
  slabItem("kiosk", KIOSK, KZ[0], KZ[1] - KZ[0], { tone: "mid", steps: 3, bevel: 0.6, extra: L(doors.join(""), { tone: "mid" }) + L(louvres.join(""), { tone: "lo" }) + handles });
  // Roof: an overhanging cap with a drip edge.
  const roof = k.insetPlan(KIOSK, -2.4);
  slabItem("kiosk.roof", roof, KZ[1], 3.2, { tone: "mid", steps: 3, bevel: 0.8, inner: L(k.sideSeam(roof, KZ[1] + 1.2, P, 3), { tone: "faint" }) });
  // Warning plate on the right door, in the brand ink.
  slabItem("kiosk.sign", { x: KIOSK.x + 20, y: fy, w: 6, d: 0.4, r: 0 }, 22, 3.6, { tone: "hi", steps: 1, bevel: 0, wrap: brand });
}

function fence() {
  const H1 = 15;
  const x0 = YARD.x;
  const x1 = YARD.x + YARD.w;
  const y0 = YARD.y;
  const y1 = YARD.y + YARD.d;
  const PS = 1.6;
  const posts = [];
  const along = (from, to, n) => Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);
  for (const x of along(x0, x1, 4)) posts.push([x, y0], [x, y1]);
  for (const y of along(y0, y1, 4).slice(1, -1)) posts.push([x0, y], [x1, y]);
  const gate = [YARD.x + 20, YARD.x + 33];
  posts.push([gate[0], y0], [gate[1], y0]);
  const uniq = [...new Map(posts.map((p) => [p.join(","), p])).values()];
  for (const [x, y] of uniq) slabItem("fence.post", { x: x - PS / 2, y: y - PS / 2, w: PS, d: PS, r: 0.3 }, 0, H1, { tone: "mid", steps: 2, bevel: 0 });
  // Rails on the outer faces of the posts: two heights, broken at the gate.
  const T = 0.8;
  const rails = [
    { x: x1 + PS / 2, y: y0 - PS / 2, w: T, d: y1 - y0 + PS },            // +x side
    { x: x0 - PS / 2, y: y1 + PS / 2, w: x1 - x0 + PS + T, d: T },        // +y side
    { x: x0 - PS / 2 - T, y: y0 - PS / 2, w: T, d: y1 - y0 + PS + T },    // -x side
    { x: x0 - PS / 2 - T, y: y0 - PS / 2 - T, w: gate[0] - x0 + T, d: T },       // -y side, left of the gate
    { x: gate[1] + PS / 2, y: y0 - PS / 2 - T, w: x1 - gate[1] + T - PS / 2 + PS / 2, d: T },  // right of the gate
  ];
  for (const z of [5.5, 12.5]) for (const plan of rails) slabItem("fence.rail", { ...plan, r: 0.2 }, z, 1.2, { tone: "hi", steps: 1, bevel: 0 });
}

const VAN = { x: 94, y: ROAD.y + 1.2, w: 30, d: 13.6, r: 1.6 };
const VZ = 4.6;
function van() {
  const cab = { x: VAN.x + VAN.w, y: VAN.y, w: 10, d: VAN.d, r: 1.6 };
  const fy = VAN.y + VAN.d;
  // Wheels: tyres along y on both sides, hub caps on the near ones.
  const wheels = [];
  for (const x of [VAN.x + 7, VAN.x + VAN.w + 4]) for (const near of [false, true]) wheels.push({ x, near });
  for (const w of wheels) {
    const y0 = w.near ? fy : VAN.y - 2.2;
    const F = G.frameOf([w.x, y0, ROAD_TOP + 4.6], D, [1, 0, 0], [0, 0, 1]);
    discItem("van.tyre", F, 0, 2.2, 4.6, { tone: "hi" }, { wrap: ebony, extra: w.near ? "" : "" });
    if (w.near) discItem("van.cap", F, 2.2, 2.6, 2.4, { tone: "mid" });
  }
  const side = [faceRect("y", fy, VAN.x + 16, VAN.x + 27, VZ + 1.5, VZ + 15, 0.6)];
  const stripe = { x: VAN.x, y: fy, w: VAN.w, d: 0.4, r: 0 };
  slabItem("van.body", VAN, VZ, 17, { tone: "hi", steps: 3, bevel: 0.6, extra: L(side.join(""), { tone: "faint" }) + Dt([facePt("y", fy, VAN.x + 17.6, VZ + 6)], { size: 0.5 }) });
  slabItem("van.stripe", stripe, VZ + 9, 2.6, { tone: "hi", steps: 1, bevel: 0, wrap: brand });
  slabItem("van.cab", cab, VZ, 11, { tone: "hi", steps: 3, bevel: 0.6, extra: L(faceRect("y", fy, cab.x + 1.5, cab.x + 8, VZ + 6, VZ + 10.2, 0.6), { tone: "mid" }) });
  // Windscreen and a roof rack bar.
  slabItem("van.glass", { x: cab.x + cab.w, y: cab.y + 1.6, w: 0.4, d: cab.d - 3.2, r: 0 }, VZ + 6, 4.4, { tone: "hi", steps: 1, bevel: 0, wrap: glass });
  for (const x of [VAN.x + 6, VAN.x + 22]) slabItem("van.rack", { x, y: VAN.y + 1, w: 1.2, d: VAN.d - 2, r: 0.3 }, VZ + 17, 1, { tone: "mid", steps: 1, bevel: 0 });
}

// ---------- trees, shrubs, rocks ----------
function tree(name, x, y, z, scale = 1) {
  cylItem(`${name}.trunk`, x, y, 2 * scale, z, 12 * scale, { tone: "mid", steps: 16, wrap: earth });
  let zz = z + 12 * scale;
  for (const [r, h] of [[15, 9], [11.5, 8], [7.5, 6.5], [3.5, 4]]) {
    cylItem(`${name}.crown`, x, y, r * scale, zz, h * scale, { tone: "mid", steps: 36, bevel: 0.6, wrap: leaf });
    zz += h * scale;
  }
}
function shrub(name, x, y, z, s = 1) {
  cylItem(`${name}`, x, y, 8 * s, z, 4.5 * s, { tone: "mid", steps: 28, bevel: 0.5, wrap: leaf });
  cylItem(`${name}.top`, x, y, 5 * s, z + 4.5 * s, 3.5 * s, { tone: "mid", steps: 22, bevel: 0.5, wrap: leaf });
}
function boulder(name, x, y, z, r, h, seed) {
  const ring = [];
  for (let i = 0; i < 7; i++) {
    const t = (i / 7) * Math.PI * 2 + seed;
    const rr = r * (0.82 + 0.18 * Math.cos(i * 2.3 + seed * 3));
    ring.push([x + Math.cos(t) * rr, y + Math.sin(t) * rr * 0.8]);
  }
  put(name, [x, y, z + h / 2], rock(S(k.extrude(ring, z, h, P, { bevel: 0.5 }), { tone: "mid" })), [record(A.extruded(ring, z, h, { name }))]);
}

function grounds() {
  tree("tree", 108, -94, 0, 1);
  tree("tree2", -112, 92, 0, 0.85);
  tree("tree3", -96, -84, UPPER_Z[2], 0.7);
  shrub("shrub", -58, 74, 0, 1);
  shrub("shrub2", -18, 98, 0, 0.8);
  shrub("shrub3", 124, -52, 0, 0.75);
  shrub("shrub4", 4, -100, UPPER_Z[2], 0.7);
  shrub("shrub5", 46, 102, 0, 0.7);
  boulder("rock", -134, 44, 0, 6, 4.5, 0.4);
  boulder("rock2", -126, 54, 0, 3.6, 3, 1.1);
  boulder("rock3", 112, 100, 0, 5, 4, 2.2);
  boulder("rock4", 18, 20, UPPER_Z[2], 4, 3.2, 0.9);
  boulder("rock5", 52, -70, 0, 4.6, 3.6, 1.7);
}

// ---------- the drone (drawn last, in open air, floating) ----------
// A two-blade propeller spinning in the horizontal plane on its motor; neighbours counter-rotate.
function prop(arm, z, r) {
  return a.amRotor([arm.cx, arm.cy, z], [1, 0, 0], [0, 1, 0], P, { count: 2, r0: 0.6, r1: r - 0.6, chord: 1.4, tip: 0.8, sweep: 0.15, period: 350, reverse: arm.deg === 135 || arm.deg === 315, delay: arm.deg * 1.3, thickness: 0.4 });
}
function drone() {
  const [x, y, z] = DRONE;
  const q = 1.35;
  const out = [];
  const arms = [45, 135, 225, 315].map((deg) => ({ deg, cx: x + 9.5 * q * Math.cos(deg * DEG), cy: y + 9.5 * q * Math.sin(deg * DEG) }));
  const parts = [];
  for (const arm of arms) {
    const ring = rotate((x + arm.cx) / 2, (y + arm.cy) / 2, 9.5 * q, 1.2 * q, arm.deg * DEG);
    parts.push({ arm: true, key: [(x + arm.cx) / 2, (y + arm.cy) / 2, z], svg: S(k.extrude(ring, z + 1 * q, 1 * q, P), { tone: "mid" }) });
    parts.push({ key: [arm.cx, arm.cy, z + 2], svg: S(k.cylinder(arm.cx, arm.cy, 1.5 * q, z + 0.4 * q, 3.6 * q, P, 14, 0.3), { tone: "mid" }) + prop(arm, z + 4 * q, 3.8 * q) + Dt([at([arm.cx, arm.cy, z + 4 * q])], { size: 0.5 }) });
  }
  const sorted = byDepth(parts, (p) => p.key);
  out.push(S(k.cylinder(x, y, 1.2 * q, z - 1.4 * q, 1.4 * q, P, 14), { tone: "mid" }));
  out.push(S(G.sphereOf([x, y, z - 2.6 * q], 1.9 * q, P), { tone: "mid" }));
  out.push(...sorted.filter((p) => p.arm || depth(p.key) < depth([x, y, z])).map((p) => p.svg));
  const plan = { x: x - 4.6 * q, y: y - 4.6 * q, w: 9.2 * q, d: 9.2 * q, r: 2.6 * q };
  out.push(S(k.slabOf(plan, z, 3.4 * q, P, 4, 0.6), { tone: "hi" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 2), z + 3.4 * q, P, 4), { tone: "faint" }));
  out.push(...sorted.filter((p) => !p.arm && depth(p.key) >= depth([x, y, z])).map((p) => p.svg));
  out.push(a.amBlink(cls("led")(Dt([at([x + 3 * q, y + 3 * q, z + 3.4 * q])], { size: 1, tone: "lit" })), { period: 2200, delay: 600 }));
  return a.amFloat(out.join(""), P, { rise: 5, period: 6200 });
}

// ---------- assemble ----------
upperTier();
tower();
nacelle();
rotor();
kiosk();
fence();
van();
grounds();

A.settle(R, P);
R.items.sort((p, q) => p.key - q.key);

// The aviation light's blink sits on top of the beacon item, in the same slot.
const lampTop = at([TX, NAC.y0 + 7, NAC_TOP + 10 + 18 + 2.4 + 2.4]);
const blink = a.amBlink(cls("beacon")(Dt([lampTop], { size: 1.3, tone: "lit" })), { period: 3000, delay: 0, min: 0.2 });

// The rotor turns in its own vertical plane: blades drawn flat in plane coordinates
// (x = world +x, y = world down) round the hub centre and spun with amSpin, about 6 s a
// turn, clockwise as seen from upwind. They take the blades' old slot: after every sorted
// part (all of which lie behind the rotor plane or below the swept disc), before the hub
// sphere and nose cone, which cover the roots. The swept blades are not recorded for the
// audit (nothing else shares their slot).
function rotorBlades() {
  const pathOfBlades = (pts) => BLADE_AT.map((deg) => {
    const t = deg * DEG;
    const pt = ([r, c]) => [r * Math.cos(t) + c * Math.sin(t), -r * Math.sin(t) + c * Math.cos(t)];
    return `M${pts.map(pt).map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}`;
  });
  const blades = pathOfBlades(PLANFORM).map((d) => `${d}Z`).join("");
  // The leading edge (the straight +chord side), a hair inside the outline, as a faint sheen.
  const edge = pathOfBlades(LEADING).join("");
  const opts = { period: 6000, reverse: true };
  // Thickness as amRotor builds it: a darker copy of the same blades 1 unit behind the rotor
  // plane (away from the viewer), turning in step, drawn first.
  const back = a.amSpin(`<path class="et-blade-back" d="${blades}"/>`, a.planeMatrix(G.sub3(C, D), [1, 0, 0], [0, 0, -1], P), opts);
  const front = a.amSpin(`<path class="et-blade" d="${blades}"/><path class="et-edge" d="${edge}"/>`, a.planeMatrix(C, [1, 0, 0], [0, 0, -1], P), opts);
  const svg = back + front;
  return dark ? `<g class="ac-white">${svg}</g>` : svg;
}
const ROTOR_TOP = new Set(["hub", "hub.nose"]);
const behind = R.items.filter((item) => !ROTOR_TOP.has(item.name)).map((item) => (item.name === "beacon" ? item.svg + blink : item.name === "vane.post" ? item.svg + VANE : item.svg)).join("");
const hubTop = R.items.filter((item) => ROTOR_TOP.has(item.name)).map((item) => item.svg).join("");
const body = [plot(), road(), behind, rotorBlades(), hubTop, drone()].join("");

const name = dark ? "energy-turbine-dark" : "energy-turbine";
const svg = a.assetSvg({
  width: W,
  height: H,
  label: "An isometric wind turbine on a grassy hill plot: a tapered tower with a door and landing, a nacelle with a green band and a met mast, three long blades, a fenced transformer kiosk, a service van on a gravel road, trees and rocks, and a small drone inspecting a blade tip.",
  body,
  paper: PAPER,
  accents: {
    brand: BRAND,
    led: { hex: BRAND, mode: "ink" },
    beacon: { hex: "#d8452c", mode: "ink" },
    ...(dark ? { white: "#b9bdb8" } : {}),
    turf: dark ? "#4f6b47" : "#a6c48c",
    leaf: dark ? "#3f6a45" : "#6f9c68",
    earth: dark ? "#6b5039" : "#a9845f",
    rock: dark ? "#55534e" : "#b3afa6",
    ebony: dark ? "#08080a" : "#3a3a3f",
    glass: dark ? "#2a3a40" : "#7f949b",
  },
  weight: 0.8,
  css: `.et-blade{fill:var(--anatomy-top);stroke:var(--anatomy-hi);stroke-width:var(--anatomy-weight);stroke-linejoin:round;vector-effect:non-scaling-stroke}.et-blade-back{fill:var(--anatomy-shade-0);stroke:var(--anatomy-mid);stroke-width:var(--anatomy-weight);stroke-linejoin:round;vector-effect:non-scaling-stroke}.et-edge{fill:none;stroke:var(--anatomy-hi);stroke-opacity:.16;stroke-width:var(--anatomy-weight);stroke-linecap:round;vector-effect:non-scaling-stroke}.et-vane{fill:var(--anatomy-top);stroke:var(--anatomy-hi);stroke-width:var(--anatomy-weight);stroke-linejoin:round;vector-effect:non-scaling-stroke}`,
  id: name,
});
writeFileSync(join(HERE, `${name}.svg`), svg);
writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W, safe: SAFE }));
console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB) and ${name}.html · ${R.items.length} items`);

A.auditOrExit(R, P);
