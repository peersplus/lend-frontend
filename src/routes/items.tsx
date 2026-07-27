import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createItemApi, createBookingApi, deleteItemApi, listItemsApi, listBookingsApi, updateItemApi, updateBookingApi } from "@/lib/api-peers";
import { useRole } from "@/hooks/useRole";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PhotoImg } from "@/components/PhotoImg";
import { haversineKm, formatDistance } from "@/lib/geo";
import { requestLocation } from "@/lib/geolocate";
import { toast } from "sonner";
import { ImagePlus, MapPin } from "lucide-react";



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
  image_urls?: string[] | null;
  owner_id: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
  building_name: string | null;
  address: string | null;
};

type BookingRequest = {
  id: string;
  item_id: string;
  status: string;
  urgency?: string | null;
};

export const Route = createFileRoute("/items")({
  validateSearch: (s: Record<string, unknown>) => ({
    lend: typeof s.lend === "string" ? s.lend : undefined,
    cat: typeof s.cat === "string" ? s.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse nearby items — Peers Plus" },
      { name: "description", content: "Discover tools, medical gear, party supplies and more available to borrow or rent from verified neighbors." },
      { property: "og:title", content: "Browse nearby items — Peers Plus" },
      { property: "og:description", content: "Borrow or rent household items from verified neighbors near you." },
    ],
  }),
  component: ItemsPage,
});

const categories = ["Tools","Electronics","Garden","Medical","Party","Baby","Kitchen","Camping","Cleaning","Sports","Pets","Furniture","Emergency"];

function normalizeImageList(item: Pick<Item, "image_url" | "image_urls">): string[] {
  const list = Array.isArray(item.image_urls) ? item.image_urls : [];
  const first = item.image_url ? [item.image_url] : [];
  return Array.from(new Set([...list, ...first].map((entry) => String(entry || "").trim()).filter(Boolean)));
}

function ItemsPage() {
  const { user } = useAuth();
  const { isSuperadmin } = useRole();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [requesting, setRequesting] = useState<Item | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [myBookings, setMyBookings] = useState<BookingRequest[]>([]);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);

  const [me, setMe] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [form, setForm] = useState({
    title: "", description: "", category: "Tools",
    price_mode: "free" as "free" | "rent",
    price_amount: "", deposit_amount: "", image_url: "", image_urls: [] as string[],
    building_name: "", address: "",
    lat: "" as string, lng: "" as string,
  });
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ q: "", category: "", price: "all" as "all" | "free" | "rent", mine: false });
  

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const profile = await import('@/lib/api-peers').then((m) => m.getMyPeerProfileApi());
        if (!profile) return;
        setMe({ lat: profile.lat ?? null, lng: profile.lng ?? null });
        setForm((f) => ({
          ...f,
          lat: profile.lat != null ? String(profile.lat) : f.lat,
          lng: profile.lng != null ? String(profile.lng) : f.lng,
          building_name: f.building_name || profile.building_name || "",
          address: f.address || profile.address || "",
        }));
      } catch {
        // ignore profile prefill errors
      }
    })();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const data = await listItemsApi();
      setItems((data as Item[]) ?? []);
    } catch (error: any) {
      toast.error(error.message || 'Unable to load items');
      setItems([]);
    }
    setLoading(false);
  }

  async function loadMyBookings() {
    if (!user) {
      setMyBookings([]);
      return;
    }

    try {
      const data = await listBookingsApi('borrowed');
      setMyBookings(((data as BookingRequest[]) ?? []).filter((booking) => Boolean(booking.item_id)));
    } catch {
      setMyBookings([]);
    }
  }
  const listed = useMemo(() => {
    const base = me.lat == null || me.lng == null
      ? items.map((i) => ({ i, km: null as number | null }))
      : items
          .map((i) => ({ i, km: i.lat != null && i.lng != null ? haversineKm({ lat: me.lat!, lng: me.lng! }, { lat: i.lat!, lng: i.lng! }) : null }))
          .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));
    const q = filters.q.trim().toLowerCase();
    return base.filter(({ i }) => {
      if (filters.category && i.category !== filters.category) return false;
      if (filters.price !== "all" && i.price_mode !== filters.price) return false;
      if (filters.mine && (!user || i.owner_id !== user.uid)) return false;
      if (q && !(`${i.title} ${i.description ?? ""} ${i.building_name ?? ""} ${i.address ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, me, filters, user]);

  useEffect(() => {
    void load();
    void loadMyBookings();
  }, [user]);

  // Prefill "Lend something" form when arriving from a request card.
  useEffect(() => {
    if (!user) return;
    if (search.lend || search.cat) {
      setForm((f) => ({
        ...f,
        title: f.title,
        category: search.lend ?? f.category,
      }));
      
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search.lend, search.cat]);





  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { navigate({ to: "/auth" }); return; }
    setSaving(true);
    try {
      await createItemApi({
        title: form.title,
        description: form.description || null,
        category: form.category,
        price_mode: form.price_mode,
        price_amount: form.price_mode === "rent" && form.price_amount ? Number(form.price_amount) : null,
        deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
        image_url: form.image_urls[0] || form.image_url || null,
        image_urls: form.image_urls,
        building_name: form.building_name || null,
        address: form.address || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
      });
    } catch (error: any) {
      setSaving(false);
      toast.error(error.message || 'Unable to create item');
      return;
    }
    setSaving(false);
    toast.success("✅ Item listed", { description: "Neighbors nearby can now request to borrow it." });
    setShowForm(false);
    setForm({
      title: "", description: "", category: "Tools", price_mode: "free",
      price_amount: "", deposit_amount: "", image_url: "", image_urls: [],
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

  async function handleCancelRequest(bookingId: string) {
    if (!confirm("Cancel this request?")) return;
    setBusyBookingId(bookingId);
    try {
      await updateBookingApi(bookingId, { status: 'cancelled' });
      toast.success('Request cancelled.');
      await loadMyBookings();
    } catch (error: any) {
      toast.error(error.message || 'Unable to cancel request');
    } finally {
      setBusyBookingId(null);
    }
  }

  async function handleRemindRequest(booking: BookingRequest) {
    if (!booking || booking.status !== 'requested') return;
    setBusyBookingId(booking.id);
    try {
      await updateBookingApi(booking.id, { action: 'remind', urgency: booking.urgency || 'normal' });
      toast.success(booking.urgency === 'urgent' ? 'High alert sent to the owner.' : 'Reminder sent to the owner.');
      await loadMyBookings();
    } catch (error: any) {
      toast.error(error.message || 'Unable to send reminder');
    } finally {
      setBusyBookingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {user && (
        <div className="border-b border-border/60 bg-card/40">
          <div className="mx-auto flex max-w-7xl justify-end px-6 py-2">
            <button onClick={() => setShowForm(true)} className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground hover:bg-leaf/90">
              + Lend something
            </button>
          </div>
        </div>
      )}


      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Available near you</p>
          <h1 className="font-display text-4xl">On your block right now</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Borrow or rent from neighbors. Save money, cut waste — one shared item at a time.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <input
            type="search"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search title, description, building…"
            className="min-w-[180px] flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:border-leaf"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="shrink-0 rounded-full border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex shrink-0 overflow-hidden rounded-full border border-input text-sm">
            {(["all","free","rent"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, price: p }))}
                className={`px-3 py-2 ${filters.price === p ? "bg-leaf text-leaf-foreground" : "bg-background hover:bg-muted"}`}
              >
                {p === "all" ? "All" : p === "free" ? "Free" : "For rent"}
              </button>
            ))}
          </div>
          {user && (
            <label className="flex shrink-0 items-center gap-2 rounded-full border border-input bg-background px-3 py-2 text-sm">
              <input type="checkbox" checked={filters.mine} onChange={(e) => setFilters((f) => ({ ...f, mine: e.target.checked }))} />
              Only mine
            </label>
          )}
          {(filters.q || filters.category || filters.price !== "all" || filters.mine) && (
            <button
              type="button"
              onClick={() => setFilters({ q: "", category: "", price: "all", mine: false })}
              className="shrink-0 rounded-full border border-input bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              Clear
            </button>
          )}
          <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
            {loading ? "…" : `${listed.length} of ${items.length}`}
          </span>
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
        ) : listed.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No items match your filters. Try clearing them.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {listed.map(({ i: item, km }) => {
              const myBooking = myBookings.find((booking) => booking.item_id === item.id);
              const showRequestActions = user?.uid !== item.owner_id && myBooking && ['requested', 'approved'].includes(myBooking.status);
              const images = normalizeImageList(item);

              return (
              <article key={item.id} className="group flex flex-col gap-3">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5">
                  {images[0] ? (
                    <PhotoImg path={images[0]} alt={item.title} className="h-full w-full object-cover" />
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
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {formatDistance(km)}</span>
                    </span>
                  )}
                  {images.length > 1 && (
                    <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
                      +{images.length - 1} more
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 text-lg font-semibold">{item.title}</h3>
                    {(item.building_name || item.address) && (
                      <button
                        type="button"
                        title={[item.building_name, item.address].filter(Boolean).join(" · ")}
                        onMouseEnter={() => toast.info([item.building_name, item.address].filter(Boolean).join(" · "), { id: `loc-${item.id}` })}
                        onClick={() => toast.info([item.building_name, item.address].filter(Boolean).join(" · "), { id: `loc-${item.id}` })}
                        className="shrink-0 rounded-full border border-input bg-background p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Show location"
                      >
                        <MapPin className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description ?? item.category}</p>

                  {images.length > 1 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="flex gap-1">
                        {images.slice(1, 4).map((img, idx) => (
                          <div key={`${img}-${idx}`} className="h-7 w-7 overflow-hidden rounded border border-border">
                            <PhotoImg path={img} alt={`${item.title} preview`} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.deposit_amount != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Replacement value if damaged: <strong>${item.deposit_amount}</strong>
                    </p>
                  )}
                  {user?.uid !== item.owner_id && !showRequestActions && (
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

                  {showRequestActions && (
                    <div className="mt-3 rounded-xl border border-leaf/20 bg-leaf/5 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-leaf">
                          {myBooking?.status === 'requested' ? 'Request sent' : 'Request approved'}
                        </p>
                        <span className="rounded-full bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {myBooking?.urgency === 'urgent' ? 'Urgent' : 'Normal'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleCancelRequest(myBooking!.id)}
                          disabled={busyBookingId === myBooking?.id}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                        >
                          {busyBookingId === myBooking?.id ? 'Working…' : 'Cancel request'}
                        </button>
                        {myBooking?.status === 'requested' && (
                          <button
                            type="button"
                            onClick={() => handleRemindRequest(myBooking)}
                            disabled={busyBookingId === myBooking.id}
                            className="rounded-full bg-leaf px-3 py-1.5 text-xs font-semibold text-leaf-foreground disabled:opacity-50"
                          >
                            {busyBookingId === myBooking.id ? 'Working…' : myBooking.urgency === 'urgent' ? 'Send high alert' : 'Remind owner'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {user && (user.uid === item.owner_id || isSuperadmin) && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setEditing(item)}
                        className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this listing?")) return;
                          try {
                            await deleteItemApi(item.id);
                            setItems((prev) => prev.filter((x) => x.id !== item.id));
                            toast.success("Item deleted.");
                          } catch (error: any) {
                            toast.error(error.message || 'Unable to delete item');
                          }
                        }}
                        className="flex-1 rounded-full border border-destructive/50 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                </div>
              </article>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />

      {requesting && user && (
        <RequestConsentModal
          item={requesting}
          user={user}
          onClose={() => setRequesting(null)}
          onRequested={() => {
            void loadMyBookings();
          }}
        />
      )}

      {editing && (
        <EditItemModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
            setEditing(null);
          }}
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
              <div className="space-y-3">
                <PhotoUpload
                  value={form.image_urls[0] || null}
                  onChange={(path) => {
                    setForm((prev) => {
                      const next = [...prev.image_urls];
                      if (path) next[0] = path;
                      else next.splice(0, 1);
                      return { ...prev, image_urls: next, image_url: next[0] || "" };
                    });
                  }}
                  folder="items"
                  label="Main image"
                />
                {form.image_urls.slice(1).length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {form.image_urls.slice(1).map((img, index) => (
                      <div key={`${img}-${index}`} className="relative overflow-hidden rounded-lg border border-border">
                        <PhotoImg path={img} alt="Additional item" className="h-20 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => {
                              const next = [...prev.image_urls];
                              next.splice(index + 1, 1);
                              return { ...prev, image_urls: next, image_url: next[0] || "" };
                            });
                          }}
                          className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {form.image_urls.length < 5 && (
                  <PhotoUpload
                    value={null}
                    onChange={(path) => {
                      if (!path) return;
                      setForm((prev) => ({
                        ...prev,
                        image_urls: [...prev.image_urls, path].slice(0, 5),
                        image_url: prev.image_urls[0] || path,
                      }));
                    }}
                    folder="items"
                    label="Add more images"
                  />
                )}
                <p className="text-xs text-muted-foreground">Upload up to 5 images. First image is shown on the card cover.</p>
              </div>
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
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Use my location</span>
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
  item, user, onClose, onRequested,
}: {
  item: Item;
  user: { uid: string };
  onClose: () => void;
  onRequested?: () => void;
}) {
  const [days, setDays] = useState(1);
  const [consent, setConsent] = useState(false);
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");
  const [submitting, setSubmitting] = useState(false);
  const deposit = Number(item.deposit_amount ?? 0);
  const rent = item.price_mode === "rent" ? Number(item.price_amount ?? 0) : 0;
  const rentTotal = rent * days;

  async function submit() {
    if (!consent) return toast.error("Please accept the terms first.");
    setSubmitting(true);
    try {
      await createBookingApi({
        item_id: item.id,
        owner_id: item.owner_id,
        borrower_id: user.uid,
        status: "requested",
        agreed_rent_per_day: rent || null,
        agreed_days: days,
        agreed_deposit: deposit,
        urgency,
        consent_accepted_at: new Date().toISOString(),
      });
    } catch (error: any) {
      setSubmitting(false);
      return toast.error(error.message || 'Unable to send request');
    }
    setSubmitting(false);
    toast.success("Request sent! The owner will approve and hand it over.");
    onRequested?.();
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

        <div className="rounded-xl bg-muted p-4 text-sm space-y-2">
          <label className="block text-sm">
            Priority
            <select value={urgency} onChange={(e) => setUrgency(e.target.value as "normal" | "urgent")} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
              <option value="normal">Normal — owner can reply within 24 hours</option>
              <option value="urgent">🚨 Urgent — owner should reply within 30 minutes</option>
            </select>
          </label>
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

function EditItemModal({
  item,
  onClose,
  onSaved,
}: {
  item: Item;
  onClose: () => void;
  onSaved: (updated: Item) => void;
}) {
  const [form, setForm] = useState({
    title: item.title,
    description: item.description ?? "",
    category: item.category,
    price_mode: item.price_mode,
    price_amount: item.price_amount != null ? String(item.price_amount) : "",
    deposit_amount: item.deposit_amount != null ? String(item.deposit_amount) : "",
    image_urls: normalizeImageList(item),
    building_name: item.building_name ?? "",
    address: item.address ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const patch = {
      title: form.title,
      description: form.description || null,
      category: form.category,
      price_mode: form.price_mode,
      price_amount: form.price_mode === "rent" && form.price_amount ? Number(form.price_amount) : null,
      deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
      image_url: form.image_urls[0] || null,
      image_urls: form.image_urls,
      building_name: form.building_name || null,
      address: form.address || null,
    };
    try {
      const data = await updateItemApi(item.id, patch);
      setSaving(false);
      toast.success("Item updated.");
      onSaved((data as Item) ?? ({ ...item, ...patch } as Item));
    } catch (error: any) {
      setSaving(false);
      toast.error(error.message || 'Unable to update item');
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg space-y-3 rounded-3xl bg-card p-8 shadow-2xl">
        <h2 className="font-display text-2xl">Edit listing</h2>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
            {["Tools","Electronics","Garden","Medical","Party","Baby","Kitchen","Camping","Cleaning","Sports","Pets","Furniture","Emergency"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={form.price_mode} onChange={(e) => setForm({ ...form, price_mode: e.target.value as "free" | "rent" })}
            className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
            <option value="free">Free to borrow</option>
            <option value="rent">Rent per day</option>
          </select>
        </div>
        {form.price_mode === "rent" && (
          <input type="number" min="1" placeholder="Price per day (USD)"
            value={form.price_amount} onChange={(e) => setForm({ ...form, price_amount: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
        )}
        <input type="number" min="0" placeholder="Replacement value if damaged (USD)"
          value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
        <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Item images</p>
          <PhotoUpload
            value={form.image_urls[0] || null}
            onChange={(path) => {
              setForm((prev) => {
                const next = [...prev.image_urls];
                if (path) next[0] = path;
                else next.splice(0, 1);
                return { ...prev, image_urls: next };
              });
            }}
            folder="items"
            label="Main image"
          />
          {form.image_urls.slice(1).length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {form.image_urls.slice(1).map((img, idx) => (
                <div key={`${img}-${idx}`} className="relative overflow-hidden rounded-lg border border-border">
                  <PhotoImg path={img} alt="Item" className="h-16 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => {
                        const next = [...prev.image_urls];
                        next.splice(idx + 1, 1);
                        return { ...prev, image_urls: next };
                      });
                    }}
                    className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
          {form.image_urls.length < 5 && (
            <PhotoUpload
              value={null}
              onChange={(path) => {
                if (!path) return;
                setForm((prev) => ({ ...prev, image_urls: [...prev.image_urls, path].slice(0, 5) }));
              }}
              folder="items"
              label="Add image"
            />
          )}
          <p className="text-xs text-muted-foreground">Up to 5 images. Cover image uses the first one.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Building / society" value={form.building_name}
            onChange={(e) => setForm({ ...form, building_name: e.target.value })}
            className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
          <input placeholder="Address" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold">Cancel</button>
          <button disabled={saving} className="flex-1 rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
