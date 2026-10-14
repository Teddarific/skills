import React from "react";

// Every illustration on this page was made by the anatomy-asset skill, served from the repo.
const CDN = "https://cdn.jsdelivr.net/gh/Teddarific/skills@f9d967875265208ed65fac2429193e6857873880/skills/anatomy-asset/examples";

const C = {
  page: "#07090d",
  panel: "#0c1016",
  line: "#18202b",
  lineStrong: "#243041",
  text: "#e9eef4",
  body: "#9aa6b5",
  muted: "#5f6b7a",
  ice: "#4cc9ff",
  iceDeep: "#0e3a52",
};

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <path d="M2 17 13 5l11 12-11-4Z" fill="none" stroke={C.ice} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13 5v8" stroke={C.ice} strokeWidth="1.4" />
      <circle cx="13" cy="20.5" r="1.6" fill={C.ice} />
    </svg>
  );
}

function Nav() {
  return (
    <nav className="relative z-20 flex items-center justify-between py-6">
      <div className="flex items-center gap-12">
        <span className="flex items-center gap-2.5">
          <Mark />
          <span className="ae-display text-[17px] font-semibold tracking-[0.16em]" style={{ color: C.text }}>AETHER</span>
        </span>
        <div className="hidden items-center gap-8 text-[13.5px] md:flex" style={{ color: C.body }}>
          {["Aircraft", "Network", "Safety", "Investors", "Careers"].map((l) => (
            <a key={l} href="#" className="transition-colors hover:text-white">{l}</a>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-6 text-[13.5px]">
        <a href="#" className="hidden sm:inline" style={{ color: C.body }}>Operators</a>
        <a href="#" className="rounded-full px-4 py-2 font-medium" style={{ background: C.ice, color: "#04121a" }}>Book a flight</a>
      </div>
    </nav>
  );
}

// The hero asset was drawn with its left 39% kept free for a headline: the copy sits there.
function Hero() {
  return (
    <section className="relative">
      <div className="relative w-full" style={{ aspectRatio: "1200 / 640" }}>
        <img src={`${CDN}/aero-vertiport/aero-vertiport.svg`} alt="A six-rotor electric air taxi hovering over a rooftop vertiport, its pad lights chasing around the landing ring." className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-y-0 left-0 flex w-[41%] flex-col justify-center">
          <p className="ae-mono mb-6 flex items-center gap-2 text-[11.5px] uppercase tracking-[0.2em]" style={{ color: C.ice }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ice, boxShadow: `0 0 10px ${C.ice}` }} />
            Type certification · 2027
          </p>
          <h1 className="ae-display text-[clamp(40px,5.2vw,68px)] font-semibold leading-[1.0] tracking-[-0.035em]" style={{ color: C.text }}>
            Electric flight, everywhere.
          </h1>
          <p className="mt-6 max-w-[40ch] text-[16.5px] leading-[1.6]" style={{ color: C.body }}>
            Aether builds quiet, all-electric aircraft and the rooftop network they fly between. Across the city in twelve minutes, with zero emissions.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 text-[14px]">
            <a href="#" className="rounded-full px-5 py-2.5 font-medium" style={{ background: C.ice, color: "#04121a", boxShadow: `0 8px 30px rgba(76,201,255,.25)` }}>Reserve a seat</a>
            <a href="#" className="rounded-full px-5 py-2.5 font-medium" style={{ color: C.text, border: `1px solid ${C.lineStrong}` }}>Meet the A-6</a>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl md:grid-cols-4" style={{ background: C.line, border: `1px solid ${C.line}` }}>
        {[
          ["250 km", "range on one charge"],
          ["320 km/h", "cruise speed"],
          ["45 dB", "at 500 m, quieter than traffic"],
          ["0 g", "CO₂ in flight"],
        ].map(([v, l]) => (
          <div key={v} className="px-6 py-6" style={{ background: C.page }}>
            <div className="ae-display text-[28px] font-semibold tracking-[-0.02em]" style={{ color: C.text }}>{v}</div>
            <div className="mt-1 text-[13px]" style={{ color: C.body }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="ae-mono mb-4 text-[11.5px] uppercase tracking-[0.2em]" style={{ color: C.ice }}>{children}</p>;
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`ae-display text-[clamp(30px,3.6vw,46px)] font-semibold leading-[1.05] tracking-[-0.03em] ${className}`} style={{ color: C.text }}>{children}</h2>;
}

function Systems() {
  const items = [
    { img: "propulsion", n: "01", title: "Electric propulsion", body: "Six ducted electric fans with redundant motors and inverters. Lose any one and the aircraft flies on, without a pilot noticing." },
    { img: "autonomy", n: "02", title: "Autonomous flight", body: "Triple-redundant flight computers and lidar keep a 360° picture of the sky, with a certified pilot on board from day one." },
    { img: "quiet", n: "03", title: "Quiet by design", body: "Slow-turning, five-bladed rotors tuned in our anechoic lab. On approach, an A-6 is quieter than the street below it." },
  ];
  return (
    <section className="mt-32">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr] md:items-end">
        <div>
          <Eyebrow>The A-6 aircraft</Eyebrow>
          <H2>Three systems,<br />engineered from first principles.</H2>
        </div>
        <p className="max-w-[46ch] text-[16px] leading-[1.6] md:justify-self-end" style={{ color: C.body }}>
          Every system that keeps an A-6 in the air is designed, built and tested in-house, so we can certify it ourselves and improve it every week.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((s) => (
          <article key={s.img} className="group overflow-hidden rounded-2xl" style={{ background: C.page, border: `1px solid ${C.line}` }}>
            <div className="relative flex justify-center pt-2" style={{ background: `radial-gradient(70% 70% at 50% 55%, ${C.panel}, ${C.page})` }}>
              <img src={`${CDN}/aero-spots/${s.img}.svg`} alt="" className="aspect-square w-full max-w-[260px] transition-transform duration-700 group-hover:-translate-y-1" />
              <span className="ae-mono absolute left-5 top-4 text-[11px]" style={{ color: C.muted }}>{s.n}</span>
            </div>
            <div className="px-6 pb-7 pt-1">
              <h3 className="ae-display text-[18px] font-semibold tracking-[-0.01em]" style={{ color: C.text }}>{s.title}</h3>
              <p className="mt-2 text-[14px] leading-[1.6]" style={{ color: C.body }}>{s.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Hangar() {
  return (
    <section className="mt-32">
      <div className="mx-auto max-w-[720px] text-center">
        <Eyebrow>Manufacturing</Eyebrow>
        <H2>Built in-house, from fan to fuselage.</H2>
        <p className="mx-auto mt-5 max-w-[52ch] text-[16px] leading-[1.6]" style={{ color: C.body }}>
          Our Bay 3 line in Long Beach assembles an aircraft every 36 hours. Composite airframes, battery packs and propulsion units all come from the same building.
        </p>
      </div>
      <div className="relative mt-12" style={{ aspectRatio: "1600 / 560" }}>
        <div className="pointer-events-none absolute inset-x-[15%] top-[20%] h-[60%] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(76,201,255,.10), transparent)" }} />
        <img src={`${CDN}/aero-hangar/aero-hangar.svg`} alt="A cutaway assembly hangar with an electric aircraft on its gear and a gantry crane lowering a propulsion pod onto its wing." className="absolute inset-0 h-full w-full" />
      </div>
      <div className="ae-mono mt-4 flex flex-wrap justify-center gap-x-10 gap-y-2 text-[12px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
        <span>Bay 3 · Long Beach</span>
        <span>1 aircraft / 36 h</span>
        <span>94% parts made in-house</span>
      </div>
    </section>
  );
}

function Orbit() {
  return (
    <section className="mt-32 grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
      <div className="overflow-hidden rounded-3xl" style={{ background: `radial-gradient(80% 80% at 50% 45%, ${C.panel}, ${C.page})`, border: `1px solid ${C.line}` }}>
        <div className="relative" style={{ aspectRatio: "640 / 480" }}>
          <img src={`${CDN}/aero-satellite/aero-satellite.svg`} alt="A satellite on an integration stand in a clean room, wired to a test console." className="absolute inset-0 h-full w-full" />
        </div>
      </div>
      <div>
        <Eyebrow>Aether Link</Eyebrow>
        <H2>Connected from orbit.</H2>
        <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.6]" style={{ color: C.body }}>
          Every aircraft talks to our own low-orbit constellation, so traffic, weather and telemetry stay in sync from the moment the rotors spin up, wherever the route goes.
        </p>
        <ul className="mt-8 flex flex-col gap-4 text-[14.5px]" style={{ color: C.body }}>
          {[
            ["< 40 ms", "telemetry latency, gate to gate"],
            ["24", "satellites in the first shell"],
            ["Live", "airspace picture shared with air traffic control"],
          ].map(([k, v]) => (
            <li key={v} className="flex items-baseline gap-4 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
              <span className="ae-display w-20 shrink-0 text-[18px] font-semibold" style={{ color: C.text }}>{k}</span>
              {v}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Spec() {
  const rows: [string, string][] = [
    ["Seats", "1 pilot + 4 passengers"],
    ["Propulsion", "6 × electric ducted fans"],
    ["Battery", "Solid-state, 180 kWh"],
    ["Recharge", "12 min, 20–80% at a vertiport"],
    ["Certification", "FAA Part 21, EASA SC-VTOL"],
  ];
  return (
    <section className="mt-32 grid grid-cols-1 gap-10 rounded-3xl p-8 md:grid-cols-[1fr_1.4fr] md:p-12" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      <div>
        <Eyebrow>Specification</Eyebrow>
        <H2 className="text-[clamp(28px,3vw,38px)]">The A-6, in numbers.</H2>
        <a href="#" className="mt-8 inline-flex rounded-full px-5 py-2.5 text-[14px] font-medium" style={{ color: C.text, border: `1px solid ${C.lineStrong}` }}>Download the spec sheet</a>
      </div>
      <dl className="ae-mono m-0 text-[13.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6 py-3.5" style={{ borderBottom: `1px solid ${C.line}` }}>
            <dt style={{ color: C.muted }}>{k}</dt>
            <dd className="m-0 text-right" style={{ color: C.text }}>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-32 pb-14">
      <div className="flex flex-col items-start justify-between gap-8 py-14 md:flex-row md:items-center" style={{ borderTop: `1px solid ${C.line}` }}>
        <h2 className="ae-display text-[clamp(28px,3.4vw,44px)] font-semibold leading-[1.05] tracking-[-0.03em]" style={{ color: C.text }}>First flights in your city, 2027.</h2>
        <a href="#" className="shrink-0 rounded-full px-6 py-3 text-[14px] font-medium" style={{ background: C.ice, color: "#04121a" }}>Join the waitlist</a>
      </div>
      <div className="flex flex-col justify-between gap-4 text-[12.5px] sm:flex-row" style={{ color: C.muted }}>
        <span className="flex items-center gap-2"><Mark /> © 2026 Aether Aerospace, Inc.</span>
        <span className="ae-mono">Illustrations made with anatomy-asset</span>
      </div>
    </footer>
  );
}

export function App() {
  return (
    <div className="w-full" style={{ background: C.page }}>
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <Nav />
        <Hero />
        <Systems />
        <Hangar />
        <Orbit />
        <Spec />
        <Footer />
      </div>
    </div>
  );
}
