import assert from "node:assert/strict";
import test from "node:test";
import * as k from "../kit/iso-kit.mjs";
import * as a from "../kit/asset.mjs";

const P = k.fitProjection(k.boxCorners({ x: -20, y: -20, w: 40, d: 40, r: 4 }, 0, 20), 200, 160, { pad: 12 });
const body = k.solidSvg(k.slabOf({ x: -20, y: -20, w: 40, d: 40, r: 4 }, 0, 20, P, 4, 0.6), { tone: "mid" });

test("the default papers reproduce the kit's own ramps", () => {
  assert.equal(a.groundTokens("#131313").hi, "#d4d4d4");
  assert.equal(a.groundTokens("#131313")["shade-0"], "#0f0f0f");
  assert.equal(a.groundTokens("#fbfbfa").hi, "#26262a");
  assert.equal(a.themeFor("#f4f1ea"), "light");
  assert.equal(a.themeFor("#0c0d10"), "dark");
});

test("accent ramps keep their tone order", () => {
  for (const theme of ["light", "dark"]) {
    const t = a.accentTokens("#ff5a1f", { theme });
    const L = (name) => a.lightnessOf(t[name]);
    assert.ok(L("shade-0") < L("shade-1") && L("shade-1") < L("shade-2") && L("shade-2") < L("shade-3"), theme);
    assert.ok(L("top") > L("shade-3"), theme);
  }
});

test("the drop is well-formed XML with every attribute valued", () => {
  const svg = a.assetSvg({ width: 200, height: 160, label: `A "box"`, body: a.amFloat(body, P), paper: "#f4f1ea", accents: { brand: "#ff5a1f" }, id: "t" });
  const tags = svg.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "").match(/<[a-zA-Z][^>]*>/g);
  for (const tag of tags) {
    const bare = tag.replace(/"[^"]*"/g, '""').match(/\s([a-zA-Z-:]+)(?=[\s/>])/g);
    assert.equal(bare, null, `attribute without a value in ${tag.slice(0, 80)}`);
  }
  assert.match(svg, /<style><!\[CDATA\[/);
  assert.match(svg, /aria-label="A &quot;box&quot;"/);
  assert.match(svg, /#t \.ac-brand\{/);
  assert.match(svg, /#t\.iso\{--anatomy-paper:#f4f1ea/);
});

test("fitInto places the art inside its region", () => {
  const region = { x: 300, y: 20, w: 200, h: 120 };
  const Q = a.fitInto(k.boxCorners({ x: -20, y: -20, w: 40, d: 40, r: 0 }, 0, 20), region, { pad: 0 });
  for (const point of k.boxCorners({ x: -20, y: -20, w: 40, d: 40, r: 0 }, 0, 20)) {
    const [x, y] = k.iso(point, Q);
    assert.ok(x >= region.x - 0.01 && x <= region.x + region.w + 0.01 && y >= region.y - 0.01 && y <= region.y + region.h + 0.01);
  }
});

test("planeMatrix places plane coordinates on the projected plane", () => {
  const centre = [10, -5, 20];
  const m = a.topPlane(centre, P).match(/matrix\(([^)]+)\)/)[1].split(" ").map(Number);
  const apply = ([x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  for (const [u, v] of [[0, 0], [7, 0], [0, -3], [4, 9]]) {
    const want = k.iso([centre[0] + u, centre[1] + v, centre[2]], P);
    const got = apply([u, v]);
    assert.ok(Math.abs(got[0] - want[0]) < 1e-3 && Math.abs(got[1] - want[1]) < 1e-3);
  }
  const spun = a.amSpin("<path/>", a.topPlane(centre, P), { period: 1000, reverse: true });
  assert.match(spun, /class="am-spin" style="--am-period:1\.00s;--am-delay:[-0-9.]+s;--am-dir:reverse"/);
  assert.equal((a.bladesPath(3, 2, 20).match(/M/g) || []).length, 3);
});
