import React from "react";

// Every illustration on this page was made by the anatomy-asset skill, served from the repo.
const CDN = "https://cdn.jsdelivr.net/gh/Teddarific/anatomy-asset@02839564a02a6df61fba6da0677f2b88dd624987/examples";

const C = {
  page: "#f4f3ee",
  card: "#f6f5f0",
  ink: "#16211b",
  body: "#4f5a53",
  muted: "#87908a",
  line: "#e2e0d6",
  green: "#1f8f5f",
  greenDeep: "#145c3d",
  greenSoft: "#dcebe2",
};

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill={C.green} />
        <path d="M7 15.5c2.5-1 4-3.2 5-7 1 3.8 2.5 6 5 7" fill="none" stroke="#f4f3ee" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="hd-serif text-[21px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>Halden</span>
    </span>
  );
}

function Nav() {
  return (
    <nav className="flex items-center justify-between py-6">
      <div className="flex items-center gap-12">
        <Logo />
        <div className="hidden items-center gap-8 text-[14px] md:flex" style={{ color: C.body }}>
          {["For homes", "For business", "Our projects", "Impact", "About"].map((l) => (
            <a key={l} href="#" className="transition-colors hover:text-black">{l}</a>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-6 text-[14px]">
        <a href="#" className="hidden sm:inline" style={{ color: C.body }}>Log in</a>
        <a href="#" className="rounded-full px-4 py-2 font-medium text-white" style={{ background: C.ink }}>Get a quote</a>
      </div>
    </nav>
  );
}

// The hero asset keeps its left 39% free for the headline; the copy sits in it.
function Hero() {
  return (
    <section className="relative">
      <div className="relative w-full" style={{ aspectRatio: "1200 / 640" }}>
        <img src={`${CDN}/energy-turbine/energy-turbine.svg`} alt="A wind turbine on a grassy hilltop plot with a transformer kiosk, a service van and an inspection drone near a blade tip." className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-y-0 left-0 flex w-[42%] flex-col justify-center">
          <span className="mb-7 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-medium" style={{ background: C.greenSoft, color: C.greenDeep }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.green }} />
            100% renewable, 100% of the time
          </span>
          <h1 className="hd-serif text-[clamp(42px,5.4vw,72px)] font-medium leading-[1.0] tracking-[-0.025em]" style={{ color: C.ink }}>
            Power that <em className="font-medium italic" style={{ color: C.green }}>renews</em> itself.
          </h1>
          <p className="mt-6 max-w-[40ch] text-[17px] leading-[1.6]" style={{ color: C.body }}>
            Halden builds wind, solar and storage, and sells the power straight to the homes and businesses around it. Cleaner, steadier and cheaper than the grid.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4 text-[14.5px]">
            <a href="#" className="rounded-full px-6 py-3 font-medium text-white" style={{ background: C.green }}>Switch to Halden</a>
            <a href="#" className="font-medium underline decoration-1 underline-offset-4" style={{ color: C.ink }}>See your savings →</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section className="mt-6 flex flex-col items-center justify-between gap-6 rounded-2xl px-8 py-6 md:flex-row" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <p className="text-[14px]" style={{ color: C.muted }}>Powering homes and businesses across</p>
      <div className="hd-serif flex flex-wrap justify-center gap-x-10 gap-y-2 text-[19px] italic" style={{ color: "#6b746e" }}>
        {["Leeds", "Bristol", "Glasgow", "Cork", "Utrecht", "Aarhus"].map((c) => <span key={c}>{c}</span>)}
      </div>
    </section>
  );
}

function Pillars() {
  const items = [
    { img: "generate", title: "Generate", body: "Wind and solar built close to the people who use it, on land we lease from local farmers and councils." },
    { img: "store", title: "Store", body: "Grid-scale batteries soak up the surplus at noon and on windy nights, then give it back at teatime." },
    { img: "share", title: "Share", body: "Power runs down the street, not across the country. Every customer sees exactly where theirs came from." },
  ];
  return (
    <section className="mt-28">
      <div className="mx-auto max-w-[680px] text-center">
        <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.green }}>How it works</p>
        <h2 className="hd-serif text-[clamp(32px,4vw,52px)] font-medium leading-[1.05] tracking-[-0.02em]" style={{ color: C.ink }}>A whole power system, at neighbourhood scale.</h2>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {items.map((p) => (
          <article key={p.img} className="rounded-3xl px-6 pb-8 pt-4 text-center" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <img src={`${CDN}/energy-spots/${p.img}.svg`} alt="" className="mx-auto aspect-square w-full max-w-[240px]" />
            <h3 className="hd-serif mt-1 text-[24px] font-medium" style={{ color: C.ink }}>{p.title}</h3>
            <p className="mx-auto mt-2 max-w-[32ch] text-[14.5px] leading-[1.6]" style={{ color: C.body }}>{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Farm() {
  return (
    <section className="mt-28">
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.green }}>Our projects</p>
          <h2 className="hd-serif text-[clamp(32px,4vw,52px)] font-medium leading-[1.05] tracking-[-0.02em]" style={{ color: C.ink }}>From field to fuse box.</h2>
        </div>
        <p className="max-w-[44ch] text-[16px] leading-[1.65] md:justify-self-end" style={{ color: C.body }}>
          Ashby Fen pairs 48 MW of solar with a four-hour battery and its own substation. It went live in nine months and now powers 31,000 homes within twenty miles.
        </p>
      </div>
      <div className="relative mt-10" style={{ aspectRatio: "1600 / 560" }}>
        <img src={`${CDN}/energy-solar-farm/energy-solar-farm.svg`} alt="A utility-scale site: rows of solar panels on trackers, an inverter skid, battery-storage containers and a small substation joined by a gravel road." className="absolute inset-0 h-full w-full" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl md:grid-cols-4" style={{ background: C.line, border: `1px solid ${C.line}` }}>
        {[
          ["48 MW", "solar on single-axis trackers"],
          ["4 h", "of battery storage on site"],
          ["31,000", "homes powered nearby"],
          ["9 months", "from planning to first power"],
        ].map(([v, l]) => (
          <div key={v} className="px-6 py-6" style={{ background: C.card }}>
            <div className="hd-serif text-[32px] font-medium tracking-[-0.01em]" style={{ color: C.ink }}>{v}</div>
            <div className="mt-1 text-[13.5px]" style={{ color: C.body }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Home() {
  return (
    <section className="mt-28 grid grid-cols-1 items-center gap-12 overflow-hidden rounded-[32px] p-8 md:p-12 lg:grid-cols-[1fr_1.15fr]" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div>
        <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.green }}>Halden Home</p>
        <h2 className="hd-serif text-[clamp(30px,3.6vw,46px)] font-medium leading-[1.05] tracking-[-0.02em]" style={{ color: C.ink }}>Your home, its own small power plant.</h2>
        <p className="mt-5 max-w-[44ch] text-[16px] leading-[1.65]" style={{ color: C.body }}>
          Rooftop solar, a home battery, a heat pump and a car charger, installed in a day and run by one app that buys and sells power at the right moment.
        </p>
        <ul className="mt-7 flex flex-col gap-3 text-[15px]" style={{ color: C.ink }}>
          {["Average bill down 64% in the first year", "Backup power when the grid goes down", "Fixed monthly price, no upfront cost"].map((t) => (
            <li key={t} className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" className="mt-0.5 shrink-0" aria-hidden="true"><circle cx="10" cy="10" r="10" fill={C.greenSoft} /><path d="M6 10.3 8.6 13 14 7.4" stroke={C.green} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-9 flex items-baseline gap-2">
          <span className="text-[13px]" style={{ color: C.muted }}>from</span>
          <span className="hd-serif text-[40px] font-medium" style={{ color: C.ink }}>£89</span>
          <span className="text-[14px]" style={{ color: C.muted }}>/ month</span>
        </div>
        <a href="#" className="mt-5 inline-flex rounded-full px-6 py-3 text-[14.5px] font-medium text-white" style={{ background: C.green }}>Check if your home is suitable</a>
      </div>
      <div className="relative" style={{ aspectRatio: "640 / 480" }}>
        <img src={`${CDN}/energy-home/energy-home.svg`} alt="The corner of a house with rooftop solar panels, a wall battery whose lights fill up, a heat pump, and an electric car on charge." className="absolute inset-0 h-full w-full" />
      </div>
    </section>
  );
}

function Quote() {
  return (
    <section className="mx-auto mt-28 max-w-[820px] text-center">
      <p className="hd-serif text-[clamp(24px,2.8vw,34px)] font-normal italic leading-[1.35]" style={{ color: C.ink }}>
        “Our village now makes more power than it uses. The turbine on the hill pays for the school's heating, and the bills went down.”
      </p>
      <p className="mt-6 text-[14px]" style={{ color: C.muted }}>Ruth Okafor · Chair, Ashby Parish Council</p>
    </section>
  );
}

function Footer() {
  const cols: [string, string[]][] = [
    ["Products", ["Halden Home", "Business energy", "Community projects"]],
    ["Company", ["About", "Impact report", "Careers", "Press"]],
    ["Help", ["Contact", "Moving home", "Report a fault"]],
  ];
  return (
    <footer className="mt-28 pb-14">
      <div className="flex flex-col items-start justify-between gap-6 rounded-[32px] px-8 py-12 md:flex-row md:items-center md:px-12" style={{ background: C.greenDeep }}>
        <h2 className="hd-serif text-[clamp(28px,3.4vw,44px)] font-medium leading-[1.05] tracking-[-0.02em] text-white">Switch in five minutes.<br />Keep your supply on.</h2>
        <a href="#" className="shrink-0 rounded-full px-6 py-3 text-[14.5px] font-medium" style={{ background: C.page, color: C.greenDeep }}>Get your quote</a>
      </div>
      <div className="mt-14 grid grid-cols-2 gap-10 text-[14px] md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-[30ch] leading-[1.6]" style={{ color: C.muted }}>Power that renews itself. Made close to home.</p>
        </div>
        {cols.map(([h, links]) => (
          <div key={h}>
            <p className="mb-4 font-semibold" style={{ color: C.ink }}>{h}</p>
            <ul className="flex flex-col gap-2.5" style={{ color: C.body }}>
              {links.map((l) => <li key={l}><a href="#" className="hover:text-black">{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-14 text-[12.5px]" style={{ color: C.muted }}>© 2026 Halden Energy Ltd · Illustrations made with anatomy-asset</p>
    </footer>
  );
}

export function App() {
  return (
    <div className="w-full" style={{ background: C.page }}>
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <Nav />
        <Hero />
        <Proof />
        <Pillars />
        <Farm />
        <Home />
        <Quote />
        <Footer />
      </div>
    </div>
  );
}
