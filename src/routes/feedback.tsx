import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { submitAppFeedbackApi } from "@/lib/api-peers";
import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/feedback")({
  head: () =>
    buildSeoHead({
      title: "Feedback and ideas - Peers Plus",
      description: "Share your product feedback and feature ideas with the Peers Plus team.",
      path: "/feedback",
    }),
  component: FeedbackPage,
});

function FeedbackPage() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  const [category, setCategory] = useState<"feedback" | "idea">("feedback");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedMessage = message.trim();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedMessage) {
      setErrorMessage("Please write your feedback before submitting.");
      return;
    }

    if (!isLoggedIn && !trimmedEmail) {
      setErrorMessage("Please enter your email so we can save your feedback.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitAppFeedbackApi({
        category,
        message: trimmedMessage,
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(!isLoggedIn && trimmedEmail ? { email: trimmedEmail } : {}),
      });

      if (!isLoggedIn && result.existing_email) {
        setSuccessMessage("Thanks. This email already exists in Peers Plus, so we saved it as user feedback.");
      } else {
        setSuccessMessage("Thanks for sharing. Your feedback has been saved.");
      }

      setMessage("");
      if (!isLoggedIn) {
        setName("");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not submit feedback right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-leaf">Community input</p>
        <h1 className="mt-2 font-display text-4xl italic">Feedback and ideas</h1>
        <p className="mt-3 text-muted-foreground">
          Tell us what is working, what is missing, and what we should build next.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCategory("feedback")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${category === "feedback" ? "bg-leaf text-leaf-foreground" : "border border-border bg-background text-foreground"}`}
              >
                Feedback
              </button>
              <button
                type="button"
                onClick={() => setCategory("idea")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${category === "idea" ? "bg-leaf text-leaf-foreground" : "border border-border bg-background text-foreground"}`}
              >
                Idea
              </button>
            </div>
          </div>

          {!isLoggedIn && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="feedback-name" className="mb-1 block text-sm font-medium">Name (optional)</label>
                <input
                  id="feedback-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="feedback-email" className="mb-1 block text-sm font-medium">Email</label>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
          )}

          {isLoggedIn && (
            <div className="rounded-lg border border-leaf/30 bg-leaf/5 px-3 py-2 text-sm text-muted-foreground">
              Signed in as {user?.email || "your account"}. You can submit directly.
            </div>
          )}

          <div>
            <label htmlFor="feedback-message" className="mb-1 block text-sm font-medium">Message</label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Share your feedback or idea..."
              required
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          )}

          {successMessage && (
            <p className="rounded-lg border border-leaf/30 bg-leaf/5 px-3 py-2 text-sm text-leaf">{successMessage}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-leaf-foreground disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
