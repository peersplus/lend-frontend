import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/community")({
  head: () =>
    buildSeoHead({
      title: "Community code — Peers Plus",
      description: "The shared values that keep Peers Plus kind, honest and welcoming for every neighbor.",
      path: "/community",
    }),
  component: CommunityPage,
});

const values = [
  { emoji: "🤝", title: "Be kind", body: "Treat every neighbor like a friend of a friend. Warmth costs nothing." },
  { emoji: "🕊️", title: "Be honest", body: "Describe your item as it is, share your real name and photo, keep promises in chat." },
  { emoji: "⏰", title: "Be on time", body: "Pickup and return times are commitments. If plans change, message early." },
  { emoji: "🧺", title: "Care for borrowed things", body: "Return items clean, charged, and in the condition you'd want to receive them." },
  { emoji: "🙌", title: "Help when you can", body: "Even lending an ear counts. Every small offer strengthens the neighborhood." },
  { emoji: "📣", title: "Speak up", body: "Report anything that feels off — silence lets small problems grow." },
];

function CommunityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Our shared values</p>
        <h1 className="mt-2 font-display text-4xl italic">Community code</h1>
        <p className="mt-3 text-muted-foreground">
          Peers Plus works because neighbors show up for each other. By joining, you agree to hold these small
          promises with everyone you meet here.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-2xl">{v.emoji}</div>
              <p className="mt-2 font-semibold">{v.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 font-display text-2xl italic">What's not allowed</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          <li>Harassment, threats, discrimination or hate speech of any kind.</li>
          <li>Listing weapons, illegal items, medications, alcohol, or anything requiring a license to transfer.</li>
          <li>Posting fake requests, fake reviews or fake stats.</li>
          <li>Taking conversations off-platform to avoid the community code.</li>
          <li>Using another person's account or photos.</li>
        </ul>

        <h2 className="mt-10 font-display text-2xl italic">Enforcement</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Reports go to a human. Depending on severity we may warn, temporarily suspend, or permanently remove an
          account. Email <a className="text-leaf underline" href="mailto:peersplushr@gmail.com">peersplushr@gmail.com</a> with
          the request or booking link and a short description.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
