import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    buildSeoHead({
      title: "Privacy — Peers Plus",
      description: "What Peers Plus collects, how we use it, and the controls you have over your neighborhood data.",
      path: "/privacy",
    }),
  component: PrivacyPage,
});

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 font-display text-2xl italic">{children}</h2>;
}

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Privacy</p>
        <h1 className="mt-2 font-display text-4xl italic">Your data on Peers Plus</h1>
        <p className="mt-3 text-muted-foreground">
          This page is maintained by the Peers Plus team to answer common questions about what we store and how we
          use it. It is a plain-language summary, not a legal contract.
        </p>

        <H>What we collect</H>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          <li>Account: email, display name, and optional phone.</li>
          <li>Profile: photo, neighborhood, building/address (visible only after a booking is approved), radius preference.</li>
          <li>Activity: items you list, requests you post, offers to help, bookings, and messages between neighbors.</li>
          <li>Photos captured at pickup and return of an item.</li>
          <li>Basic device information used to keep the app secure.</li>
        </ul>

        <H>How we use it</H>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          <li>To connect you with nearby neighbors inside your chosen radius.</li>
          <li>To send in-app, push and email notifications you asked for. You control each channel in settings.</li>
          <li>To keep a record of pickups and returns so both sides are protected.</li>
          <li>To keep spam, fraud and abuse off the platform.</li>
        </ul>

        <H>Who can see what</H>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          <li>Your display name, photo and neighborhood are visible to signed-in neighbors.</li>
          <li>Your exact address and phone are hidden until you approve a booking or accept an offer.</li>
          <li>Chats are visible only to you and the neighbor you're chatting with.</li>
        </ul>

        <H>Notifications</H>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Turn push, email and daily-digest notifications on or off any time in your settings. You can also
          unsubscribe from any email using the link at the bottom of it.
        </p>

        <H>Deleting your data</H>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          You can delete your requests and listings from the app. To close your account and remove your profile,
          email <a className="text-leaf underline" href="mailto:peersplushr@gmail.com">peersplushr@gmail.com</a> from the
          address on your account and we'll process it.
        </p>

        <H>Security</H>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Traffic is served over HTTPS. Passwords are hashed. Photos are stored privately and served through
          short-lived signed links. Access to user data is limited to the small team that operates Peers Plus.
        </p>

        <H>Contact</H>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Questions or a privacy request? Email <a className="text-leaf underline" href="mailto:peersplushr@gmail.com">peersplushr@gmail.com</a>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
