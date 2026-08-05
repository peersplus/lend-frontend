import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    buildSeoHead({
      title: "Contact support — Peers Plus",
      description:
        "Reach the Peers Plus team by email for support, safety reports, and partnership questions.",
      path: "/contact",
    }),
  component: ContactPage,
});

const topics = [
  { title: "Safety concern", body: "Someone made you feel unsafe, or you saw a request that doesn't belong." },
  { title: "Booking dispute", body: "Damaged item, no-show, or disagreement about a deposit." },
  { title: "Account help", body: "Sign-in trouble, verification, deleting your account or data." },
  { title: "Idea or feedback", body: "Something we should build, fix, or do differently." },
];

function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Support</p>
        <h1 className="mt-2 font-display text-4xl italic">Contact us</h1>
        <p className="mt-3 text-muted-foreground">
          We're a small team. Every message goes to a human and we usually reply within a business day.
        </p>

        <div className="mt-8 rounded-2xl border border-leaf/40 bg-leaf/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-leaf">Email support</p>
          <a
            href="mailto:peersplushr@gmail.com"
            className="mt-2 block font-display text-3xl italic text-foreground hover:text-leaf"
          >
            peersplushr@gmail.com
          </a>
          <p className="mt-3 text-sm text-muted-foreground">
            Include the request or booking link, and a short description of what happened. Screenshots help.
          </p>
          <a
            href="mailto:peersplushr@gmail.com?subject=PeersPlus%20support%20request"
            className="mt-4 inline-block rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-leaf-foreground hover:bg-leaf/90"
          >
            Open email
          </a>
        </div>

        <h2 className="mt-12 font-display text-2xl italic">Common topics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {topics.map((t) => (
            <div key={t.title} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-semibold">{t.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 font-display text-2xl italic">Before you write</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          <li>Check the <Link to="/safety" className="text-leaf underline">safety guide</Link> and the <Link to="/community" className="text-leaf underline">community code</Link>.</li>
          <li>For anything urgent involving physical safety, call your local emergency number first.</li>
          <li>Peers Plus does not mediate cash payments — but we do help investigate abuse or fraud reports.</li>
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
