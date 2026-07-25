import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/items" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/items`,
            data: { display_name: displayName, neighborhood },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success(`Welcome to the block, ${displayName || "neighbor"}!`);
          navigate({ to: "/items" });
        } else {
          toast.success(
            `Almost there! We sent a verification link to ${email}. Open it and you're in.`,
            { duration: 9000 },
          );
          toast.info("Tip: check your spam folder if it doesn't arrive in a minute.", {
            duration: 7000,
          });
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/items" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/items" });
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-leaf text-leaf-foreground font-display text-lg">
            P
          </span>
          <span className="font-display text-2xl italic text-leaf">Peers Plus</span>
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
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
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
