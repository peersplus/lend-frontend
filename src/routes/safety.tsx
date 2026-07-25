import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety guide — Peers Plus" },
      { name: "description", content: "Simple habits that keep neighborly borrowing, lending and helping safe on Peers Plus." },
      { property: "og:title", content: "Safety guide — Peers Plus" },
      { property: "og:description", content: "Meeting neighbors, handling items, and staying safe in-person and in-app." },
    ],
  }),
  component: SafetyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl italic text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function SafetyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Trust & safety</p>
        <h1 className="mt-2 font-display text-4xl italic">Safety guide</h1>
        <p className="mt-3 text-muted-foreground">
          Peers Plus is built on trust between neighbors. These habits keep every exchange smooth, respectful and safe.
        </p>

        <Section title="Before you meet">
          <ul className="list-disc space-y-2 pl-5">
            <li>Chat inside Peers Plus until you feel comfortable — don't share phone or address off-platform before agreeing.</li>
            <li>Check the other person's profile: verified email, photo, neighborhood and past activity.</li>
            <li>Agree on the item, price, deposit, pickup time and return date <em>in writing in the chat</em>.</li>
          </ul>
        </Section>

        <Section title="Meeting in person">
          <ul className="list-disc space-y-2 pl-5">
            <li>Prefer a public spot — building lobby, café, or your doorstep during daylight.</li>
            <li>Bring someone with you if the item is large, or the request is a companionship / hospital visit.</li>
            <li>Take a photo of the item at pickup and again at return. Peers Plus stores these against the booking.</li>
          </ul>
        </Section>

        <Section title="Handling money">
          <ul className="list-disc space-y-2 pl-5">
            <li>Payments are <strong>cash on return</strong>. Never wire money in advance to unlock an item.</li>
            <li>The deposit / full-item price for defects is shown on every listing before you request — read it.</li>
            <li>If the item is damaged, take dated photos before returning and note it in chat.</li>
          </ul>
        </Section>

        <Section title="Urgent & medical requests">
          <ul className="list-disc space-y-2 pl-5">
            <li>For a true emergency (fire, injury, crime) call your local emergency number first — Peers Plus is a neighborly assist, not an emergency service.</li>
            <li>Urgent requests fan out to nearby neighbors immediately; verify identity before opening your door.</li>
          </ul>
        </Section>

        <Section title="If something goes wrong">
          <ul className="list-disc space-y-2 pl-5">
            <li>Keep the conversation inside Peers Plus — screenshots and photos help us support you.</li>
            <li>Email <a className="text-leaf underline" href="mailto:peersplushr@gmail.com">peersplushr@gmail.com</a> with the booking or request link.</li>
            <li>Block the other user from your <Link to="/settings" className="text-leaf underline">settings</Link> if you feel unsafe.</li>
          </ul>
        </Section>

        <div className="mt-12 rounded-2xl border border-dashed border-border bg-muted/40 p-5 text-xs text-muted-foreground">
          Peers Plus is a free community platform. We help neighbors connect — all exchanges happen directly between users.
          Peers Plus is not responsible for any communication, agreement, damage or loss between neighbors.
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
