import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LOGO_URL } from "@/lib/brand";
import {
  getFirebaseAuthErrorMessage,
  getFirebaseClient,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/firebase";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Join Peers Plus — Sign in or create your neighbor account" },
      {
        name: "description",
        content:
          "Verify your address, meet the neighbors, and start borrowing or lending items nearby.",
      },
      { property: "og:title", content: "Join Peers Plus" },
      {
        property: "og:description",
        content: "Sign in or create your verified neighbor account.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; title: string; description?: string } | null>(null);

  useEffect(() => {
    const client = getFirebaseClient();
    if (client?.auth.currentUser) {
      navigate({ to: "/items", search: {} });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      if (mode === "signup") {
        await signUpWithEmail({ email, password, displayName, neighborhood });
        setMode("signin");
        setPassword("");
        setFeedback({
          type: "success",
          title: "Verification email sent",
          description: "Please check your inbox, verify your account, and then sign in.",
        });
        toast.success("Verification email sent. Please verify your account.");
      } else {
        await signInWithEmail({ email, password });
        toast.success("Welcome back!");
        navigate({ to: "/items", search: {} });
      }
    } catch (err) {
      const errorMessage = getFirebaseAuthErrorMessage(err);
      if (mode === "signup" && errorMessage.title.includes("already registered")) {
        setMode("signin");
      }
      setFeedback({ type: "error", title: errorMessage.title, description: errorMessage.description });
      toast.error(errorMessage.title, {
        description: errorMessage.description,
        duration: 6000,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setFeedback(null);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google");
      navigate({ to: "/items", search: {} });
    } catch (err) {
      const errorMessage = getFirebaseAuthErrorMessage(err);
      setFeedback({ type: "error", title: errorMessage.title, description: errorMessage.description });
      toast.error(errorMessage.title, {
        description: errorMessage.description,
        duration: 6000,
      });
    }
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2" aria-label="Peers Plus home">
          <img src={LOGO_URL} alt="Peers Plus" className="h-10 w-auto" />
        </Link>


        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
          <h1 className="mb-2 font-display text-3xl">
            {mode === "signin" ? "Welcome back" : "Join the neighborhood"}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to borrow, lend, and message neighbors."
              : "Create a verified account. Your address stays private."}
          </p>

          {feedback && (
            <div
              role="alert"
              className={`mb-4 rounded-xl border px-3 py-2 text-sm ${feedback.type === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-red-300 bg-red-50 text-red-700"}`}
            >
              <p className="font-semibold">{feedback.title}</p>
              {feedback.description && <p className="mt-1 text-xs">{feedback.description}</p>}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <span className="grid size-5 place-items-center rounded-full bg-white text-xs font-bold text-[#4285F4]">
              G
            </span>
            Continue with Google
          </button>

          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <input
                  required
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leaf/40"
                />
                <input
                  required
                  placeholder="Neighborhood (e.g. Maplewood)"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leaf/40"
                />
              </>
            )}
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leaf/40"
            />
            <input
              required
              type="password"
              minLength={6}
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leaf/40"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/20 disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "New neighbor? " : "Already a member? "}
            <button
              type="button"
              onClick={() => {
                setFeedback(null);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="font-semibold text-leaf underline underline-offset-4"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
