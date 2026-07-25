import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Item = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price_mode: "free" | "rent";
  price_amount: number | null;
  distance_hint: string | null;
  image_url: string | null;
  owner_id: string;
  created_at: string;
};

export const Route = createFileRoute("/items")({
  head: () => ({
    meta: [
      { title: "Browse nearby items — Peers+Help" },
      {
        name: "description",
        content:
          "Discover tools, medical gear, party supplies and more available to borrow or rent from verified neighbors.",
      },
      { property: "og:title", content: "Browse nearby items — Peers+Help" },
      {
        property: "og:description",
        content: "Borrow or rent household items from verified neighbors near you.",
      },
    ],
  }),
  component: ItemsPage,
});

const categories = [
  "Tools",
  "Garden",
  "Medical",
  "Party",
  "Baby",
  "Kitchen",
  "Camping",
  "Cleaning",
  "Sports",
  "Pets",
  "Furniture",
  "Emergency",
];

function ItemsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Tools",
    price_mode: "free" as "free" | "rent",
    price_amount: "",
    image_url: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) toast.error(error.message);
    setItems((data as Item[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("items").insert({
      owner_id: user.id,
      title: form.title,
      description: form.description || null,
      category: form.category,
      price_mode: form.price_mode,
      price_amount: form.price_mode === "rent" && form.price_amount ? Number(form.price_amount) : null,
      image_url: form.image_url || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listed! Your neighbors can see it now.");
    setShowForm(false);
    setForm({ title: "", description: "", category: "Tools", price_mode: "free", price_amount: "", image_url: "" });
    load();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-leaf text-leaf-foreground font-display text-lg">
              P
            </span>
            <span className="font-display text-2xl italic text-leaf">Peers+Help</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setShowForm(true)}
                  className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground"
                >
                  + Lend something
                </button>
                <button
                  onClick={handleSignOut}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Available near you
          </p>
          <h1 className="font-display text-4xl">On your block right now</h1>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <p className="mb-4 text-muted-foreground">Nothing listed yet — be the first neighbor to share.</p>
            {user ? (
              <button
                onClick={() => setShowForm(true)}
                className="rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground"
              >
                List your first item
              </button>
            ) : (
              <Link to="/auth" className="rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground">
                Sign in to list
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <article key={item.id} className="group flex flex-col gap-3">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-muted to-cream">
                      <span className="font-display text-3xl italic text-muted-foreground/60">
                        {item.category}
                      </span>
                    </div>
                  )}
                  <span
                    className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase backdrop-blur ${
                      item.price_mode === "free"
                        ? "bg-leaf/90 text-leaf-foreground"
                        : "bg-foreground/85 text-background"
                    }`}
                  >
                    {item.price_mode === "free" ? "Free" : `$${item.price_amount}/day`}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description ?? item.category}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
            className="w-full max-w-lg space-y-3 rounded-3xl bg-card p-8 shadow-2xl"
          >
            <h2 className="font-display text-2xl">Lend something</h2>
            <input
              required
              placeholder="What are you sharing? (e.g. Extension ladder)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
            />
            <textarea
              placeholder="Anything neighbors should know? Condition, pickup notes…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <select
                value={form.price_mode}
                onChange={(e) => setForm({ ...form, price_mode: e.target.value as "free" | "rent" })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
              >
                <option value="free">Free to borrow</option>
                <option value="rent">Rent per day</option>
              </select>
            </div>
            {form.price_mode === "rent" && (
              <input
                type="number"
                min="1"
                step="1"
                required
                placeholder="Price per day (USD)"
                value={form.price_amount}
                onChange={(e) => setForm({ ...form, price_amount: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
              />
            )}
            <input
              placeholder="Image URL (optional)"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="flex-1 rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground"
              >
                {saving ? "Sharing…" : "Share with neighbors"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
