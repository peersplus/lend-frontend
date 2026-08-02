import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildSeoHead } from "@/lib/seo";

const sitemapSections = [
  {
    title: "Core pages",
    items: [
      { label: "Home", to: "/" },
      { label: "Landing page", to: "/landing" },
      { label: "Browse items", to: "/items" },
      { label: "FAQ", to: "/faq" },
    ],
  },
  {
    title: "Community and trust",
    items: [
      { label: "About us", to: "/about" },
      { label: "Community code", to: "/community" },
      { label: "Safety guide", to: "/safety" },
      { label: "Verification", to: "/verification" },
    ],
  },
  {
    title: "Support and policy",
    items: [
      { label: "Contact support", to: "/contact" },
      { label: "Privacy policy", to: "/privacy" },
      { label: "Sitemap", to: "/sitemap" },
    ],
  },
];

export const Route = createFileRoute("/sitemap")({
  head: () =>
    buildSeoHead({
      title: "HTML Sitemap — Peers Plus",
      description:
        "A human-friendly sitemap for Peers Plus, organized by core pages, community guidance, support, and policy pages.",
      path: "/sitemap",
    }),
  component: SitemapPage,
});

function SitemapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Navigation</p>
          <h1 className="mt-2 font-display text-4xl italic sm:text-5xl">HTML sitemap</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            A simple directory of the main pages on Peers Plus, built for people who want to find the right page quickly.
          </p>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sitemapSections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-2xl italic text-foreground">{section.title}</h2>
              <ul className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="group flex items-center justify-between rounded-2xl border border-transparent px-3 py-2 transition-colors hover:border-leaf/20 hover:bg-leaf/5">
                      <span className="font-medium text-foreground group-hover:text-leaf">{item.label}</span>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Open</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-leaf/20 bg-leaf/5 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-leaf">For search engines</p>
          <div className="mt-3 grid gap-4 text-sm leading-6 text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <p>Primary website for neighborhood lending, borrowing, and community help.</p>
            <p>Trust pages include safety, verification, privacy, and community standards.</p>
            <p>Support pages include contact and FAQ for common user questions.</p>
            <p>Browse items, post requests, and manage your local exchange experience.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
