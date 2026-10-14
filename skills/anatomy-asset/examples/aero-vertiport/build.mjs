// A landing-page hero for "Aether", an electric-aviation company: a sleek six-rotor air taxi
// hovering just above a rooftop vertiport. The aircraft is a turned fuselage with a glass nose
// and an ice-blue livery band, a high wing on a short pylon, two booms under it carrying four
// rotor pods, two more pods on the wing tips, a T-tail and a pair of skids. The pad stands on
// steel legs on a building roof, with a painted touchdown ring and H, edge lights that chase
// round it, safety-net trays, a charging bollard with its connector parked in a holster, a
// stair down to the roof, a windsock, an HVAC unit, vents and an access hatch. The aircraft
// floats (its halo stays on the pad), the edge lights chase and the wing-tip strobes blink.
//
//   node build.mjs            dark   → aero-vertiport.svg, aero-vertiport.html
//   node build.mjs --light    light  → aero-vertiport-light.svg, aero-vertiport-light.html
//   node build.mjs --audit    also runs the audit on the recorded shapes

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
const TAU = Math.PI * 2;

const W = 1200;
const H = 640;
const SAFE = { x: 0, y: 0, w: 470, h: H };
const REGION = { x: 500, y: 30, w: 670, h: 580 };
const AZIMUTH = 32;
const ELEVATION = 30;

// ---------- world ----------
const ROOF = { x: -130, y: -128, w: 230, d: 230, r: 3 };
const ROOF_Z0 = -30;
const PARAPET_T = 6;
const PARAPET_H = 9;
const PC = [-34, -32]; // pad centre
const C = [-28, -26]; // aircraft centre, in the aircraft's own coordinates
const PAD_HALF = 70;
const PAD = { x: PC[0] - PAD_HALF, y: PC[1] - PAD_HALF, w: PAD_HALF * 2, d: PAD_HALF * 2, r: 6 };
const DECK_Z0 = 18;
const DECK_Z1 = 24;

// aircraft
const ZF = 88; // fuselage axis height
const RM = 17; // max fuselage radius
const S0 = -84;
const SM = 14;
const S1 = 70;
const RT = 3.4;
const WING_Z0 = ZF + RM + 2.2;
const WING_T = 3.2;
const WING_Z1 = WING_Z0 + WING_T;
const BOOM_R = 3.2;
const BOOM_X = 64;
const BOOM_Z = WING_Z0 - BOOM_R;
const POD_FRONT = 66;
const POD_REAR = -70;
const NAC_R = 6.2;
const TIP_X = 120;
const ROTOR_R = 25;
const SKID_X = 14;

// The aircraft is built at its own scale and placed over the pad by a scaled projection:
// a craft point q stands at HOVER + SC·(q − Q0) in the roof's world, so the craft can be the
// hero while the rooftop stays a plinth at human scale.
const SC = 1.5;
const Q0 = [C[0], C[1], 0];
const SKID_BOTTOM = ZF - 20 - 13 - 1.7; // skid underside in craft units
const GAP = 20; // clear air between the skids and the deck, in roof units
const HOVER = [PC[0], PC[1], DECK_Z1 + GAP - SC * SKID_BOTTOM];
const placed = (q) => G.add3(HOVER, G.mul3(G.sub3(q, Q0), SC));
const PR = a.fitInto(
  [
    ...k.boxCorners(ROOF, ROOF_Z0, PARAPET_H),
    ...[
      [C[0] - TIP_X - ROTOR_R, C[1] - ROTOR_R, WING_Z1 + 14],
      [C[0] + TIP_X + ROTOR_R, C[1] + ROTOR_R, WING_Z1 + 14],
      [C[0] - TIP_X - ROTOR_R, C[1] + ROTOR_R, WING_Z1 + 14],
      [C[0] + TIP_X + ROTOR_R, C[1] - ROTOR_R, WING_Z1 + 14],
      [C[0] + BOOM_X + ROTOR_R, C[1] + POD_FRONT + ROTOR_R, WING_Z1 + 14],
      [C[0] - BOOM_X - ROTOR_R, C[1] + POD_REAR - ROTOR_R, WING_Z1 + 14],
      [C[0], C[1] - 95, ZF + 50],
      [C[0], C[1] + 70, ZF],
    ].map(placed),
  ],
  REGION,
  { pad: 2, azimuth: AZIMUTH, elevation: ELEVATION },
);
const PA = (() => {
  const zero = { ...PR, scale: PR.scale * SC, origin: [0, 0] };
  const want = k.iso(HOVER, PR);
  const got = k.iso(Q0, zero);
  return { ...zero, origin: [want[0] - got[0], want[1] - got[1]] };
})();
let P = PA; // the aircraft is drawn first, then P switches to the roof
const V = G.viewOf(PA);
const KS = G.scaleOf(PA);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (list, key = (i) => i) => [...list].sort((p, q) => depth(key(p)) - depth(key(q)));
const ac = (name, svg) => `<g class="ac-${name}">${svg}</g>`;
const rot = ([x, y], t) => [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)];
const vframe = (x, y, z) => G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);

// ---------- the recorder: every aircraft part is an item with its true shape ----------
const R = A.recorder(P);
const record = R.solid;
function put(name, centre, svg, shapes, bias = 0) {
  const id = R.nameFor(name);
  R.put({ piece: "craft", at: centre, bias, svg, name: id, shapes: shapes.map((shape) => record({ ...shape, name: shape.name ?? id })) });
}
// the rooftop lives in the roof's own coordinates, so its shapes go to a recorder of their own
const RR = A.recorder(PR);
const stand = (shape, name) => RR.solid({ ...shape, name: RR.nameFor(`stand.${name}`) });

// ---------- fuselage: one turned body, cut into tail, livery band, cabin, glass and nose ----------
const FUS = G.frameOf([C[0], C[1], ZF], [0, 1, 0], [1, 0, 0], [0, 0, 1]); // angle 0 = +x, π/2 = up
const NOSE_P = 1.7;
const rF = (s) => {
  if (s >= SM) {
    const v = Math.min(1, (s - SM) / (S1 - SM));
    return RM * Math.pow(Math.max(0, 1 - Math.pow(v, NOSE_P)), 0.5);
  }
  const u = Math.min(1, (SM - s) / (SM - S0));
  return RT + (RM - RT) * (1 - u * u);
};
const dF = (s) => {
  if (s >= SM) {
    const v = Math.min(0.9995, Math.max(1e-6, (s - SM) / (S1 - SM)));
    const q = Math.max(1e-6, 1 - Math.pow(v, NOSE_P));
    return (RM * 0.5 * Math.pow(q, -0.5) * -NOSE_P * Math.pow(v, NOSE_P - 1)) / (S1 - SM);
  }
  const u = Math.min(1, (SM - s) / (SM - S0));
  return ((RM - RT) * 2 * u) / (SM - S0);
};
const STRIPE = [-40, -35];
const GLASS = [30, 55];
const BODY = G.bandsOf([[S0, rF(S0)], [S1, 0]], [STRIPE[0], STRIPE[1], -33.6, -32.4, GLASS[0], GLASS[1]], FUS, P, { radius: rF, slope: dF, rows: 6 });
const surf = (s, angle, lift = 0.05) => G.pointOf(FUS, s, rF(s) + lift, angle);
const VIEW_PHI = Math.atan2(G.dot3(V, FUS.v), G.dot3(V, FUS.u));

// A closed outline on the fuselage skin, a rounded rectangle in (s, angle).
function skinLoop(s0, s1, a0, a1, round = 2.2) {
  const pts = [];
  const rr = Math.min(round, (s1 - s0) / 2);
  const ra = Math.min(round / RM, (a1 - a0) / 2);
  const corner = (cs, ca, from) => {
    for (let i = 0; i <= 5; i++) {
      const t = from + (i / 5) * (Math.PI / 2);
      pts.push(surf(cs + Math.cos(t) * rr, ca + Math.sin(t) * ra));
    }
  };
  corner(s1 - rr, a1 - ra, 0);
  corner(s0 + rr, a1 - ra, Math.PI / 2);
  corner(s0 + rr, a0 + ra, Math.PI);
  corner(s1 - rr, a0 + ra, (3 * Math.PI) / 2);
  return k.pathOf(pts.map(at), true);
}
const glassFill = (d) => ac("glass", `<path class="av-glass" d="${d}"/>`);

function fuselage() {
  const out = [];
  BODY.bands.forEach((band, index) => {
    const mid = (band.s0 + band.s1) / 2;
    const isStripe = (band.s0 >= STRIPE[0] - 1e-6 && band.s1 <= STRIPE[1] + 1e-6) || (band.s0 >= -33.6 - 1e-6 && band.s1 <= -32.4 + 1e-6);
    const isGlass = band.s0 >= GLASS[0] - 1e-6 && band.s1 <= GLASS[1] + 1e-6;
    let inner = band.seam ? L(band.seam, { tone: isGlass ? "mid" : "faint" }) : "";
    if (band.s0 <= -20 && band.s1 >= 20) {
      // cabin: a door with its window, two side windows and a hatch seam
      const door = skinLoop(-24, -6, -0.62, 0.72, 2.4);
      const doorWin = skinLoop(-21, -9, 0.02, 0.6, 1.8);
      const win1 = skinLoop(-2, 11, 0.04, 0.58, 2);
      const win2 = skinLoop(14, 26, 0.04, 0.58, 2);
      inner += glassFill(doorWin + win1 + win2) + L(door, { tone: "lo" }) + L(doorWin + win1 + win2, { tone: "mid" });
      inner += L(skinLoop(-17, -13, -0.3, -0.18, 0.5), { tone: "lo" });
      // a charge-port flap low on the side behind the door
      inner += L(skinLoop(-31, -27, -0.42, -0.2, 0.8), { tone: "faint" });
    }
    if (band.s0 <= -60 && band.s1 >= -60) {
      inner += L(G.arcOf(FUS, -60, rF(-60), P, { slope: dF(-60) }), { tone: "faint" });
      inner += L(skinLoop(-70, -62, -0.25, 0.25, 1.2), { tone: "faint" });
    }
    let svg = S(band.paths, { tone: "hi", inner });
    if (isStripe) svg = ac("ice", svg);
    else if (isGlass) svg = ac("glass", S(band.paths, { tone: "hi", inner: inner + L(glassFrames(), { tone: "mid" }) }));
    put("craft.fuselage", G.pointOf(FUS, mid, 0, 0), svg, [{ ...A.solid(FUS, band.profile, { radius: rF }), ground: true, name: `craft.fuselage.${index}` }]);
  });
  const sides = BODY.sidesOf(S0, S1, { ends: "first" });
  put("craft.fuselage-outline", G.pointOf(FUS, 0, 0, 0), L(sides.d, { tone: "hi" }), sides.points.map((points) => ({ ...A.tube(points, 0.4 / KS), ground: true })), 60);
  return out.join("");
}
// window frames on the glass band: posts across it at a few angles
function glassFrames() {
  const out = [];
  for (const ang of [-0.5, 0.35, 1.15]) {
    const f = G.facingOf(FUS, ang, P, dF(GLASS[0]));
    if (f < 0.15) continue;
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const s = GLASS[0] + ((GLASS[1] - GLASS[0]) * i) / 12;
      pts.push(at(surf(s, ang, 0.02)));
    }
    out.push(k.pathOf(pts));
  }
  return out.join("");
}

// ---------- belly fairing, gear legs and skids ----------
const BELLY = { x: C[0] - 9, y: C[1] - 26, w: 18, d: 48, r: 6 };
const BELLY_Z0 = ZF - 20;
const BELLY_Z1 = ZF - 9;
const SKID_Z = BELLY_Z0 - 13;
const SKID_R = 1.7;
const SKID_S = [-36, 40];
function gear() {
  const fusShapes = R.solids.filter((s) => (s.name ?? "").startsWith("craft.fuselage."));
  put("craft.belly", [C[0], C[1], BELLY_Z0 + 3], S(k.slabOf(BELLY, BELLY_Z0, BELLY_Z1 - BELLY_Z0, P, 6, 0.5), { tone: "mid", inner: L(k.sideSeam(BELLY, BELLY_Z0 + 3.5, P, 6), { tone: "faint" }) }), [
    { ...A.slab(BELLY, BELLY_Z0, BELLY_Z1 - BELLY_Z0), seated: true, cut: fusShapes },
  ]);
  // two skids: turned tubes with rounded ends and an upturned toe cap
  const skidR = (s) => {
    const e = 2.4;
    if (s < SKID_S[0] + e) return SKID_R * Math.sqrt(Math.max(0, 1 - ((SKID_S[0] + e - s) / e) ** 2));
    if (s > SKID_S[1] - e) return SKID_R * Math.sqrt(Math.max(0, 1 - ((s - SKID_S[1] + e) / e) ** 2));
    return SKID_R;
  };
  const skidD = (s) => {
    const e = 2.4;
    if (s < SKID_S[0] + e) {
      const t = Math.min(0.995, (SKID_S[0] + e - s) / e);
      return (SKID_R * t) / (e * Math.sqrt(1 - t * t));
    }
    if (s > SKID_S[1] - e) {
      const t = Math.min(0.995, (s - SKID_S[1] + e) / e);
      return (-SKID_R * t) / (e * Math.sqrt(1 - t * t));
    }
    return 0;
  };
  const knots = Array.from({ length: 25 }, (_, i) => {
    const s = SKID_S[0] + ((SKID_S[1] - SKID_S[0]) * i) / 24;
    return [s, skidR(s)];
  });
  const prof = [[SKID_S[0], 0], ...[0.3, 0.8, 1.4, 2, 2.4].map((d) => [SKID_S[0] + d, skidR(SKID_S[0] + d), 1]), ...[2.4, 2, 1.4, 0.8, 0.3].map((d) => [SKID_S[1] - d, skidR(SKID_S[1] - d), 1]), [SKID_S[1], 0]];
  for (const side of [-1, 1]) {
    const F = G.frameOf([C[0] + side * SKID_X, C[1], SKID_Z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    const legs = [-16, 18];
    // leg plates: flat struts from the belly down to the skid, splayed outward
    for (const ly of legs) {
      const LF = G.frameOf([C[0], C[1] + ly - 1.4, 0], [0, 1, 0], [side, 0, 0], [0, 0, 1]);
      const top = BELLY_Z0;
      const bot = SKID_Z + Math.sqrt(SKID_R ** 2 - 0.9 ** 2);
      const poly = [[4.5, top], [8.2, top], [SKID_X + 0.9, bot], [SKID_X - 0.9, bot]];
      put("craft.leg", [C[0] + side * 10, C[1] + ly, (top + bot) / 2], S(G.prismOf(LF, poly, 0, 2.8, P), { tone: "mid" }), [A.prism(LF, poly, 0, 2.8)]);
    }
    put("craft.skid", [C[0] + side * SKID_X, C[1] + 2, SKID_Z], S(G.lathe(prof, F, P, { steps: 24, smooth: { slope: skidD, radius: skidR, rows: 2 } }), { tone: "hi", inner: L(G.arcOf(F, SKID_S[1] - 7, SKID_R, P), { tone: "faint" }) + L(G.arcOf(F, SKID_S[0] + 6, SKID_R, P), { tone: "faint" }) }), [A.lathe(F, prof, { radius: skidR })], -1);
    void knots;
  }
  // chin sensor: a small ball under the nose, touching the skin
  const sc = [C[0], C[1] + 40, ZF - rF(40) - 2.6];
  put("craft.sensor", sc, S(G.sphereOf(sc, 2.6, P, { steps: 36 }), { tone: "mid" }), [A.ball(sc, 2.6)]);
}

// ---------- wing, pylon, booms ----------
const WING_RING = [[-127, 10], [-130.5, 7], [-130.5, -7], [-127.5, -10], [127.5, -10], [130.5, -7], [130.5, 7], [127, 10], [0, 14]].map(([x, y]) => [C[0] + x, C[1] + y]);
function wing() {
  const fusShapes = R.solids.filter((s) => (s.name ?? "").startsWith("craft.fuselage."));
  const pylon = { x: C[0] - 4, y: C[1] - 12, w: 8, d: 26, r: 3 };
  const pz0 = ZF + RM - 0.6;
  put("craft.pylon", [C[0], C[1], pz0 + 1], S(k.slabOf(pylon, pz0, WING_Z0 - pz0, P, 3), { tone: "mid" }), [{ ...A.slab(pylon, pz0, WING_Z0 - pz0, {}, 3), seated: true, cut: fusShapes }]);
  // wing top: flap hinge lines and flap divisions, an access panel over the root
  const z = WING_Z1;
  const hingeY = C[1] - 5;
  const xAt = (y) => 130.5; // tips are straight between their chamfers
  const lines = [];
  for (const side of [-1, 1]) {
    lines.push(k.lineOnTop([C[0] + side * 8, hingeY], [C[0] + side * xAt(hingeY), hingeY], z, P));
    for (const fx of [8, 50, 92]) lines.push(k.lineOnTop([C[0] + side * fx, hingeY], [C[0] + side * fx, C[1] - 10], z, P));
  }
  lines.push(k.lineOnTop([C[0] - 8, hingeY], [C[0] + 8, hingeY], z, P));
  const panel = { x: C[0] - 10, y: C[1] - 1, w: 20, d: 9, r: 1.5 };
  const svg = S(k.extrude(WING_RING, WING_Z0, WING_T, P, { bevel: 0.6 }), { tone: "hi", inner: L(k.ringSeam(WING_RING, WING_Z0 + 1.2, P), { tone: "faint" }) }) +
    L(lines.join(""), { tone: "lo" }) +
    L(k.planOutline(panel, z, P, 3), { tone: "faint" }) +
    D(k.corners(panel, 1.6).map(([x, y]) => at([x, y, z])), { size: 0.4 });
  put("craft.wing", [C[0], C[1], WING_Z0], svg, [A.extruded(WING_RING, WING_Z0, WING_T)], 2);
  // wing-tip nav lights: lenses on the tip faces, the moment's echo
  for (const side of [-1, 1]) {
    const c = [C[0] + side * (130.5 + 1.3), C[1], WING_Z0 + WING_T / 2];
    put("craft.navlight", c, ac("ice", S(G.sphereOf(c, 1.5, P, { steps: 28 }), { tone: "hi", lit: true })) + a.amBlink(ac("lamp", D([at(c)], { size: 1.6, tone: "hi" })), { period: 1800, delay: side > 0 ? 0 : 900, min: 0.1 }), [A.ball(c, 1.5)]);
  }
  // booms
  for (const side of [-1, 1]) {
    const x = C[0] + side * BOOM_X;
    const F = G.frameOf([x, C[1], BOOM_Z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    const end = Math.sqrt(NAC_R ** 2 - BOOM_R ** 2);
    const s0 = POD_REAR + end;
    const s1 = POD_FRONT - end;
    const seams = [s0 + 8, -18, 20, s1 - 8].map((s) => G.arcOf(F, s, BOOM_R, P)).join("");
    put("craft.boom", [x, C[1], BOOM_Z], S(G.disc(s0, s1, BOOM_R, F, P), { tone: "hi", inner: L(seams, { tone: "faint" }) }), [A.disc(F, s0, s1, BOOM_R)]);
  }
}

// ---------- rotor pods ----------
const PODS = [
  { x: C[0] + BOOM_X, y: C[1] + POD_FRONT, kind: "boom", turn: 0.35, period: 560, reverse: false, delay: 0 },
  { x: C[0] - BOOM_X, y: C[1] + POD_FRONT, kind: "boom", turn: 1.2, period: 640, reverse: true, delay: 300 },
  { x: C[0] + BOOM_X, y: C[1] + POD_REAR, kind: "boom", turn: 0.9, period: 600, reverse: true, delay: 700 },
  { x: C[0] - BOOM_X, y: C[1] + POD_REAR, kind: "boom", turn: 0.1, period: 520, reverse: false, delay: 500 },
  { x: C[0] + TIP_X, y: C[1], kind: "tip", turn: 1.6, period: 500, reverse: false, delay: 200 },
  { x: C[0] - TIP_X, y: C[1], kind: "tip", turn: 0.6, period: 680, reverse: true, delay: 900 },
];
function pod(p) {
  const { x, y, kind } = p;
  let z0;
  let z1;
  if (kind === "boom") {
    z0 = BOOM_Z - 10.5;
    z1 = WING_Z1 + 3;
    const F = vframe(x, y, z0);
    const h = z1 - z0;
    const prof = [[0, 0.1], [0.5, 2.6, 1], [1.6, 4.3, 1], [3.2, 5.4, 1], [5.2, 6.05, 1], [7, NAC_R], [h, NAC_R]];
    const seam = G.arcOf(F, h - 4, NAC_R, P);
    const vents = G.ribsOf(F, h - 3.2, h - 0.8, NAC_R, 18, P, { fade: [0.1, 0.55] });
    put("craft.nacelle", [x, y, (z0 + z1) / 2], S(G.solidOf(prof, F, P, { steps: 32, smooth: { rows: 2 } }), { tone: "hi", inner: L(seam, { tone: "faint" }) + k.fadedSvg(vents, { tone: "lo" }) }), [A.solid(F, prof)]);
  } else {
    z0 = WING_Z1;
    z1 = WING_Z1 + 6.5;
    put("craft.nacelle", [x, y, z0 + 3], S(k.cylinder(x, y, 5.6, z0, z1 - z0, P, 40, 0.4), { tone: "hi", inner: L(k.sideArc(x, y, 5.6, z0 + 2.4, P, 32), { tone: "faint" }) }), [A.cylinder(x, y, 5.6, z0, z1 - z0)]);
  }
  // motor bell, blades, hub and spinner
  const mb = z1;
  put("craft.motor", [x, y, mb + 1], S(k.cylinder(x, y, 5, mb, 2.2, P, 28, 0.3), { tone: "mid", inner: L(k.knurl(x, y, 5, mb + 0.3, mb + 1.9, 18, P), { tone: "lo" }) }), [A.cylinder(x, y, 5, mb, 2.2)]);
  const bz = mb + 2.2;
  const r1 = kind === "tip" ? ROTOR_R - 3 : ROTOR_R;
  // a finished spinning rotor (blur disc, blade thickness, trailing ghosts) in the slot the
  // static blades had; recorded for the audit as the thin disc it sweeps
  const tipR = r1 + 0.9;
  const spin = ac("carbon", a.amRotor([x, y, bz + 0.8], [1, 0, 0], [0, 1, 0], P, { count: 3, r0: 2.4, r1, chord: 3.6, tip: 1.6, sweep: 0.1, period: p.period, reverse: p.reverse, delay: p.delay, thickness: 0.7 }));
  put("craft.rotor", [x, y, bz + 0.4], spin, [A.cylinder(x, y, tipR, bz, 0.8)]);
  const hz = bz + 0.8;
  put("craft.hub", [x, y, hz + 0.8], S(k.cylinder(x, y, 3.2, hz, 1.6, P, 20, 0.3), { tone: "mid" }), [A.cylinder(x, y, 3.2, hz, 1.6)]);
  const SF = vframe(x, y, hz + 1.6);
  const dome = Array.from({ length: 9 }, (_, i) => {
    const t = (i / 8) * (Math.PI / 2);
    return [3.6 * Math.sin(t), 2.8 * Math.cos(t), i > 0 && i < 8 ? 1 : 0];
  });
  const domeR = (s) => 2.8 * Math.sqrt(Math.max(0, 1 - (s / 3.6) ** 2));
  const domeD = (s) => {
    const t = Math.min(0.995, s / 3.6);
    return (-2.8 * t) / (3.6 * Math.sqrt(1 - t * t));
  };
  const cone = [[0, 2.8], [1.3, 2.5], [2.5, 1.75], [3.3, 0.85], [3.6, 0]];
  put("craft.spinner", [x, y, hz + 3], S(G.solidOf(cone, SF, P, { steps: 20 }), { tone: "hi", crease: "none" }), [A.solid(SF, cone)]);
}

// ---------- tail: fin, tailplane, end plates and a strobe ----------
function tail() {
  const fusShapes = R.solids.filter((s) => (s.name ?? "").startsWith("craft.fuselage."));
  const T = 2.4;
  const F = G.frameOf([C[0] - T / 2, C[1], 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const zb = (s) => ZF + rF(s) - 0.2;
  const top = ZF + 38;
  const poly = [[-50, zb(-50)], [-79, zb(-79)], [-92, top], [-80, top]];
  put("craft.fin", [C[0], C[1] - 75, ZF + 26], S(G.prismOf(F, poly, 0, T, P), { tone: "hi", inner: L(k.segment([C[0] + T / 2, C[1] - 70, zb(-50) + ((zb(-79) - zb(-50)) * 20) / 29], [C[0] + T / 2, C[1] - 85, top], P), { tone: "faint" }) }), [{ ...A.prism(F, poly, 0, T), seated: true, cut: fusShapes }]);
  const stab = [[-34, -93], [34, -93], [34, -86], [10, -79], [-10, -79], [-34, -86]].map(([x, y]) => [C[0] + x, C[1] + y]);
  put("craft.tailplane", [C[0], C[1] - 86, top + 1], S(k.extrude(stab, top, 2, P, { bevel: 0.4 }), { tone: "hi", inner: L(k.ringSeam(stab, top + 0.8, P), { tone: "faint" }) }) + L(k.onTop([[C[0] - 34, C[1] - 89.5], [C[0] + 34, C[1] - 89.5]], top + 2, P), { tone: "lo" }), [A.extruded(stab, top, 2)], 1);
  for (const side of [-1, 1]) {
    const EF = G.frameOf([C[0] + side * 34 + (side > 0 ? 0 : -1.6), C[1], 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    const plate = [[-86, top - 5], [-93, top - 3], [-95, top + 8], [-89, top + 8]];
    put("craft.endplate", [C[0] + side * 35, C[1] - 90, top + 2], ac("ice", S(G.prismOf(EF, plate, 0, 1.6, P), { tone: "hi" })), [A.prism(EF, plate, 0, 1.6)], 2);
  }
  const sc = [C[0], C[1] - 86, top + 2 + 1.1];
  put("craft.strobe", sc, S(G.sphereOf(sc, 1.1, P, { steps: 24 }), { tone: "hi" }) + a.amBlink(ac("lamp", D([at(sc)], { size: 1.3, tone: "hi" })), { period: 2600, delay: 400, min: 0.1 }), [A.ball(sc, 1.1)], 3);
  // a blade antenna on the cabin roof
  const AF = G.frameOf([C[0] - 0.6, C[1], 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const ant = [[-22, ZF + rF(-22) - 0.2], [-30, ZF + rF(-30) - 0.2], [-33, ZF + rF(-30) + 6], [-29, ZF + rF(-30) + 6]];
  put("craft.antenna", [C[0], C[1] - 27, ZF + RM + 2], S(G.prismOf(AF, ant, 0, 1.2, P), { tone: "mid" }), [{ ...A.prism(AF, ant, 0, 1.2), seated: true, cut: fusShapes }]);
}

// ---------- build the aircraft ----------
fuselage();
gear();
wing();
PODS.forEach(pod);
// the booms end with their rims on the nacelle walls: their end faces sit inside the pods
{
  const nacelles = R.solids.filter((sh) => (sh.name ?? "").startsWith("craft.nacelle"));
  for (const sh of R.solids) if ((sh.name ?? "").startsWith("craft.boom")) Object.assign(sh, { seated: true, cut: nacelles });
}
tail();
A.settle(R, PA);
R.items.sort((p, q) => p.key - q.key);
const craftSvg = R.items.map((item) => item.svg).join("");
P = PR;

// ======================================================================================
// the rooftop and the pad (static, painted back to front by hand, recorded as the stand)
// ======================================================================================
const back = [];
const front = [];

// building top
back.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(ROOF, -4), ROOF_Z0, 6, P)}"/>`);
{
  const seams = L(k.sideSeam(ROOF, -7, P, 2), { tone: "lo" }) + L(k.sideSeam(ROOF, -10, P, 2), { tone: "faint" });
  back.push(S(k.slabOf(ROOF, ROOF_Z0, -ROOF_Z0, P, 2, 0), { tone: "lo", inner: seams }));
  stand(A.slab(ROOF, ROOF_Z0, -ROOF_Z0, {}, 2), "roof");
  // the top storey's glazing: wide windows with a mullion each and a sill below
  const wins = [];
  const mull = [];
  const sills = [];
  const xFace = ROOF.x + ROOF.w;
  const yFace = ROOF.y + ROOF.d;
  const [W0, W1] = [-23, -13];
  const quad = (pts) => k.pathOf(pts.map(at), true);
  const WW = 38;
  const STEP = 54;
  const first = (len) => (len - (Math.floor((len - WW) / STEP) * STEP + WW)) / 2;
  for (let y = ROOF.y + first(ROOF.d); y + WW <= ROOF.y + ROOF.d - 6; y += STEP) {
    wins.push(quad([[xFace, y, W0], [xFace, y + WW, W0], [xFace, y + WW, W1], [xFace, y, W1]]));
    mull.push(k.segment([xFace, y + WW / 2, W0], [xFace, y + WW / 2, W1], P));
    sills.push(quad([[xFace, y - 2, W0 - 0.4], [xFace, y + WW + 2, W0 - 0.4], [xFace, y + WW + 2, W0 - 1.8], [xFace, y - 2, W0 - 1.8]]));
  }
  for (let x = ROOF.x + first(ROOF.w); x + WW <= ROOF.x + ROOF.w - 6; x += STEP) {
    wins.push(quad([[x, yFace, W0], [x + WW, yFace, W0], [x + WW, yFace, W1], [x, yFace, W1]]));
    mull.push(k.segment([x + WW / 2, yFace, W0], [x + WW / 2, yFace, W1], P));
    sills.push(quad([[x - 2, yFace, W0 - 0.4], [x + WW + 2, yFace, W0 - 0.4], [x + WW + 2, yFace, W0 - 1.8], [x - 2, yFace, W0 - 1.8]]));
  }
  back.push(ac("glass", `<path class="av-glass-dim" d="${wins.join("")}"/>`) + L(wins.join(""), { tone: "mid" }) + L(mull.join(""), { tone: "lo" }) + L(sills.join(""), { tone: "lo" }));
}

// roof membrane seams, drains and a paver walk
{
  const z = 0;
  const lines = [];
  for (let x = ROOF.x + PARAPET_T + 40; x < ROOF.x + ROOF.w - PARAPET_T; x += 48) lines.push(k.lineOnTop([x, ROOF.y + PARAPET_T], [x, ROOF.y + ROOF.d - PARAPET_T], z, P));
  back.push(L(lines.join(""), { tone: "faint" }));
}

// parapets: far walls first
const PAR = {
  north: { x: ROOF.x, y: ROOF.y, w: ROOF.w, d: PARAPET_T, r: 0.5 },
  west: { x: ROOF.x, y: ROOF.y + PARAPET_T, w: PARAPET_T, d: ROOF.d - PARAPET_T, r: 0.5 },
  east: { x: ROOF.x + ROOF.w - PARAPET_T, y: ROOF.y + PARAPET_T, w: PARAPET_T, d: ROOF.d - 2 * PARAPET_T, r: 0.5 },
  south: { x: ROOF.x + PARAPET_T, y: ROOF.y + ROOF.d - PARAPET_T, w: ROOF.w - PARAPET_T, d: PARAPET_T, r: 0.5 },
};
function parapet(plan, name) {
  const out = S(k.slabOf(plan, 0, PARAPET_H, P, 2, 0), { tone: "mid" });
  const cope = k.insetPlan(plan, -0.8);
  stand(A.slab(plan, 0, PARAPET_H, {}, 2), `parapet.${name}`);
  return out + S(k.slabOf(cope, PARAPET_H, 1.4, P, 2, 0.3), { tone: "hi" });
}
back.push(parapet(PAR.north, "north"), parapet(PAR.west, "west"));
// a guard rail on the far parapets
function guardRail(points) {
  const out = [];
  const z0 = PARAPET_H + 1.4;
  const posts = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1] = [points[i], points[i + 1]];
    const n = Math.max(1, Math.round(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 64));
    for (let j = 0; j <= n; j++) {
      if (i > 0 && j === 0) continue;
      posts.push([p0[0] + ((p1[0] - p0[0]) * j) / n, p0[1] + ((p1[1] - p0[1]) * j) / n]);
    }
  }
  for (const [x, y] of byDepth(posts, ([x, y]) => [x, y, 0])) out.push(S(k.cylinder(x, y, 0.9, z0, 13, P, 12), { tone: "mid" }));
  // two rails, each a thin bar resting on the posts
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1] = [points[i], points[i + 1]];
    const along = [p1[0] - p0[0], p1[1] - p0[1]];
    const len = Math.hypot(...along);
    const n = [-along[1] / len, along[0] / len];
    const bar = [[p0[0] + n[0] * 0.9, p0[1] + n[1] * 0.9], [p1[0] + n[0] * 0.9, p1[1] + n[1] * 0.9], [p1[0] - n[0] * 0.9, p1[1] - n[1] * 0.9], [p0[0] - n[0] * 0.9, p0[1] - n[1] * 0.9]];
    out.push(S(k.extrude(bar, z0 + 13, 1.2, P), { tone: "hi" }));
  }
  return out.join("");
}
back.push(guardRail([[ROOF.x + ROOF.w - 12, ROOF.y + 3], [ROOF.x + 3, ROOF.y + 3], [ROOF.x + 3, ROOF.y + ROOF.d - 12]]));

// windsock in the far corner
function windsock() {
  const out = [];
  const [mx, my] = [ROOF.x + 16, ROOF.y + ROOF.d - 16];
  const top = 86;
  out.push(S(k.slabOf({ x: mx - 7, y: my - 7, w: 14, d: 14, r: 1 }, 0, 1.6, P, 2, 0.3), { tone: "lo" }));
  out.push(D(k.corners({ x: mx - 7, y: my - 7, w: 14, d: 14 }, 2).map(([x, y]) => at([x, y, 1.6])), { size: 0.45 }));
  out.push(S(k.cylinder(mx, my, 2.6, 1.6, 6, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(mx, my, 1.4, 7.6, top - 7.6, P, 16), { tone: "mid", inner: L(k.sideArc(mx, my, 1.4, 40, P, 12), { tone: "faint" }) }));
  stand(A.cylinder(mx, my, 1.4, 1.6, top - 1.6), "windsock.mast");
  out.push(S(k.cylinder(mx, my, 2.2, top, 3.2, P, 20, 0.3), { tone: "hi" }));
  // the sock: a turned cone along the wind, banded in ice and neutral
  const dir = G.unit3([-0.5, 0.82, -0.12]);
  const o = [mx, my, top + 1.6];
  const F = G.frameAlong(G.add3(o, G.mul3(dir, 2.2)), dir);
  const sockR = (s) => 4.6 - s * 0.085;
  const sockD = () => -0.085;
  const SB = G.bandsOf([[0, sockR(0)], [30, sockR(30)]], [6, 12, 18, 24], F, P, { radius: sockR, slope: sockD, rows: 3 });
  // the hoop the sock hangs from
  const hoop = G.ringBand(-0.5, 0.6, 4.4, 5.2, F, P);
  out.push(S(hoop, { tone: "hi" }));
  stand(A.ring(F, -0.5, 0.6, 4.4, 5.2), "windsock.hoop");
  SB.bands.forEach((band, index) => {
    const svg = S(band.paths, { tone: "hi", inner: band.seam ? L(band.seam, { tone: "faint" }) : "" });
    out.push(index % 2 === 0 ? ac("ice", svg) : svg);
    stand(A.solid(F, band.profile, { radius: sockR }), "windsock.sock");
  });
  out.push(L(SB.sidesOf(0, 30, { ends: true }).d, { tone: "hi" }));
  return out.join("");
}

// access hatch and a roof box behind the pad
function hatch(x, y) {
  const base = { x, y, w: 26, d: 22, r: 1 };
  const lid = k.insetPlan(base, -1);
  const out = [S(k.slabOf(base, 0, 8, P, 2, 0.4), { tone: "mid", inner: L(k.sideSeam(base, 3, P, 2), { tone: "faint" }) })];
  out.push(S(k.slabOf(lid, 8, 1.6, P, 2, 0.4), { tone: "hi" }));
  out.push(S(k.slabOf({ x: x + 9, y: y + lid.d - 2, w: 8, d: 1.4, r: 0.4 }, 9.6, 1.2, P, 2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(lid, 2.2), 9.6, P, 2), { tone: "faint" }));
  stand(A.slab(base, 0, 9.6, {}, 2), "hatch");
  return out.join("");
}

// pad legs and cross beams
const LEGS = [];
for (const fx of [0.1, 0.5, 0.9]) for (const fy of [0.1, 0.5, 0.9]) if (fx === 0.9 || fy === 0.9) LEGS.push([PAD.x + PAD.w * fx, PAD.y + PAD.d * fy]);
function padLegs() {
  const out = [];
  for (const [x, y] of byDepth(LEGS, ([x, y]) => [x, y, 0])) {
    const base = { x: x - 6, y: y - 6, w: 12, d: 12, r: 1 };
    out.push(S(k.slabOf(base, 0, 1.4, P, 2, 0.3), { tone: "lo" }));
    out.push(D(k.corners(base, 2).map(([px, py]) => at([px, py, 1.4])), { size: 0.4 }));
    out.push(S(k.slabOf({ x: x - 3, y: y - 3, w: 6, d: 6, r: 0.6 }, 1.4, DECK_Z0 - 1.4, P, 2, 0.3), { tone: "mid" }));
    stand(A.slab({ x: x - 3, y: y - 3, w: 6, d: 6, r: 0.6 }, 0, DECK_Z0, {}, 2), "pad.leg");
  }
  return out.join("");
}

// safety-net trays round the deck, below its top
const TRAY_Z = DECK_Z0 + 1;
const TRAY_W = 12;
const STAIR = { x0: PAD.x + PAD.w, x1: PAD.x + PAD.w + 16, y0: -30, y1: 6 };
const TRAYS = {
  north: [{ x: PAD.x - TRAY_W, y: PAD.y - TRAY_W, w: PAD.w + 2 * TRAY_W, d: TRAY_W, r: 1 }],
  west: [{ x: PAD.x - TRAY_W, y: PAD.y, w: TRAY_W, d: PAD.d + TRAY_W, r: 1 }],
  south: [{ x: PAD.x, y: PAD.y + PAD.d, w: PAD.w + TRAY_W, d: TRAY_W, r: 1 }],
  east: [{ x: PAD.x + PAD.w, y: PAD.y, w: TRAY_W, d: STAIR.y0 - 2 - PAD.y, r: 1 }, { x: PAD.x + PAD.w, y: STAIR.y1 + 2, w: TRAY_W, d: PAD.y + PAD.d - STAIR.y1 - 2, r: 1 }],
};
function tray(plan) {
  const out = [S(k.slabOf(plan, TRAY_Z, 1.4, P, 2, 0), { tone: "mid", crease: "faint" })];
  const inner = k.insetPlan(plan, 1.4);
  out.push(L(k.planOutline(inner, TRAY_Z + 1.4, P, 2), { tone: "lo" }));
  const cols = Math.max(1, Math.floor(inner.w / 3.2));
  const rows = Math.max(1, Math.floor(inner.d / 3.2));
  out.push(D(k.dotGrid(inner.x + (inner.w - (cols - 1) * 3.2) / 2, inner.y + (inner.d - (rows - 1) * 3.2) / 2, cols, rows, 3.2, TRAY_Z + 1.4, P), { size: 0.35, tone: "lo" }));
  stand(A.slab(plan, TRAY_Z, 1.4, {}, 2), "pad.tray");
  return out.join("");
}

// deck and markings
const LIGHTS = [];
{
  const inset = 4.5;
  const n = 4;
  const corners = [[PAD.x + inset, PAD.y + inset], [PAD.x + PAD.w - inset, PAD.y + inset], [PAD.x + PAD.w - inset, PAD.y + PAD.d - inset], [PAD.x + inset, PAD.y + PAD.d - inset]];
  for (let side = 0; side < 4; side++) {
    const [p0, p1] = [corners[side], corners[(side + 1) % 4]];
    for (let i = 0; i < n; i++) LIGHTS.push({ x: p0[0] + ((p1[0] - p0[0]) * i) / n, y: p0[1] + ((p1[1] - p0[1]) * i) / n, order: side * n + i });
  }
}
function deck() {
  const out = [];
  const z = DECK_Z1;
  out.push(S(k.slabOf(PAD, DECK_Z0, DECK_Z1 - DECK_Z0, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(PAD, DECK_Z0 + 2, P, 4), { tone: "faint" }) }));
  stand(A.slab(PAD, DECK_Z0, DECK_Z1 - DECK_Z0, {}, 4), "pad.deck");
  // deck panel joints, edge to edge
  const joints = [];
  for (const f of [0.25, 0.5, 0.75]) {
    joints.push(k.lineOnTop([PAD.x + PAD.w * f, PAD.y], [PAD.x + PAD.w * f, PAD.y + PAD.d], z, P));
    joints.push(k.lineOnTop([PAD.x, PAD.y + PAD.d * f], [PAD.x + PAD.w, PAD.y + PAD.d * f], z, P));
  }
  out.push(L(joints.join(""), { tone: "faint" }));
  // FATO border, the touchdown ring and the H
  out.push(L(k.planOutline(k.insetPlan(PAD, 11), z, P, 4), { tone: "lo" }));
  out.push(ac("led", L(k.ring(PC[0], PC[1], 48, z, P, 120) + k.ring(PC[0], PC[1], 43, z, P, 120), { tone: "mid" })));
  const hRing = [[-14, -20], [-8, -20], [-8, -3], [8, -3], [8, -20], [14, -20], [14, 20], [8, 20], [8, 3], [-8, 3], [-8, 20], [-14, 20]].map(([x, y]) => [PC[0] + x * 0.8, PC[1] + y * 0.8]);
  out.push(S(k.extrude(hRing, z, 0.3, P, { convex: false }), { tone: "hi", flat: true, crease: "none" }));
  // chevrons on the approach side
  for (const dy of [53, 58]) out.push(L(k.onTop([[PC[0] - 8, PC[1] + dy - 4], [PC[0], PC[1] + dy], [PC[0] + 8, PC[1] + dy - 4]], z, P), { tone: "lo", free: true }));
  // corner tie-down rings
  for (const [x, y] of k.corners(PAD, 18)) out.push(L(k.ring(x, y, 2.2, z, P, 16), { tone: "lo" }), D([at([x, y, z])], { size: 0.45 }));
  return out.join("");
}
function edgeLights(list) {
  const out = [];
  for (const l of byDepth(list, (l) => [l.x, l.y, DECK_Z1])) {
    out.push(ac("led", S(k.cylinder(l.x, l.y, 1.8, DECK_Z1, 1.6, P, 14, 0.2), { tone: "mid" })));
    out.push(a.amBlink(ac("led", D([at([l.x, l.y, DECK_Z1 + 1.6])], { size: 1.3, tone: "hi" })), { period: 3600, delay: (l.order / LIGHTS.length) * 3600, min: 0.12 }));
  }
  return out.join("");
}

// the charging bollard, with its cable looped to a connector parked in a holster
function bollard() {
  const out = [];
  const bx = PAD.x + PAD.w - 22;
  const by = PAD.y + 26;
  const z = DECK_Z1;
  const base = { x: bx - 8, y: by - 8, w: 16, d: 16, r: 1.2 };
  const body = { x: bx - 5, y: by - 6, w: 10, d: 12, r: 2 };
  const H1 = 30;
  out.push(S(k.slabOf(base, z, 1.4, P, 2, 0.3), { tone: "lo" }));
  out.push(D(k.corners(base, 1.8).map(([x, y]) => at([x, y, z + 1.4])), { size: 0.4 }));
  out.push(S(k.slabOf(body, z + 1.4, H1, P, 4, 0.5), { tone: "hi", inner: L(k.sideSeam(body, z + 1.4 + H1 - 6, P, 4), { tone: "faint" }) }));
  stand(A.slab(body, z, H1 + 1.4, {}, 4), "bollard.body");
  const capPlan = k.insetPlan(body, -0.8);
  out.push(ac("ice", S(k.slabOf(capPlan, z + 1.4 + H1, 1.6, P, 4, 0.4), { tone: "hi" })));
  const xf = body.x + body.w;
  // a status screen on the +x face
  const scr = [[xf, by - 3.6, z + H1 - 3], [xf, by + 3.6, z + H1 - 3], [xf, by + 3.6, z + H1 - 10], [xf, by - 3.6, z + H1 - 10]];
  out.push(ac("glass", `<path class="av-glass" d="${k.pathOf(scr.map(at), true)}"/>`), L(k.pathOf(scr.map(at), true), { tone: "mid" }));
  out.push(ac("led", L(k.pathOf([[xf, by - 2.4, z + H1 - 6.5], [xf, by + 1.2, z + H1 - 6.5]].map(at)), { tone: "hi", free: true })));
  // port boss with a ball elbow, the cable loop and the connector in its holster
  const portZ = z + 13;
  const portY = by + 3.2;
  const BF = G.frameAlong([xf, portY, portZ], [1, 0, 0]);
  const bossLen = 2.6;
  out.push(S(G.disc(0, bossLen, 1.5, BF, P), { tone: "mid" }));
  const BALL = 1.9;
  const ballC = [xf + bossLen + Math.sqrt(BALL ** 2 - 1.5 ** 2), portY, portZ];
  out.push(S(G.sphereOf(ballC, BALL, P, { steps: 32 }), { tone: "hi" }));
  const elbow = stand(A.ball(ballC, BALL), "bollard.elbow");
  stand({ ...A.disc(BF, 0, bossLen, 1.5), seated: true, cut: [elbow] }, "bollard.boss");
  const CR = 0.85;
  const start = G.add3(ballC, [0, 0, -Math.sqrt(BALL ** 2 - CR ** 2)]);
  const conY = by - 3.2;
  const conZ0 = z + 16;
  const xc = ballC[0];
  const route = G.fillet([start, [xc, portY, z + 4.5], [xc, conY, z + 4.5], [xc, conY, conZ0]], 3.2, 12, { P, tube: CR });
  RR.route("stand.cable", route, CR, { limp: true });
  const holster = { x: xf, y: conY - 2.6, w: xc - 1.9 - xf, d: 5.2, r: 0.5 };
  out.push(S(k.slabOf(holster, conZ0 + 1, 6, P, 2, 0.3), { tone: "mid" }));
  stand(A.slab(holster, conZ0 + 1, 6, {}, 2), "bollard.holster");
  for (const piece of tubePieces(route, CR, P, { maxLength: 40, spacing: 1 }).sort((p, q) => G.dot3(p.mid, V) - G.dot3(q.mid, V))) out.push(tubeSvg(piece, { tone: "mid" }));
  const CF = vframe(xc, conY, conZ0);
  const con = [[0, 1.3], [1.4, 1.9], [7.5, 1.9], [8.4, 1.4], [8.4, 0]];
  out.push(S(G.lathe([[0, 0], ...con], CF, P, { steps: 28 }), { tone: "hi", inner: L(G.arcOf(CF, 3, 1.9, P) + G.arcOf(CF, 5.5, 1.9, P), { tone: "faint" }) }));
  out.push(ac("led", D([at([xc, conY, conZ0 + 8.4])], { size: 0.8, tone: "hi" })));
  stand(A.lathe(CF, [[0, 0], ...con]), "bollard.connector");
  return out.join("");
}

// the stair from the roof up to the deck, on the pad's +x side
function stair() {
  const out = [];
  const N = 6;
  const rise = DECK_Z1 / N;
  const run = (STAIR.y1 - STAIR.y0) / N;
  const slope = rise / run;
  const T = 1.6;
  const strPoly = [[STAIR.y1, 0], [STAIR.y0, DECK_Z1 - 7], [STAIR.y0, DECK_Z1 + 1], [STAIR.y1, 7]];
  const stringer = (x) => {
    const F = G.frameOf([x, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    stand(A.prism(F, strPoly, 0, T), "stair.stringer");
    return S(G.prismOf(F, strPoly, 0, T, P), { tone: "mid" });
  };
  out.push(stringer(STAIR.x0));
  for (let i = N - 1; i >= 1; i--) {
    const plan = { x: STAIR.x0 + T, y: STAIR.y1 - run * i, w: STAIR.x1 - STAIR.x0 - 2 * T, d: run, r: 0.4 };
    const top = rise * i;
    out.push(S(k.slabOf(plan, top - 1.2, 1.2, P, 2, 0.3), { tone: "hi" }));
    out.push(L(k.lineOnTop([plan.x, plan.y + plan.d - 1.4], [plan.x + plan.w, plan.y + plan.d - 1.4], top, P), { tone: "lo" }));
  }
  out.push(stringer(STAIR.x1 - T));
  // a handrail on the outer stringer: posts and a sloped rail
  const rx = STAIR.x1 - T / 2;
  const edge = (y) => 7 + (STAIR.y1 - y) * slope * ((DECK_Z1 + 1 - 7) / ((STAIR.y1 - STAIR.y0) * slope));
  const RH = 16;
  const postsY = [STAIR.y1 - 4, (STAIR.y0 + STAIR.y1) / 2, STAIR.y0 + 3];
  const railA = [rx, postsY[0], edge(postsY[0]) + RH];
  const railB = [rx, postsY[2], edge(postsY[2]) + RH];
  for (const y of postsY) {
    const zb = edge(y);
    const zt = railA[2] + ((railB[2] - railA[2]) * (y - postsY[0])) / (postsY[2] - postsY[0]) - 0.9;
    out.push(S(k.cylinder(rx, y, 0.8, zb - 0.3, zt - zb + 0.3, P, 12), { tone: "mid" }));
  }
  const axis = G.unit3(G.sub3(railB, railA));
  const len = G.len3(G.sub3(railB, railA));
  const RF = G.frameAlong(railA, axis);
  out.push(S(G.disc(-2, len + 2, 0.9, RF, P), { tone: "hi" }));
  return out.join("");
}

// rooftop plant in front of the pad: an HVAC unit, vents and a duct
function hvac() {
  const out = [];
  const box = { x: 58, y: 30, w: 30, d: 42, r: 1.5 };
  const h = 20;
  out.push(S(k.slabOf({ x: box.x - 2, y: box.y - 2, w: box.w + 4, d: box.d + 4, r: 1 }, 0, 2, P, 2, 0.3), { tone: "lo" }));
  const louvres = [];
  for (let z = 5; z <= 15; z += 2.5) louvres.push(k.segment([box.x + box.w, box.y + 3, z], [box.x + box.w, box.y + box.d - 3, z], P));
  for (let z = 5; z <= 15; z += 2.5) louvres.push(k.segment([box.x + 3, box.y + box.d, z], [box.x + 23, box.y + box.d, z], P));
  const louvreFrames = k.pathOf([[box.x + box.w, box.y + 3, 3.5], [box.x + box.w, box.y + box.d - 3, 3.5], [box.x + box.w, box.y + box.d - 3, 16.5], [box.x + box.w, box.y + 3, 16.5]].map(at), true) + k.pathOf([[box.x + 3, box.y + box.d, 3.5], [box.x + 23, box.y + box.d, 3.5], [box.x + 23, box.y + box.d, 16.5], [box.x + 3, box.y + box.d, 16.5]].map(at), true);
  const panelLine = k.segment([box.x + 30, box.y + box.d, 2], [box.x + 30, box.y + box.d, 2 + h], P);
  out.push(S(k.slabOf(box, 2, h, P, 2, 0.6), { tone: "mid", inner: L(louvreFrames, { tone: "lo" }) + L(panelLine, { tone: "faint" }) }));
  out.push(L(louvres.join(""), { tone: "faint" }));
  stand(A.slab(box, 0, h + 2, {}, 2), "hvac");
  const z = 2 + h;
  for (const [fx, fy] of byDepth([[box.x + 15, box.y + 11], [box.x + 15, box.y + 31]], ([x, y]) => [x, y, z])) {
    out.push(S(k.cylinder(fx, fy, 9.4, z, 2, P, 48, 0.4), { tone: "hi" }));
    out.push(L(k.ring(fx, fy, 8, z + 2, P, 48) + k.ring(fx, fy, 6, z + 2, P, 40) + k.ring(fx, fy, 4, z + 2, P, 32), { tone: "lo" }));
    const spokes = [];
    for (let i = 0; i < 4; i++) {
      const t = (i / 4) * Math.PI + 0.3;
      spokes.push(k.lineOnTop([fx + Math.cos(t) * 2, fy + Math.sin(t) * 2], [fx + Math.cos(t) * 8, fy + Math.sin(t) * 8], z + 2, P));
      spokes.push(k.lineOnTop([fx - Math.cos(t) * 2, fy - Math.sin(t) * 2], [fx - Math.cos(t) * 8, fy - Math.sin(t) * 8], z + 2, P));
    }
    out.push(L(spokes.join(""), { tone: "faint" }));
    out.push(S(k.cylinder(fx, fy, 2, z + 2, 1.2, P, 16), { tone: "mid" }));
  }
  out.push(D(k.corners(box, 3).map(([x, y]) => at([x, y, z])), { size: 0.45 }));
  return out.join("");
}
function vent(x, y, h = 10) {
  return [
    S(k.cylinder(x, y, 4.2, 0, 1.2, P, 20), { tone: "lo" }),
    S(k.cylinder(x, y, 2.4, 1.2, h, P, 20), { tone: "mid", inner: L(k.sideArc(x, y, 2.4, h * 0.5, P, 16), { tone: "faint" }) }),
    S(k.cylinder(x, y, 4.4, h + 1.2, 1.6, P, 24, 0.3), { tone: "hi" }),
    S(k.cylinder(x, y, 2.8, h + 2.8, 1.4, P, 20, 0.3), { tone: "hi" }),
  ].join("");
}
function pavers() {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const plan = { x: STAIR.x0 + 1, y: STAIR.y1 + 4 + i * 13, w: 14, d: 10, r: 0.6 };
    out.push(S(k.slabOf(plan, 0, 0.8, P, 2, 0.2), { tone: "mid" }));
  }
  return out.join("");
}

// ---------- assemble the stand ----------
back.push(padLegs());
for (const t of TRAYS.north) back.push(tray(t));
for (const t of TRAYS.west) back.push(tray(t));
back.push(deck());
back.push(edgeLights(LIGHTS));
back.push(bollard());
for (const t of TRAYS.east) back.push(tray(t));
for (const t of TRAYS.south) back.push(tray(t));
back.push(stair());
back.push(vent(4, 70, 11), vent(20, 78, 8));
back.push(hvac());
back.push(windsock());
back.push(parapet(PAR.east, "east"), parapet(PAR.south, "south"));

// the aircraft floats over the pad; its halo stays on the deck
const haloPlan = { x: PC[0] - 40, y: PC[1] - 52, w: 80, d: 104, r: 30 };
const halo = `<path class="iso-halo" d="${k.haloOf(haloPlan, DECK_Z1, 0.1, P)}" style="filter:blur(14px)"/>`;
const body = [...back, a.amFloat(ac("comp", craftSvg), P, { rise: 6, period: 6400, halo })].join("");

const name = light ? "aero-vertiport-light" : "aero-vertiport";
const css = `#${name} .av-glass{fill:var(--anatomy-shade-1);stroke:none}#${name} .av-glass-dim{fill:var(--anatomy-shade-${light ? 3 : 0});stroke:none}`;
const svg = a.assetSvg({
  width: W,
  height: H,
  label: "An isometric electric air taxi with six rotors, a glass nose and an ice-blue livery band, hovering just above a rooftop vertiport: a steel pad with a painted touchdown ring and H, blinking edge lights, safety nets, a charging bollard, a stair, a windsock and rooftop plant.",
  body,
  paper: PAPER,
  accents: {
    ice: ICE,
    led: { hex: ICE, mode: "ink" },
    lamp: { hex: ICE, mode: "ink" },
    comp: light ? "#f3f6f9" : "#c9d2dc",
    glass: light ? "#41566a" : "#173246",
    carbon: light ? "#3a4048" : "#0b0e13",
  },
  weight: 0.8,
  css,
  id: name,
});
writeFileSync(join(HERE, `${name}.svg`), svg);
writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W, safe: SAFE }));
console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB, ${(svg.match(/class="iso-solid/g) || []).length} solids, ${R.items.length} aircraft items) and ${name}.html`);

// a boom's end rim lands on its nacelle's wall; where the wall curves past the rim it is a
// sliver under a pixel and a half, which no key can order (looked at 8x)
if (process.argv.includes("--audit")) console.log("— aircraft —");
A.auditOrExit(R, PA, { allow: [["craft.boom*", "craft.nacelle*"]], ground: (shape) => A.grounded(shape) || Boolean(shape.ground) });
if (process.argv.includes("--audit")) console.log("— rooftop —");
A.auditOrExit(RR, PR);
