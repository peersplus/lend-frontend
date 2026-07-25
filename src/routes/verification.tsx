import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: "Verification — Peers+Help" },
      { name: "description", content: "How Peers+Help verifies neighbors so you know who you're borrowing from and lending to." },
      { property: "og:title", content: "Verification — Peers+Help" },
      { property: "og:description", content: "Email, phone, address, and photo checks that build trust between neighbors." },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  const levels = [
    { badge: "✉️", title: "Email verified", body: "Every account confirms their email before posting or requesting." },
    { badge: "📱", title: "Phone number", body: "Optional phone verification unlocks direct call from an approved chat." },
    { badge: "🏠", title: "Neighborhood & address", body: "You set your building or street — used only to match you with nearby requests within your radius." },
    { badge: "🪪", title: "Photo & display name", body: "A clear photo and real first name help neighbors recognize you at the door." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Trust & safety</p>
        <h1 className="mt-2 font-display text-4xl italic">Verification</h1>
        <p className="mt-3 text-muted-foreground">
          Peers+Help asks every neighbor to verify a few basics. It's how a stranger becomes someone you'd hand a
          ladder to.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {levels.map((l) => (
            <div key={l.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-2xl">{l.badge}</div>
              <p className="mt-2 font-semibold">{l.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{l.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 font-display text-2xl italic">What verification does — and doesn't do</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          <li>Verification confirms someone owns the email, phone and photo they claim. It does <strong>not</strong> guarantee behavior.</li>
          <li>Always use the <Link className="text-leaf underline" to="/safety">safety guide</Link> and trust your gut.</li>
          <li>You can hide your exact address — only your neighborhood and radius are shared until a booking is approved.</li>
        </ul>

        <div className="mt-8 rounded-2xl border border-leaf/30 bg-leaf/5 p-5">
          <p className="font-semibold">Complete your verification</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your photo, neighborhood, and phone from your profile.</p>
          <Link to="/profile" className="mt-3 inline-block rounded-full bg-leaf px-5 py-2 text-sm font-semibold text-leaf-foreground hover:bg-leaf/90">
            Go to profile
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
