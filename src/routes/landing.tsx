import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import heroElectronics from "@/assets/hero-electronics.jpg";
import heroGarden from "@/assets/hero-garden.jpg";
import heroHospital from "@/assets/hero-hospital.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildSeoHead } from "@/lib/seo";
import { detectNearbyAreaLabel } from "@/lib/nearby-area";

/**
 * Standalone marketing landing page for peersplus.com.
 * Self-contained — safe to copy/paste into another repo.
 * Only external dependency: @tanstack/react-router <Link>.
 * Swap <Link to="..."> for <a href="..."> if pasting into a non-TanStack app.
 */

export const Route = createFileRoute("/landing")({
  head: () =>
    buildSeoHead({
      title: "PeersPlus — Borrow, lend, and help neighbours",
      description:
        "PeersPlus connects neighbours who want to borrow, lend, and help each other locally. Now building the first sharing community in your nearby area.",
      path: "/landing",
    }),
  component: LandingPage,
});

const firstTimeGuide = [
  {
    n: "01",
    title: "Choose your role",
    body: "Borrow what you need, lend what you already own, or do both. No long setup.",
  },
  {
    n: "02",
    title: "Use safer exchanges",
    body: "QR and photo handoff records are rolling out. Until then, confirm terms in chat before meeting.",
  },
  {
    n: "03",
    title: "Pay only if required",
    body: "Most items are free. If rent/deposit exists, you see terms before you request.",
  },
];

const features = [
  {
    icon: "🔧",
    title: "Borrow what you need",
    body: "Ladders, drills, sewing machines, camping gear — thousands of items sit unused on your block. Access them in a few taps.",
  },
  {
    icon: "🩺",
    title: "Medical & mobility gear",
    body: "Wheelchairs, crutches, nebulizers, shower chairs — get short-term equipment from neighbors when you or a loved one need it.",
  },
  {
    icon: "🍼",
    title: "Baby & kids essentials",
    body: "Strollers, cribs, high chairs, toys — outgrown one week, life-saving the next. Keep them circulating.",
  },
  {
    icon: "🎉",
    title: "Party & events",
    body: "Folding tables, speakers, string lights, coolers — throw the birthday you dreamed of without buying gear you'll use once.",
  },
  {
    icon: "🤝",
    title: "A hand when you need one",
    body: "Ride to a hospital visit, help lifting a couch, company for a walk — post a request, a nearby neighbor will show up.",
  },
  {
    icon: "🚨",
    title: "Emergency requests",
    body: "Storm knocked out power? Need oxygen tonight? Broadcast urgently and reach every verified neighbor within your radius.",
  },
];

const steps = [
  {
    n: "01",
    t: "Register & verify",
    d: "Sign up with email or Google, add your neighborhood, and set your profile. Advanced verification is rolling out in phases.",
  },
  {
    n: "02",
    t: "Post or browse",
    d: "List items you can lend, or browse what's available nearby. Filter by category, distance and urgency.",
  },
  {
    n: "03",
    t: "Request & agree",
    d: "Tap 'Request' — the owner accepts, chat unlocks, you agree on pickup time and any deposit or rental fee.",
  },
  {
    n: "04",
    t: "Pick up confidently",
    d: "Meet and confirm condition together. Photo and QR handoff flows are being expanded.",
  },
  {
    n: "05",
    t: "Return with a smile",
    d: "Bring it back on time, snap a return photo, rate your neighbor. Trust grows with every exchange.",
  },
];

const trust = [
  { t: "Basic", d: "Phone + email confirmed" },
  { t: "Address", d: "Address checks rolling out in stages" },
  { t: "Trusted", d: "20+ positive exchanges" },
];

const faqs = [
  {
    q: "Is Peers Plus free?",
    a: "Yes. Joining, browsing, requesting and lending are all free. If a lender charges a rental fee, 100% of it goes to them — we don't take a cut.",
  },
  {
    q: "What if an item gets damaged?",
    a: "Lenders can require a refundable deposit up-front, and can list a replacement value. If damage occurs, the deposit covers it up to that value — agreed in advance, no surprises.",
  },
  {
    q: "How do you keep it safe?",
    a: "PeersPlus uses profile checks, transparent chat, and trust signals. Advanced verification and expanded handoff records are being rolled out in phases.",
  },
  {
    q: "Is Peers Plus responsible for exchanges?",
    a: "No. Peers Plus is a free platform that connects neighbors. All communication, exchanges and agreements are between the users. We provide the tools; the community brings the trust.",
  },
  {
    q: "What kind of help can I request?",
    a: "Anything neighborly — a lift to a hospital appointment, help moving furniture, company for a walk, a hand shovelling snow. Post a request and nearby neighbors can offer to help.",
  },
  {
    q: "Which neighborhoods are covered?",
    a: "Peers Plus works anywhere you have verified neighbors nearby. Invite your block to grow the local network — the more neighbors, the more items and help available.",
  },
];

function LandingPage() {
  const [nearbyArea, setNearbyArea] = useState<string | null>(null);
  const launchAreaLine = useMemo(
    () => nearbyArea
      ? `Now building the first PeersPlus sharing community in ${nearbyArea}.`
      : "Now building the first PeersPlus sharing community in your nearby area.",
    [nearbyArea],
  );

  useEffect(() => {
    let cancelled = false;
    detectNearbyAreaLabel().then((area) => {
      if (cancelled || !area) return;
      setNearbyArea(area);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1B1D1A] antialiased">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-5 pt-20 pb-24 md:pt-28">
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#E4EFDD] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#F5E7D8] blur-3xl" />
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
            <div>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#4B5147]">
                <span className="size-1.5 rounded-full bg-[#C2410C]" />
                Neighbours sharing and helping neighbours
              </span>
              <div className="mb-4 min-h-[2.25rem]">
                <span className="inline-flex items-center rounded-full border border-[#3F6B4A]/25 bg-[#E4EFDD] px-3 py-1 text-xs font-semibold text-[#3F6B4A]">
                  {launchAreaLine}
                </span>
              </div>
              <h1 className="mb-6 text-balance font-serif text-5xl leading-[1.05] md:text-6xl lg:text-7xl">
                Borrow a ladder.{" "}
                <span className="italic text-[#3F6B4A]">Lend a hand.</span>
              </h1>
              <p className="mb-9 max-w-lg text-lg leading-relaxed text-[#4B5147]">
                PeersPlus is your neighborhood library of things — tools, medical gear, baby
                supplies, party equipment and everyday help. Verified people only. No fees.
                Built on trust.
              </p>
              <p className="mb-6 rounded-xl border border-[#C2410C]/20 bg-[#F5E7D8] px-3 py-2 text-xs leading-relaxed text-[#4B5147]">
                PeersPlus connects community members. Assistance is offered voluntarily by individual users and is not provided by PeersPlus staff.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/items"
                  search={{ lend: undefined, cat: undefined, lendOpen: undefined }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#3F6B4A] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#3F6B4A]/25 transition-transform hover:-translate-y-0.5"
                >
                  Browse nearby →
                </Link>
                <Link
                  to="/auth"
                  search={{ redirectTo: undefined }}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-7 py-3.5 text-sm font-semibold text-[#1B1D1A] hover:bg-black/5"
                >
                  Join your block
                </Link>
              </div>
              <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#4B5147]">
                <li>✓ Trust features expanding step by step</li>
                <li>✓ Handoff records improving (more coming soon)</li>
                <li>✓ 0% platform fee</li>
              </ul>
            </div>

            {/* Illustrated card stack */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -top-6 -left-4 h-full w-full rotate-[-4deg] rounded-3xl bg-[#E4EFDD]" />
              <div className="absolute -bottom-6 -right-4 h-full w-full rotate-[3deg] rounded-3xl bg-[#F5E7D8]" />
              <div className="relative rounded-3xl border border-black/5 bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between text-xs font-medium text-[#4B5147]">
                  <span className="rounded-full bg-[#E4EFDD] px-2.5 py-1 text-[#3F6B4A]">
                    Nearby · 0.3 mi
                  </span>
                  <span>Free to borrow</span>
                </div>
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#F5E7D8] via-[#E4EFDD] to-[#D8E6DF]" />
                <div className="mt-4">
                  <p className="font-serif text-2xl">Extension ladder · 24 ft</p>
                  <p className="mt-1 text-sm text-[#4B5147]">
                    Sarah on Maple St · usually replies in 20 min
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
                  <div className="flex -space-x-2">
                    <span className="size-8 rounded-full border-2 border-white bg-[#C2410C]/40" />
                    <span className="size-8 rounded-full border-2 border-white bg-[#3F6B4A]/40" />
                    <span className="size-8 rounded-full border-2 border-white bg-amber-400/50" />
                  </div>
                  <button className="rounded-full bg-[#3F6B4A] px-4 py-2 text-sm font-semibold text-white">
                    Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* First-time explainer */}
        <section className="px-5 pb-20">
          <div className="mx-auto grid max-w-6xl items-start gap-8 rounded-3xl border border-black/5 bg-white/90 p-5 shadow-sm sm:p-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#4B5147]">
                Start here
              </p>
              <h2 className="font-serif text-3xl md:text-4xl">
                New here? Understand everything <span className="italic text-[#3F6B4A]">before your first request.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#4B5147] sm:text-base">
                PeersPlus is a neighborhood sharing platform. You borrow from nearby people,
                return on time, and grow trust with every exchange.
              </p>

              <p className="mt-3 rounded-xl border border-[#3F6B4A]/20 bg-[#E4EFDD]/60 px-3 py-2 text-xs leading-relaxed text-[#4B5147]">
                PeersPlus connects community members. Assistance is offered voluntarily by individual users and is not provided by PeersPlus staff.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {firstTimeGuide.map((step) => (
                  <div key={step.n} className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-4">
                    <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">
                      {step.n}
                    </p>
                    <h3 className="mb-1.5 text-sm font-semibold">{step.title}</h3>
                    <p className="text-xs leading-relaxed text-[#4B5147]">{step.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  to="/auth"
                  search={{ redirectTo: undefined }}
                  className="rounded-full bg-[#3F6B4A] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Create free account
                </Link>
                <Link to="/safety" className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-black/5">
                  Read trust and safety
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white" style={{ transform: "perspective(900px) rotateY(-7deg) rotateX(2deg)" }}>
                <img src={heroElectronics} alt="Neighbor sharing electronics" className="h-40 w-full object-cover" />
                <div className="p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#4B5147]">Borrow</p>
                  <p className="text-sm">Find useful items near you in minutes.</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white" style={{ transform: "perspective(900px) rotateY(7deg) rotateX(2deg)" }}>
                <img src={heroGarden} alt="Neighbor lending garden tools" className="h-40 w-full object-cover" />
                <div className="p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#4B5147]">Lend</p>
                  <p className="text-sm">List once, help your block often.</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white sm:col-span-2" style={{ transform: "perspective(900px) rotateX(2deg)" }}>
                <img src={heroHospital} alt="Community support for hospital visit" className="h-44 w-full object-cover" />
                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#4B5147]">Help</p>
                    <p className="text-sm">Post urgent or everyday requests and get neighborhood support.</p>
                  </div>
                  <span className="rounded-full bg-[#F5E7D8] px-2.5 py-1 text-[11px] font-semibold text-[#8A5A34]">Coming soon: expanded trust badges</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-y border-black/5 bg-white px-5 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#4B5147]">
                (01) What Peers Plus does
              </p>
              <h2 className="font-serif text-4xl md:text-5xl">
                One neighborhood, endless things you can share.
              </h2>
            </div>
            <p className="mb-8 rounded-xl border border-[#3F6B4A]/20 bg-[#E4EFDD]/60 px-4 py-3 text-xs leading-relaxed text-[#4B5147]">
              PeersPlus connects community members. Assistance is offered voluntarily by individual users and is not provided by PeersPlus staff.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-3xl border border-black/5 bg-[#FAF7F2] p-7 transition-shadow hover:shadow-md"
                >
                  <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-[#E4EFDD] text-2xl">
                    {f.icon}
                  </div>
                  <h3 className="mb-2 font-serif text-2xl">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[#4B5147]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="px-5 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#4B5147]">
                (02) How it works
              </p>
              <h2 className="font-serif text-4xl md:text-5xl">
                Five steps from stranger to trusted neighbor.
              </h2>
            </div>
            <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              {steps.map((s) => (
                <li
                  key={s.n}
                  className="rounded-3xl border border-black/5 bg-white p-6"
                >
                  <span className="font-mono text-xs font-bold tracking-[0.25em] text-[#C2410C]">
                    STEP {s.n}
                  </span>
                  <h3 className="mt-3 font-serif text-xl">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4B5147]">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Trust */}
        <section id="trust" className="bg-[#3F6B4A] px-5 py-20 text-white">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <h3 className="font-serif text-4xl italic">Trust, verified.</h3>
              <p className="mt-3 text-sm text-white/70">
                Verification and trust features are rolling out in stages.
              </p>
            </div>
            {trust.map((v) => (
              <div key={v.t} className="border-l border-white/20 pl-5">
                <div className="mb-3 grid size-10 place-items-center rounded-full border border-white/30 text-sm">
                  ✓
                </div>
                <p className="font-semibold">{v.t}</p>
                <p className="mt-1 text-xs text-white/70">{v.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* For lenders / For borrowers */}
        <section className="px-5 py-24">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-black/5 bg-white p-10">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#4B5147]">
                For lenders
              </p>
              <h3 className="mb-4 font-serif text-3xl">Turn your shed into shared wealth.</h3>
              <ul className="space-y-3 text-sm text-[#4B5147]">
                <li>• Keep 100% of any rental fee — we take zero.</li>
                <li>• Set a deposit and replacement value up-front.</li>
                <li>• Photo protection on every handoff and return.</li>
                <li>• Meet the neighbors you've been waving to for years.</li>
              </ul>
              <Link
                to="/items"
                search={{ lend: "1", cat: undefined, lendOpen: undefined }}
                className="mt-8 inline-flex rounded-full bg-[#3F6B4A] px-6 py-3 text-sm font-semibold text-white"
              >
                + Post a lend
              </Link>
            </div>
            <div className="rounded-3xl border border-black/5 bg-[#F5E7D8] p-10">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#4B5147]">
                For borrowers
              </p>
              <h3 className="mb-4 font-serif text-3xl">Get what you need without buying it.</h3>
              <ul className="space-y-3 text-sm text-[#4B5147]">
                <li>• Free or fair pricing — most items cost nothing.</li>
                <li>• Chat with the lender once your request is accepted.</li>
                <li>• Pick a time that works. Cancel if plans change.</li>
                <li>• Rate every exchange to grow trust in your block.</li>
              </ul>
              <Link
                to="/items"
                search={{ lend: undefined, cat: undefined, lendOpen: undefined }}
                className="mt-8 inline-flex rounded-full bg-[#1B1D1A] px-6 py-3 text-sm font-semibold text-white"
              >
                Browse nearby →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-black/5 bg-white px-5 py-24">
          <div className="mx-auto max-w-4xl">
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#4B5147]">
              (03) Questions, answered
            </p>
            <h2 className="mb-10 font-serif text-4xl md:text-5xl">Frequently asked</h2>
            <div className="divide-y divide-black/5 rounded-3xl border border-black/5">
              {faqs.map((f) => (
                <details key={f.q} className="group p-6 open:bg-[#FAF7F2]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-serif text-lg">
                    {f.q}
                    <span className="grid size-8 place-items-center rounded-full border border-black/10 text-sm transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[#4B5147]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 py-24">
          <div className="mx-auto max-w-3xl rounded-3xl bg-[#1B1D1A] px-8 py-16 text-center text-white">
            <h2 className="font-serif text-4xl md:text-5xl">
              Your block already has <span className="italic text-[#C7E0B7]">everything you need.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Join PeersPlus today. Meet your neighbors. Borrow, lend, help — and keep more of
              what matters within walking distance.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/auth"
                search={{ redirectTo: undefined }}
                className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#1B1D1A]"
              >
                Get started — it's free
              </Link>
              <Link
                to="/items"
                search={{ lend: undefined, cat: undefined, lendOpen: undefined }}
                className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white"
              >
                Explore listings
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
