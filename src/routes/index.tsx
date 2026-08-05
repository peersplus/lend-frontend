import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroCarousel } from "@/components/HeroCarousel";
import { HomeTrustedFeedback } from "@/components/HomeTrustedFeedback";
import { useReveal } from "@/hooks/useReveal";
import { buildSeoHead } from "@/lib/seo";
import { detectNearbyAreaLabel } from "@/lib/nearby-area";
import { getFestivalSpotlight } from "@/lib/seasonal";
import heroElectronics600Jpg from "@/assets/optimized/hero-electronics-600.jpg";
import heroElectronics480Webp from "@/assets/optimized/hero-electronics-480.webp";
import heroElectronics800Webp from "@/assets/optimized/hero-electronics-800.webp";
import heroGarden600Jpg from "@/assets/optimized/hero-garden-600.jpg";
import heroGarden480Webp from "@/assets/optimized/hero-garden-480.webp";
import heroGarden800Webp from "@/assets/optimized/hero-garden-800.webp";
import heroHospital600Jpg from "@/assets/optimized/hero-hospital-600.jpg";
import heroHospital480Webp from "@/assets/optimized/hero-hospital-480.webp";
import heroHospital800Webp from "@/assets/optimized/hero-hospital-800.webp";
import { DAY_THEMES } from "@/lib/utils";


export const Route = createFileRoute("/")({
  head: () =>
    buildSeoHead({
      title: "PeersPlus — Borrow, lend, and share with neighbours",
      description:
        "PeersPlus is a neighborhood platform where people borrow, lend, and help each other locally. Now building the first sharing community in your nearby area.",
      path: "/",
    }),
  component: Home,
});

const categories = [
  { label: "Tools", tone: "bg-clay/10 text-clay", emoji: "🔧" },
  { label: "Garden", tone: "bg-leaf/10 text-leaf", emoji: "🌿" },
  { label: "Medical", tone: "bg-sky-600/10 text-sky-700", emoji: "🩺" },
  { label: "Party", tone: "bg-rose-500/10 text-rose-600", emoji: "🎉" },
  { label: "Baby", tone: "bg-amber-500/10 text-amber-700", emoji: "🍼" },
  { label: "Kitchen", tone: "bg-indigo-500/10 text-indigo-700", emoji: "🍳" },
  { label: "Camping", tone: "bg-emerald-600/10 text-emerald-700", emoji: "⛺" },
  { label: "Cleaning", tone: "bg-cyan-600/10 text-cyan-700", emoji: "🧹" },
  { label: "Sports", tone: "bg-orange-500/10 text-orange-700", emoji: "🏐" },
  { label: "Pets", tone: "bg-yellow-500/10 text-yellow-700", emoji: "🐾" },
  { label: "Furniture", tone: "bg-stone-500/10 text-stone-700", emoji: "🪑" },
  { label: "Emergency", tone: "bg-red-500/10 text-red-600", emoji: "🚨" },
];

const emergencies = [
  { need: "Wheelchair for visiting grandparent", who: "Example request", when: "Nearby" },
  { need: "Portable generator — power out on 5th Ave", who: "Example request", when: "Nearby" },
];

const firstTimeGuide = [
  {
    n: "01",
    title: "Choose your role",
    body: "Borrow what you need, lend what you already own, or do both. No long setup.",
  },
  {
    n: "02",
    title: "Use safer exchanges",
    body: "Photo and QR handoff records are rolling out. Until then, confirm details in chat before meeting.",
  },
  {
    n: "03",
    title: "Pay only if required",
    body: "Most items are free. If rent/deposit exists, you see terms before you request.",
  },
];


const flowSteps = [
  {
    n: "01",
    title: "Register & verify",
    body: "Sign up with email or Google, add your neighborhood, and verify your address. You choose what neighbors see.",
    screen: (
      <div className="space-y-2.5">
        <div className="h-2 w-16 rounded-full bg-leaf/40" />
        <p className="font-display text-lg leading-tight">Welcome, neighbor 👋</p>
        <div className="space-y-2 pt-1">
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-[11px]">sarah@maple.st</div>
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-[11px]">•••••••••</div>
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-[11px]">Maplewood Village</div>
          <div className="rounded-lg bg-leaf py-2 text-center text-[11px] font-semibold text-leaf-foreground">
            Create account
          </div>
          <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-leaf" /> Address verified · ID pending
          </div>
        </div>
      </div>
    ),
  },
  {
    n: "02",
    title: "Take the item",
    body: "Find what you need, message the lender, then scan the QR at pickup. A photo on both sides keeps it fair.",
    screen: (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Pickup · Sat 2:15pm</span>
          <span className="rounded-full bg-leaf/15 px-2 py-0.5 font-semibold text-leaf">On the way</span>
        </div>
        <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-clay/30 to-leaf/20" />
        <p className="text-[11px] font-semibold">Extension Ladder · Sarah M.</p>
        <div className="grid place-items-center rounded-lg border-2 border-dashed border-leaf/50 bg-leaf/5 py-4">
          <div className="mb-1 grid size-14 place-items-center rounded bg-foreground text-[8px] font-mono text-background">
            ▪ ■ ▪<br />■ ▪ ■<br />▪ ■ ▪
          </div>
          <p className="text-[10px] font-semibold text-leaf">Scan to confirm handoff</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>📸</span> Photo captured
        </div>
      </div>
    ),
  },
  {
    n: "03",
    title: "Return with a smile",
    body: "Bring it back before the due date, scan the return QR, snap a photo, and rate your neighbor. Trust +1.",
    screen: (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Return · Due Sun 6pm</span>
          <span className="rounded-full bg-clay/15 px-2 py-0.5 font-semibold text-clay">Ready</span>
        </div>
        <div className="rounded-lg border border-leaf/30 bg-leaf/5 p-3">
          <p className="mb-1 text-[11px] font-semibold text-leaf">✓ Returned in great shape</p>
          <p className="text-[10px] text-muted-foreground">Sarah reviewed the photo and confirmed.</p>
        </div>
        <p className="text-[11px] font-semibold">Rate this exchange</p>
        <div className="flex gap-1 text-lg">
          <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
        </div>
        <div className="rounded-lg bg-leaf py-2 text-center text-[11px] font-semibold text-leaf-foreground">
          Say thanks & finish
        </div>
        <p className="text-[10px] text-muted-foreground">Trust grows one exchange at a time</p>
      </div>
    ),
  },
];

function Home() {
  const { user } = useAuth();
  const [nearbyArea, setNearbyArea] = useState<string | null>(null);
  useReveal();
  const today = new Date();
  const dayTheme = DAY_THEMES[today.getDay()] || DAY_THEMES[1];
  const festivalSpotlight = getFestivalSpotlight(today);
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(today);
  const launchAreaLine = useMemo(
    () => nearbyArea
      ? `Now building the first PeersPlus sharing community in ${nearbyArea}.`
      : "Now building the first PeersPlus sharing community in your nearby area.",
    [nearbyArea],
  );

  const availabilityLine = useMemo(
    () => nearbyArea
      ? `Currently available near ${nearbyArea}. Below are real platform journeys and examples from the live product flow.`
      : "Currently available in nearby launch areas. Below are real platform journeys and examples from the live product flow.",
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
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-24">
          <div className="pointer-events-none absolute -top-16 -left-20 h-72 w-72 rounded-full bg-clay/20 blur-3xl" />
          <div className="pointer-events-none absolute top-10 right-0 h-80 w-80 rounded-full bg-leaf/20 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-12">
            <div className="lg:col-span-7" data-reveal="left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <span className="size-1.5 rounded-full bg-accent" />
                {dayTheme.badge}
              </div>
              <div className="mb-4 min-h-[2.25rem]">
                <span className="inline-flex items-center rounded-full border border-leaf/30 bg-leaf/10 px-3 py-1 text-xs font-semibold text-leaf">
                  {launchAreaLine}
                </span>
              </div>
              <h1 className="mb-6 min-h-[2.4em] text-balance font-display text-5xl leading-[1.04] md:min-h-[2.15em] md:text-7xl">
                {dayTheme.headline} <span className="italic text-leaf">{dayTheme.accent}</span>
              </h1>
              <p className="mb-7 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                {dayTheme.description} {festivalSpotlight ? festivalSpotlight.heroLine : "A trusted app for homes, families, and everyday life."}
              </p>
              <div className="mb-9 flex flex-wrap gap-2">
                {dayTheme.audience.map((label) => (
                  <span key={label} className="rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground">{label}</span>
                ))}
                {festivalSpotlight && (
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                    {festivalSpotlight.label} spotlight
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/items"
                  search={{ lend: undefined, cat: undefined, lendOpen: undefined }}
                  className="inline-flex items-center gap-2 rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/25 transition-transform hover:-translate-y-0.5"
                >
                  Browse nearby
                  <span aria-hidden>→</span>
                </Link>
                {user ? (
                  <Link
                    to="/items"
                    search={{ lend: undefined, cat: undefined, lendOpen: undefined }}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    Lend something
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    search={{ redirectTo: undefined }}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    Join your block
                  </Link>
                )}
              </div>
              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                {[
                  { label: "Today", value: todayLabel },
                  { label: "Pickup confidence", value: "Handoff tools improving (more coming soon)" },
                  { label: "Budget friendly", value: "Free or fair local fees" },
                ].map((point) => (
                  <div key={point.label} className="rounded-2xl border border-border/80 bg-card/80 p-3">
                    <p className="text-xs text-muted-foreground">{point.label}</p>
                    <p className="mt-1 text-sm font-semibold">{point.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:col-span-5" data-reveal="right" data-reveal-delay="120" data-scrub="parallax-slow">
              <HeroCarousel />
             
             

            
            </div>
          </div>
           
        </section>

        {/* First-time explainer */}
        <section className="px-6 pb-20">
          <div className="mx-auto grid max-w-7xl items-start gap-8 rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm sm:p-8 lg:grid-cols-[1.1fr_1fr]">
            <div data-reveal="left">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Start here
              </p>
              <h2 className="text-3xl md:text-4xl">
                New here? Understand everything <span className="italic text-leaf">before your first request.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                PeersPlus is a neighborhood sharing platform. You borrow from nearby people,
                return on time, and grow trust with every exchange.
              </p>

              <p className="mt-3 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                PeersPlus connects community members. Assistance is offered voluntarily by individual users and is not provided by PeersPlus staff.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {firstTimeGuide.map((step, idx) => (
                  <div
                    key={step.n}
                    className="rounded-2xl border border-border bg-background/80 p-4"
                    data-reveal="scale"
                    data-reveal-delay={String(80 + idx * 80)}
                  >
                    <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-clay">
                      {step.n}
                    </p>
                    <h3 className="mb-1.5 text-sm font-semibold">{step.title}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {user ? (
                  <Link
                    to="/items"
                    search={{ lend: undefined, cat: undefined, lendOpen: undefined }}
                    className="rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-leaf-foreground"
                  >
                    Go to listings
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    search={{ redirectTo: undefined }}
                    className="rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-leaf-foreground"
                  >
                    Create free account
                  </Link>
                )}
                <Link to="/safety" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-muted">
                  Read trust & safety
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2" data-reveal="right" data-reveal-delay="120">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-background" style={{ transform: "perspective(900px) rotateY(-7deg) rotateX(2deg)" }}>
                <picture>
                  <source
                    srcSet={`${heroElectronics480Webp} 480w, ${heroElectronics800Webp} 800w`}
                    sizes="(min-width: 640px) 365px, 100vw"
                    type="image/webp"
                  />
                  <img
                    src={heroElectronics600Jpg}
                    alt="Neighbor sharing electronics"
                    width={600}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="h-40 w-full object-cover"
                  />
                </picture>
                <div className="p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Borrow</p>
                  <p className="text-sm">Find useful items near you in minutes.</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-border bg-background" style={{ transform: "perspective(900px) rotateY(7deg) rotateX(2deg)" }}>
                <picture>
                  <source
                    srcSet={`${heroGarden480Webp} 480w, ${heroGarden800Webp} 800w`}
                    sizes="(min-width: 640px) 365px, 100vw"
                    type="image/webp"
                  />
                  <img
                    src={heroGarden600Jpg}
                    alt="Neighbor lending garden tools"
                    width={600}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="h-40 w-full object-cover"
                  />
                </picture>
                <div className="p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lend</p>
                  <p className="text-sm">List once, help your block often.</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-border bg-background sm:col-span-2" style={{ transform: "perspective(900px) rotateX(2deg)" }}>
                <picture>
                  <source
                    srcSet={`${heroHospital480Webp} 480w, ${heroHospital800Webp} 800w`}
                    sizes="(min-width: 640px) 740px, 100vw"
                    type="image/webp"
                  />
                  <img
                    src={heroHospital600Jpg}
                    alt="Community support for hospital visit"
                    width={600}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="h-44 w-full object-cover"
                  />
                </picture>
                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Help</p>
                    <p className="text-sm">Post urgent or everyday requests and get neighborhood support.</p>
                  </div>
                  <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-semibold text-accent">Verified first</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform evidence */}
        <section className="border-y border-border/60 bg-background px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-3xl" data-reveal>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">(01A) Platform evidence</p>
              <h2 className="text-3xl md:text-4xl">What users can see in the product today</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {availabilityLine}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-2xl border border-border bg-card p-5" data-reveal="scale" data-reveal-delay="60">
                <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Borrower journey</p>
                <p className="mt-2 text-sm text-muted-foreground">Browse items, request from owner, chat, and complete return directly in app.</p>
                <Link to="/items" search={{ lend: undefined, cat: undefined, lendOpen: undefined }} className="mt-3 inline-flex text-sm font-semibold text-leaf underline">Open listings</Link>
              </article>

              <article className="rounded-2xl border border-border bg-card p-5" data-reveal="scale" data-reveal-delay="120">
                <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Lender journey</p>
                <p className="mt-2 text-sm text-muted-foreground">Post a lend, review requests, approve neighbors, and manage returns.</p>
                <Link to="/items" search={{ lend: "1", cat: undefined, lendOpen: undefined }} className="mt-3 inline-flex text-sm font-semibold text-leaf underline">Post a lend</Link>
              </article>

              <article className="rounded-2xl border border-border bg-card p-5" data-reveal="scale" data-reveal-delay="180">
                <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Sample verified profile</p>
                <p className="mt-2 text-sm text-muted-foreground">See profile basics, identity signals, and trust indicators used by the community.</p>
                <Link to="/profile" className="mt-3 inline-flex text-sm font-semibold text-leaf underline">View profile</Link>
              </article>

              <article className="rounded-2xl border border-border bg-card p-5" data-reveal="scale" data-reveal-delay="240">
                <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Real listing example</p>
                <p className="mt-2 text-sm text-muted-foreground">Explore active categories and cards exactly as neighbors browse them.</p>
                <Link to="/items" search={{ lend: undefined, cat: "Tools", lendOpen: undefined }} className="mt-3 inline-flex text-sm font-semibold text-leaf underline">Open Tools listings</Link>
              </article>

              <article className="rounded-2xl border border-border bg-card p-5" data-reveal="scale" data-reveal-delay="300">
                <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Product screenshots</p>
                <p className="mt-2 text-sm text-muted-foreground">Live screenshots and user stories are being added as community usage grows.</p>
                <span className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700">Coming soon</span>
              </article>

              <article className="rounded-2xl border border-border bg-card p-5" data-reveal="scale" data-reveal-delay="360">
                <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Community testimonials</p>
                <p className="mt-2 text-sm text-muted-foreground">Early testimonials will be published once verified local borrowing history is available.</p>
                <span className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700">Coming soon</span>
              </article>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="browse" className="bg-muted/40 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-end justify-between gap-6" data-reveal>
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  (01) Collections
                </p>
                <h2 className="text-3xl md:text-4xl">Everything, right around the corner</h2>
              </div>
              <Link to="/items" search={{ lend: undefined, cat: undefined, lendOpen: undefined }} className="hidden text-sm font-medium text-leaf underline decoration-leaf/30 underline-offset-4 md:inline">
                Browse all listings →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {categories.map((c, i) => (
                <Link
                  key={c.label}
                  to="/items"
                  search={{ lend: undefined, cat: undefined, lendOpen: undefined }}
                  id={`cat-${c.label.toLowerCase()}`}
                  data-reveal="scale"
                  data-reveal-delay={String((i % 6) * 60)}
                  className="group flex aspect-square flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-1 hover:shadow-md scroll-mt-24"
                >
                  <div className={`grid size-11 place-items-center rounded-xl text-xl ${c.tone}`}>
                    <span aria-hidden>{c.emoji}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{c.label}</p>
                    <p className="text-[11px] text-muted-foreground">Browse →</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile flow: register → take → return */}
        <section id="how" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 max-w-2xl" data-reveal>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                (02) The neighborhood handshake
              </p>
              <h2 className="mb-4 text-3xl md:text-4xl">
                Register, take, return — <span className="italic text-leaf">right from your phone.</span>
              </h2>
              <p className="text-muted-foreground">
                Three quick screens help neighbors coordinate better. Advanced address verification,
                QR flows, and handoff photo records are being rolled out in phases.
              </p>
            </div>

            <div className="grid gap-10 lg:grid-cols-3">
              {flowSteps.map((step, i) => (
                <div
                  key={step.n}
                  className="flex flex-col items-center text-center"
                  data-reveal="scale"
                  data-reveal-delay={String(i * 140)}
                  data-scrub="tilt"
                >
                  <div className="mb-6 font-mono text-xs font-bold uppercase tracking-[0.3em] text-clay">
                    Step {step.n}
                  </div>
                  {/* Phone frame */}
                  <div className="relative mb-6">
                    <div className="rounded-[2.4rem] border-[10px] border-bark bg-bark p-1 shadow-2xl shadow-bark/25">
                      <div className="relative w-[220px] overflow-hidden rounded-[1.75rem] bg-cream">
                        <div className="flex items-center justify-between px-5 pt-2 text-[9px] font-semibold text-bark/70">
                          <span>9:41</span>
                          <span>••• ▮▮▮</span>
                        </div>
                        <div className="h-[380px] p-4">{step.screen}</div>
                      </div>
                    </div>
                    <div className="absolute left-1/2 top-0 h-1.5 w-16 -translate-x-1/2 rounded-b-lg bg-bark" />
                  </div>
                  <h3 className="mb-2 font-display text-2xl">{step.title}</h3>
                  <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-3" data-scrub="rise">
              {user ? (
                <Link
                  to="/items"
                  search={{ lend: undefined, cat: undefined, lendOpen: undefined }}
                  className="rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/20"
                  data-scrub="cta"
                >
                  Open my feed
                </Link>
              ) : (
                <Link
                  to="/auth"
                  search={{ redirectTo: undefined }}
                  className="rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/20"
                  data-scrub="cta"
                >
                  Register in 30 seconds
                </Link>
              )}
              <Link to="/items" search={{ lend: undefined, cat: undefined, lendOpen: undefined }} className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold">
                See what's nearby
              </Link>
            </div>
          </div>
        </section>

        {/* Emergency band */}
        <section className="bg-cream px-6 pb-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
            <div className="rounded-3xl border border-accent/20 bg-accent/5 p-8 lg:col-span-1" data-reveal="left" data-scrub="rise">
              <div className="mb-4 flex items-center gap-2">
                <span className="size-2 animate-pulse rounded-full bg-accent" />
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  Urgent nearby
                </span>
              </div>
              <h3 className="mb-2 font-display text-2xl">When neighbors need help fast</h3>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Broadcast an urgent request — a wheelchair, oxygen tank, storm-prep gear — and get
                faster visibility in your nearby community.
              </p>
              <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                Coming soon: AI urgent routing and high-priority push alerts
              </p>
              <div className="mb-6 rounded-xl border border-accent/20 bg-accent/10 p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">AI priority match (coming soon)</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Planned feature: urgent requests will be matched to nearby neighbors likely to help,
                  then highlighted with priority delivery.
                </p>
              </div>
              <p className="mb-6 rounded-xl border border-accent/30 bg-background/70 p-3 text-xs leading-relaxed text-muted-foreground">
                PeersPlus connects community members. Assistance is offered voluntarily by individual users and is not provided by PeersPlus staff.
              </p>
              <ul className="space-y-3">
                {emergencies.map((e) => (
                  <li key={e.need} className="rounded-xl border border-accent/15 bg-card p-3">
                    <p className="text-sm font-medium leading-snug">{e.need}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {e.who} · {e.when}
                    </p>
                  </li>
                ))}
              </ul>
              {user ? (
                <Link
                  to="/items"
                  search={{ lend: undefined, cat: undefined, lendOpen: undefined }}
                  className="mt-6 block w-full rounded-xl bg-accent py-3 text-center text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  Post emergency request
                </Link>
              ) : (
                <Link
                  to="/auth"
                  search={{ redirectTo: undefined }}
                  className="mt-6 block w-full rounded-xl bg-accent py-3 text-center text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  Post emergency request
                </Link>
              )}
            </div>

            <div className="lg:col-span-2" data-reveal="right" data-reveal-delay="120">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                (03) Why neighbors choose us
              </p>
              <h2 className="mb-10 text-3xl md:text-4xl">Small favors, big community</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { n: "🤝", t: "Real people", d: "Verified profiles and trust signals are improving in stages as the community grows." },
                  { n: "📸", t: "Handoff records", d: "Photo and QR handoff records are being expanded to more flows." },
                  { n: "💚", t: "Free or fair", d: "Most items are free and any optional lender fee is shown before you request." },
                  { n: "🤖", t: "AI urgent routing", d: "Coming soon: matching urgent requests with nearby relevant owners." },
                ].map((s, i) => (
                  <div
                    key={s.t}
                    className="rounded-2xl border border-border bg-card p-6"
                    data-reveal="scale"
                    data-reveal-delay={String(200 + i * 120)}
                  >
                    <div className="mb-4 grid size-12 place-items-center rounded-full bg-leaf/10 text-2xl">
                      {s.n}
                    </div>
                    <h4 className="mb-2 text-lg font-semibold">{s.t}</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust band */}
        <section id="safety" className="bg-leaf px-6 py-16 text-leaf-foreground">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
            <div className="md:col-span-1" data-reveal="left">
              <h3 className="font-display text-3xl italic">Trust, verified.</h3>
              <p className="mt-3 text-sm text-leaf-foreground/70">
                Verification and trust features are rolling out in stages.
              </p>
            </div>
            <div className="grid gap-4 md:col-span-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { t: "Basic", d: "Phone + email confirmed" },
                { t: "Address", d: "Address checks improving in rollout phases" },
                { t: "Trusted", d: "20+ positive exchanges" },
              ].map((v, i) => (
                <div
                  key={v.t}
                  className="border-l border-leaf-foreground/20 pl-4"
                  data-reveal
                  data-reveal-delay={String(120 + i * 100)}
                >
                  <div className="mb-2 grid size-9 place-items-center rounded-full border border-leaf-foreground/30 text-sm">
                    ✓
                  </div>
                  <p className="font-semibold">{v.t}</p>
                  <p className="text-xs text-leaf-foreground/70">{v.d}</p>
                </div>
              ))}
            </div>

            <div className="md:col-span-4">
              <p className="mb-3 rounded-xl border border-leaf-foreground/25 bg-leaf-foreground/10 px-3 py-2 text-xs leading-relaxed text-leaf-foreground/80">
                PeersPlus connects community members. Assistance is offered voluntarily by individual users and is not provided by PeersPlus staff.
              </p>
              <HomeTrustedFeedback />
            </div>
          </div>
        </section>
        {/* CTA */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-3xl text-center" data-reveal="scale" data-scrub="zoom">
            <h2 className="mb-4 font-display text-4xl md:text-5xl">
              Your block has <span className="italic text-leaf">everything you need.</span>
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join PeersPlus and start borrowing, lending, and meeting your neighbors
              today.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {user ? (
                <Link
                  to="/items"
                  search={{ lend: undefined, cat: undefined, lendOpen: undefined }}
                  className="rounded-full bg-leaf px-8 py-3.5 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/20"
                  data-scrub="cta"
                >
                  Open the app
                </Link>
              ) : (
                <Link
                  to="/auth"
                  search={{ redirectTo: undefined }}
                  className="rounded-full bg-leaf px-8 py-3.5 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/20"
                  data-scrub="cta"
                >
                  Get started — it's free
                </Link>
              )}
              <Link to="/items" search={{ lend: undefined, cat: undefined, lendOpen: undefined }} className="rounded-full border border-border bg-card px-8 py-3.5 text-sm font-semibold" data-scrub="cta">
                See what's nearby
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
