import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    buildSeoHead({
      title: "About us — Peers Plus",
      description:
        "Peers Plus is a free community platform where neighbors share things, help each other, and keep useful items out of landfills.",
      path: "/about",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Our story</p>
        <h1 className="mt-2 font-display text-4xl italic">About Peers Plus</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Peers Plus is a free community platform for neighbors — a friendly place to borrow a ladder, lend a
          wheelchair, ask for a lift to the hospital, or simply share things you rarely use.
        </p>

        <h2 className="mt-10 font-display text-2xl italic">Why we built it</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Every home has a shed, a drawer, or a corner full of things used a few times a year. Meanwhile a
          neighbor two doors down is buying the same thing. We wanted a warm, low-friction way for
          neighborhoods to share what they already have — and to help each other on the small days as well as
          the hard ones.
        </p>

        <h2 className="mt-10 font-display text-2xl italic">What we stand for</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          <li><strong>Free forever</strong> to post, browse and connect.</li>
          <li><strong>Verified neighbors</strong>, not anonymous strangers.</li>
          <li><strong>Less waste</strong>: one shared item replaces many bought and forgotten.</li>
          <li><strong>Community first</strong>: we support connection, not commerce.</li>
        </ul>

        <h2 className="mt-10 font-display text-2xl italic">How we make it work</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Peers Plus provides the platform, the safety guardrails, and the notification plumbing so nearby
          neighbors hear about a request the moment it's posted. All conversations, exchanges and payments
          happen directly between users — we're not responsible for the outcome, but we're always available
          to support you if something goes wrong.
        </p>

        <div className="mt-10 rounded-2xl border border-leaf/30 bg-leaf/5 p-6">
          <p className="font-semibold">Have a question, an idea, or a story to share?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Email us any time at <a className="text-leaf underline" href="mailto:peersplushr@gmail.com">peersplushr@gmail.com</a>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/contact" className="rounded-full bg-leaf px-5 py-2 text-sm font-semibold text-leaf-foreground hover:bg-leaf/90">
              Contact support
            </Link>
            <Link to="/community" className="rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold hover:bg-muted">
              Read our community code
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
