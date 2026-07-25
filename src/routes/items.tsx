import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/UserMenu";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PhotoImg } from "@/components/PhotoImg";
import { haversineKm, formatDistance } from "@/lib/geo";
import { requestLocation } from "@/lib/geolocate";
import { toast } from "sonner";

type Item = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price_mode: "free" | "rent";
  price_amount: number | null;
  deposit_amount: number | null;
  distance_hint: string | null;
  image_url: string | null;
  owner_id: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
  building_name: string | null;
  address: string | null;
};

export const Route = createFileRoute("/items")({
  head: () => ({
    meta: [
      { title: "Browse nearby items — Peers+Help" },
      { name: "description", content: "Discover tools, medical gear, party supplies and more available to borrow or rent from verified neighbors." },
      { property: "og:title", content: "Browse nearby items — Peers+Help" },
      { property: "og:description", content: "Borrow or rent household items from verified neighbors near you." },
    ],
  }),
  component: ItemsPage,
});

const categories = ["Tools","Garden","Medical","Party","Baby","Kitchen","Camping","Cleaning","Sports","Pets","Furniture","Emergency"];

function ItemsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [requesting, setRequesting] = useState<Item | null>(null);
  const [me, setMe] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [form, setForm] = useState({
    title: "", description: "", category: "Tools",
    price_mode: "free" as "free" | "rent",
    price_amount: "", deposit_amount: "", image_url: "",
    building_name: "", address: "",
    lat: "" as string, lng: "" as string,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("lat,lng,building_name,address")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setMe({ lat: data.lat ?? null, lng: data.lng ?? null });
        setForm((f) => ({
          ...f,
          lat: data.lat != null ? String(data.lat) : f.lat,
          lng: data.lng != null ? String(data.lng) : f.lng,
          building_name: f.building_name || (data as any).building_name || "",
          address: f.address || (data as any).address || "",
        }));
      });
  }, [user]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("items").select("*").eq("status", "available")
      .order("created_at", { ascending: false }).limit(60);
    if (error) toast.error(error.message);
    setItems((data as Item[]) ?? []);
    setLoading(false);
  }
  const listed = useMemo(() => {
    if (me.lat == null || me.lng == null) return items.map((i) => ({ i, km: null as number | null }));
    return items
      .map((i) => ({ i, km: i.lat != null && i.lng != null ? haversineKm({ lat: me.lat!, lng: me.lng! }, { lat: i.lat!, lng: i.lng! }) : null }))
      .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));
  }, [items, me]);

  useEffect(() => { load(); }, []);





  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { navigate({ to: "/auth" }); return; }
    setSaving(true);
    const { error } = await supabase.from("items").insert({
      owner_id: user.id,
      title: form.title,
      description: form.description || null,
      category: form.category,
      price_mode: form.price_mode,
      price_amount: form.price_mode === "rent" && form.price_amount ? Number(form.price_amount) : null,
      deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
      image_url: form.image_url || null,
      building_name: form.building_name || null,
      address: form.address || null,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
    } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Listed! Your neighbors can see it now.");
    setShowForm(false);
    setForm({
      title: "", description: "", category: "Tools", price_mode: "free",
      price_amount: "", deposit_amount: "", image_url: "",
      building_name: form.building_name, address: form.address,
      lat: form.lat, lng: form.lng,
    });
    load();
  }

  function useMyLocation() {
    requestLocation(({ lat, lng }) => {
      setForm((f) => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
      toast.success("Location captured for this listing.");
    });
  }



  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-leaf text-leaf-foreground font-display text-lg">P</span>
            <span className="font-display text-2xl text-leaf">Peers+Help</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/bookings" className="hidden sm:inline rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
              My bookings
            </Link>
            {user && (
              <button onClick={() => setShowForm(true)} className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground">
                + Lend something
              </button>
            )}
            <UserMenu />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Available near you</p>
          <h1 className="font-display text-4xl">On your block right now</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Borrow or rent from neighbors. Save money, cut waste — one shared item at a time.
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <p className="mb-4 text-muted-foreground">Nothing listed yet — be the first neighbor to share.</p>
            {user ? (
              <button onClick={() => setShowForm(true)} className="rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground">
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
            {listed.map(({ i: item, km }) => (
              <article key={item.id} className="group flex flex-col gap-3">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5">
                  {item.image_url ? (
                    <PhotoImg path={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-muted to-cream">
                      <span className="font-display text-3xl text-muted-foreground/60">{item.category}</span>
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase backdrop-blur ${
                    item.price_mode === "free" ? "bg-leaf/90 text-leaf-foreground" : "bg-foreground/85 text-background"
                  }`}>
                    {item.price_mode === "free" ? "Free" : `$${item.price_amount}/day`}
                  </span>
                  {km != null && (
                    <span className="absolute right-3 top-3 rounded-md bg-background/90 px-2 py-1 text-[10px] font-semibold backdrop-blur">
                      📍 {formatDistance(km)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description ?? item.category}</p>
                  {(item.building_name || item.address) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.building_name && <span className="font-medium text-foreground">🏢 {item.building_name}</span>}
                      {item.building_name && item.address ? " · " : ""}
                      {item.address && <span className="line-clamp-1">{item.address}</span>}
                    </p>
                  )}
                  {item.deposit_amount != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Replacement value if damaged: <strong>${item.deposit_amount}</strong>
                    </p>
                  )}
                  {user?.id !== item.owner_id && (
                    <button
                      onClick={() => {
                        if (!user) { navigate({ to: "/auth" }); return; }
                        setRequesting(item);
                      }}
                      className="mt-3 w-full rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground"
                    >
                      Request this item
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {requesting && user && (
        <RequestConsentModal
          item={requesting}
          user={user}
          onClose={() => setRequesting(null)}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleCreate} className="w-full max-w-lg space-y-3 rounded-3xl bg-card p-8 shadow-2xl">
            <h2 className="font-display text-2xl">Lend something</h2>
            <input required placeholder="What are you sharing? (e.g. Extension ladder)"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
            <textarea placeholder="Anything neighbors should know? Condition, pickup notes…"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
                {categories.map((c) => (<option key={c}>{c}</option>))}
              </select>
              <select value={form.price_mode}
                onChange={(e) => setForm({ ...form, price_mode: e.target.value as "free" | "rent" })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
                <option value="free">Free to borrow</option>
                <option value="rent">Rent per day</option>
              </select>
            </div>
            {form.price_mode === "rent" && (
              <input type="number" min="1" step="1" required placeholder="Price per day (USD)"
                value={form.price_amount} onChange={(e) => setForm({ ...form, price_amount: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
            )}
            <div>
              <input type="number" min="0" step="1" required
                placeholder="Replacement value if damaged (USD)"
                value={form.deposit_amount}
                onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
              <p className="mt-1 px-1 text-xs text-muted-foreground">
                Borrower will be shown this amount up-front and asked to consent. If the item comes back damaged, they pay this full amount in cash at return.
              </p>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item photo</label>
              <PhotoUpload
                value={form.image_url || null}
                onChange={(p) => setForm({ ...form, image_url: p ?? "" })}
                folder="items"
                label="Snap or upload the item"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Building / society"
                value={form.building_name} onChange={(e) => setForm({ ...form, building_name: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
              <input placeholder="Address (shown at pickup only)"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={useMyLocation}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                📍 Use my location
              </button>
              <span className="text-xs text-muted-foreground">
                {form.lat && form.lng ? `Pin set (${Number(form.lat).toFixed(3)}, ${Number(form.lng).toFixed(3)})` : "So neighbors see distance"}
              </span>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold">
                Cancel
              </button>
              <button disabled={saving}
                className="flex-1 rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground">
                {saving ? "Sharing…" : "Share with neighbors"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function RequestConsentModal({
  item, user, onClose,
}: {
  item: Item;
  user: { id: string };
  onClose: () => void;
}) {
  const [days, setDays] = useState(1);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const deposit = Number(item.deposit_amount ?? 0);
  const rent = item.price_mode === "rent" ? Number(item.price_amount ?? 0) : 0;
  const rentTotal = rent * days;

  async function submit() {
    if (!consent) return toast.error("Please accept the terms first.");
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      item_id: item.id,
      owner_id: item.owner_id,
      borrower_id: user.id,
      status: "requested",
      agreed_rent_per_day: rent || null,
      agreed_days: days,
      agreed_deposit: deposit,
      consent_accepted_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Request sent! The owner will approve and hand it over.");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-3xl bg-card p-8 shadow-2xl">
        <h2 className="font-display text-2xl">Request "{item.title}"</h2>

        {item.price_mode === "rent" && (
          <label className="block text-sm">
            How many days?
            <input type="number" min={1} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
          </label>
        )}

        <div className="rounded-xl bg-muted p-4 text-sm space-y-1">
          {rent > 0 && <p><strong>Rent:</strong> ${rent}/day × {days} = <strong>${rentTotal}</strong> — paid in cash at return</p>}
          <p><strong>Replacement value:</strong> ${deposit}</p>
        </div>

        <div className="rounded-xl border-2 border-clay/40 bg-clay/5 p-4 text-sm">
          <p className="font-semibold text-clay">Please read carefully</p>
          <p className="mt-1 text-foreground">
            If the item comes back with any defect, damage or missing parts, you agree to pay the
            <strong> full replacement value of ${deposit}</strong> to the owner in cash at return
            {rent > 0 ? ` (in addition to the $${rentTotal} rent).` : "."}
          </p>
          <label className="mt-3 flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            <span>I understand and accept these terms. A confirmation will be emailed to me at pickup.</span>
          </label>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button onClick={submit} disabled={!consent || submitting}
            className="flex-1 rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground disabled:opacity-50">
            {submitting ? "Sending…" : "Send request"}
          </button>
        </div>
      </div>
    </div>
  );
}
