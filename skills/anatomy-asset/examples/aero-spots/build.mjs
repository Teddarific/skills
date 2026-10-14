// Three matching spot illustrations for the features row of "Aether", an electric-aviation
// company: "Electric propulsion" (a ducted electric fan on a thrust stand, wired to its motor
// controller), "Autonomous flight" (a finned flight computer with a lidar mast whose LED ring
// breathes) and "Quiet by design" (a rotor on a stand in front of an acoustic foam panel, a
// measurement mic on a boom and a dB meter reading low in the quiet band).
//
// One camera (azimuth 30, so the +x faces carry the detail), one world scale, one round
// turntable display base with a degree ring, one part vocabulary (rubber feet, bevelled bench
// plates, 0.6 screws in rings, flat ribbon cables between connector blocks), one ice-blue
// accent family: each spot has the accent on its own moment.
//
//   node build.mjs            dark   → propulsion.svg, autonomy.svg, quiet.svg (+ .html), aero-spots.html
//   node build.mjs --light    light  → propulsion-light.svg, … , aero-spots-light.html

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const light = process.argv.includes("--light");
const PAPER = light ? "#f6f7f9" : "#07090d";
const ICE = "#4cc9ff";
const SUFFIX = light ? "-light" : "";

const W = 320;
const H = 320;
const PAD = 20;
const AZIMUTH = 30;
const ELEVATION = 32;
const SCREW = 0.6;
const RAD = Math.PI / 180;

// ---------- the shared world: a round turntable display base ----------
const BASE_R = 42;          // plinth drum
const PLATTER_R = 39.6;     // turntable platter on top of it
const TICK_R = 37.8;        // degree ring; everything stands inside r 34
const Z_SKIRT = -12;        // rubber skirt -12..-9, drum -9..-3, platter -3..0
const LABEL = { x: 24.5, y: -8, w: 6, d: 16, r: 1 };

let P = null;
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (items, key = (i) => i) => [...items].sort((p, q) => depth(key(p)) - depth(key(q)));
const brand = (svg) => `<g class="ac-brand">${svg}</g>`;
const led = (svg) => `<g class="ac-led">${svg}</g>`;
const rubber = (svg) => `<g class="ac-rubber">${svg}</g>`;
const glass = (svg) => `<g class="ac-glass">${svg}</g>`;
const halo = (plan, z, blur = 4) => `<path class="iso-halo" d="${k.haloOf(plan, z, 0.1, P)}" style="filter:blur(${blur}px)"/>`;
const disc = (r) => ({ x: -r, y: -r, w: 2 * r, d: 2 * r, r });
const screws = (pts, z, ring = 1.4) =>
  L(pts.map(([x, y]) => k.ring(x, y, ring, z, P, 16)).join(""), { tone: "lo" }) + D(pts.map(([x, y]) => at([x, y, z])), { size: SCREW });
const faceY = (y, x0, x1, z0, z1) => k.pathOf([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]].map(at), true);
const faceX = (x, y0, y1, z0, z1) => k.pathOf([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]].map(at), true);
const polar = (c, r, deg) => [c[0] + r * Math.cos(deg * RAD), c[1] + r * Math.sin(deg * RAD)];

// A flat ribbon cable lying on a surface: a mitred band of width w along a polyline.
function ribbonRing(pts, w) {
  const h = w / 2;
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const dir = (u, v) => { const dx = v[0] - u[0]; const dy = v[1] - u[1]; const l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
    const d0 = i > 0 ? dir(pts[i - 1], p) : dir(p, pts[i + 1]);
    const d1 = i < pts.length - 1 ? dir(p, pts[i + 1]) : d0;
    let nx = -(d0[1] + d1[1]);
    let ny = d0[0] + d1[0];
    const nl = Math.hypot(nx, ny);
    nx /= nl; ny /= nl;
    const m = h / Math.max(0.3, nx * -d0[1] + ny * d0[0]);
    left.push([p[0] + nx * m, p[1] + ny * m]);
    right.push([p[0] - nx * m, p[1] - ny * m]);
  }
  return [...left, ...right.reverse()];
}
const cable = (pts, z, w = 2.6) => rubber(S(k.extrude(ribbonRing(pts, w), z, 1.4, P, { convex: false }), { tone: "hi" }));

// A connector block standing on a surface, the cable's end landing in it.
const connector = (plan, z, h) => S(k.slabOf(plan, z, h, P, 2, 0.3), { tone: "hi" });

// ---------- shared base ----------
function turntable(onPlatter = "") {
  const out = [halo(disc(BASE_R + 2), Z_SKIRT, 5)];
  out.push(rubber(S(k.cylinder(0, 0, BASE_R - 5, Z_SKIRT, 3, P, 64), { tone: "mid" })));
  out.push(S(k.cylinder(0, 0, BASE_R, Z_SKIRT + 3, 6, P, 64, 0.8), { tone: "lo", inner: L(k.sideArc(0, 0, BASE_R, Z_SKIRT + 5, P, 64), { tone: "faint" }) }));
  out.push(S(k.cylinder(0, 0, PLATTER_R, -3, 3, P, 64, 0.6), { tone: "mid" }));
  out.push(L(k.ring(0, 0, TICK_R, 0, P, 64), { tone: "lo" }));
  const t = k.radialTicks(0, 0, TICK_R, 72, 6, 0, [1, 2.1], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(onPlatter);
  // label plate on the near-right of the platter
  const z = 0.8;
  out.push(S(k.slabOf(LABEL, 0, z, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(LABEL, 1.2), z, P, 3), { tone: "faint" }));
  out.push(L([[4, 8], [4, 5]].map(([dy, len], i) => k.lineOnTop([LABEL.x + 2.3 + i * 1.6, LABEL.y + dy], [LABEL.x + 2.3 + i * 1.6, LABEL.y + dy + len], z, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([LABEL.x + LABEL.w / 2, LABEL.y + 2.2, z]), at([LABEL.x + LABEL.w / 2, LABEL.y + LABEL.d - 2.2, z])], { size: SCREW }));
  return out.join("");
}
const basePoints = () => k.circleRing(0, 0, BASE_R + 1, 72).flatMap(([x, y]) => [[x, y, Z_SKIRT - 1], [x, y, 0]]);

// A bevelled bench plate with corner screws, the shared footing for every machine.
function benchPlate(plan, h = 3) {
  return halo(k.insetPlan(plan, -1.5), 0, 3) +
    S(k.slabOf(plan, 0, h, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(plan, 1, P, 4), { tone: "faint" }) }) +
    screws(k.corners(plan, 3), h, 1.2);
}

// ======================================================================================
// PROPULSION: a ducted electric fan, face up, on an S-beam load cell on a bench plate; its
// rotor (ice blue) is the moment. A ribbon cable runs to the motor controller, whose status
// LEDs glow ice blue and one blinks.
// ======================================================================================
const F = [-9, 3];
const BP = { x: -26, y: -14, w: 34, d: 34, r: 3 };
const CTRL = { x: 4, y: -27, w: 15, d: 10.5, r: 1.6 };
const Z_DUCT = 27;
const Z_LIP = 34;
const Z_FACE = 36.4;
const DUCT_R = 18;

function propulsionBody() {
  const out = [turntable()];
  // controller first: it is behind (−y) the stand
  out.push(controller());
  // cable from the controller to the bench plate's near side
  const cy = CTRL.y + CTRL.d;
  const cx = CTRL.x + 9.5;
  out.push(connector({ x: cx - 2, y: cy, w: 4, d: 2.4, r: 0.5 }, 0.4, 3.2));
  out.push(benchPlate(BP));
  out.push(cable([[cx, cy + 2.4], [cx, 6], [BP.x + BP.w + 2, 6]], 0));
  out.push(connector({ x: BP.x + BP.w, y: 4, w: 2, d: 4, r: 0.5 }, 0.4, 2.4));
  // S-beam load cell between two mounting blocks
  const lc = { x: F[0] - 5, y: F[1] - 6, w: 10, d: 12, r: 1 };
  out.push(S(k.slabOf(k.insetPlan(lc, -2.5), 3, 2, P, 3, 0.4), { tone: "lo" }));
  const bolts = byDepth(k.corners(k.insetPlan(lc, -2.5), 1.3)).map(([x, y]) => S(k.cylinder(x, y, 0.8, 5, 0.8, P, 12), { tone: "hi" }));
  out.push(bolts.slice(0, 3).join(""));
  const LX = lc.x + lc.w;
  out.push(S(k.slabOf(lc, 5, 11, P, 3, 0.5), {
    tone: "hi",
    inner: L(faceX(LX, lc.y + 2, lc.y + lc.d - 4, 8, 9.6) + faceX(LX, lc.y + 4, lc.y + lc.d - 2, 11.4, 13), { tone: "lo" }),
  }));
  out.push(bolts[3]);
  // its signal lead: a gland on the near face
  out.push(S(k.slabOf({ x: LX, y: F[1] - 1.5, w: 1.6, d: 3, r: 0.6 }, 5.8, 1.8, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf(k.insetPlan(lc, -1), 16, 2, P, 3, 0.4), { tone: "lo" }));
  // motor can below the duct, finned
  out.push(S(k.cylinder(F[0], F[1], 4, 18, 2, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(F[0], F[1], 7, 20, Z_DUCT - 20, P, 36, 0.4), { tone: "hi", crease: "lo", inner: L(k.knurl(F[0], F[1], 7, 20, Z_DUCT, 24, P, 0.15), { tone: "lo" }) }));
  // the duct: shroud, seam, lip, the dark face and the rotor
  out.push(S(k.cylinder(F[0], F[1], DUCT_R, Z_DUCT, Z_LIP - Z_DUCT, P, 64), {
    tone: "mid",
    inner: L(k.sideArc(F[0], F[1], DUCT_R, Z_DUCT + 3, P, 48) + k.sideArc(F[0], F[1], DUCT_R, Z_LIP - 3, P, 48), { tone: "faint" }),
  }));
  out.push(S(k.cylinder(F[0], F[1], DUCT_R + 1, Z_LIP, Z_FACE - Z_LIP, P, 64, 0.5), { tone: "hi", crease: "lo" }));
  out.push(S(k.cylinder(F[0], F[1], DUCT_R - 2.6, Z_FACE, 0.3, P, 56), { tone: "lo", crease: "none" }));
  const lipScrews = Array.from({ length: 12 }, (_, i) => at([...polar(F, DUCT_R - 0.8, i * 30 + 15), Z_FACE]));
  out.push(D(lipScrews, { size: SCREW }));
  const zf = Z_FACE + 0.3;
  // stator ring under the blades: a faint ring on the face
  out.push(L(k.ring(F[0], F[1], 7.5, zf, P, 40), { tone: "faint" }));
  // the rotor: flat tapered blades in the face's plane, spinning; the hub covers their roots
  const spin = a.amRotor([F[0], F[1], zf + 0.6], [1, 0, 0], [0, 1, 0], P, { count: 7, r0: 3.6, r1: 13.2, chord: 5.4, tip: 2.6, sweep: 0.42, period: 500, thickness: 0.6, clip: DUCT_R - 2.6 });
  const rotor = [spin];
  rotor.push(S(k.cylinder(F[0], F[1], 4.6, zf, 2.4, P, 32, 0.4), { tone: "hi", lit: true, inner: L(k.sideArc(F[0], F[1], 4.6, zf + 1, P, 24), { tone: "lo" }) }));
  rotor.push(S(k.cylinder(F[0], F[1], 2.4, zf + 2.4, 1.2, P, 24), { tone: "hi" }));
  out.push(brand(rotor.join("")));
  out.push(D([at([F[0], F[1], zf + 3.6])], { size: SCREW }));
  return out.join("");
}

function controller() {
  const out = [];
  const c = CTRL;
  out.push(halo(k.insetPlan(c, -1), 0, 3));
  for (const [x, y] of byDepth(k.corners(c, 2.2))) out.push(rubber(S(k.cylinder(x, y, 1.4, 0, 1.2, P, 14), { tone: "mid" })));
  const z0 = 1.2;
  const z1 = 11;
  const XF = c.x + c.w;
  out.push(S(k.slabOf(c, z0, z1 - z0, P, 3, 0.6), {
    tone: "mid",
    inner: L(k.sideSeam(c, z1 - 2.4, P, 3), { tone: "faint" }) +
      L([0, 1, 2].map((i) => faceY(c.y + c.d, c.x + 3 + i * 3.4, c.x + 4.6 + i * 3.4, z0 + 2, z1 - 4.4)).join(""), { tone: "lo" }),
  }));
  // top: vent slots and screws
  out.push(screws(k.corners(c, 1.8), z1, 0.9));
  for (let i = 0; i < 3; i++) out.push(S(k.slabOf({ x: c.x + 3.2, y: c.y + 2.4 + i * 2.4, w: 8.6, d: 1, r: 0.4 }, z1, 2, P, 2, 0.3), { tone: "mid" }));
  // near face: a display window with four status LEDs, the last one blinking
  const win = { x: XF, y: c.y + 2.4, w: 0.6, d: 6.2, r: 0.3 };
  out.push(S(k.slabOf(win, 4.2, 3.6, P, 2), { tone: "lo", crease: "none" }));
  const ledAt = (i) => at([XF + 0.6, win.y + 1 + i * 1.4, 6]);
  out.push(led(D([0, 1, 2].map(ledAt), { size: 0.75, tone: "hi" })));
  out.push(a.amBlink(led(D([ledAt(3)], { size: 0.75, tone: "hi" })), { period: 2600, min: 0.1 }));
  // a power switch on the near face
  out.push(S(k.slabOf({ x: XF, y: c.d + c.y - 3.4, w: 1.2, d: 2, r: 0.4 }, 4.6, 2.6, P, 2), { tone: "hi" }));
  return out.join("");
}

function propulsionPoints() {
  return [...basePoints(), ...k.boxCorners({ x: F[0] - DUCT_R - 1, y: F[1] - DUCT_R - 1, w: 2 * DUCT_R + 2, d: 2 * DUCT_R + 2, r: 0 }, 0, Z_FACE + 4)];
}

// ======================================================================================
// AUTONOMY: a flight computer on anti-vibration mounts, finned lid, connectors and status
// LEDs on its near face, a GPS puck and a whip antenna; a mast carries the lidar head, whose
// ice-blue LED ring is the moment and breathes.
// ======================================================================================
const AP = { x: -26, y: -20, w: 44, d: 36, r: 3 };
const U = { x: -22, y: -16, w: 36, d: 28, r: 2 };
const Z_U0 = 5;
const Z_U1 = 19;
const Z_LID = 21;
const M = [6, -4];
const Z_HEAD = 44;

function autonomyBody() {
  // the scan: two ice rings expanding across the platter, out of phase (CSS in PING_CSS)
  const ping = (delay) => `<g transform="${a.topPlane([0, 0, 0], P)}"><circle r="35" class="iso-line ping" data-tone="hi" style="fill:none;animation-delay:${delay}s"/></g>`;
  const out = [turntable(led(ping(0) + ping(-1.6))), benchPlate(AP, 2.5)];
  // power module on the platter, cabled to the bench plate's near side
  const PM = { x: -19, y: 21, w: 12, d: 8, r: 1.5 };
  const py = AP.y + AP.d;
  out.push(connector({ x: -2, y: py, w: 4, d: 2, r: 0.5 }, 0.4, 2.2));
  out.push(cable([[0, py + 2], [0, PM.y + 4], [PM.x + PM.w + 2, PM.y + 4]], 0));
  out.push(halo(k.insetPlan(PM, -1), 0, 3));
  out.push(S(k.slabOf(PM, 0, 7, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(PM, 2, P, 3), { tone: "faint" }) }));
  out.push(connector({ x: PM.x + PM.w, y: PM.y + 2, w: 2, d: 4, r: 0.5 }, 0.4, 2.4));
  for (const [tx, ty] of byDepth([[PM.x + 3.5, PM.y + 4], [PM.x + 8, PM.y + 4]])) {
    out.push(S(k.cylinder(tx, ty, 1.5, 7, 1, P, 16), { tone: "lo" }), S(k.cylinder(tx, ty, 0.9, 8, 1.4, P, 14, 0.2), { tone: "hi" }));
  }
  out.push(led(D([at([PM.x + 3, PM.y + PM.d, 4.6]), at([PM.x + 5, PM.y + PM.d, 4.6])], { size: 0.7, tone: "hi" })));
  // anti-vibration mounts
  for (const [x, y] of byDepth(k.corners(U, 3.5))) {
    out.push(rubber(S(k.cylinder(x, y, 2.8, 2.5, Z_U0 - 2.5, P, 18), { tone: "mid", inner: L(k.sideArc(x, y, 2.8, 3.75, P, 12), { tone: "faint" }) })));
  }
  const XF = U.x + U.w;
  const YF = U.y + U.d;
  // the unit: body with a seam, vents on its left face, connectors and LEDs on its near face
  out.push(S(k.slabOf(U, Z_U0, Z_U1 - Z_U0, P, 3, 0.6), {
    tone: "mid",
    inner: L(k.sideSeam(U, Z_U0 + 3, P, 3), { tone: "faint" }) +
      L([0, 1, 2, 3, 4].map((i) => faceY(YF, U.x + 6 + i * 4.4, U.x + 8 + i * 4.4, Z_U0 + 5, Z_U1 - 3)).join(""), { tone: "lo" }),
  }));
  const conns = [];
  for (const [i, y] of [-12, -5, 2].entries()) {
    const w = i === 2 ? 4.4 : 5.6;
    conns.push(S(k.slabOf({ x: XF, y, w: 1.6, d: w, r: 0.8 }, 8.6, 4.4, P, 2, 0.3), { tone: "hi", inner: L(faceX(XF + 1.6, y + 1, y + w - 1, 9.8, 11.8), { tone: "lo" }) }));
  }
  out.push(conns.join(""));
  out.push(led(D([at([XF, 7.4, 15.4]), at([XF, 9.2, 15.4])], { size: 0.7, tone: "hi" })));
  out.push(D([at([XF, 5.6, 15.4])], { size: 0.7, tone: "lo" }));
  // lid with fins along y, sorted far to near
  out.push(S(k.slabOf(k.insetPlan(U, -0.6), Z_U1, Z_LID - Z_U1, P, 3, 0.5), { tone: "hi" }));
  out.push(screws(k.corners(k.insetPlan(U, -0.6), 2.2), Z_LID, 1));
  const top = [];
  for (let i = 0; i < 6; i++) {
    const x = U.x + 5 + i * 3;
    top.push({ key: [x, -2, Z_LID], svg: S(k.slabOf({ x, y: U.y + 3.4, w: 1.3, d: U.d - 6.8, r: 0.5 }, Z_LID, 5, P, 2, 0.3), { tone: "mid" }) });
  }
  // GPS puck and whip antenna on the near end of the lid
  const G = [10, 6.5];
  top.push({ key: [G[0], G[1], Z_LID], svg: S(k.cylinder(G[0], G[1], 3.4, Z_LID, 2, P, 28, 0.4), { tone: "hi", inner: "" }) + L(k.ring(G[0], G[1], 2, Z_LID + 2, P, 20), { tone: "faint" }) });
  const AN = [-20.2, 7.5];
  top.push({
    key: [AN[0] + 4, AN[1], Z_LID],
    svg: S(k.cylinder(AN[0], AN[1], 1.6, Z_LID, 1.6, P, 16), { tone: "mid" }) +
      S(k.cylinder(AN[0], AN[1], 0.7, Z_LID + 1.6, 15, P, 12), { tone: "hi" }) +
      S(k.cylinder(AN[0], AN[1], 1.2, Z_LID + 16.6, 1.2, P, 14), { tone: "hi" }),
  });
  // the mast with its lidar head, as one item
  top.push({ key: [M[0], M[1], Z_LID], svg: mast() });
  for (const t of byDepth(top, (t) => t.key)) out.push(t.svg);
  return out.join("");
}

function mast() {
  const out = [];
  const [x, y] = M;
  out.push(S(k.cylinder(x, y, 4.6, Z_LID, 1.6, P, 32, 0.4), { tone: "mid" }));
  out.push(D([0, 120, 240].map((d) => at([...polar(M, 3.4, d + 30), Z_LID + 1.6])), { size: SCREW }));
  out.push(S(k.cylinder(x, y, 2, Z_LID + 1.6, Z_HEAD - Z_LID - 1.6, P, 20), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x, y, 3, 32, 3, P, 24, 0.3), { tone: "hi", inner: L(k.sideArc(x, y, 3, 33.5, P, 16), { tone: "faint" }) }));
  // head: base puck, dark window, the LED ring, cap and dome
  out.push(S(k.cylinder(x, y, 8, Z_HEAD, 3, P, 36, 0.5), { tone: "mid" }));
  out.push(glass(S(k.cylinder(x, y, 7.4, Z_HEAD + 3, 6, P, 36), { tone: "mid", inner: L(k.sideArc(x, y, 7.4, Z_HEAD + 4.4, P, 32), { tone: "faint" }) })));
  out.push(a.amPulse(brand(S(k.cylinder(x, y, 7.7, Z_HEAD + 5.4, 1.3, P, 36), { tone: "hi", lit: true })), { period: 3600, min: 0.35 }));
  out.push(S(k.cylinder(x, y, 8, Z_HEAD + 9, 2.6, P, 36, 0.5), { tone: "hi", crease: "lo" }));
  // window marks on the cap's top, turning with the head: an ice sensor window and three slots
  const arcBand = (a0, a1, r0, r1, n = 8) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = (a0 + ((a1 - a0) * i) / n) * RAD; pts.push([Math.cos(t) * r1, Math.sin(t) * r1]); }
    for (let i = n; i >= 0; i--) { const t = (a0 + ((a1 - a0) * i) / n) * RAD; pts.push([Math.cos(t) * r0, Math.sin(t) * r0]); }
    return "M" + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("L") + "Z";
  };
  const marks = led(`<path class="iso-line" data-tone="hi" style="fill:var(--anatomy-shade-0)" d="${arcBand(-25, 25, 4.9, 7.1)}"/>`) +
    `<path class="iso-line" data-tone="lo" style="fill:none" d="${[90, 180, 270].map((t) => arcBand(t - 8, t + 8, 5.4, 6.6, 4)).join("")}"/>`;
  out.push(a.amSpin(marks, a.topPlane([x, y, Z_HEAD + 11.6], P), { period: 1000 }));
  out.push(S(k.cylinder(x, y, 4, Z_HEAD + 11.6, 1.2, P, 32, 0.3), { tone: "mid" }));
  out.push(D([at([x, y, Z_HEAD + 12.8])], { size: SCREW }));
  return out.join("");
}

function autonomyPoints() {
  return [...basePoints(), ...k.boxCorners({ x: M[0] - 8, y: M[1] - 8, w: 16, d: 16, r: 0 }, 0, Z_HEAD + 13)];
}

// ======================================================================================
// QUIET: a three-blade rotor on a test stand in front of an acoustic foam panel; a measurement
// mic hangs from a boom over the blade tips; a dB meter, face up, reads low with its quiet
// band in ice blue (the moment, breathing) and an ice-blue needle.
// ======================================================================================
const R = [-5, -6];
const PANEL = { x: -29, y: -17, w: 4, d: 34, r: 0.8 };
const Z_PANEL = 40;
const MP = [20, -22];
const Z_BOOM = 25;
const MIC = [11, -22];
const METER = { x: -11, y: 13, w: 23, d: 15, r: 2 };
const Z_METER = 8;

function quietBody() {
  const out = [turntable()];
  // foam panel on two feet, its near face a grid of wedges
  const feet = [PANEL.y + 3, PANEL.y + PANEL.d - 7];
  out.push(halo(k.insetPlan({ ...PANEL, x: PANEL.x - 2, w: PANEL.w + 4 }, -1), 0, 3));
  for (const y of feet) out.push(S(k.slabOf({ x: PANEL.x - 1.5, y, w: PANEL.w + 6, d: 4, r: 1 }, 0, 2, P, 3, 0.4), { tone: "lo" }));
  const XF = PANEL.x + PANEL.w;
  const cols = 4;
  const rows = 4;
  const y0 = PANEL.y + 2;
  const z0 = 4;
  const cw = (PANEL.d - 4) / cols;
  const rh = (Z_PANEL - 2 - z0) / rows;
  const foam = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const ya = y0 + i * cw;
      const za = z0 + j * rh;
      // a pyramid: the tile's outline and its two diagonals, which end in its corners
      foam.push(faceX(XF, ya, ya + cw, za, za + rh));
      foam.push(k.segment([XF, ya, za], [XF, ya + cw, za + rh], P), k.segment([XF, ya + cw, za], [XF, ya, za + rh], P));
    }
  }
  out.push(S(k.slabOf(PANEL, 2, Z_PANEL - 2, P, 2, 0.5), { tone: "mid", inner: L(foam.join(""), { tone: "lo" }) }));
  for (const y of feet) out.push(D([at([PANEL.x + PANEL.w + 2.5, y + 2, 2])], { size: SCREW }));

  // the rotor stand
  const RB = { x: R[0] - 8, y: R[1] - 8, w: 16, d: 16, r: 2 };
  out.push(benchPlate(RB, 4));
  out.push(S(k.cylinder(R[0], R[1], 4.4, 4, 2, P, 28, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(R[0], R[1], 2.8, 6, 16, P, 24), { tone: "mid", crease: "none", inner: L(k.sideArc(R[0], R[1], 2.8, 14, P, 16), { tone: "faint" }) }));
  out.push(S(k.cylinder(R[0], R[1], 5, 22, 6, P, 36, 0.4), { tone: "hi", crease: "lo", inner: L(k.knurl(R[0], R[1], 5, 22, 28, 22, P, 0.15), { tone: "lo" }) }));
  const zb = 28.2;
  out.push(a.amRotor([R[0], R[1], zb + 0.6], [1, 0, 0], [0, 1, 0], P, { count: 3, r0: 2, r1: 15.4, chord: 3.8, tip: 2, sweep: 0.3, period: 800, reverse: true, delay: 300, thickness: 0.6 }));
  out.push(S(k.cylinder(R[0], R[1], 2.8, zb, 2.2, P, 24, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(R[0], R[1], 1.4, zb + 2.2, 0.8, P, 16), { tone: "hi" }));

  // the mic stand: base, post, boom out toward the rotor, the mic standing at its end
  out.push(halo({ x: MP[0] - 6, y: MP[1] - 6, w: 12, d: 12, r: 6 }, 0, 2));
  out.push(rubber(S(k.cylinder(MP[0], MP[1], 5, 0, 2, P, 32, 0.4), { tone: "mid" })));
  out.push(S(k.cylinder(MP[0], MP[1], 2.4, 2, 2, P, 20, 0.3), { tone: "hi" }));
  out.push(S(k.cylinder(MP[0], MP[1], 1.2, 4, Z_BOOM - 2.4 - 4, P, 16), { tone: "mid", crease: "none", inner: L(k.sideArc(MP[0], MP[1], 1.2, 13, P, 10), { tone: "faint" }) }));
  out.push(S(k.slabOf({ x: MIC[0] - 1.2, y: MIC[1] - 0.9, w: MP[0] - MIC[0], d: 1.8, r: 0.8 }, Z_BOOM - 0.8, 1.6, P, 2), { tone: "mid" }));
  const zm = Z_BOOM + 0.8;
  out.push(S(k.cylinder(MIC[0], MIC[1], 2, zm, 1.6, P, 20, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(MIC[0], MIC[1], 1.5, zm + 1.6, 6.4, P, 20), { tone: "hi", inner: L(k.sideArc(MIC[0], MIC[1], 1.5, zm + 4.6, P, 12), { tone: "faint" }) }));
  out.push(rubber(S(k.cylinder(MIC[0], MIC[1], 1.2, zm + 8, 2.4, P, 18), { tone: "hi", inner: L(k.knurl(MIC[0], MIC[1], 1.2, zm + 8, zm + 10.4, 10, P, 0.3), { tone: "mid" }) })));
  out.push(S(k.slabOf({ x: MP[0] - 2, y: MP[1] - 2, w: 4, d: 4, r: 0.8 }, Z_BOOM - 2.4, 4.8, P, 2, 0.3), { tone: "hi" }));
  out.push(S(k.slabOf({ x: MP[0] + 2, y: MP[1] - 0.8, w: 1.2, d: 1.6, r: 0.4 }, Z_BOOM - 0.8, 1.6, P, 2), { tone: "lo" }));
  out.push(S(k.cylinder(MP[0] + 4.4, MP[1], 1.4, Z_BOOM - 1.6, 3.2, P, 16), { tone: "hi", crease: "lo" }));
  out.push(S(k.cylinder(MP[0], MP[1], 1.2, Z_BOOM + 2.4, 1.2, P, 16), { tone: "mid" }));

  // cable from the mic base to the meter
  out.push(connector({ x: MP[0] - 1.6, y: MP[1] + 4.4, w: 3.2, d: 2.4, r: 0.5 }, 0.2, 2.2));
  out.push(cable([[MP[0], MP[1] + 6.8], [MP[0], METER.y + 6.5], [METER.x + METER.w + 2, METER.y + 6.5]], 0));
  out.push(connector({ x: METER.x + METER.w, y: METER.y + 4.5, w: 2, d: 4, r: 0.5 }, 0.4, 2.4));
  out.push(meter());
  return out.join("");
}

function meter() {
  const out = [];
  const m = METER;
  out.push(halo(k.insetPlan(m, -1), 0, 3));
  for (const [x, y] of byDepth(k.corners(m, 2.4))) out.push(rubber(S(k.cylinder(x, y, 1.4, 0, 1.2, P, 14), { tone: "mid" })));
  out.push(S(k.slabOf(m, 1.2, Z_METER - 1.2, P, 4, 0.6), {
    tone: "mid",
    inner: L(k.sideSeam(m, 3.4, P, 4), { tone: "faint" }),
  }));
  const C = [m.x + 8.5, m.y + m.d / 2];
  const zt = Z_METER;
  // bezel, face, scale ring and ticks; the first quarter of the scale is the quiet band
  out.push(S(k.cylinder(C[0], C[1], 7.2, zt, 1.6, P, 56, 0.4), { tone: "hi", crease: "lo" }));
  const zf = zt + 1.6;
  out.push(S(k.cylinder(C[0], C[1], 6.2, zf, 0.2, P, 52), { tone: "lo", crease: "none" }));
  const z = zf + 0.2;
  const FROM = 180 * RAD;
  const SPAN = 240 * RAD;
  const QUIET = 60 * RAD;
  const arc = (r, a0, a1, n = 24) => k.onTop(Array.from({ length: n + 1 }, (_, i) => {
    const t = a0 + ((a1 - a0) * i) / n;
    return [C[0] + Math.sin(t) * r, C[1] - Math.cos(t) * r];
  }), z, P);
  const loud = k.radialTicks(C[0], C[1], 5.6, 12, 3, z, [1, 1.9], P, FROM + QUIET, SPAN - QUIET);
  out.push(L(arc(5.6, FROM + QUIET, FROM + SPAN, 30), { tone: "lo" }), L(loud.minor, { tone: "lo" }), L(loud.major, { tone: "mid" }));
  const quiet = k.radialTicks(C[0], C[1], 5.6, 4, 4, z, [1, 1.9], P, FROM, QUIET);
  out.push(a.amPulse(led(L(arc(5.6, FROM, FROM + QUIET, 10), { tone: "hi" }) + L(quiet.minor + quiet.major, { tone: "hi" })), { period: 4200, min: 0.4 }));
  // needle in the quiet band, on a hub
  const NA = FROM + 38 * RAD;
  const d = [Math.sin(NA), -Math.cos(NA)];
  const n = [-d[1], d[0]];
  const p = (s, o) => [C[0] + d[0] * s + n[0] * o, C[1] + d[1] * s + n[1] * o];
  // the needle, drawn flat in the face's plane and swinging gently inside the quiet band
  const q = (s2, o) => `${(d[0] * s2 + n[0] * o).toFixed(2)} ${(d[1] * s2 + n[1] * o).toFixed(2)}`;
  const needle = `<path class="iso-line" data-tone="lit" style="fill:var(--anatomy-top);stroke-linejoin:round" d="M${q(5.2, 0)}L${q(0.4, 0.5)}L${q(-1.6, 0.5)}L${q(-1.6, -0.5)}L${q(0.4, -0.5)}Z"/>`;
  out.push(brand(a.amSwing(needle, a.topPlane([C[0], C[1], z + 0.2], P), { from: -16, to: 14, period: 3400 })));
  out.push(brand(S(k.cylinder(C[0], C[1], 0.9, z + 0.4, 0.5, P, 14), { tone: "hi" })));
  // two push buttons and a power LED on the right of the top
  for (const [bx, by] of byDepth([[m.x + 18, m.y + 4.5], [m.x + 18, m.y + 10]])) {
    out.push(S(k.cylinder(bx, by, 1.6, zt, 1, P, 18, 0.3), { tone: "hi" }));
  }
  out.push(L(k.ring(m.x + 20.6, m.y + 7.5, 0.9, zt, P, 12), { tone: "lo" }));
  out.push(led(D([at([m.x + 20.6, m.y + 7.5, zt])], { size: 0.7, tone: "hi" })));
  return out.join("");
}

function quietPoints() {
  return [...basePoints(), ...k.boxCorners(PANEL, 0, Z_PANEL), [MP[0], MP[1], Z_BOOM + 2.4]];
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
// One camera, one scale, one origin: a single fit over all three spots' extremes, so the
// turntables line up in the row at the same size.
// ======================================================================================
// The lidar's scan ping: a ring scaling out in the platter's plane and fading. Scoped to the
// SVG's id, with its own keyframe name so three spots inlined on one page don't collide.
const pingCss = (id) => `#${id} .ping{transform-box:view-box;transform-origin:0 0;opacity:0;animation:ping-${id} 3.2s cubic-bezier(.25,.6,.35,1) infinite}` +
  `@keyframes ping-${id}{0%{transform:scale(.7);opacity:0}12%{opacity:.85}100%{transform:scale(1);opacity:0}}` +
  `@media (prefers-reduced-motion:reduce){#${id} .ping{animation:none;opacity:0}}`;

const SPOTS = [
  { name: "propulsion", title: "Electric propulsion", body: propulsionBody, points: propulsionPoints, label: "An isometric ducted electric fan on a thrust-measuring load cell, standing on a round turntable base, its rotor in ice blue and a ribbon cable running to a motor controller with blue status lights." },
  { name: "autonomy", title: "Autonomous flight", body: autonomyBody, points: autonomyPoints, label: "An isometric finned flight computer on a round turntable base, with connectors, a GPS puck and an antenna, and a mast carrying a lidar head whose ice-blue LED ring glows." },
  { name: "quiet", title: "Quiet by design", body: quietBody, points: quietPoints, label: "An isometric acoustic test on a round turntable base: a two-blade rotor on a stand in front of a foam panel, a microphone on a boom over its blade tips, and a dB meter whose ice-blue needle sits in the quiet band." },
];

P = { origin: [0, 0], scale: 1, azimuth: AZIMUTH, elevation: ELEVATION };
const SHARED = k.fitProjection(SPOTS.flatMap((s) => s.points()), W, H, { pad: PAD, azimuth: AZIMUTH, elevation: ELEVATION });
const svgs = [];
for (const s of SPOTS) {
  P = SHARED;
  const id = `${s.name}${SUFFIX}`;
  const svg = a.assetSvg({
    width: W,
    height: H,
    label: s.label,
    body: minify(s.body()),
    css: s.name === "autonomy" ? pingCss(id) : "",
    paper: PAPER,
    accents: {
      brand: ICE,
      led: { hex: ICE, mode: "ink" },
      rubber: light ? "#3a3d45" : "#05070a",
      glass: light ? "#2c3440" : "#04070c",
    },
    weight: 0.5,
    id,
  });
  writeFileSync(join(HERE, `${id}.svg`), svg);
  writeFileSync(join(HERE, `${id}.html`), a.previewHtml({ title: id, svg, paper: PAPER, width: W }));
  svgs.push({ ...s, id, svg });
  console.log(`wrote ${id}.svg (${(svg.length / 1024).toFixed(1)} KB, scale ${SHARED.scale.toFixed(3)})`);
}

// The row: three spots side by side on the page colour, at their shown size (240 px).
const ink = light ? "#14171d" : "#e9eef5";
const sub = light ? "#5b626e" : "#8790a0";
const row = svgs.map((s) => `<figure><div class="spot">${s.svg}</div><figcaption><b>${s.title}</b></figcaption></figure>`).join("");
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>aero-spots${SUFFIX}</title><style>*{box-sizing:border-box}html,body{margin:0;background:${PAPER};color:${ink};font:15px/1.4 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:960px;margin:48px auto;padding:0 16px}.row.asset-stage.iso-plate{display:flex;flex-wrap:wrap;justify-content:center;gap:24px;padding:0;box-shadow:none;background:${PAPER}}figure{margin:0;width:240px;text-align:center}.spot svg{width:240px;height:auto;display:block}figcaption{margin-top:4px;color:${sub}}figcaption b{color:${ink};font-weight:600;letter-spacing:.01em}</style></head><body><main><div class="row asset-stage iso-plate">${row}</div></main></body></html>`;
writeFileSync(join(HERE, `aero-spots${SUFFIX}.html`), page);
console.log(`wrote aero-spots${SUFFIX}.html`);
