import { createFileRoute, Link } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildSeoHead } from "@/lib/seo";

const faqs = [
  {
    id: "what-is-peers-plus",
    question: "What is Peers Plus?",
    answer:
      "Peers Plus is a neighborhood sharing platform where people can borrow, lend, and request help from verified neighbors nearby. It is designed for everyday items, occasional-use equipment, and local support.",
  },
  {
    id: "how-does-it-work",
    question: "How does it work?",
    answer:
      "Create an account, verify your neighborhood, then browse items or post a request. When both sides agree, you coordinate pickup and return directly in chat, with photos and QR confirmation to keep the exchange clear.",
  },
  {
    id: "is-it-free",
    question: "Is Peers Plus free to use?",
    answer:
      "Yes. Browsing, posting, messaging, and community participation are free. Some items may be offered for rent or with a deposit, but the platform itself is free to join and use.",
  },
  {
    id: "what-can-i-borrow",
    question: "What kinds of things can I borrow?",
    answer:
      "Common categories include tools, garden equipment, party supplies, baby items, mobility aids, kitchen gear, sports equipment, and emergency help. Listings and requests should stay within the community guidelines.",
  },
  {
    id: "how-do-you-keep-it-safe",
    question: "How do you keep exchanges safe?",
    answer:
      "We encourage verified profiles, in-app chat, pickup and return photos, QR handoff confirmation, and clear written agreements. Our safety guide also explains how to meet in person and handle money responsibly.",
  },
  {
    id: "what-if-something-goes-wrong",
    question: "What if something goes wrong?",
    answer:
      "If you have a dispute, damaged item, safety concern, or account issue, contact the team right away with the booking or request link. We review reports manually and help where we can.",
  },
  {
    id: "can-i-delete-my-account",
    question: "Can I delete my account or data?",
    answer:
      "Yes. You can remove your own listings and requests from the app. To close your account and request profile removal, email the support team from the address tied to your account.",
  },
  {
    id: "who-can-see-my-details",
    question: "Who can see my details?",
    answer:
      "Your display name, photo, and neighborhood are visible to signed-in neighbors. Your exact address, phone number, and private exchange details stay hidden until you approve an exchange.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export const Route = createFileRoute("/faq")({
  head: () =>
    buildSeoHead({
      title: "FAQ — Peers Plus",
      description:
        "Answers to the most common questions about borrowing, lending, safety, verification, and support on Peers Plus.",
      path: "/faq",
    }),
  component: FAQPage,
});

function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Support</p>
          <h1 className="mt-2 font-display text-4xl italic sm:text-5xl">Frequently asked questions</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Clear answers for people who want to borrow, lend, or ask for help without guessing how the platform works.
          </p>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pr-6 text-sm leading-7 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-leaf/20 bg-leaf/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Need support?</p>
              <h2 className="mt-2 font-display text-2xl italic">Talk to a human</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                For account issues, safety concerns, or partnership questions, the team reads every message.
              </p>
              <a
                href="mailto:support@peersplus.com?subject=PeersPlus%20support"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-leaf-foreground transition-colors hover:bg-leaf/90"
              >
                Email support
              </a>
            </div>

            <div className="rounded-3xl border border-border bg-muted/40 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Helpful links</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link to="/safety" className="text-leaf hover:underline">
                    Read the safety guide
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="text-leaf hover:underline">
                    Review the community code
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-leaf hover:underline">
                    Contact support
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
