import { createFileRoute, Link } from "@tanstack/react-router";
import heroHandoff from "@/assets/hero-handoff.jpg";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";


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

const emergencies = [
  { need: "Wheelchair for visiting grandparent", who: "Example request", when: "Nearby" },
  { need: "Portable generator — power out on 5th Ave", who: "Example request", when: "Nearby" },
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

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
                <Link
                  to="/items"
                  className="inline-flex items-center gap-2 rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/20 transition-transform hover:-translate-y-0.5"
                >
                  Browse nearby
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  to={user ? "/items" : "/auth"}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {user ? "Lend something" : "Join your block"}
                </Link>
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
                    <b className="text-foreground">Be among the first</b> verified neighbors
                  </span>
                </div>
                <div>
                  <b className="text-foreground">Free</b> to join & lend
                </div>
                <div>
                  <b className="text-foreground">Verified</b> people only
                </div>
              </div>
            </div>

            <div className="relative lg:col-span-5">
              <div className="overflow-hidden rounded-[2rem] ring-1 ring-black/5 shadow-2xl shadow-bark/10">
                <img
                  src={heroHandoff}
                  alt="A smiling neighbor handing a wooden toolbox with a drill and hammer to another neighbor on a warm front porch"
                  width={1200}
                  height={1408}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 max-w-[260px] rounded-2xl border border-border bg-card p-4 shadow-xl">
                <div className="mb-3 flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-leaf/15 font-display italic text-leaf">
                    P
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Peers+Help</p>
                    <p className="text-[11px] text-muted-foreground">New on your block</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed italic text-muted-foreground">
                  "Start a sharing circle on your street. List one item and invite a neighbor."
                </p>
              </div>
              <div className="absolute -top-4 right-4 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground shadow-lg">
                🚨 Post the first urgent request
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
              <Link to="/items" className="hidden text-sm font-medium text-leaf underline decoration-leaf/30 underline-offset-4 md:inline">
                Browse all listings →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {categories.map((c) => (
                <Link
                  key={c.label}
                  to="/items"
                  className="group flex aspect-square flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-1 hover:shadow-md"
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
            <div className="mb-14 max-w-2xl">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                (02) The neighborhood handshake
              </p>
              <h2 className="mb-4 text-3xl md:text-4xl">
                Register, take, return — <span className="italic text-leaf">right from your phone.</span>
              </h2>
              <p className="text-muted-foreground">
                Three quick screens keep every exchange safe: verify your address, scan a QR at pickup,
                and snap a return photo. No cash, no awkwardness — just neighbors keeping their word.
              </p>
            </div>

            <div className="grid gap-10 lg:grid-cols-3">
              {flowSteps.map((step) => (
                <div key={step.n} className="flex flex-col items-center text-center">
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

            <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={user ? "/items" : "/auth"}
                className="rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/20"
              >
                {user ? "Open my feed" : "Register in 30 seconds"}
              </Link>
              <Link to="/items" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold">
                See what's nearby
              </Link>
            </div>
          </div>
        </section>

        {/* Emergency band */}
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
              <Link
                to={user ? "/items" : "/auth"}
                className="mt-6 block w-full rounded-xl bg-accent py-3 text-center text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Post emergency request
              </Link>
            </div>

            <div className="lg:col-span-2">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                (03) Why neighbors choose us
              </p>
              <h2 className="mb-10 text-3xl md:text-4xl">Small favors, big community</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  { n: "🤝", t: "Real people", d: "Every neighbor is address-verified. No anonymous accounts, no strangers." },
                  { n: "📸", t: "Photo protection", d: "Both sides snap a photo at pickup and return — no arguments later." },
                  { n: "💚", t: "Free or fair", d: "Most items are free. Rentals are capped, and 100% goes to the lender." },
                ].map((s) => (
                  <div key={s.t} className="rounded-2xl border border-border bg-card p-6">
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
              <Link
                to={user ? "/items" : "/auth"}
                className="rounded-full bg-leaf px-8 py-3.5 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/20"
              >
                {user ? "Open the app" : "Get started — it's free"}
              </Link>
              <Link to="/items" className="rounded-full border border-border bg-card px-8 py-3.5 text-sm font-semibold">
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
