import { createFileRoute } from "@tanstack/react-router";
import heroNeighbors from "@/assets/hero-neighbors.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Peers Plus and Help — Borrow, lend, and share with your neighbors" },
      {
        name: "description",
        content:
          "A trusted neighborhood platform to borrow, rent, or receive household items from verified people nearby. Tools, medical gear, party supplies, baby equipment and more.",
      },
      { property: "og:title", content: "Peers Plus and Help — Your neighborhood library of things" },
      {
        property: "og:description",
        content:
          "Borrow a ladder, lend a hand. Access what you need from verified neighbors — for free or a small fee.",
      },
      { name: "twitter:title", content: "Peers Plus and Help" },
      {
        name: "twitter:description",
        content: "Borrow, rent, or share household items with verified neighbors nearby.",
      },
    ],
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

const listings = [
  {
    title: "Extension Ladder",
    owner: "Sarah M.",
    distance: "0.4 mi",
    price: "Free",
    priceKind: "free" as const,
    badge: "Trusted Member",
    rating: 4.9,
    category: "Tools",
  },
  {
    title: "Cordless Power Drill",
    owner: "Marcus L.",
    distance: "0.8 mi",
    price: "$8 / day",
    priceKind: "rent" as const,
    badge: "ID Verified",
    rating: 5.0,
    category: "Tools",
  },
  {
    title: "Folding Wheelchair",
    owner: "Maple St. Assoc.",
    distance: "1.1 mi",
    price: "Free",
    priceKind: "free" as const,
    badge: "Address Verified",
    rating: 4.8,
    category: "Medical",
  },
  {
    title: "10×20 Party Tent",
    owner: "Elena R.",
    distance: "1.6 mi",
    price: "$45 / day",
    priceKind: "rent" as const,
    badge: "Trusted Member",
    rating: 4.9,
    category: "Party",
  },
];

const emergencies = [
  { need: "Wheelchair for visiting grandparent", who: "David K.", when: "10 min ago" },
  { need: "Portable generator — power out on 5th Ave", who: "Priya S.", when: "35 min ago" },
];

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-leaf text-leaf-foreground font-display text-lg">
                P
              </span>
              <span className="font-display text-2xl italic text-leaf">Peers+Help</span>
            </a>
            <div className="hidden items-center gap-2 rounded-full bg-muted px-3 py-1.5 ring-1 ring-border md:flex">
              <span className="size-2 animate-pulse rounded-full bg-leaf" />
              <span className="text-xs font-medium text-muted-foreground">Maplewood Village</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#browse" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline">
              Browse
            </a>
            <a href="#how" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline">
              How it works
            </a>
            <a href="#safety" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline">
              Trust & safety
            </a>
            <button className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90">
              Sign in
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="px-6 pt-16 pb-20 md:pt-24">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-accent" />
                Neighbors helping neighbors, one shed at a time
              </div>
              <h1 className="mb-6 text-balance font-display text-5xl leading-[1.05] md:text-7xl">
                Borrow a ladder. <span className="italic text-leaf">Lend a hand.</span>
              </h1>
              <p className="mb-10 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Your neighborhood library of things. Access tools, medical gear, party supplies and
                more from verified neighbors — for free or a small fee. Built on trust, not
                transactions.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/20 transition-transform hover:-translate-y-0.5">
                  Request an item
                  <span aria-hidden>→</span>
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                  Lend something
                </button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="inline-flex -space-x-2">
                    <span className="size-7 rounded-full border-2 border-background bg-clay/40" />
                    <span className="size-7 rounded-full border-2 border-background bg-leaf/40" />
                    <span className="size-7 rounded-full border-2 border-background bg-amber-400/50" />
                    <span className="size-7 rounded-full border-2 border-background bg-sky-400/40" />
                  </span>
                  <span>
                    <b className="text-foreground">2,400+</b> verified neighbors
                  </span>
                </div>
                <div>
                  <b className="text-foreground">$180k+</b> saved this year
                </div>
                <div>
                  <b className="text-foreground">450 tons</b> kept out of landfills
                </div>
              </div>
            </div>

            <div className="relative lg:col-span-5">
              <div className="overflow-hidden rounded-[2rem] ring-1 ring-black/5 shadow-2xl shadow-bark/10">
                <img
                  src={heroNeighbors}
                  alt="Two neighbors sharing a garden tool over a wooden fence in warm afternoon light"
                  width={1200}
                  height={1400}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 max-w-[260px] rounded-2xl border border-border bg-card p-4 shadow-xl">
                <div className="mb-3 flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-leaf/15 font-display italic text-leaf">
                    M
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Marcus K.</p>
                    <p className="text-[11px] text-muted-foreground">Trusted Member · 4.9 ★</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed italic text-muted-foreground">
                  "Borrowed a pressure washer for $5. Saved $200 and made a new friend."
                </p>
              </div>
              <div className="absolute -top-4 right-4 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground shadow-lg">
                🚨 2 urgent requests nearby
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="browse" className="bg-muted/40 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  (01) Collections
                </p>
                <h2 className="text-3xl md:text-4xl">Everything, right around the corner</h2>
              </div>
              <a href="#" className="hidden text-sm font-medium text-leaf underline decoration-leaf/30 underline-offset-4 md:inline">
                All 14 categories →
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {categories.map((c) => (
                <button
                  key={c.label}
                  className="group flex aspect-square flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className={`grid size-11 place-items-center rounded-xl text-xl ${c.tone}`}>
                    <span aria-hidden>{c.emoji}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{c.label}</p>
                    <p className="text-[11px] text-muted-foreground">Browse →</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Nearby feed */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  (02) Available near you
                </p>
                <h2 className="text-3xl md:text-4xl">On your block this week</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
                <span className="text-muted-foreground">Radius:</span>
                <span className="font-semibold">2.5 miles</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-medium text-leaf">Change</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {listings.map((item) => (
                <article
                  key={item.title}
                  className="group flex cursor-pointer flex-col gap-4"
                >
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5">
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-muted to-cream">
                      <span className="font-display text-3xl italic text-muted-foreground/60">
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute left-3 top-3 flex gap-2">
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-tight backdrop-blur ${
                          item.priceKind === "free"
                            ? "bg-leaf/90 text-leaf-foreground"
                            : "bg-foreground/85 text-background"
                        }`}
                      >
                        {item.price}
                      </span>
                    </div>
                    <div className="absolute right-3 top-3 rounded-md bg-background/85 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur">
                      {item.distance}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <span className="mt-1 shrink-0 text-xs font-semibold text-foreground">
                        {item.rating} ★
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Shared by {item.owner}</p>
                    <span className="mt-3 inline-block rounded bg-leaf/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-leaf">
                      {item.badge}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Emergency + how it works */}
        <section className="bg-cream px-6 pb-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
            <div className="rounded-3xl border border-accent/20 bg-accent/5 p-8 lg:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <span className="size-2 animate-pulse rounded-full bg-accent" />
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  Urgent nearby
                </span>
              </div>
              <h3 className="mb-2 font-display text-2xl">When neighbors need help fast</h3>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Broadcast an urgent request — a wheelchair, oxygen tank, storm-prep gear — and get
                priority notifications to everyone in your radius.
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
              <button className="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                Post emergency request
              </button>
            </div>

            <div id="how" className="lg:col-span-2">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                (03) How it works
              </p>
              <h2 className="mb-10 text-3xl md:text-4xl">The neighborhood handshake</h2>
              <ol className="grid gap-6 sm:grid-cols-3">
                {[
                  {
                    n: "1",
                    t: "Join the circle",
                    d: "Verify your address and phone. We keep it neighbors-only, so everyone knows everyone.",
                  },
                  {
                    n: "2",
                    t: "Ask or offer",
                    d: "Post what you need or list what you own. Neighbors in your radius are gently notified.",
                  },
                  {
                    n: "3",
                    t: "Meet & scan",
                    d: "Scan a QR at pickup and return — photos on both ends keep it fair for everyone.",
                  },
                ].map((s) => (
                  <li
                    key={s.n}
                    className="rounded-2xl border border-border bg-card p-6"
                  >
                    <div className="mb-4 grid size-12 place-items-center rounded-full bg-leaf/10 font-display text-2xl italic text-leaf">
                      {s.n}
                    </div>
                    <h4 className="mb-2 text-lg font-semibold">{s.t}</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Trust band */}
        <section id="safety" className="bg-leaf px-6 py-16 text-leaf-foreground">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <h3 className="font-display text-3xl italic">Trust, verified.</h3>
              <p className="mt-3 text-sm text-leaf-foreground/70">
                Four levels of verification keep the community safe.
              </p>
            </div>
            {[
              { t: "Basic", d: "Phone + email confirmed" },
              { t: "Address", d: "Mail-verified home address" },
              { t: "ID", d: "Government ID matched" },
              { t: "Trusted", d: "20+ positive exchanges" },
            ].map((v) => (
              <div key={v.t} className="border-l border-leaf-foreground/20 pl-4">
                <div className="mb-2 grid size-9 place-items-center rounded-full border border-leaf-foreground/30 text-sm">
                  ✓
                </div>
                <p className="font-semibold">{v.t}</p>
                <p className="text-xs text-leaf-foreground/70">{v.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 font-display text-4xl md:text-5xl">
              Your block has <span className="italic text-leaf">everything you need.</span>
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join Peers Plus and Help and start borrowing, lending, and meeting your neighbors
              today.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button className="rounded-full bg-leaf px-8 py-3.5 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/20">
                Get started — it's free
              </button>
              <button className="rounded-full border border-border bg-card px-8 py-3.5 text-sm font-semibold">
                See what's nearby
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-leaf text-leaf-foreground font-display text-sm">
              P
            </span>
            <span className="font-display text-xl italic text-leaf">Peers+Help</span>
          </div>
          <nav className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <a href="#" className="hover:text-leaf">Safety guide</a>
            <a href="#" className="hover:text-leaf">Verification</a>
            <a href="#" className="hover:text-leaf">Community code</a>
            <a href="#" className="hover:text-leaf">Privacy</a>
          </nav>
          <p className="text-xs text-muted-foreground">
            © 2026 Peers Plus and Help · Built for the block
          </p>
        </div>
      </footer>
    </div>
  );
}
