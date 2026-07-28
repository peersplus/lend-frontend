import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
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
import { ChevronLeft, ChevronRight, ImagePlus, LayoutGrid, List, MapPin } from "lucide-react";



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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = Route.useSearch();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [lendStep, setLendStep] = useState<1 | 2 | 3>(1);
  const [requesting, setRequesting] = useState<Item | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [myBookings, setMyBookings] = useState<BookingRequest[]>([]);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [cancelBooking, setCancelBooking] = useState<BookingRequest | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [cardUploadItemId, setCardUploadItemId] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [activeImageByItemId, setActiveImageByItemId] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("items-view-mode");
      if (saved === "grid" || saved === "list") {
        setViewMode(saved);
      }
    } catch {
      // ignore localStorage access errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("items-view-mode", viewMode);
    } catch {
      // ignore localStorage access errors
    }
  }, [viewMode]);

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
    setLendStep(1);
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

  function cycleItemImage(itemId: string, imageCount: number, direction: 1 | -1) {
    if (imageCount < 2) return;
    setActiveImageByItemId((prev) => {
      const current = prev[itemId] ?? 0;
      const next = (current + direction + imageCount) % imageCount;
      return { ...prev, [itemId]: next };
    });
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

  function validateLendStep(step: 1 | 2 | 3) {
    if (step === 1) {
      if (!form.title.trim()) {
        toast.error("Please add an item title.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!form.deposit_amount || Number(form.deposit_amount) < 0) {
        toast.error("Please add replacement value.");
        return false;
      }
      if (form.price_mode === "rent" && (!form.price_amount || Number(form.price_amount) <= 0)) {
        toast.error("Please add a valid rent price.");
        return false;
      }
      return true;
    }

    return true;
  }

  async function updateItemImages(itemId: string, imageUrls: string[]) {
    setUpdatingItemId(itemId);
    try {
      await updateItemApi(itemId, {
        image_url: imageUrls[0] || null,
        image_urls: imageUrls,
      });
      setItems((prev) => prev.map((entry) => (
        entry.id === itemId
          ? { ...entry, image_url: imageUrls[0] || null, image_urls: imageUrls }
          : entry
      )));
      setActiveImageByItemId((prev) => ({ ...prev, [itemId]: 0 }));
      toast.success("Item images updated.");
    } catch (error: any) {
      toast.error(error.message || "Unable to update item images");
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleDeleteItem(itemId: string) {
    setDeletingItemId(itemId);
    try {
      await deleteItemApi(itemId);
      setItems((prev) => prev.filter((x) => x.id !== itemId));
      toast.success("Item deleted.");
    } catch (error: any) {
      toast.error(error.message || "Unable to delete item");
    } finally {
      setDeletingItemId(null);
    }
  }

  const isItemDetailPath = pathname.startsWith("/items/") && pathname !== "/items";
  if (isItemDetailPath) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {user && (
        <div className="border-b border-border/60 bg-card/40">
          <div className="mx-auto flex max-w-7xl px-4 py-3 sm:justify-end sm:px-6">
            <button onClick={() => { setLendStep(1); setShowForm(true); }} className="w-full rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground hover:bg-leaf/90 sm:w-auto">
              + Lend something
            </button>
          </div>
        </div>
      )}


      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="mb-6 sm:mb-8">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Available near you</p>
          <h1 className="font-display text-3xl sm:text-4xl">On your block right now</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Borrow or rent from neighbors. Save money, cut waste — one shared item at a time.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-card p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_auto_auto_auto_auto] lg:items-center">
          <input
            type="search"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search title, description, building…"
            className="w-full rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:border-leaf lg:min-w-[220px]"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="w-full rounded-full border border-input bg-background px-3 py-2 text-sm sm:w-auto"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="grid w-full grid-cols-3 overflow-hidden rounded-full border border-input text-sm sm:w-auto">
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
            <label className="flex items-center gap-2 rounded-full border border-input bg-background px-3 py-2 text-sm sm:w-fit">
              <input type="checkbox" checked={filters.mine} onChange={(e) => setFilters((f) => ({ ...f, mine: e.target.checked }))} />
              Only mine
            </label>
          )}
          {(filters.q || filters.category || filters.price !== "all" || filters.mine) && (
            <button
              type="button"
              onClick={() => setFilters({ q: "", category: "", price: "all", mine: false })}
              className="rounded-full border border-input bg-background px-3 py-2 text-sm hover:bg-muted sm:w-fit"
            >
              Clear
            </button>
          )}
          <div className="grid grid-cols-2 overflow-hidden rounded-full border border-input sm:w-fit">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold ${viewMode === "grid" ? "bg-leaf text-leaf-foreground" : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold ${viewMode === "list" ? "bg-leaf text-leaf-foreground" : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <span className="whitespace-nowrap px-1 text-xs text-muted-foreground sm:col-span-2 lg:col-auto lg:justify-self-end">
            {loading ? "…" : `${listed.length} of ${items.length}`}
          </span>
        </div>
        </div>



        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <p className="mb-4 text-muted-foreground">Nothing listed yet — be the first neighbor to share.</p>
            {user ? (
              <button onClick={() => { setLendStep(1); setShowForm(true); }} className="rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground">
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
          <div className={viewMode === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid gap-4"}>
            {listed.map(({ i: item, km }) => {
              const myBooking = myBookings.find((booking) => booking.item_id === item.id);
              const showRequestActions = user?.uid !== item.owner_id && myBooking && ['requested', 'approved'].includes(myBooking.status);
              const images = normalizeImageList(item);
              const activeImageIndex = images.length ? ((activeImageByItemId[item.id] ?? 0) % images.length) : 0;

              return (
              <article
                key={item.id}
                className={viewMode === "grid"
                  ? "group flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 sm:p-3.5"
                  : "group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 sm:flex-row sm:items-stretch sm:gap-4 sm:p-4"}
              >
                <div className={viewMode === "grid" ? "relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5" : "relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5 sm:w-60 sm:shrink-0"}>
                  {images[activeImageIndex] ? (
                    <PhotoImg path={images[activeImageIndex]} alt={item.title} className="h-full w-full object-cover" />
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
                      {activeImageIndex + 1}/{images.length}
                    </span>
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => cycleItemImage(item.id, images.length, -1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white hover:bg-black/75"
                        aria-label="Previous item image"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => cycleItemImage(item.id, images.length, 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white hover:bg-black/75"
                        aria-label="Next item image"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
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

                  <div className="mt-auto space-y-2 pt-3">
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/items/$itemId", params: { itemId: item.id } })}
                      className="inline-flex w-full items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      View details
                    </button>
                  </div>

                  {user?.uid !== item.owner_id && !showRequestActions && (
                    <button
                      onClick={() => {
                        if (!user) { navigate({ to: "/auth" }); return; }
                        setRequesting(item);
                      }}
                      className="mt-2 w-full rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground"
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
                          onClick={() => setCancelBooking(myBooking!)}
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
                    <>
                      {images.length === 0 && (
                        <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/30 p-2">
                          <p className="mb-2 text-xs text-muted-foreground">No photos yet. Add from card using gallery or camera.</p>
                          <PhotoUpload
                            value={null}
                            onChange={(path) => {
                              if (!path) return;
                              void updateItemImages(item.id, [path]);
                            }}
                            folder="items"
                            label={updatingItemId === item.id ? "Saving image..." : "Add first image"}
                          />
                        </div>
                      )}

                      {images.length > 0 && cardUploadItemId === item.id && (
                        <div className="mt-3 space-y-2 rounded-xl border border-border bg-background/70 p-2">
                          <div className="grid grid-cols-4 gap-2">
                            {images.map((img, imgIdx) => (
                              <div key={`${img}-${imgIdx}`} className="relative overflow-hidden rounded border border-border">
                                <PhotoImg path={img} alt={`${item.title} image`} className="h-12 w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = images.filter((_, idx) => idx !== imgIdx);
                                    void updateItemImages(item.id, next);
                                  }}
                                  className="absolute right-0.5 top-0.5 rounded-full bg-black/70 px-1 text-[10px] text-white"
                                >
                                  x
                                </button>
                              </div>
                            ))}
                          </div>
                          {images.length < 5 && (
                            <PhotoUpload
                              value={null}
                              onChange={(path) => {
                                if (!path) return;
                                void updateItemImages(item.id, [...images, path]);
                              }}
                              folder="items"
                              label="Add image"
                            />
                          )}
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          onClick={() => setEditing(item)}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setCardUploadItemId((prev) => (prev === item.id ? null : item.id))}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          {cardUploadItemId === item.id ? "Hide images" : "Manage images"}
                        </button>
                        <button
                          onClick={() => setDeleteItemId(item.id)}
                          className="rounded-full border border-destructive/50 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 sm:col-span-2"
                        >
                          Delete
                        </button>
                      </div>
                    </>
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

      {cancelBooking && (
        <ConfirmActionModal
          title="Cancel request"
          description="Are you sure you want to cancel this request?"
          confirmLabel={busyBookingId === cancelBooking.id ? "Cancelling..." : "Yes, cancel request"}
          onCancel={() => setCancelBooking(null)}
          onConfirm={async () => {
            await handleCancelRequest(cancelBooking.id);
            setCancelBooking(null);
          }}
          busy={busyBookingId === cancelBooking.id}
        />
      )}

      {deleteItemId && (
        <ConfirmActionModal
          title="Delete listing"
          description="This will permanently remove your listing from the marketplace."
          confirmLabel={deletingItemId === deleteItemId ? "Deleting..." : "Yes, delete listing"}
          onCancel={() => setDeleteItemId(null)}
          onConfirm={async () => {
            await handleDeleteItem(deleteItemId);
            setDeleteItemId(null);
          }}
          busy={deletingItemId === deleteItemId}
        />
      )}


      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => { setShowForm(false); setLendStep(1); }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleCreate} className="w-full max-w-lg space-y-3 rounded-3xl bg-card p-5 shadow-2xl sm:p-8">
            <h2 className="font-display text-2xl">Lend something</h2>
            <div className="rounded-xl border border-border bg-background/70 p-2">
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold uppercase tracking-wide">
                {[
                  { id: 1, label: "Details" },
                  { id: 2, label: "Price" },
                  { id: 3, label: "Photos" },
                ].map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      const target = step.id as 1 | 2 | 3;
                      if (target <= lendStep || validateLendStep(lendStep)) setLendStep(target);
                    }}
                    className={`rounded-lg px-2 py-2 ${lendStep === step.id ? "bg-leaf text-leaf-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {step.id}. {step.label}
                  </button>
                ))}
              </div>
            </div>

            {lendStep === 1 && (
              <>
                <input required placeholder="What are you sharing? (e.g. Extension ladder)"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
                <textarea placeholder="Anything neighbors should know? Condition, pickup notes…"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
                  {categories.map((c) => (<option key={c}>{c}</option>))}
                </select>
              </>
            )}

            {lendStep === 2 && (
              <>
                <select value={form.price_mode}
                  onChange={(e) => setForm({ ...form, price_mode: e.target.value as "free" | "rent" })}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
                  <option value="free">Free to borrow</option>
                  <option value="rent">Rent per day</option>
                </select>
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
              </>
            )}

            {lendStep === 3 && (
              <>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item photo (optional)</label>
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
                    <p className="text-xs text-muted-foreground">You can skip now and add photos directly from the item card later.</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
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
              </>
            )}
            <div className="grid gap-2 pt-2 sm:grid-cols-3">
              <button type="button" onClick={() => { setShowForm(false); setLendStep(1); }}
                className="rounded-xl border border-border bg-background py-2.5 text-sm font-semibold">
                Cancel
              </button>
              {lendStep > 1 && (
                <button
                  type="button"
                  onClick={() => setLendStep((prev) => (prev - 1) as 1 | 2 | 3)}
                  className="rounded-xl border border-border bg-background py-2.5 text-sm font-semibold"
                >
                  Back
                </button>
              )}
              {lendStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!validateLendStep(lendStep)) return;
                    setLendStep((prev) => (prev + 1) as 1 | 2 | 3);
                  }}
                  className="rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground"
                >
                  Next
                </button>
              ) : (
                <button disabled={saving}
                  className="rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground sm:col-start-3">
                  {saving ? "Sharing..." : "Share with neighbors"}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-3xl bg-card p-5 shadow-2xl sm:p-8">
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl border border-border py-2.5 text-sm font-semibold">
            Keep request
          </button>
          <button type="button" onClick={() => void onConfirm()} disabled={busy} className="rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground disabled:opacity-60">
            {confirmLabel}
          </button>
        </div>
      </div>
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
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-3xl bg-card p-5 shadow-2xl sm:p-8">
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

        <div className="grid gap-2 sm:grid-cols-2">
          <button onClick={onClose} className="rounded-xl border border-border py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button onClick={submit} disabled={!consent || submitting}
            className="rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground disabled:opacity-50">
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
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg space-y-3 rounded-3xl bg-card p-5 shadow-2xl sm:p-8">
        <h2 className="font-display text-2xl">Edit listing</h2>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
        <div className="grid gap-3 sm:grid-cols-2">
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
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Building / society" value={form.building_name}
            onChange={(e) => setForm({ ...form, building_name: e.target.value })}
            className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
          <input placeholder="Address" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
        </div>
        <div className="grid gap-2 pt-2 sm:grid-cols-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-border bg-background py-2.5 text-sm font-semibold">Cancel</button>
          <button disabled={saving} className="rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
