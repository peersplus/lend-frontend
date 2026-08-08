import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Home } from "lucide-react";
import { toast } from "@/lib/sonner";
import { LOGO_URL } from "@/lib/brand";
import { buildSeoHead } from "@/lib/seo";
import {
  sendForgotPasswordEmail,
  getFirebaseAuthErrorMessage,
  getFirebaseClient,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/firebase";


export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirectTo: typeof s.redirectTo === "string" ? s.redirectTo : undefined,
  }),
  head: () =>
    buildSeoHead({
      title: "Join Peers Plus — Sign in or create your neighbor account",
      description:
        "Verify your address, meet the neighbors, and start borrowing or lending items nearby.",
      path: "/auth"
    }),
  component: AuthPage,
});

const trustPoints = [
  "Verified neighbors, not anonymous listings.",
  "Borrow and lend local items with clear pickup terms.",
  "Keep your exact address private until you approve an exchange.",
];

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; title: string; description?: string } | null>(null);

  function goAfterAuth() {
    const target = search.redirectTo && search.redirectTo.startsWith("/")
      ? search.redirectTo
      : "/items";
    window.location.assign(target);
  }

  useEffect(() => {
    const client = getFirebaseClient();
    if (client?.auth.currentUser) {
      goAfterAuth();
    }
  }, [navigate, search.redirectTo]);

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
        goAfterAuth();
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
      goAfterAuth();
    } catch (err) {
      const errorMessage = getFirebaseAuthErrorMessage(err);
      setFeedback({ type: "error", title: errorMessage.title, description: errorMessage.description });
      toast.error(errorMessage.title, {
        description: errorMessage.description,
        duration: 6000,
      });
    }
  }

  async function handleForgotPassword() {
    setForgotBusy(true);
    setFeedback(null);
    try {
      await sendForgotPasswordEmail(email);
      toast.success("Password reset email sent.", {
        description: "Check your inbox for the reset link.",
      });
      setFeedback({
        type: "success",
        title: "Password reset email sent",
        description: "Please open the link in your inbox to set a new password.",
      });
      setForgotOpen(false);
    } catch (err) {
      const errorMessage = getFirebaseAuthErrorMessage(err);
      toast.error(errorMessage.title, { description: errorMessage.description });
      setFeedback({ type: "error", title: errorMessage.title, description: errorMessage.description });
    } finally {
      setForgotBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(170,210,139,0.35),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(248,203,141,0.24),_transparent_30%),linear-gradient(180deg,_#fbfaf6_0%,_#f6f1e8_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <Link
        to="/"
        id="auth-home-top-link"
        data-testid="auth-home-top-link"
        aria-label="Go home"
        className="fixed right-4 top-4 z-30 inline-flex size-11 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-lg transition-colors hover:bg-muted sm:right-6 sm:top-6"
      >
        <Home className="h-4 w-4" />
      </Link>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-6 lg:grid lg:items-center lg:grid-cols-[1.05fr_0.95fr]">
        <section className="order-2 relative overflow-hidden rounded-[2rem] border border-white/60 bg-[var(--leaf)] px-8 py-10 text-white shadow-[0_25px_80px_rgba(15,23,42,0.35)] sm:px-10 sm:py-12 lg:order-1">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(166,199,111,0.28),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_24%)]" />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2" aria-label="Peers Plus home">
              <img src={LOGO_URL} alt="Peers Plus" className="h-10 w-auto brightness-0 invert" />
            </Link>

            <div className="mt-6 max-w-xl space-y-6">
              <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                Secure neighborhood access
              </p>
              <div className="space-y-4">
                <h1 className="font-display text-4xl leading-tight sm:text-5xl">
                  A better way to join your neighborhood exchange.
                </h1>
                <p className="max-w-lg text-base leading-7 text-white/72 sm:text-lg">
                  Sign in with a clean, trust-first experience built for borrowing, lending, and helping nearby neighbors.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {trustPoints.map((point) => (
                  <div key={point} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/82 backdrop-blur">
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 rounded-[2rem] border border-border/70 bg-card/95 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:p-8 lg:order-2">
          <div className="flex items-start gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Welcome</p>
              <h2 className="mt-2 font-display text-3xl leading-tight">
                {mode === "signin" ? "Sign in" : "Create your account"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {mode === "signin"
                  ? "Get back to browsing items, messages, and requests."
                  : "Create a verified account and keep your address private."}
              </p>
            </div>
          </div>

          {feedback && (
            <div
              role="alert"
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${feedback.type === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-red-300 bg-red-50 text-red-700"}`}
            >
              <p className="font-semibold">{feedback.title}</p>
              {feedback.description && <p className="mt-1 text-xs leading-5">{feedback.description}</p>}
            </div>
          )}

          <button
            type="button"
            id="auth-google-signin-button"
            name="authGoogleSignin"
            data-testid="auth-google-signin-button"
            onClick={handleGoogle}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background py-3 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <span className="grid size-5 place-items-center rounded-full bg-white text-xs font-bold text-[#4285F4]">
              G
            </span>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <input
                  required
                  id="auth-signup-display-name-input"
                  name="displayName"
                  data-testid="auth-signup-display-name-input"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-leaf/40"
                />
                <input
                  required
                  id="auth-signup-neighborhood-input"
                  name="neighborhood"
                  data-testid="auth-signup-neighborhood-input"
                  placeholder="Neighborhood (e.g. Maplewood)"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-leaf/40"
                />
              </>
            )}
            <input
              required
              type="email"
              id="auth-email-input"
              name="email"
              data-testid="auth-email-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-leaf/40"
            />
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                minLength={6}
                id="auth-password-input"
                name="password"
                data-testid="auth-password-input"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 pr-11 text-sm outline-none transition-shadow focus:ring-2 focus:ring-leaf/40"
              />
              <button
                type="button"
                id="auth-toggle-password-button"
                name="togglePasswordVisibility"
                data-testid="auth-toggle-password-button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === "signin" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  id="auth-forgot-password-open-button"
                  name="openForgotPassword"
                  data-testid="auth-forgot-password-open-button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-semibold text-leaf underline underline-offset-4"
                >
                  Forgot password?
                </button>
              </div>
            )}
            <button
              type="submit"
              id="auth-submit-button"
              name="authSubmit"
              data-testid="auth-submit-button"
              disabled={busy}
              className="w-full rounded-2xl bg-leaf py-3 text-sm font-semibold text-leaf-foreground shadow-lg shadow-leaf/20 transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "New neighbor? " : "Already a member? "}
            <button
              type="button"
              id="auth-switch-mode-button"
              name="switchAuthMode"
              data-testid="auth-switch-mode-button"
              onClick={() => {
                setFeedback(null);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="font-semibold text-leaf underline underline-offset-4"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </section>

        {forgotOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setForgotOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-6 shadow-xl">
              <h2 className="font-display text-2xl">Reset password</h2>
              <p className="text-sm text-muted-foreground">
                We will send a password reset link to your email.
              </p>
              <input
                type="email"
                id="auth-forgot-password-email-input"
                name="forgotPasswordEmail"
                data-testid="auth-forgot-password-email-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leaf/40"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  id="auth-forgot-password-cancel-button"
                  name="cancelForgotPassword"
                  data-testid="auth-forgot-password-cancel-button"
                  onClick={() => setForgotOpen(false)}
                  className="rounded-xl border border-border py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="auth-forgot-password-submit-button"
                  name="submitForgotPassword"
                  data-testid="auth-forgot-password-submit-button"
                  onClick={() => void handleForgotPassword()}
                  disabled={forgotBusy}
                  className="rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground disabled:opacity-60"
                >
                  {forgotBusy ? "Sending..." : "Send reset link"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
