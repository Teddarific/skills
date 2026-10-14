// Three matching spot illustrations for the features row of "Halden", a clean-energy company
// ("Power that renews itself"): "Generate" (a small vertical-axis wind turbine on a short mast,
// its green blades held on two tiers of arms, a junction box on the mast), "Store" (an open rack
// of battery modules with busbars, a BMS box on top and its green charge gauge filling) and
// "Share" (a neighbourhood grid pole: crossarm, stacked insulators, a transformer can on the pole
// and a green smart meter at its foot). Each spot moves: the turbine turns (a flipbook
// of poses), the gauge fills, and a green pulse of power runs from the transformer down to the
// meter, whose LED blinks as it arrives.
//
// One camera, one world scale, one base (a round turf disc with an earth rim, a concrete pad
// with a kerb and two stepping stones), one part vocabulary, one green accent family. The three
// are fitted together, so every disc sits at the same place on its canvas.
//
//   node build.mjs            light → generate.svg, store.svg, share.svg (+ .html), energy-spots.html
//   node build.mjs --dark     dark  → generate-dark.svg, … , energy-spots-dark.html

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const dark = process.argv.includes("--dark");
const PAPER = dark ? "#0d100e" : "#f6f5f0";
const GREEN = "#1f8f5f";
const SUFFIX = dark ? "-dark" : "";

const W = 320;
const H = 320;
const PAD = 20;
const AZIMUTH = 35;      // the +x faces carry the fronts: junction box, module fronts, meter
const ELEVATION = 30;
const SCREW = 0.6;

// ---------- the shared world ----------
const DISC_R = 40;
const EARTH_Z = -9;
const TURF_Z = -2.6;     // turf layer from -2.6 to 0, earth below
const KERB_H = 1.2;
const PZ = 3;            // pad top: every object stands here
const STONES = [[27, 17.5, 4.2], [17.5, 29.5, 3.4]];

let P = null;
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (items, key = (i) => i) => [...items].sort((p, q) => depth(key(p)) - depth(key(q)));
const brand = (svg) => `<g class="ac-brand">${svg}</g>`;
const led = (svg) => `<g class="ac-led">${svg}</g>`;
const grass = (svg) => `<g class="ac-grass">${svg}</g>`;
const earth = (svg) => `<g class="ac-earth">${svg}</g>`;
const cell = (svg) => `<g class="ac-cell">${svg}</g>`;
const discPlan = (r) => ({ x: -r, y: -r, w: 2 * r, d: 2 * r, r });
const halo = (plan, z, blur = 4) => `<path class="iso-halo" d="${k.haloOf(plan, z, 0.1, P)}" style="filter:blur(${blur}px)"/>`;
const screws = (pts, z, ring = 1.3) =>
  L(pts.map(([x, y]) => k.ring(x, y, ring, z, P, 16)).join(""), { tone: "lo" }) + D(pts.map(([x, y]) => at([x, y, z])), { size: SCREW });
// Closed outlines on vertical faces: x = const (the +x front) or y = const (the +y side).
const faceX = (x, y0, y1, z0, z1) => k.pathOf([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]].map(at), true);
const faceY = (y, x0, x1, z0, z1) => k.pathOf([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]].map(at), true);
// A rounded bar lying along floor direction `deg` about centre c, from radius r0 to r1.
const dirOf = (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
function radialBar(c, deg, r0, r1, half, rad = 0.5) {
  const d = dirOf(deg);
  const n = [-d[1], d[0]];
  return k.roundedPlan({ x: r0, y: -half, w: r1 - r0, d: 2 * half, r: rad }, 2).map(([lx, ly]) => [c[0] + d[0] * lx + n[0] * ly, c[1] + d[1] * lx + n[1] * ly]);
}

// ---------- shared base: turf disc on an earth rim, concrete pad with a kerb, stepping stones ----------
function base(pad) {
  const out = [`<path class="iso-halo" d="${k.haloOf(discPlan(DISC_R + 3), EARTH_Z, 4, P)}"/>`];
  out.push(earth(S(k.cylinder(0, 0, DISC_R, EARTH_Z, TURF_Z - EARTH_Z, P, 44), {
    tone: "mid",
    inner: L(k.sideArc(0, 0, DISC_R, EARTH_Z + 2.6, P, 40), { tone: "faint" }),
  })));
  out.push(grass(S(k.cylinder(0, 0, DISC_R, TURF_Z, -TURF_Z, P, 44, 1), { tone: "mid" })));
  out.push(grass(L(k.ring(0, 0, DISC_R - 4, 0, P, 44), { tone: "faint" })));
  // the pad: a kerb course, the slab, a groove and four anchor screws
  const kerb = k.insetPlan(pad, -1.6);
  out.push(halo(kerb, 0, 3));
  out.push(S(k.slabOf(kerb, 0, KERB_H, P, 4, 0.5), { tone: "lo" }));
  out.push(S(k.slabOf(pad, KERB_H, PZ - KERB_H, P, 4, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(pad, 2.6), PZ, P, 4), { tone: "faint" }));
  out.push(screws(k.corners(pad, 4.6), PZ, 1.1));
  return out.join("");
}
function stones() {
  return byDepth(STONES).map(([x, y, r]) => {
    const plan = { x: x - r, y: y - r, w: 2 * r, d: 2 * r, r: 1.6 };
    return S(k.slabOf(plan, 0, 0.9, P, 3, 0.4), { tone: "mid" });
  }).join("");
}
const circlePts = (r, z0, z1) => Array.from({ length: 24 }, (_, i) => dirOf(i * 15)).flatMap(([c, s]) => [[c * r, s * r, z0], [c * r, s * r, z1]]);
const basePoints = () => circlePts(DISC_R + 2, EARTH_Z, 0);

// ======================================================================================
// GENERATE: an H-rotor vertical-axis turbine on a short mast. Flange and anchor nuts on the
// pad, a junction box on the mast's front with its green status LED, a bearing housing, and
// the rotor: two hub tiers, three arms each, three green airfoil blades and a finial. The
// rotor turns, drawn as a flipbook of poses with true order round the shaft in each.
// ======================================================================================
const GPAD = { x: -14, y: -14, w: 28, d: 28, r: 3 };
const ROTOR_R = 20;
const CHORD = 9.5;
const BLADE = [41, 77];
const HUB = [[44, 48], [68, 72]];
const ARM_Z = [45.6, 69.6];
const ARM_H = 1.4;
const VIEW = AZIMUTH;                         // floor angle that points at the viewer
const BLADES = [VIEW + 180, VIEW + 60, VIEW - 60].map((d) => d - 14);   // rest pose: no arm points straight at the camera
const FRAMES = 10;      // poses over one 120° repeat
const SPIN = 1400;      // ms per 120°: a stately 4.2 s a turn

// An airfoil (NACA 00xx-like) outline, chord along the rotor's tangent at angle `deg`.
function airfoil(deg) {
  const c = dirOf(deg);
  const centre = [c[0] * ROTOR_R, c[1] * ROTOR_R];
  const t = [-c[1], c[0]];
  const pts = [];
  const N = 4;
  const half = (u) => 5 * 0.24 * CHORD * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4);
  const s = (u) => (u - 0.5) * CHORD;
  for (let i = 0; i <= N; i++) { const u = (1 - Math.cos((Math.PI * i) / N)) / 2; pts.push([s(u), half(u)]); }
  for (let i = N - 1; i >= 1; i--) { const u = (1 - Math.cos((Math.PI * i) / N)) / 2; pts.push([s(u), -half(u)]); }
  return pts.map(([lt, ln]) => [centre[0] + t[0] * lt + c[0] * ln, centre[1] + t[1] * lt + c[1] * ln]);
}

// One pose of the rotor, turned `turn` degrees from the rest pose: blades, arms and clamps,
// sorted far to near.
function rotorItems(turn) {
  const items = [];
  for (const deg0 of BLADES) {
    const deg = deg0 + turn;
    const ring = airfoil(deg);
    const c = dirOf(deg);
    items.push({ key: [c[0] * ROTOR_R, c[1] * ROTOR_R, 0], svg: brand(S(k.extrude(ring, BLADE[0], BLADE[1] - BLADE[0], P), { tone: "hi" })) });
    // the two arms are the same shape 24 units apart: draw the lower one, reuse it for the upper
    const id = `${SPOT_ID}-arm-${Math.round(turn * 10)}-${Math.round(deg0)}`;
    const key = [c[0] * ROTOR_R * 0.5, c[1] * ROTOR_R * 0.5, 0];
    const dy = (at([0, 0, ARM_Z[1]])[1] - at([0, 0, ARM_Z[0]])[1]).toFixed(2);
    items.push({ key, svg: `<g id="${id}">${S(k.extrude(radialBar([0, 0], deg, 3.4, ROTOR_R - 0.6, 0.9, 0), ARM_Z[0], ARM_H, P), { tone: "hi" })}</g>` });
    items.push({ key, svg: `<use href="#${id}" transform="translate(0 ${dy})"/>` });
  }
  return byDepth(items, (i) => i.key);
}

function generateBody() {
  const out = [base(GPAD)];
  // flange with four hex anchor nuts, split round the mast
  out.push(halo(discPlan(9), PZ, 3));
  out.push(S(k.cylinder(0, 0, 8, PZ, 1.6, P, 32, 0.5), { tone: "mid" }));
  const FZ = PZ + 1.6;
  const nuts = [35, 125, 215, 305].map((deg) => { const d = dirOf(deg); return [d[0] * 5.8, d[1] * 5.8]; });
  const nut = ([x, y]) => S(k.cylinder(x, y, 1.15, FZ, 1.2, P, 6), { tone: "hi" }) + D([at([x, y, FZ + 1.2])], { size: SCREW, tone: "lo" });
  const sorted = byDepth(nuts);
  const behind = sorted.filter((p) => depth(p) < 0);
  const front = sorted.filter((p) => depth(p) >= 0);
  for (const p of behind) out.push(nut(p));
  // lower mast with a weld ring, collar, upper mast
  out.push(S(k.cylinder(0, 0, 3.4, FZ, 24 - FZ, P, 28), { tone: "mid", inner: L(k.sideArc(0, 0, 3.4, FZ + 3, P, 20), { tone: "faint" }) }));
  for (const p of front) out.push(nut(p));
  // junction box on the mast's +x face: conduit and gland below, bracket, box, lid
  const JX = 4.4;
  out.push(S(k.slabOf({ x: 6.1, y: -0.9, w: 1.8, d: 1.8, r: 0.6 }, FZ, 9.8 - FZ, P, 2), { tone: "lo" }));
  out.push(S(k.cylinder(7, 0, 1.4, 9.8, 1.2, P, 16), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 3, y: -1.6, w: JX - 3, d: 3.2, r: 0.3 }, 13, 8, P, 2), { tone: "mid" }));
  const BOX = { x: JX, y: -5, w: 5.2, d: 10, r: 0.8 };
  out.push(S(k.slabOf(BOX, 11, 11, P, 3, 0.4), { tone: "hi", inner: L(k.sideSeam(BOX, 19.4, P, 3), { tone: "faint" }) }));
  const BX = JX + BOX.w;
  out.push(L(faceX(BX, -3.4, 1.6, 13, 17.6), { tone: "lo" }));
  out.push(L([[0.9, 3.2], [0.9, 2.2]].map(([dz, len], i) => k.segment([BX, -2.6, 16.4 - i * 1.4], [BX, -2.6 + len, 16.4 - i * 1.4], P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([BX, -3.4 - 0.9, 12]), at([BX, -3.4 - 0.9, 18.6])], { size: SCREW }));
  out.push(a.amBlink(led(D([at([BX, 3.2, 16])], { size: 1.6, tone: "lit" })), { period: 3200 }));
  out.push(S(k.slabOf(k.insetPlan(BOX, -0.5), 22, 1, P, 3, 0.3), { tone: "mid" }));
  // collar, upper mast, bearing housing
  out.push(S(k.cylinder(0, 0, 4.2, 24, 3, P, 24, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 2.6, 27, 13, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 4.8, 40, 4, P, 28, 0.5), { tone: "hi", inner: L(k.sideArc(0, 0, 4.8, 41.6, P, 28), { tone: "faint" }) }));

  // the rotor turns: a flipbook of FRAMES poses over one 120° repeat. Each pose is split into
  // the parts behind the shaft and those in front of it, two flipbooks in lockstep round the
  // static hubs and shaft, so the order is true in every pose.
  const backs = [];
  const fronts = [];
  for (let f = 0; f < FRAMES; f++) {
    const items = rotorItems((f * 120) / FRAMES);
    backs.push(items.filter((i) => depth(i.key) < 0).map((i) => i.svg).join(""));
    fronts.push(items.filter((i) => depth(i.key) >= 0).map((i) => i.svg).join(""));
  }
  out.push(a.amFlip(backs, { period: SPIN }));
  const hub = ([z0, z1]) => S(k.cylinder(0, 0, 3.8, z0, z1 - z0, P, 24, 0.4), { tone: "hi", inner: L(k.sideArc(0, 0, 3.8, (z0 + z1) / 2, P, 24), { tone: "faint" }) }) + screws([[0, 0]], z1, 1.8);
  out.push(hub(HUB[0]));
  out.push(S(k.cylinder(0, 0, 2, HUB[0][1], HUB[1][0] - HUB[0][1], P, 24), { tone: "mid" }));
  out.push(hub(HUB[1]));
  out.push(S(k.cylinder(0, 0, 0.7, HUB[1][1], 6, P, 12), { tone: "mid" }));
  out.push(D([at([0, 0, HUB[1][1] + 6])], { size: SCREW, tone: "hi" }));
  out.push(a.amFlip(fronts, { period: SPIN }));
  out.push(stones());
  return out.join("");
}

function generatePoints() {
  const pts = [...basePoints()];
  for (let i = 0; i < 36; i++) { const [c, s] = dirOf(i * 10); pts.push([c * (ROTOR_R + 3), s * (ROTOR_R + 3), BLADE[1]]); pts.push([c * (ROTOR_R + 3), s * (ROTOR_R + 3), BLADE[0]]); }
  return pts;
}

// ======================================================================================
// STORE: an open steel rack of three battery modules on levelling feet. Each module has a
// handle and two terminal blocks; two busbars tie the terminals; a BMS box on the top plate
// carries the charge gauge, which fills green segment by segment and resets; the module
// status LEDs ripple bottom to top.
// ======================================================================================
const SPAD = { x: -15, y: -23, w: 30, d: 46, r: 3 };
const RK = { x: -11, y: -19, w: 22, d: 38, r: 0.8 };
const POST = 2.4;
const RX1 = RK.x + RK.w;                       // 11: front plane of the posts and shelves
const MX0 = RK.x + 1;
const MX1 = RX1 - 1.4;                         // module front face
const MY0 = RK.y + POST + 0.2;
const MY1 = RK.y + RK.d - POST - 0.2;
const FRAME_Z = [PZ + 1.4, PZ + 4];
const TIERS = [[7, 19.4], [20.8, 33.2], [34.6, 47]];
const TOP_Z = [50, 52.4];
const BUS_Y = [-12, 12];

function storeBody() {
  const out = [base(SPAD)];
  out.push(halo(k.insetPlan(RK, -1), PZ, 3));
  for (const [x, y] of byDepth(k.corners(RK, 1.6))) out.push(S(k.cylinder(x, y, 1.4, PZ, FRAME_Z[0] - PZ, P, 16), { tone: "lo" }));
  out.push(S(k.slabOf(RK, FRAME_Z[0], FRAME_Z[1] - FRAME_Z[0], P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(RK, FRAME_Z[0] + 1, P, 3), { tone: "faint" }) }));
  const posts = [[RK.x, RK.y], [RX1 - POST, RK.y], [RK.x, RK.y + RK.d - POST], [RX1 - POST, RK.y + RK.d - POST]];
  const post = ([x, y]) => S(k.slabOf({ x, y, w: POST, d: POST, r: 0.4 }, FRAME_Z[1], TOP_Z[0] - FRAME_Z[1], P, 2), { tone: "mid" });
  out.push(post(posts[0]));
  const leds = [];
  const shelf = { x: RK.x, y: RK.y + POST, w: RK.w, d: RK.d - 2 * POST, r: 0.3 };
  TIERS.forEach(([z0, z1], i) => {
    if (i > 0) out.push(S(k.slabOf(shelf, z0 - 1.4, 1.4, P, 2), { tone: "mid" }));
    const mod = { x: MX0, y: MY0, w: MX1 - MX0, d: MY1 - MY0, r: 0.8 };
    out.push(S(k.slabOf(mod, z0, z1 - z0, P, 3, 0.5), { tone: "hi", inner: L(k.sideSeam(mod, z1 - 2, P, 3), { tone: "faint" }) }));
    // vents on the front: three closed slots
    out.push(L([0, 1, 2].map((j) => faceX(MX1, -3 + j * 2.2 - 3.3, -3 + j * 2.2 - 2.1, z0 + 2, z0 + 6.4)).join("") + [0, 1, 2].map((j) => faceX(MX1, 2.1 + j * 2.2, 3.3 + j * 2.2, z0 + 2, z0 + 6.4)).join(""), { tone: "lo" }));
    // terminal blocks, then the handle
    for (const y of byDepth(BUS_Y, (y) => [MX1, y, 0])) out.push(S(k.slabOf({ x: MX1, y: y - 1.3, w: RX1 - MX1, d: 2.6, r: 0.3 }, z1 - 4.4, 3, P, 2), { tone: "lo" }));
    // a status LED per module; the three ripple bottom to top
    leds.push(a.amBlink(led(D([at([MX1, 8.6, z1 - 3])], { size: 1.3, tone: "lit" })), { period: 2400, delay: 2400 - i * 260 }));
    out.push(leds[i]);
    const hz = z0 + 8;
    for (const y of byDepth([-5.2, 4], (y) => [MX1, y + 0.6, 0])) out.push(S(k.slabOf({ x: MX1, y, w: 1.6, d: 1.2, r: 0.3 }, hz - 0.8, 1.6, P, 2), { tone: "mid" }));
    out.push(S(k.slabOf({ x: MX1 + 1.6, y: -6, w: 1.2, d: 11, r: 0.5 }, hz - 1.1, 2.2, P, 2, 0.2), { tone: "hi" }));
  });
  // busbars across the three terminal blocks, with a bolt at each
  for (const y of byDepth(BUS_Y, (y) => [RX1, y, 0])) {
    const z0 = TIERS[0][1] - 4.4;
    const z1 = TIERS[2][1] - 1.4;
    out.push(S(k.slabOf({ x: RX1, y: y - 1, w: 0.8, d: 2, r: 0.2 }, z0, z1 - z0, P, 2), { tone: "hi" }));
    out.push(D(TIERS.map(([, t]) => at([RX1 + 0.8, y, t - 2.9])), { size: SCREW }));
  }
  for (const p of byDepth(posts.slice(1), ([x, y]) => [x + 1.2, y + 1.2, 0])) out.push(post(p));
  // top plate
  out.push(S(k.slabOf(RK, TOP_Z[0], TOP_Z[1] - TOP_Z[0], P, 3, 0.5), { tone: "mid" }));
  out.push(screws(k.corners(RK, 1.2), TOP_Z[1], 0.9));
  // the BMS box: body, lid, gauge window with four segments, a rocker, vents on its +y side
  const BMS = { x: -8, y: -11, w: 15, d: 20, r: 1 };
  const BZ = TOP_Z[1];
  out.push(halo(BMS, BZ, 2));
  out.push(S(k.slabOf(BMS, BZ, 8.6, P, 3, 0.4), { tone: "hi", inner: L(k.sideSeam(BMS, BZ + 1.4, P, 3), { tone: "faint" }) }));
  const FX = BMS.x + BMS.w;
  out.push(cell(S(k.slabOf({ x: FX, y: -8.6, w: 0.5, d: 12.4, r: 0.3 }, BZ + 2.2, 4.8, P, 2), { tone: "hi" })));
  const segs = [0, 1, 2, 3].map((i) => ({ x: FX + 0.5, y: 0.8 - i * 3, w: 0.5, d: 2.4, r: 0.2 }));
  segs.forEach((plan, i) => {
    const seg = brand(S(k.slabOf(plan, BZ + 3, 3.2, P, 2), { tone: "hi", lit: i === 3 }));
    out.push(`<g class="es-seg es-seg-${i}">${seg}</g>`);
  });
  out.push(S(k.slabOf({ x: FX, y: 5.2, w: 0.8, d: 2.2, r: 0.3 }, BZ + 2.6, 4, P, 2, 0.2), { tone: "mid" }));
  out.push(L([0, 1, 2].map((j) => faceY(BMS.y + BMS.d, BMS.x + 2.5 + j * 3, BMS.x + 4 + j * 3, BZ + 2.4, BZ + 6.4)).join(""), { tone: "lo" }));
  const LID = k.insetPlan(BMS, -0.5);
  out.push(S(k.slabOf(LID, BZ + 8.6, 1.2, P, 3, 0.4), { tone: "mid" }));
  out.push(screws(k.corners(LID, 2), BZ + 9.8, 0.9));
  out.push(stones());
  return out.join("");
}

// The charge gauge fills segment by segment, holds full, then resets. Under reduced motion
// the animation stops and all four segments show.
const GAUGE = 4800;
const GAUGE_CSS = [0, 1, 2, 3].map((i) => {
  const on = 10 + i * 18;
  return `@keyframes es-fill-${i}{0%,${on - 3}%{opacity:.14}${on}%,88%{opacity:1}95%,100%{opacity:.14}}.es-seg-${i}{animation:es-fill-${i} ${GAUGE / 1000}s linear infinite}`;
}).join("") + "@media (prefers-reduced-motion:reduce){.es-seg{animation:none}}";

function storePoints() {
  return [...basePoints(), ...k.boxCorners(RK, PZ, TOP_Z[1] + 10)];
}

// ======================================================================================
// SHARE: a steel utility pole in a concrete collar. A crossarm on its front with two pin
// insulators and a third on the pole top, a transformer can on brackets with its bushing
// jumpered up to an insulator, a conduit down the pole to a green smart meter.
// ======================================================================================
const HPAD = { x: -12, y: -12, w: 26, d: 24, r: 3 };
const POLE_R = 3.2;
const POLE_TOP = 84;
const ARM = { x: 3.1, y: -24, w: 4, d: 48, r: 0.6 };
const ARM_Zs = [76, 80];
const INS_Y = [-19.5, 19.5];
const INS_X = ARM.x + ARM.w / 2;
const CAN = { x: 6.4, y: -11.4, r: 6.2 };
const BUSH = [CAN.x + 3.2, CAN.y];
const WEATHER_Z = 50;
const FLOW = 3000;      // ms for one pulse: transformer → weatherhead → down the conduit → meter blinks
const CAN_Z = [50, 67];

// A pin insulator: pin, a big skirt, a neck, a small skirt and a grooved top. Returns its top z.
function insulator(x, y, z) {
  const out = [];
  out.push(S(k.cylinder(x, y, 0.8, z, 1.8, P, 12), { tone: "mid" }));
  let t = z + 1.8;
  out.push(S(k.cylinder(x, y, 2.6, t, 1.1, P, 24, 0.3), { tone: "hi" })); t += 1.1;
  out.push(S(k.cylinder(x, y, 1.5, t, 1.3, P, 20), { tone: "hi" })); t += 1.3;
  out.push(S(k.cylinder(x, y, 2.1, t, 1, P, 24, 0.3), { tone: "hi" })); t += 1;
  out.push(S(k.cylinder(x, y, 1.3, t, 1.8, P, 20), { tone: "hi", inner: L(k.sideArc(x, y, 1.3, t + 0.9, P, 12), { tone: "lo" }) })); t += 1.8;
  return { svg: out.join(""), top: t };
}

function shareBody() {
  const out = [base(HPAD)];
  out.push(halo(discPlan(7), PZ, 3));
  out.push(S(k.cylinder(0, 0, 5.6, PZ, 2.4, P, 36, 0.6), { tone: "mid" }));
  const CZ = PZ + 2.4;
  // can brackets on the pole's far side, drawn before the pole
  const toCan = (Math.atan2(CAN.y, CAN.x) * 180) / Math.PI;
  const reach = Math.hypot(CAN.x, CAN.y) - CAN.r + 0.6;
  for (const z of [52, 61]) out.push(S(k.extrude(radialBar([0, 0], toCan, POLE_R - 0.4, reach, 1.3, 0.3), z, 2.4, P), { tone: "lo" }));
  const seams = [CZ + 4, 58, 72].map((z) => k.sideArc(0, 0, POLE_R, z, P, 24)).join("");
  out.push(S(k.cylinder(0, 0, POLE_R, CZ, POLE_TOP - CZ, P, 28), { tone: "mid", inner: L(seams, { tone: "faint" }) }));
  // meter backboard, the green meter with its hood, display and LED
  out.push(S(k.slabOf({ x: 2.9, y: -6, w: 1.3, d: 12, r: 0.4 }, 13, 21, P, 2, 0.3), { tone: "mid" }));
  const MB = { x: 4.2, y: -4.4, w: 5, d: 8.8, r: 0.8 };
  out.push(brand(S(k.slabOf(MB, 15.4, 14.4, P, 3, 0.4), { tone: "hi", inner: L(k.sideSeam(MB, 17, P, 3), { tone: "mid" }) })));
  const MX = MB.x + MB.w;
  out.push(cell(S(k.slabOf({ x: MX, y: -3, w: 0.5, d: 6, r: 0.3 }, 23, 4.2, P, 2), { tone: "hi" })));
  out.push(led(L(k.pathOf([[MX + 0.5, -2.2, 25.8], [MX + 0.5, 0.2, 25.8]].map(at)) + k.pathOf([[MX + 0.5, -2.2, 24.4], [MX + 0.5, 1.2, 24.4]].map(at)), { tone: "lit", free: true })));
  out.push(a.amBlink(led(D([at([MX, 2.4, 20.6])], { size: 1.6, tone: "lit" })), { period: FLOW, delay: FLOW * 0.1, min: 0.1 }));
  out.push(D([at([MX, -2.6, 19.4]), at([MX, -2.6, 21.6])], { size: SCREW }));
  out.push(S(k.slabOf({ x: 4.2, y: -5, w: 6.2, d: 10, r: 0.8 }, 29.8, 1.2, P, 3, 0.3), { tone: "mid" }));
  // conduits: one from the meter down into the pad, one up the pole on two straps to a weatherhead
  out.push(S(k.slabOf({ x: 5.8, y: -1, w: 2, d: 2, r: 0.8 }, PZ, 15.4 - PZ, P, 3), { tone: "lo" }));
  out.push(S(k.slabOf({ x: POLE_R - 0.3, y: -1, w: 2, d: 2, r: 0.8 }, 31, WEATHER_Z - 31, P, 3), { tone: "lo" }));
  // power flows: the second half of the green pulse runs down the conduit's face to the meter
  out.push(led(a.amDraw(k.pathOf([[POLE_R + 1.7, 0, WEATHER_Z], [POLE_R + 1.7, 0, 31]].map(at)), { tone: "lit", period: FLOW, delay: FLOW * 0.55 })));
  out.push(S(k.slabOf({ x: POLE_R - 0.5, y: -1.5, w: 2.6, d: 3, r: 1 }, WEATHER_Z, 1.6, P, 3, 0.3), { tone: "mid" }));
  for (const z of [38, 45]) out.push(S(k.slabOf({ x: POLE_R - 0.3, y: -1.6, w: 2.6, d: 3.2, r: 0.5 }, z, 1.2, P, 2), { tone: "mid" }) + D([at([POLE_R + 2.3, 0, z + 0.6])], { size: SCREW }));
  // crossarm with a gain plate, the pole cap, and the three insulators
  out.push(S(k.slabOf({ x: POLE_R - 0.3, y: -3, w: 1.2, d: 6, r: 0.3 }, 69, ARM_Zs[0] - 69, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf(ARM, ARM_Zs[0], ARM_Zs[1] - ARM_Zs[0], P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(ARM, ARM_Zs[0] + 1.2, P, 3), { tone: "faint" }) }));
  out.push(D([at([ARM.x + ARM.w, -3.6, 78]), at([ARM.x + ARM.w, 3.6, 78])], { size: SCREW }));
  out.push(S(k.cylinder(0, 0, POLE_R + 0.4, POLE_TOP, 1.6, P, 28, 0.4), { tone: "hi" }));
  const tops = {};
  const ins = byDepth([[0, 0, POLE_TOP + 1.6], ...INS_Y.map((y) => [INS_X, y, ARM_Zs[1]])]);
  for (const [x, y, z] of ins) { const i = insulator(x, y, z); out.push(i.svg); tops[y] = [x, y, i.top]; }
  // transformer can on the pole's far side: halo, base ring, can with bands and a nameplate,
  // lid, dome and one high-voltage bushing (the brackets were drawn behind the pole)
  out.push(halo({ x: CAN.x - CAN.r, y: CAN.y - CAN.r, w: 2 * CAN.r, d: 2 * CAN.r, r: CAN.r }, CAN_Z[0] - 1.4, 2));
  out.push(S(k.cylinder(CAN.x, CAN.y, CAN.r + 0.4, CAN_Z[0] - 1.4, 1.4, P, 40), { tone: "lo" }));
  const bands = [55, 63].map((z) => k.sideArc(CAN.x, CAN.y, CAN.r, z, P, 32)).join("");
  out.push(S(k.cylinder(CAN.x, CAN.y, CAN.r, CAN_Z[0], CAN_Z[1] - CAN_Z[0], P, 40), { tone: "hi", inner: L(bands, { tone: "faint" }) }));
  const plate = radialBar([CAN.x, CAN.y], VIEW, CAN.r - 0.2, CAN.r + 0.3, 1.6, 0.3);
  out.push(S(k.extrude(plate, 57.4, 3, P), { tone: "mid" }));
  out.push(S(k.cylinder(CAN.x, CAN.y, CAN.r + 0.6, CAN_Z[1], 1.6, P, 40, 0.5), { tone: "mid" }));
  out.push(S(k.cylinder(CAN.x, CAN.y, CAN.r - 1.4, CAN_Z[1] + 1.6, 1.2, P, 36, 0.4), { tone: "hi" }));
  const BZ = CAN_Z[1] + 2.8;
  const [bx, by] = BUSH;
  out.push(S(k.cylinder(bx, by, 1.5, BZ, 1, P, 16), { tone: "mid" }));
  out.push(S(k.cylinder(bx, by, 1, BZ + 1, 3.4, P, 16), { tone: "hi", inner: L(k.sideArc(bx, by, 1, BZ + 2.2, P, 10) + k.sideArc(bx, by, 1, BZ + 3.4, P, 10), { tone: "lo" }) }));
  const btop = [bx, by, BZ + 4.4];
  // the jumper up to the crossarm insulator, and the service lead from the weatherhead
  const wire = (p0, p1, sag = 1.2) => k.pathOf(Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    return at([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t - sag * 4 * t * (1 - t)]);
  }));
  const lug = [CAN.x, CAN.y + CAN.r, 58];
  const head = [POLE_R + 1, 0, WEATHER_Z + 1.6];
  out.push(L(wire(btop, tops[INS_Y[0]], 0.6) + wire(head, lug, 1), { tone: "hi" }));
  // the first half of the pulse: along the service lead from the transformer to the weatherhead
  out.push(led(a.amDraw(wire(lug, head, 1), { tone: "lit", period: FLOW })));
  out.push(D([at(btop), at(tops[INS_Y[0]]), at(head), at(lug)], { size: SCREW, tone: "hi" }));
  out.push(stones());
  return out.join("");
}

function sharePoints() {
  return [...basePoints(), ...k.boxCorners(ARM, PZ, ARM_Zs[1] + 9), [0, 0, POLE_TOP + 11], ...k.boxCorners({ x: CAN.x - CAN.r, y: CAN.y - CAN.r, w: 2 * CAN.r, d: 2 * CAN.r }, CAN_Z[0], CAN_Z[1] + 8)];
}

// ---------- size: lossless path minifier (as in feature-spots) ----------
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

// ======================================================================================
// One camera, one scale, one origin: a single fit over all three spots' extremes.
// ======================================================================================
const SPOTS = [
  { name: "generate", title: "Generate", body: generateBody, points: generatePoints, label: "An isometric small vertical-axis wind turbine on a short mast, standing on a concrete pad on a round turf disc, its three blades in green and a junction box with a green status light on the mast." },
  { name: "store", title: "Store", body: storeBody, points: storePoints, css: GAUGE_CSS, label: "An isometric open rack of three battery modules joined by busbars on a concrete pad on a round turf disc, a control box on top with a green charge gauge filling." },
  { name: "share", title: "Share", body: shareBody, points: sharePoints, label: "An isometric neighbourhood utility pole on a round turf disc: a crossarm with insulators, a transformer can on brackets wired up to one of them, and a green smart meter at its foot with a blinking light." },
];

P = { origin: [0, 0], scale: 1, azimuth: AZIMUTH, elevation: ELEVATION };
P = k.fitProjection(SPOTS.flatMap((s) => s.points()), W, H, { pad: PAD, azimuth: AZIMUTH, elevation: ELEVATION });
const accents = {
  brand: GREEN,
  led: { hex: GREEN, mode: "ink" },
  grass: dark ? "#53693f" : "#a3b98a",
  earth: dark ? "#6b5442" : "#9a7b60",
  cell: dark ? "#0a0e15" : "#1e2633",
};
let SPOT_ID = "";
const svgs = [];
for (const s of SPOTS) {
  const id = `${s.name}${SUFFIX}`;
  SPOT_ID = id;
  const svg = a.assetSvg({ width: W, height: H, label: s.label, body: minify(s.body()), paper: PAPER, accents, weight: 0.5, id, css: s.css ?? "" });
  writeFileSync(join(HERE, `${id}.svg`), svg);
  writeFileSync(join(HERE, `${id}.html`), a.previewHtml({ title: id, svg, paper: PAPER, width: W }));
  svgs.push({ ...s, id, svg });
  console.log(`wrote ${id}.svg (${(svg.length / 1024).toFixed(1)} KB, scale ${P.scale.toFixed(3)})`);
}

// The row: three spots side by side on the page colour, at their shown size (240 px).
const ink = dark ? "#e6e9e4" : "#1c1f1b";
const sub = dark ? "#8d958c" : "#5f665c";
const row = svgs.map((s) => `<figure><div class="spot">${s.svg}</div><figcaption><b>${s.title}</b></figcaption></figure>`).join("");
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>energy-spots${SUFFIX}</title><style>*{box-sizing:border-box}html,body{margin:0;background:${PAPER};color:${ink};font:15px/1.4 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:960px;margin:48px auto;padding:0 16px}.row.asset-stage.iso-plate{display:flex;flex-wrap:wrap;justify-content:center;gap:24px;padding:0;box-shadow:none;background:${PAPER}}figure{margin:0;width:240px;text-align:center}.spot svg{width:240px;height:auto;display:block}figcaption{margin-top:4px;color:${sub}}figcaption b{color:${ink};font-weight:600}</style></head><body><main><div class="row asset-stage iso-plate">${row}</div></main></body></html>`;
writeFileSync(join(HERE, `energy-spots${SUFFIX}.html`), page);
console.log(`wrote energy-spots${SUFFIX}.html`);
