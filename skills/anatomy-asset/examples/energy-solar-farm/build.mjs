// A wide section banner for "Halden", a clean-energy company ("Power that renews itself"): a
// utility-scale solar site on a long strip of land, drawn as a diorama slab with a grass top and
// an earth edge. On the left four rows of single-axis tracker panels on piles and a torque tube,
// each row with its slew drive and controller; in the middle an inverter skid; on the right a
// battery yard of four container enclosures and a fenced substation with a transformer; a
// gravel road along the front with a service cart. The moment: one container's status lights
// chase green in sequence; a small inspection drone floats over the panels.
//
//   node build.mjs            light → energy-solar-farm.svg, energy-solar-farm.html
//   node build.mjs --dark     dark  → energy-solar-farm-dark.svg, energy-solar-farm-dark.html
//   node build.mjs --audit    also runs the audit on the recorded shapes

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const dark = process.argv.includes("--dark");
const PAPER = dark ? "#0d100e" : "#f4f3ee";
const GREEN = "#1f8f5f";

const W = 1600;
const H = 560;
const REGION = { x: 40, y: 20, w: 1520, h: 520 };
const AZIMUTH = Number(process.env.AZ ?? 75);
const ELEVATION = Number(process.env.EL ?? 33);

// ---------- world ----------
const GROUND = { x: -588, y: -150, w: 1124, d: 270, r: 14 };
const EARTH_Z = -24;
const GRASS_Z = -4;

const P = a.fitInto(
  [...k.boxCorners(GROUND, EARTH_Z, 0), [-420, -20, 132], [400, -110, 92], [-566, 108, 74]],
  REGION,
  { pad: 6, azimuth: AZIMUTH, elevation: ELEVATION },
);
const V = G.viewOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const ac = (name, svg) => `<g class="ac-${name}">${svg}</g>`;
const slab = (plan, z, h, steps = 2, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel);
const cyl = (x, y, r, z, h, steps = 20, bevel = 0) => k.cylinder(x, y, r, z, h, P, steps, bevel);
const seam = (plan, z, steps = 2) => k.sideSeam(plan, z, P, steps);
const faceY = (y, pts, closed = false) => k.pathOf(pts.map(([x, z]) => at([x, y, z])), closed);
const faceX = (x, pts, closed = false) => k.pathOf(pts.map(([yy, z]) => at([x, yy, z])), closed);
const rect = (u0, z0, u1, z1) => [[u0, z0], [u1, z0], [u1, z1], [u0, z1]];
const slotPts = (u0, u1, zc, h, n = 5) => {
  const r = h / 2;
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + (i / n) * Math.PI; pts.push([u1 - r + Math.cos(t) * r, zc + Math.sin(t) * r]); }
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + (i / n) * Math.PI; pts.push([u0 + r + Math.cos(t) * r, zc + Math.sin(t) * r]); }
  return pts;
};
// A vertical capsule (a handle) centred on (u, zc) in a face plane: width w, height h.
const vslot = (u, zc, w, h, n = 5) => {
  const r = w / 2;
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = (i / n) * Math.PI; pts.push([u + Math.cos(t) * r, zc + h / 2 - r + Math.sin(t) * r]); }
  for (let i = 0; i <= n; i++) { const t = Math.PI + (i / n) * Math.PI; pts.push([u + Math.cos(t) * r, zc - h / 2 + r + Math.sin(t) * r]); }
  return pts;
};
const screwsY = (y, pts, r = 1) =>
  L(pts.map(([x, z]) => k.sideRing([x, y, z], r, "y", P, 12)).join(""), { tone: "mid" }) + D(pts.map(([x, z]) => at([x, y, z])), { size: 0.5 });
const halo = (plan, z, h, blur = 0) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ""}/>`;
const centreOf = (plan, z, h) => [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2];

// ---------- the recorder: every part is an item with its true shape ----------
const R = A.recorder(P);
function put(name, centre, svg, shapes, bias = 0) {
  const id = R.nameFor(name);
  return R.put({ at: centre, bias, svg, name: id, shapes: shapes.map((shape) => R.solid({ ...shape, name: shape.name ?? id })) });
}
// A box part: drawn with slabOf and recorded with the same rounded plan.
function box(name, plan, z, h, { tone = "mid", steps = 2, bevel = 0, inner = "", extra = "", cls = null, lit = false, crease, bias = 0 } = {}) {
  const svg = S(slab(plan, z, h, steps, bevel), { tone, inner, lit, crease }) + extra;
  return put(name, centreOf(plan, z, h), cls ? ac(cls, svg) : svg, [A.slab(plan, z, h, {}, steps)], bias);
}
// A stack of round parts on one vertical axis, bottom to top: [[r, h, tone, steps?]].
function stack(name, x, y, z0, parts, { cls = null, extra = "" } = {}) {
  let z = z0;
  const svg = [];
  const shapes = [];
  for (const [r, h, tone = "mid", steps = 18, inner = ""] of parts) {
    svg.push(S(cyl(x, y, r, z, h, steps), { tone, inner: inner ? inner(z) : "" }));
    shapes.push(A.cylinder(x, y, r, z, h));
    z += h;
  }
  const out = svg.join("") + extra;
  put(name, [x, y, (z0 + z) / 2], cls ? ac(cls, out) : out, shapes);
  return z;
}

// ---------- the ground strip (static, painted first) ----------
R.solid(A.slab(GROUND, EARTH_Z, -EARTH_Z, { name: "stand.ground" }, 6));
function ground() {
  const out = [halo(k.insetPlan(GROUND, -10), EARTH_Z, 1, 10)];
  out.push(ac("earth", S(slab(GROUND, EARTH_Z, GRASS_Z - EARTH_Z, 6, 0), { tone: "mid", inner: L(seam(GROUND, -15, 6), { tone: "faint" }) })));
  out.push(ac("grass", S(slab(GROUND, GRASS_Z, -GRASS_Z, 6, 1.2), { tone: "mid", crease: "faint" })));
  out.push(ac("grass", L(k.planOutline(k.insetPlan(GROUND, 6), 0, P, 6), { tone: "faint" })));
  return out.join("");
}

// ---------- road, aprons and pads ----------
const ROAD = { x: -236, y: 66, w: 754, d: 22, r: 4 };
const INV_PAD = { x: -232, y: -40, w: 152, d: 96, r: 2 };
const BAT_PAD = { x: -60, y: -112, w: 260, d: 130, r: 2 };
const SUB_PAD = { x: 222, y: -118, w: 300, d: 172, r: 3 };
function grounds() {
  box("road", ROAD, 0, 0.8, { tone: "mid", steps: 3, cls: "gravel", inner: L(k.planOutline(k.insetPlan(ROAD, 3), 0.8, P, 3), { tone: "faint" }) });
  const aprons = [
    { x: -172, y: INV_PAD.y + INV_PAD.d, w: 34, d: ROAD.y - INV_PAD.y - INV_PAD.d, r: 0 },
    { x: 52, y: BAT_PAD.y + BAT_PAD.d, w: 40, d: ROAD.y - BAT_PAD.y - BAT_PAD.d, r: 0 },
    { x: 274, y: SUB_PAD.y + SUB_PAD.d, w: 52, d: ROAD.y - SUB_PAD.y - SUB_PAD.d, r: 0 },
  ];
  aprons.push({ x: -224, y: ROAD.y + ROAD.d, w: 26, d: GROUND.y + GROUND.d - 4 - ROAD.y - ROAD.d, r: 0 });
  for (const ap of aprons) box("apron", ap, 0, 0.8, { tone: "mid", steps: 1, cls: "gravel" });
  box("pad.inverter", INV_PAD, 0, 3, { tone: "mid", steps: 2, bevel: 0.5, inner: L(seam(INV_PAD, 1.5), { tone: "faint" }) });
  box("pad.battery", BAT_PAD, 0, 3, { tone: "mid", steps: 2, bevel: 0.5, inner: L(seam(BAT_PAD, 1.5), { tone: "faint" }) });
  box("pad.substation", SUB_PAD, 0, 2, { tone: "mid", steps: 2, cls: "gravel", bevel: 0.5 });
}

// ---------- solar array: four tracker rows ----------
const ROW_Y = [-112, -46, 20, 86];
const TUBE_Z = 26;
const TR = 2.2;
const TILT = (24 * Math.PI) / 180;
const PD = 40;          // panel depth across the tube
const PT = 1.6;         // panel thickness
const PW = 46;          // panel width along the row
const GAP = 2;
const HALF = 3 * PW + 2 * GAP;
const X_A0 = -566;
const DRIVE_GAP = 24;
const X_D = X_A0 + HALF + DRIVE_GAP / 2;   // drive centre
const X_A1 = X_A0 + 2 * HALF + DRIVE_GAP;
const GB_R = 5.6;       // slew drive radius
const GB_T = 7;         // slew drive length

function panelFrame(y) {
  const c = Math.cos(TILT);
  const s = Math.sin(TILT);
  return { o: [0, y, TUBE_Z], a: [1, 0, 0], u: [0, c, -s], v: [0, s, c] };
}
const xAxis = (x, y, z) => ({ o: [x, y, z], a: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] });

function panel(x0, y) {
  const F = panelFrame(y);
  const poly = [[-PD / 2, TR], [PD / 2, TR], [PD / 2, TR + PT], [-PD / 2, TR + PT]];
  const top = TR + PT;
  const pt = (s, u) => G.add3(G.add3(G.add3(F.o, G.mul3(F.a, s)), G.mul3(F.u, u)), G.mul3(F.v, top));
  const path = (pts, closed = false) => k.pathOf(pts.map((p) => at(p)), closed);
  const IN = 1.3;
  const s0 = x0 + IN;
  const s1 = x0 + PW - IN;
  const u0 = -PD / 2 + IN;
  const u1 = PD / 2 - IN;
  const frame = path([pt(s0, u0), pt(s1, u0), pt(s1, u1), pt(s0, u1)], true);
  const grid = [];
  const COLS = 10;
  const ROWS = 6;
  for (let i = 1; i < COLS; i++) { const s = s0 + ((s1 - s0) * i) / COLS; grid.push(path([pt(s, u0), pt(s, u1)])); }
  for (let j = 1; j < ROWS; j++) { const u = u0 + ((u1 - u0) * j) / ROWS; grid.push(path([pt(s0, u), pt(s1, u)])); }
  const inner = ac("cellink", L(grid.join(""), { tone: dark ? "lo" : "mid" }) + L(frame, { tone: "hi" }));
  const svg = ac("cell", S(G.prismOf(F, poly, x0, x0 + PW, P), { tone: "hi", inner }));
  put("array.panel", [x0 + PW / 2, y, TUBE_Z + TR], svg, [A.prism(F, poly, x0, x0 + PW)]);
}

function pile(x, y, top, { w = 3.6, d = 3 } = {}) {
  const plan = { x: x - w / 2, y: y - d / 2, w, d, r: 0.3 };
  box("array.pile", plan, 0, top, { tone: "mid", steps: 1, inner: L(seam(plan, 3, 1), { tone: "faint" }) });
}

function tube(x0, x1, y) {
  const F = xAxis(x0, y, TUBE_Z);
  put("array.tube", [(x0 + x1) / 2, y, TUBE_Z], S(G.disc(0, x1 - x0, TR, F, P, { steps: 16 }), { tone: "mid" }), [A.disc(F, 0, x1 - x0, TR)]);
}

function row(y, index) {
  const g0 = X_D - GB_T / 2;
  const g1 = X_D + GB_T / 2;
  tube(X_A0 - 2, g0, y);
  tube(g1, X_A1 + 2, y);
  for (const x of [X_A0 + HALF * 0.42, X_A1 - HALF * 0.42]) pile(x, y, TUBE_Z - TR);
  // slew drive on a heavier pier, its motor on the front, the row controller on the pier
  pile(X_D, y, TUBE_Z - GB_R, { w: 5, d: 4.4 });
  const F = xAxis(g0, y, TUBE_Z);
  const ring = G.arcOf(F, GB_T / 2, GB_R, P, {});
  put("array.drive", [X_D, y, TUBE_Z], S(G.disc(0, GB_T, GB_R, F, P, { steps: 24 }), { tone: "hi", inner: L(ring, { tone: "faint" }) }) + D([at([g1, y, TUBE_Z])], { size: 0.6 }), [A.disc(F, 0, GB_T, GB_R)]);
  const motor = { x: X_D - 3, y: y + GB_R, w: 6, d: 6, r: 1 };
  box("array.motor", motor, TUBE_Z - 6, 7, { tone: "mid", steps: 2, bevel: 0.3, inner: L(seam(motor, TUBE_Z - 2.5, 2), { tone: "faint" }) });
  const ctl = { x: X_D - 4.5, y: y + 2.2, w: 9, d: 4, r: 0.6 };
  const cy = ctl.y + ctl.d;
  const inner = L(faceY(cy, rect(ctl.x + 1.4, 7.4, ctl.x + ctl.w - 1.4, 15.6), true), { tone: "mid" });
  const led = index === 2 ? ac("led", D([at([X_D + 2.6, cy, 13.8])], { size: 0.8, tone: "lit" })) : D([at([X_D + 2.6, cy, 13.8])], { size: 0.5 });
  box("array.controller", ctl, 6, 11, { tone: "hi", steps: 2, bevel: 0.3, inner, extra: led });
  const xs = [];
  for (let i = 0; i < 3; i++) xs.push(X_A0 + i * (PW + GAP));
  for (let i = 0; i < 3; i++) xs.push(X_D + DRIVE_GAP / 2 + i * (PW + GAP));
  for (const x of xs) panel(x, y);
}

// ---------- inverter skid ----------
function inverterSkid() {
  const skid = { x: -222, y: -28, w: 132, d: 64, r: 1 };
  box("inv.skid", skid, 3, 5, { tone: "lo", steps: 2, bevel: 0.4, inner: L(seam(skid, 5.5), { tone: "mid" }) });
  const Z0 = 8;
  const cabinet = (x0, label) => {
    const plan = { x: x0, y: -20, w: 40, d: 30, r: 1 };
    const h = 46;
    const fy = plan.y + plan.d;
    const lines = [];
    lines.push(L(faceY(fy, rect(x0 + 2.5, Z0 + 3, x0 + 19.4, Z0 + h - 4), true) + faceY(fy, rect(x0 + 20.6, Z0 + 3, x0 + 37.5, Z0 + h - 4), true), { tone: "mid" }));
    const vents = [];
    for (let i = 0; i < 5; i++) {
      const z = Z0 + h - 10 - i * 3.2;
      vents.push(faceY(fy, slotPts(x0 + 5, x0 + 16.9, z, 1.5), true), faceY(fy, slotPts(x0 + 23.1, x0 + 35, z, 1.5), true));
    }
    lines.push(L(vents.join(""), { tone: "lo" }));
    lines.push(L(faceY(fy, vslot(x0 + 17.8, Z0 + 20, 1.2, 6), true) + faceY(fy, vslot(x0 + 22.2, Z0 + 20, 1.2, 6), true), { tone: "hi" }));
    lines.push(L(faceX(x0 + plan.w, rect(plan.y + 4, Z0 + 6, plan.y + plan.d - 4, Z0 + 18), true), { tone: "faint" }));
    const plate = L([12, 8].map((len, i) => faceY(fy, [[x0 + 5, Z0 + 12 - i * 2.4], [x0 + 5 + len, Z0 + 12 - i * 2.4]])).join(""), { tone: "lo", free: true });
    const leds = label ? amBlinkLed(at([x0 + 33, fy, Z0 + 12]), 0) : "";
    const body = S(slab(plan, Z0, h, 2, 0.6), { tone: "hi", inner: lines.join("") + plate }) + D([at([x0 + 33, fy, Z0 + 12]), at([x0 + 33, fy, Z0 + 9])], { size: 0.5 }) + leds;
    const hood = { x: x0 - 2, y: plan.y - 2, w: plan.w + 4, d: plan.d + 5, r: 1 };
    const hoodSvg = S(slab(hood, Z0 + h, 3, 2, 0.5), { tone: "mid", inner: L(seam(hood, Z0 + h + 1.5), { tone: "faint" }) });
    put("inv.cabinet", centreOf(plan, Z0, h + 3), body + hoodSvg, [A.slab(plan, Z0, h, {}, 2), A.slab(hood, Z0 + h, 3, {}, 2)]);
  };
  cabinet(-216, false);
  // compact MV transformer between the two inverters, with cooling fins on its front
  const tx = { x: -170, y: -18, w: 30, d: 24, r: 1 };
  const th = 34;
  box("inv.trafo", tx, Z0, th, { tone: "mid", steps: 2, bevel: 0.5, inner: L(seam(tx, Z0 + th - 5), { tone: "faint" }) });
  for (let i = 0; i < 4; i++) box("inv.fin", { x: tx.x + 4.2 + i * 7, y: tx.y + tx.d, w: 1.2, d: 6, r: 0.2 }, Z0 + 4, th - 12, { tone: "hi", steps: 1 });
  stack("inv.bushing", tx.x + 9, tx.y + 10, Z0 + th, [[2.8, 1.2, "mid", 14], [1.8, 4, "hi", 12]]);
  stack("inv.bushing", tx.x + 21, tx.y + 10, Z0 + th, [[2.8, 1.2, "mid", 14], [1.8, 4, "hi", 12]]);
  cabinet(-134, true);
}

// LED dot that blinks (ink accent)
function amBlinkLed(p, delay) {
  return a.amBlink(ac("led", D([p], { size: 1.1, tone: "lit" })), { period: 2600, delay });
}

// ---------- battery yard ----------
const C_W = 104;
const C_D = 32;
const C_H = 40;
const C_Z = 3;
const CONTAINERS = [
  { x: -52, y: -104 }, { x: 76, y: -104 },
  { x: -52, y: -32 }, { x: 76, y: -32, moment: true },
];
function container({ x, y, moment }) {
  const plan = { x, y, w: C_W, d: C_D, r: 1 };
  const fy = y + C_D;
  const z0 = C_Z;
  const z1 = C_Z + C_H;
  const lines = [];
  const DX0 = x + 18;
  const DW = (C_W - 22) / 4;
  const doors = [];
  const ribs = [];
  const bars = [];
  for (let i = 0; i < 4; i++) {
    const d0 = DX0 + i * DW + 0.8;
    const d1 = DX0 + (i + 1) * DW - 0.8;
    doors.push(faceY(fy, rect(d0, z0 + 2.5, d1, z1 - 3), true));
    for (let j = 1; j < 8; j++) {
      const rx = d0 + ((d1 - d0) * j) / 8;
      (j === 2 || j === 6 ? bars : ribs).push(faceY(fy, [[rx, z0 + 2.5], [rx, z1 - 3]]));
    }
  }
  lines.push(L(ribs.join(""), { tone: "faint" }), L(doors.join(""), { tone: "mid" }), L(bars.join(""), { tone: "lo" }));
  // handles on the lock bars
  const handles = [];
  for (let i = 0; i < 4; i++) {
    const d0 = DX0 + i * DW + 0.8;
    const d1 = DX0 + (i + 1) * DW - 0.8;
    for (const j of [2, 6]) { const rx = d0 + ((d1 - d0) * j) / 8; handles.push(faceY(fy, vslot(rx, z0 + 18, 1.8, 4.4, 3), true)); }
  }
  lines.push(L(handles.join(""), { tone: "lo" }));
  // end face: a lifting seam band and a hatch outline
  lines.push(L(faceX(x + C_W, rect(y + 5, z0 + 4, y + C_D - 5, z0 + 11), true), { tone: "faint" }));
  // status lights left of the doors: a lamp plate on the moment container, bare lamps elsewhere
  const pz0 = z0 + 12;
  const pz1 = z1 - 6;
  const py = moment ? fy + 0.8 : fy;
  const LIGHTS = [0, 1, 2, 3].map((i) => [x + 9, py, pz0 + 3.4 + i * 6.2]);
  const lampRings = LIGHTS.map((p) => k.sideRing(p, moment ? 2.3 : 1.7, "y", P, 16)).join("");
  if (!moment) lines.push(L(lampRings, { tone: "mid" }));
  const roof = L(k.planOutline(k.insetPlan(plan, 3), z1, P, 2), { tone: "faint" });
  const body = S(slab(plan, z0, C_H, 2, 0.6), { tone: "hi", inner: lines.join("") + L(seam(plan, z1 - 1.6), { tone: "faint" }) }) + roof;
  const dots = D(k.corners(plan, 2.4).map(([cx, cy]) => at([cx, cy, z1])), { size: 0.6 }) + (moment ? "" : D(LIGHTS.map((p) => at(p)), { size: 0.55 }));
  put("bat.container", centreOf(plan, z0, C_H), body + dots, [A.slab(plan, z0, C_H, {}, 2)]);
  if (moment) {
    const sp = { x: x + 3.4, y: fy, w: 11.2, d: 0.8, r: 0.2 };
    const leds = LIGHTS.map((p, i) => a.amBlink(ac("led", D([at(p)], { size: 2.1, tone: "lit" })), { period: 2800, delay: 2800 - i * 420, min: 0.12 })).join("");
    box("bat.status", sp, pz0, pz1 - pz0, { tone: "mid", steps: 1, extra: ac("led", L(lampRings, { tone: "mid" })) + leds });
  }
  // HVAC unit on the +x end
  const hv = { x: x + C_W, y: y + 5, w: 7, d: C_D - 10, r: 0.6 };
  const hx = hv.x + hv.w;
  const hc = [hx, y + C_D / 2, z0 + 22];
  const fan = k.sideRing(hc, 6.4, "x", P, 28) + k.sideRing(hc, 1.6, "x", P, 12);
  const spokes = [0, 1, 2, 3, 4, 5].map((i) => {
    const t = (i / 6) * Math.PI * 2 + 0.3;
    return faceX(hx, [[hc[1] + Math.cos(t) * 1.6, hc[2] + Math.sin(t) * 1.6], [hc[1] + Math.cos(t) * 6.4, hc[2] + Math.sin(t) * 6.4]]);
  }).join("");
  const louvre = [0, 1, 2].map((i) => faceY(hv.y + hv.d, slotPts(hv.x + 1.6, hv.x + hv.w - 1.6, z0 + 32 - i * 2.6, 1.2, 3), true)).join("");
  box("bat.hvac", hv, z0 + 8, 30, { tone: "mid", steps: 2, bevel: 0.4, inner: L(fan, { tone: "mid" }) + L(spokes, { tone: "lo" }) + L(louvre, { tone: "lo" }) });
}

// ---------- substation ----------
const SUB_Z = 2;
function transformer() {
  const base = { x: 320, y: -66, w: 92, d: 58, r: 1.5 };
  box("sub.plinth", base, SUB_Z, 6, { tone: "mid", steps: 2, bevel: 0.5, inner: L(seam(base, SUB_Z + 3), { tone: "faint" }) });
  const Z0 = SUB_Z + 6;
  const tank = { x: 334, y: -58, w: 64, d: 34, r: 1.5 };
  const TH = 40;
  const fy = tank.y + tank.d;
  const plate = { x: 339, y: fy, w: 10, d: 0.6, r: 0.2 };
  const tankLines = L(seam(tank, Z0 + TH - 4, 2) + seam(tank, Z0 + 4, 2), { tone: "faint" });
  box("sub.tank", tank, Z0, TH, { tone: "hi", steps: 2, bevel: 0.6, inner: tankLines });
  box("sub.plate", plate, Z0 + 24, 9, { tone: "mid", steps: 1, extra: L([6, 4].map((len, i) => faceY(fy + 0.6, [[plate.x + 2, Z0 + 30 - i * 2.4], [plate.x + 2 + len, Z0 + 30 - i * 2.4]])).join(""), { tone: "lo", free: true }) });
  // radiator bank on the front: headers and fins
  const RX0 = 354;
  const RX1 = 396;
  box("sub.header", { x: RX0, y: fy, w: RX1 - RX0, d: 10, r: 0.6 }, Z0 + 4, 3, { tone: "mid", steps: 2 });
  for (let i = 0; i < 7; i++) box("sub.fin", { x: RX0 + 2 + i * 6.2, y: fy, w: 1.4, d: 10, r: 0.2 }, Z0 + 7, TH - 14, { tone: "hi", steps: 1 });
  box("sub.header", { x: RX0, y: fy, w: RX1 - RX0, d: 10, r: 0.6 }, Z0 + TH - 7, 3, { tone: "mid", steps: 2 });
  // conservator on two brackets
  const ZT = Z0 + TH;
  const CR = 6.5;
  const CZ = ZT + 12;
  const CY = -50;
  for (const bx of [342, 384]) box("sub.bracket", { x: bx - 1.5, y: CY - 1.5, w: 3, d: 3, r: 0.3 }, ZT, CZ - CR - ZT, { tone: "mid", steps: 1 });
  const CF = xAxis(336, CY, CZ);
  const cseam = G.arcOf(CF, 6, CR, P, {}) + G.arcOf(CF, 50, CR, P, {});
  put("sub.conservator", [364, CY, CZ], S(G.disc(0, 56, CR, CF, P, { steps: 28 }), { tone: "hi", inner: L(cseam, { tone: "faint" }) }), [A.disc(CF, 0, 56, CR)]);
  // HV bushings: stacked sheds on a flange
  const shed = (z) => "";
  for (const bx of [346, 366, 386]) {
    stack("sub.hv", bx, -38, ZT, [[4.2, 1.6, "mid", 18], [2.2, 6, "hi", 14], [3.8, 1.6, "mid", 18], [2.2, 7, "hi", 14]],
      { extra: D([at([bx, -38, ZT + 16.2])], { size: 0.6 }) });
  }
  for (const bx of [352, 366, 380]) stack("sub.lv", bx, -26, ZT, [[3, 1.2, "mid", 14], [1.6, 4, "hi", 12]]);
  void shed;
}

function kiosk() {
  const plan = { x: 448, y: -98, w: 58, d: 40, r: 1 };
  const z0 = SUB_Z;
  const h = 34;
  const fy = plan.y + plan.d;
  const door = faceY(fy, rect(460, z0 + 1, 476, z0 + 26), true);
  const knob = faceY(fy, vslot(473.7, z0 + 13, 1.4, 4, 3), true);
  const vent = [0, 1, 2, 3].map((i) => faceY(fy, slotPts(485, 502, z0 + 24 - i * 3, 1.4), true)).join("");
  const sign = L([10, 7].map((len, i) => faceY(fy, [[488, z0 + 10 - i * 2.4], [488 + len, z0 + 10 - i * 2.4]])).join(""), { tone: "lo", free: true });
  const body = S(slab(plan, z0, h, 2, 0.6), { tone: "hi", inner: L(door, { tone: "mid" }) + L(knob + vent, { tone: "lo" }) + L(faceY(fy, rect(484, z0 + 5, 503, z0 + 12), true), { tone: "faint" }) + sign });
  const roof = { x: plan.x - 2, y: plan.y - 2, w: plan.w + 4, d: plan.d + 4, r: 1 };
  const roofSvg = S(slab(roof, z0 + h, 3, 2, 0.5), { tone: "mid" });
  put("sub.kiosk", centreOf(plan, z0, h + 3), body + roofSvg, [A.slab(plan, z0, h, {}, 2), A.slab(roof, z0 + h, 3, {}, 2)]);
  const ac1 = { x: plan.x + plan.w, y: plan.y + 10, w: 6, d: 18, r: 0.5 };
  const hc = [ac1.x + ac1.w, ac1.y + ac1.d / 2, z0 + 20];
  box("sub.kioskac", ac1, z0 + 12, 16, { tone: "mid", steps: 2, bevel: 0.3, inner: L(k.sideRing(hc, 5, "x", P, 24) + k.sideRing(hc, 1.2, "x", P, 10), { tone: "lo" }) });
}

// Disconnect switch: two steel posts, a beam, three insulator stacks with blades.
function disconnect() {
  const y = 22;
  const zb = SUB_Z;
  for (const px of [424, 492]) box("sub.dpost", { x: px - 2, y: y - 2, w: 4, d: 4, r: 0.4 }, zb, 30, { tone: "mid", steps: 1, inner: L(seam({ x: px - 2, y: y - 2, w: 4, d: 4, r: 0.4 }, zb + 3, 1), { tone: "faint" }) });
  const beam = { x: 418, y: y - 3, w: 80, d: 6, r: 0.6 };
  box("sub.dbeam", beam, zb + 30, 4, { tone: "mid", steps: 2, bevel: 0.3 });
  for (const ix of [440, 458, 476]) {
    const top = stack("sub.insulator", ix, y, zb + 34, [[2.6, 1.2, "mid", 14], [1.4, 5, "hi", 10], [2.6, 1.4, "mid", 14], [1.4, 5, "hi", 10]]);
    void top;
  }
}

// Fence: posts with a top rail and palisade pales between them, and a gate in the front.
const FENCE = { x: 230, y: -112, w: 286, d: 160 };
const FENCE_H = 30;
const GATE = [288, 328];
function fence() {
  const x0 = FENCE.x;
  const x1 = FENCE.x + FENCE.w;
  const y0 = FENCE.y;
  const y1 = FENCE.y + FENCE.d;
  const PR = 1.5;
  const zb = SUB_Z;
  const posts = [];
  const along = (from, to, n) => Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);
  const backXs = along(x0, x1, 5);
  const sideYs = along(y0, y1, 2);
  const frontXs = [x0, 258, GATE[0], GATE[1], 376, 422, 469, x1];
  for (const x of backXs) posts.push([x, y0]);
  for (const y of sideYs.slice(1, -1)) posts.push([x0, y], [x1, y]);
  for (const x of frontXs) posts.push([x, y1]);
  for (const [x, y] of posts) {
    const gate = y === y1 && (x === GATE[0] || x === GATE[1]);
    stack("fence.post", x, y, zb, [[gate ? 2.2 : PR, FENCE_H + 3, "mid", 14]]);
  }
  const isGate = (x) => x === GATE[0] || x === GATE[1];
  const segX = (y, xa, xb, gate = false) => {
    const a0 = xa + (y === y1 && isGate(xa) ? 2.2 : PR);
    const a1 = xb - (y === y1 && isGate(xb) ? 2.2 : PR);
    const rail = { x: a0, y: y - 0.6, w: a1 - a0, d: 1.2, r: 0.3 };
    const pales = [];
    const n = Math.max(2, Math.round((a1 - a0) / 3.4));
    for (let i = 1; i < n; i++) { const px = a0 + ((a1 - a0) * i) / n; pales.push(k.segment([px, y, zb + 4], [px, y, zb + FENCE_H - 1.4], P)); }
    const low = k.segment([a0, y, zb + 4], [a1, y, zb + 4], P);
    const svg = L(pales.join(""), { tone: gate ? "mid" : "faint" }) + L(low, { tone: "lo" }) + S(slab(rail, zb + FENCE_H - 1.4, 1.4, 1), { tone: "mid" })
      + (gate ? L(k.segment([a0, y, zb + 4], [(a0 + a1) / 2, y, zb + FENCE_H - 1.4], P) + k.segment([(a0 + a1) / 2, y, zb + 4], [(a0 + a1) / 2, y, zb + FENCE_H - 1.4], P) + k.segment([(a0 + a1) / 2, y, zb + 4], [a1, y, zb + FENCE_H - 1.4], P), { tone: "mid" }) : "");
    put(gate ? "fence.gate" : "fence.seg", [(a0 + a1) / 2, y, zb + FENCE_H / 2], svg, [A.slab(rail, zb + FENCE_H - 1.4, 1.4, {}, 1), A.box([a0, y - 0.2, zb + 4], [a1, y + 0.2, zb + FENCE_H - 1.4])]);
  };
  const segY = (x, ya, yb) => {
    const a0 = ya + PR;
    const a1 = yb - PR;
    const rail = { x: x - 0.6, y: a0, w: 1.2, d: a1 - a0, r: 0.3 };
    const pales = [];
    const n = Math.max(2, Math.round((a1 - a0) / 3.4));
    for (let i = 1; i < n; i++) { const py = a0 + ((a1 - a0) * i) / n; pales.push(k.segment([x, py, zb + 4], [x, py, zb + FENCE_H - 1.4], P)); }
    const low = k.segment([x, a0, zb + 4], [x, a1, zb + 4], P);
    const clamps = D([at([x, a0, zb + 4]), at([x, a1, zb + 4])], { size: 0.6 });
    const svg = L(pales.join(""), { tone: "faint" }) + L(low, { tone: "lo" }) + clamps + S(slab(rail, zb + FENCE_H - 1.4, 1.4, 1), { tone: "mid" });
    put("fence.seg", [x, (a0 + a1) / 2, zb + FENCE_H / 2], svg, [A.slab(rail, zb + FENCE_H - 1.4, 1.4, {}, 1), A.box([x - 0.2, a0, zb + 4], [x + 0.2, a1, zb + FENCE_H - 1.4])]);
  };
  for (let i = 0; i < backXs.length - 1; i++) segX(y0, backXs[i], backXs[i + 1]);
  for (let i = 0; i < sideYs.length - 1; i++) { segY(x0, sideYs[i], sideYs[i + 1]); segY(x1, sideYs[i], sideYs[i + 1]); }
  for (let i = 0; i < frontXs.length - 1; i++) segX(y1, frontXs[i], frontXs[i + 1], frontXs[i] === GATE[0]);
}

// ---------- service cart on the road ----------
function cart() {
  const cx = 120;
  const yc = 77;
  const BW = 16;      // body half-width is 8
  const WR = 5.4;
  const z0 = 0.8;
  const zA = z0 + WR;
  const body = { x: cx - 26, y: yc - BW / 2, w: 52, d: BW, r: 1.5 };
  const wheels = [cx - 17, cx + 16];
  // far wheels first
  for (const wx of wheels) {
    const F = { o: [wx, yc - BW / 2, zA], a: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] };
    put("cart.wheel", [wx, yc - BW / 2 - 2, zA], S(G.disc(0, 3.4, WR, F, P, { steps: 24 }), { tone: "lo" }), [A.disc(F, 0, 3.4, WR)]);
  }
  box("cart.chassis", body, zA - 2.5, 6, { tone: "mid", steps: 2, bevel: 0.4, inner: L(seam(body, zA, 2), { tone: "faint" }) });
  const zt = zA + 3.5;
  // bed with low walls
  const bed = { x: cx - 26, y: yc - BW / 2, w: 21.2, d: BW, r: 1 };
  box("cart.bedwall", { x: bed.x, y: bed.y, w: 1.4, d: bed.d, r: 0.3 }, zt, 6, { tone: "hi", steps: 1 });
  box("cart.bedwall", { x: bed.x + 1.4, y: bed.y, w: bed.w - 1.4, d: 1.4, r: 0.3 }, zt, 6, { tone: "hi", steps: 1 });
  void ("cart.crate", { x: bed.x + 4, y: bed.y + 3, w: 12, d: 9, r: 0.6 }, zt, 6, { tone: "mid", steps: 2, bevel: 0.3, inner: L(seam({ x: bed.x + 4, y: bed.y + 3, w: 12, d: 9, r: 0.6 }, zt + 4, 2), { tone: "faint" }) });
  box("cart.bedwall", { x: bed.x + 1.4, y: bed.y + bed.d - 1.4, w: bed.w - 1.4, d: 1.4, r: 0.3 }, zt, 6, { tone: "hi", steps: 1 });
  // seat and the cab: posts, roof
  box("cart.seat", { x: cx - 1, y: yc - 6, w: 9, d: 12, r: 1 }, zt, 4, { tone: "lo", steps: 2, bevel: 0.3 });
  box("cart.seatback", { x: cx - 3.4, y: yc - 6, w: 2.4, d: 12, r: 0.6 }, zt, 11, { tone: "lo", steps: 2 });
  const roofZ = zt + 20;
  const postAt = [[cx - 4, yc - 7], [cx + 11.2, yc - 7], [cx - 4, yc + 7], [cx + 11.2, yc + 7]];
  for (const [px, py] of postAt.slice(0, 2)) box("cart.post", { x: px - 0.8, y: py - 0.8, w: 1.6, d: 1.6, r: 0.4 }, zt, roofZ - zt, { tone: "mid", steps: 1 });
  box("cart.hood", { x: cx + 12, y: yc - BW / 2, w: 14, d: BW, r: 2 }, zt, 5, { tone: "hi", steps: 3, bevel: 0.4 });
  void ("cart.screen", { x: cx + 15.2, y: yc - 7, w: 0.8, d: 14, r: 0.2 }, zt + 5, roofZ - zt - 5, { tone: "faint", steps: 1, crease: "none" });
  for (const [px, py] of postAt.slice(2)) box("cart.post", { x: px - 0.8, y: py - 0.8, w: 1.6, d: 1.6, r: 0.4 }, zt, roofZ - zt, { tone: "mid", steps: 1 });
  const roof = { x: cx - 6, y: yc - 9, w: 24, d: 18, r: 1.5 };
  box("cart.roof", roof, roofZ, 1.8, { tone: "hi", steps: 2, bevel: 0.4 });
  stack("cart.beacon", cx + 6, yc, roofZ + 1.8, [[1.6, 2.2, "hi", 14]], { cls: null });
  for (const wx of wheels) {
    const F = { o: [wx, yc + BW / 2, zA], a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] };
    const hub = G.circleOf(F, 3.4, 2.2, P);
    put("cart.wheel", [wx, yc + BW / 2 + 2, zA], S(G.disc(0, 3.4, WR, F, P, { steps: 24 }), { tone: "lo" }) + L(hub, { tone: "mid" }) + D([at(G.pointOf(F, 3.4, 0, 0))], { size: 0.6 }), [A.disc(F, 0, 3.4, WR)]);
  }
}

// ---------- site detail: sheep, trees, met mast, trench, combiners, sign, lamps, bollards ----------
function sheep(x, y, dir, graze = 0) {
  // dir: "+x", "-x" or "+y"; the body is a woolly rounded slab on four dark legs
  const along = dir === "+y" ? "y" : "x";
  const L2 = 7;
  const W2 = 4.5;
  const body = along === "x" ? { x: x - L2, y: y - W2, w: 2 * L2, d: 2 * W2, r: 4 } : { x: x - W2, y: y - L2, w: 2 * W2, d: 2 * L2, r: 4 };
  const legs = [[-4.5, -2.4], [4.5, -2.4], [-4.5, 2.4], [4.5, 2.4]].map(([u, v]) => (along === "x" ? [x + u, y + v] : [x + v, y + u]));
  for (const [lx, ly] of legs) box("site.sheepleg", { x: lx - 0.7, y: ly - 0.7, w: 1.4, d: 1.4, r: 0.4 }, 0, 5, { tone: "mid", steps: 1, cls: "fleece" });
  box("site.sheep", body, 5, 8, { tone: "hi", steps: 4, bevel: 0.5, cls: "wool", inner: L(seam(body, 7, 4), { tone: "faint" }) });
  const sgn = dir === "-x" ? -1 : 1;
  const head = along === "x"
    ? { x: sgn > 0 ? x + L2 : x - L2 - 6, y: y - 2.1, w: 6, d: 4.2, r: 1.8 }
    : { x: x - 2.1, y: y + L2, w: 4.2, d: 6, r: 1.8 };
  const eye = along === "x" ? [sgn > 0 ? head.x + 2.6 : head.x + 3.4, head.y + head.d, 11.6] : [head.x + head.w, head.y + 2.6, 11.6];
  const item = box("site.sheephead", head, 8, 5, { tone: "hi", steps: 3, bevel: 0.3, cls: "fleece", extra: D([at(eye)], { size: 0.45, tone: "faint" }) });
  if (graze) item.svg = a.amPress(item.svg, along === "x" ? [sgn * 0.8, 0, -3] : [0, 0.8, -3], P, { period: 4400, delay: graze });
}

function tree(x, y, r, trunk) {
  const F = { o: [x, y, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] };
  const cz = trunk + r;
  const svg = ac("bark", S(cyl(x, y, 1.8, 0, trunk, 14), { tone: "mid" })) + ac("leaf", S(G.sphereOf([x, y, cz], r, P, { steps: 40 }), { tone: "hi" }));
  put("site.tree", [x, y, cz], svg, [A.cylinder(x, y, 1.8, 0, trunk), A.ball([x, y, cz], r)]);
  void F;
}

function metMast() {
  const x = -566;
  const y = 108;
  const base = { x: x - 6, y: y - 6, w: 12, d: 12, r: 1 };
  box("met.base", base, 0, 2.4, { tone: "mid", steps: 2, bevel: 0.4 });
  const top = 66;
  stack("met.mast", x, y, 2.4, [[1.1, top - 2.4, "mid", 14], [1.8, 1.4, "mid", 14]]);
  box("met.arm", { x: x - 12, y: y - 0.8, w: 10.9, d: 1.6, r: 0.4 }, top - 6, 1.6, { tone: "mid", steps: 1 });
  box("met.arm", { x: x + 1.1, y: y - 0.8, w: 10.9, d: 1.6, r: 0.4 }, top - 6, 1.6, { tone: "mid", steps: 1 });
  // cup anemometer on the left of the arm, a wind vane on the right
  {
    const ax = x - 10;
    const cz = top - 4.4 + 3;
    const cups = [0, 1, 2].map((i) => {
      const t = (i / 3) * Math.PI * 2;
      const ex = Math.cos(t) * 4.4;
      const ey = Math.sin(t) * 4.4;
      return `<path d="M0 0L${ex.toFixed(2)} ${ey.toFixed(2)}" style="fill:none;stroke:var(--anatomy-mid);stroke-width:var(--anatomy-weight)"/><circle cx="${(ex + Math.cos(t + 1.57) * 0.6).toFixed(2)}" cy="${(ey + Math.sin(t + 1.57) * 0.6).toFixed(2)}" r="1.5" style="fill:var(--anatomy-top);stroke:var(--anatomy-hi);stroke-width:var(--anatomy-weight)"/>`;
    }).join("");
    const spin = a.amSpin(cups, a.topPlane([ax, y, cz + 0.4], P), { period: 900 });
    const svg = S(cyl(ax, y, 0.6, top - 4.4, 3, 10), { tone: "mid" }) + spin + S(cyl(ax, y, 0.9, cz, 1.4, 10), { tone: "mid" });
    put("met.cups", [ax, y, cz], svg, [A.cylinder(ax, y, 0.6, top - 4.4, 3), A.cylinder(ax, y, 0.9, cz, 1.4), A.cylinder(ax, y, 5.8, cz + 0.3, 0.2)]);
  }
  stack("met.vane", x + 10, y, top - 4.4, [[0.8, 4, "mid", 10]]);
  box("met.tail", { x: x + 10.5, y: y - 0.3, w: 5, d: 0.6, r: 0.2 }, top - 2.8, 3, { tone: "hi", steps: 1 });
  // pyranometer on top: a small dome on a disc
  const pz = top + 1.4;
  put("met.pyrano", [x, y, pz + 1], S(cyl(x, y, 2.6, pz, 0.8, 20), { tone: "mid" }) + S(G.sphereOf([x, y, pz + 2.4], 1.6, P, { steps: 24 }), { tone: "hi" }), [A.cylinder(x, y, 2.6, pz, 0.8), A.ball([x, y, pz + 2.4], 1.6)]);
  // logger box on the mast
  const lb = { x: x - 3.5, y: y + 1.1, w: 7, d: 3.4, r: 0.5 };
  const fy = lb.y + lb.d;
  box("met.logger", lb, 14, 10, { tone: "hi", steps: 2, bevel: 0.3, inner: L(faceY(fy, rect(lb.x + 1, 15.4, lb.x + lb.w - 1, 22.6), true), { tone: "mid" }), extra: amLed(at([x + 2, fy, 21]), 1300) });
}
function amLed(p, delay) {
  return a.amBlink(ac("led", D([p], { size: 0.9, tone: "lit" })), { period: 3600, delay });
}

function trench() {
  const ring = [[-246, -126], [-238, -126], [-238, -14], [-232, -14], [-232, -6], [-246, -6]];
  const joints = [];
  for (let yy = -116; yy < -14; yy += 10) joints.push(k.lineOnTop([-246, yy], [-238, yy], 1.2, P));
  joints.push(k.lineOnTop([-238, -14], [-238, -6], 1.2, P));
  const svg = S(k.extrude(ring, 0, 1.2, P, { convex: false }), { tone: "mid", inner: L(joints.join(""), { tone: "lo" }) });
  put("site.trench", [-242, -66, 0.6], svg, [A.extruded(ring, 0, 1.2)]);
  // one combiner box at the end of each row, by the trench
  ROW_Y.forEach((ry) => {
    const plan = { x: -253.6, y: ry + 4, w: 6, d: 5, r: 0.5 };
    const fy = plan.y + plan.d;
    box("site.combiner", plan, 0, 13, { tone: "hi", steps: 2, bevel: 0.3, inner: L(faceY(fy, rect(plan.x + 0.9, 1.4, plan.x + plan.w - 0.9, 11.4), true), { tone: "mid" }) + L(seam(plan, 2, 2), { tone: "faint" }) });
  });
}

function sign() {
  const y = 108;
  const x0 = -190;
  const W = 38;
  for (const px of [x0 + 4, x0 + W - 4]) box("sign.post", { x: px - 1, y: y - 1, w: 2, d: 2, r: 0.3 }, 0, 6, { tone: "mid", steps: 1 });
  const board = { x: x0, y: y - 1, w: W, d: 2, r: 0.4 };
  const z0 = 6;
  const h = 14;
  const fy = y + 1;
  const tr = k.sideMatrix([x0 + W / 2, fy], z0 + 4.4, P, "left");
  const text = ac("led", k.faceTextSvg(tr, "HALDEN", { size: 7, tone: "hi", anchor: "middle" }));
  const leaf = ac("led", L(faceY(fy, [[x0 + 6, z0 + 2.6], [x0 + W - 6, z0 + 2.6]]), { tone: "mid", free: true }));
  const inner = L(faceY(fy, rect(x0 + 1.4, z0 + 1.2, x0 + W - 1.4, z0 + h - 1.2), true), { tone: "faint" });
  box("sign.board", board, z0, h, { tone: "hi", steps: 1, bevel: 0.3, inner, extra: text + leaf });
}

function lampPost(x, y) {
  const top = 40;
  stack("road.lamp", x, y, 0, [[1.1, top, "mid", 14]]);
  const arm = { x: x - 0.7, y: y - 10, w: 1.4, d: 10 - 1.1, r: 0.3 };
  box("road.lamparm", arm, top - 2, 1.4, { tone: "mid", steps: 1 });
  const head = { x: x - 2.6, y: y - 13, w: 5.2, d: 6, r: 1.2 };
  box("road.lamphead", head, top - 4.4, 2.4, { tone: "hi", steps: 3, bevel: 0.3, extra: D([at([x, y - 10, top - 4.4])], { size: 0.8, tone: "hi" }) });
}

function bollard(x, y) {
  const band = L(k.sideArc(x, y, 1.6, 6.2, P, 16), { tone: "lo" });
  put("road.bollard", [x, y, 4], S(cyl(x, y, 1.6, 0, 8, 16, 0.3), { tone: "hi", inner: band }), [A.cylinder(x, y, 1.6, 0, 8)]);
}

// A hedgerow along the front edge, with trees standing in its gaps.
function hedgerow() {
  const Y = 104;
  const D2 = 10;
  const spans = [[-140, -20], [4, 150], [174, 330], [354, 516]];
  for (const [x0, x1] of spans) {
    const plan = { x: x0, y: Y, w: x1 - x0, d: D2, r: 4.6 };
    box("site.hedge", plan, 0, 9, { tone: "hi", steps: 5, bevel: 0.6, cls: "leaf", inner: L(seam(plan, 3, 5), { tone: "faint" }) });
  }
  for (const [x, r, t] of [[-8, 12, 11], [162, 13, 12], [342, 12, 11]]) tree(x, Y + D2 / 2, r, t);
}

function site() {
  sheep(-532, 114, "+x", 600);
  sheep(-470, 110, "-x");
  sheep(-300, 110, "-x");
  sheep(-411, 52, "+y", 2600);
  hedgerow();
  metMast();
  trench();
  sign();
  lampPost(-60, 94);
  lampPost(230, 94);
  for (const x of [-230, -192]) bollard(x, 92);
}

// ---------- drone (floats; drawn last, outside the sorted scene) ----------
function drone() {
  const cx = -404;
  const cy = -14;
  const z = 112;
  const out = [];
  const body = { x: cx - 7, y: cy - 5, w: 14, d: 10, r: 2.5 };
  const arms = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const RO = 15;
  const rotor = (sx, sy) => {
    const x = cx + sx * RO;
    const y = cy + sy * RO * 0.8;
    return [
      S(cyl(x, y, 2.2, z + 1, 3.4, 16), { tone: "mid" }),
      a.amRotor([x, y, z + 4.9], [1, 0, 0], [0, -1, 0], P, { count: 2, r0: 1.2, r1: 8, chord: 2.2, tip: 1.2, period: 350, reverse: sx * sy > 0, delay: (sx + 2) * 90 + (sy + 2) * 40, thickness: 0.5 }),
      S(cyl(x, y, 1.2, z + 4.4, 1.2, 12), { tone: "mid" }),
    ].join("");
  };
  const armSvg = (sx, sy) => {
    const x = cx + sx * RO;
    const y = cy + sy * RO * 0.8;
    const pts = [[cx + sx * 4, cy + sy * 3], [x, y]];
    const dx = pts[1][0] - pts[0][0];
    const dy = pts[1][1] - pts[0][1];
    const len = Math.hypot(dx, dy);
    const nx = (-dy / len) * 1.1;
    const ny = (dx / len) * 1.1;
    const ring = [[pts[0][0] + nx, pts[0][1] + ny], [pts[1][0] + nx, pts[1][1] + ny], [pts[1][0] - nx, pts[1][1] - ny], [pts[0][0] - nx, pts[0][1] - ny]];
    return S(k.extrude(ring, z + 1.6, 1.6, P), { tone: "mid" });
  };
  const order = [...arms].sort((p, q) => k.depthOf([cx + p[0] * RO, cy + p[1] * RO, z], P) - k.depthOf([cx + q[0] * RO, cy + q[1] * RO, z], P));
  const back = order.filter(([, sy]) => sy < 0);
  const front = order.filter(([, sy]) => sy > 0);
  for (const [sx, sy] of back) out.push(armSvg(sx, sy), rotor(sx, sy));
  out.push(ac("brand", S(slab(body, z, 4.6, 3, 0.4), { tone: "hi", inner: L(seam(body, z + 2.2, 3), { tone: "faint" }) })));
  out.push(ac("brand", L(k.planOutline(k.insetPlan(body, 2), z + 4.6, P, 3), { tone: "faint" })));
  out.push(ac("led", D([at([cx + 4, cy + 3, z + 4.6])], { size: 0.8, tone: "lit" })));
  for (const [sx, sy] of front) out.push(armSvg(sx, sy), rotor(sx, sy));
  const shadow = halo({ x: cx - 22, y: cy - 16, w: 44, d: 32, r: 16 }, TUBE_Z + 8, 0.1, 6);
  return a.amFloat(out.join(""), P, { rise: 6, period: 6400, delay: 900, halo: shadow });
}

// ---------- assemble ----------
grounds();
ROW_Y.forEach((y, i) => row(y, i));
inverterSkid();
CONTAINERS.forEach(container);
transformer();
disconnect();
kiosk();
fence();
cart();
site();

A.settle(R, P);
R.items.sort((p, q) => p.key - q.key);

// The cart drives along the road and back as one group in one slot of the painter's order.
// Its swept screen box is checked against every other item: everything it overlaps must be
// either wholly behind it (drawn before the slot) or wholly in front (drawn after).
const CART_DRIVE = [-120, 0, 0];
function cartSlot(items) {
  const cart = items.filter((it) => it.name.startsWith("cart."));
  // flat ground-level parts (road, aprons, pads, trench) lie under everything: paint them first
  const flat = (it) => /^(road(#|$)|apron|pad\.|site\.trench)/.test(it.name);
  const rest = [...items.filter((it) => flat(it)), ...items.filter((it) => !flat(it) && !it.name.startsWith("cart."))];
  const boxOf = (svg) => A.markupBox(svg);
  let sweep = cart.map((it) => boxOf(it.svg)).reduce((m, b) => (b ? [Math.min(m[0], b[0]), Math.min(m[1], b[1]), Math.max(m[2], b[2]), Math.max(m[3], b[3])] : m), [1e9, 1e9, -1e9, -1e9]);
  const d = k.iso(CART_DRIVE, P);
  const o = k.iso([0, 0, 0], P);
  sweep = [Math.min(sweep[0], sweep[0] + d[0] - o[0]), Math.min(sweep[1], sweep[1] + d[1] - o[1]), Math.max(sweep[2], sweep[2] + d[0] - o[0]), Math.max(sweep[3], sweep[3] + d[1] - o[1])];
  const hits = (b) => b && b[0] < sweep[2] && b[2] > sweep[0] && b[1] < sweep[3] && b[3] > sweep[1];
  const front = (it) => /^(site\.hedge|site\.tree|road\.|sign\.)/.test(it.name);
  let lastBack = -1;
  let firstFront = rest.length;
  rest.forEach((it, i) => {
    if (!hits(boxOf(it.svg))) return;
    if (front(it)) firstFront = Math.min(firstFront, i);
    else lastBack = Math.max(lastBack, i);
  });
  if (lastBack >= firstFront) throw new Error(`cart slot: ${rest[lastBack].name} (behind) is drawn after ${rest[firstFront].name} (in front)`);
  const group = { name: "cart", svg: a.amSlide(cart.map((it) => it.svg).join(""), CART_DRIVE, P, { period: 11000, delay: 0 }) };
  if (process.env.SLOT) console.log("cart slot after", rest[lastBack]?.name, "before", rest[firstFront]?.name);
  return [...rest.slice(0, lastBack + 1), group, ...rest.slice(lastBack + 1)];
}
const drawn = cartSlot(R.items);
{
  // Check the final drawing order against every measured overlap at rest.
  const slot = new Map();
  drawn.forEach((it, i) => slot.set(it, i));
  const cartIndex = drawn.findIndex((it) => it.name === "cart");
  const { items: settled, overlaps } = R.settled;
  const idx = (it) => (it.name.startsWith("cart.") ? cartIndex + settled.indexOf(it) * 1e-6 : slot.get(it));
  const bad = [];
  for (const pair of overlaps.pairs) {
    const aFront = pair.front[0].area >= overlaps.least;
    const bFront = pair.front[1].area >= overlaps.least;
    if (aFront === bFront) continue;
    const [f, bk] = aFront ? [settled[pair.a], settled[pair.b]] : [settled[pair.b], settled[pair.a]];
    if (f.name.startsWith("cart.") && bk.name.startsWith("cart.")) continue;
    if (!(idx(f) > idx(bk))) bad.push(`${bk.name} drawn after ${f.name}`);
  }
  if (bad.length) throw new Error(`drawing order: ${bad.join("; ")}`);
}
const body = [ground(), drawn.map((item) => item.svg).join(""), drone()].join("");

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

const name = dark ? "energy-solar-farm-dark" : "energy-solar-farm";
const svg = a.assetSvg({
  width: W,
  height: H,
  label: "An isometric utility-scale solar site on a strip of grassland: four rows of tracker-mounted solar panels, an inverter skid, a battery yard of container enclosures with one container's status lights chasing green, a fenced substation with a transformer, a gravel road with a service cart, and an inspection drone hovering over the panels.",
  body: minify(body),
  paper: PAPER,
  accents: {
    brand: GREEN,
    led: { hex: GREEN, mode: "ink" },
    cell: dark ? "#1a2433" : "#2a3a52",
    cellink: { hex: dark ? "#8ea4c0" : "#a9bdd6", mode: "ink" },
    grass: dark ? "#45633c" : "#8fae7a",
    earth: dark ? "#6e5440" : "#9a7a5e",
    gravel: dark ? "#8f897c" : "#cfc8b8",
    wool: dark ? "#b8b2a4" : "#f3f0e8",
    fleece: dark ? "#24211e" : "#4a4440",
    leaf: dark ? "#3f5c37" : "#6e9460",
    bark: dark ? "#5a4636" : "#8a6a50",
  },
  weight: 0.85,
  id: name,
});
writeFileSync(join(HERE, `${name}.svg`), svg);
writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W }));
console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB, ${(svg.match(/class="iso-solid/g) || []).length} solids, ${R.items.length} items) and ${name}.html, scale ${P.scale.toFixed(3)}`);

A.auditOrExit(R, P);
if (process.env.COUNT) { const c = {}; for (const it of R.items) { const n = it.name.split("#")[0]; c[n] = (c[n] ?? 0) + (it.svg.match(/class="iso-solid/g) || []).length; } console.log(c); }
