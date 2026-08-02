import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createItemApi, createBookingApi, deleteItemApi, listItemsApi, listBookingsApi, listPublicBookingFeedbackApi, updateItemApi, updateBookingApi } from "@/lib/api-peers";
import { useRole } from "@/hooks/useRole";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PhotoImg } from "@/components/PhotoImg";
import { MediaVideo } from "@/components/MediaVideo";
import { CenteredLoader } from "@/components/CenteredLoader";
import { haversineKm, formatDistance } from "@/lib/geo";
import { requestLocation } from "@/lib/geolocate";
import { toast } from "@/lib/sonner";
import { buildSeoHead } from "@/lib/seo";
import { formatCurrency, getCurrencyCode } from "@/lib/money";
import { buildItemTitleSuggestions } from "@/lib/item-suggestions";
import { ChevronLeft, ChevronRight, ImagePlus, LayoutGrid, List, MapPin, ShieldCheck, Star } from "lucide-react";



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
  video_url?: string | null;
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

type PublicBookingFeedback = {
  booking_id: string;
  rating: number;
  feedback: string;
  item_title: string;
  borrower_name: string;
  created_at: string;
};

function normalizeTitleForFeedback(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export const Route = createFileRoute("/items")({
  validateSearch: (s: Record<string, unknown>) => ({
    lend: typeof s.lend === "string" ? s.lend : undefined,
    cat: typeof s.cat === "string" ? s.cat : undefined,
    lendOpen: typeof s.lendOpen === "string" ? s.lendOpen : undefined,
  }),
  head: () =>
    buildSeoHead({
      title: "Browse nearby items — Peers Plus",
      description:
        "Discover tools, medical gear, party supplies and more available to borrow or rent from verified neighbors.",
      path: "/items",
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
  const { user, loading: authLoading } = useAuth();
  const { isSuperadmin } = useRole();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = Route.useSearch();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [lendStep, setLendStep] = useState<1 | 2>(1);
  const [requesting, setRequesting] = useState<Item | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [myBookings, setMyBookings] = useState<BookingRequest[]>([]);
  const [publicFeedbackRows, setPublicFeedbackRows] = useState<PublicBookingFeedback[]>([]);
  const [expandedFeedbackByItem, setExpandedFeedbackByItem] = useState<Record<string, boolean>>({});
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
    price_amount: "", deposit_amount: "", image_url: "", image_urls: [] as string[], video_url: "",
    building_name: "", address: "",
    lat: "" as string, lng: "" as string,
  });
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ q: "", category: "", price: "all" as "all" | "free" | "rent", mine: false });
  const currencyCode = getCurrencyCode();

  const titleSuggestions = useMemo(
    () => buildItemTitleSuggestions(form.category, false),
    [form.category],
  );
  

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

  async function loadPublicFeedback() {
    try {
      const rows = await listPublicBookingFeedbackApi(120);
      setPublicFeedbackRows(Array.isArray(rows) ? (rows as PublicBookingFeedback[]) : []);
    } catch {
      setPublicFeedbackRows([]);
    }
  }

  const feedbackByItemTitle = useMemo(() => {
    const grouped = new Map<string, PublicBookingFeedback[]>();
    for (const row of publicFeedbackRows) {
      const key = normalizeTitleForFeedback(row.item_title);
      if (!key) continue;
      const list = grouped.get(key) ?? [];
      list.push(row);
      grouped.set(key, list);
    }

    for (const [, list] of grouped) {
      list.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    return grouped;
  }, [publicFeedbackRows]);
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
    void loadPublicFeedback();
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
    if (!search.lend && !search.cat && !search.lendOpen) return;
    if (authLoading) return;

    if (!user) {
      setShowAuthPrompt(true);
      navigate({ to: "/items", search: { lend: undefined, cat: undefined, lendOpen: undefined }, replace: true });
      return;
    }

    setForm((f) => ({
      ...f,
      category: search.cat ?? f.category,
    }));
    setLendStep(1);
    setShowForm(true);
    navigate({ to: "/items", search: { lend: undefined, cat: undefined, lendOpen: undefined }, replace: true });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, search.lend, search.cat, search.lendOpen]);





  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { navigate({ to: "/auth", search: { redirectTo: undefined } }); return; }
    setSaving(true);
    try {
      await createItemApi({
        title: form.title,
        description: form.description || null,
        category: form.category,
        price_mode: form.price_mode,
        price_amount: form.price_mode === "rent" && form.price_amount ? Number(form.price_amount) : null,
        deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
        image_url: null,
        image_urls: [],
        video_url: form.video_url || null,
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
      price_amount: "", deposit_amount: "", image_url: "", image_urls: [], video_url: "",
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
      if (String(error?.message || '').toLowerCase().includes('unauthorized')) {
        setShowAuthPrompt(true);
        return;
      }
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
      if (String(error?.message || '').toLowerCase().includes('unauthorized')) {
        setShowAuthPrompt(true);
        return;
      }
      toast.error(error.message || 'Unable to send reminder');
    } finally {
      setBusyBookingId(null);
    }
  }

  function validateLendStep(step: 1 | 2) {
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

  async function updateItemVideo(itemId: string, videoUrl: string | null) {
    setUpdatingItemId(itemId);
    try {
      await updateItemApi(itemId, { video_url: videoUrl || null });
      setItems((prev) => prev.map((entry) => (
        entry.id === itemId
          ? { ...entry, video_url: videoUrl || null }
          : entry
      )));
      toast.success(videoUrl ? "360 video updated." : "360 video removed.");
    } catch (error: any) {
      toast.error(error.message || "Unable to update item video");
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
            id="items-filter-search-input"
            name="itemsSearch"
            data-testid="items-filter-search-input"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search title, description, building…"
            className="w-full rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:border-leaf lg:min-w-[220px]"
          />
          <select
            id="items-filter-category-select"
            name="itemsCategory"
            data-testid="items-filter-category-select"
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
                id={`items-filter-price-${p}-button`}
                name={`itemsPrice${p}`}
                data-testid={`items-filter-price-${p}-button`}
                onClick={() => setFilters((f) => ({ ...f, price: p }))}
                className={`px-3 py-2 ${filters.price === p ? "bg-leaf text-leaf-foreground" : "bg-background hover:bg-muted"}`}
              >
                {p === "all" ? "All" : p === "free" ? "Free" : "For rent"}
              </button>
            ))}
          </div>
          {user && (
            <label className="flex items-center gap-2 rounded-full border border-input bg-background px-3 py-2 text-sm sm:w-fit">
              <input id="items-filter-only-mine-checkbox" name="itemsOnlyMine" data-testid="items-filter-only-mine-checkbox" type="checkbox" checked={filters.mine} onChange={(e) => setFilters((f) => ({ ...f, mine: e.target.checked }))} />
              Only mine
            </label>
          )}
          {(filters.q || filters.category || filters.price !== "all" || filters.mine) && (
            <button
              type="button"
              id="items-filter-clear-button"
              name="itemsClearFilters"
              data-testid="items-filter-clear-button"
              onClick={() => setFilters({ q: "", category: "", price: "all", mine: false })}
              className="rounded-full border border-input bg-background px-3 py-2 text-sm hover:bg-muted sm:w-fit"
            >
              Clear
            </button>
          )}
          <div className="grid grid-cols-2 overflow-hidden rounded-full border border-input sm:w-fit">
            <button
              type="button"
              id="items-view-grid-button"
              name="itemsViewGrid"
              data-testid="items-view-grid-button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold ${viewMode === "grid" ? "bg-leaf text-leaf-foreground" : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Cards
            </button>
            <button
              type="button"
              id="items-view-list-button"
              name="itemsViewList"
              data-testid="items-view-list-button"
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
          <CenteredLoader label="Loading items..." />
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <p className="mb-4 text-muted-foreground">Nothing listed yet — be the first neighbor to share.</p>
            {user ? (
              <button
                onClick={() => { setLendStep(1); setShowForm(true); }}
                className="rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground"
                id="items-empty-open-lend-form-button"
                name="openLendFormEmptyState"
                data-testid="items-empty-open-lend-form-button"
              >
                List your first item
              </button>
            ) : (
              <Link to="/auth" search={{ redirectTo: undefined }} className="rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground">
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
              const isMyLend = user?.uid === item.owner_id;
              const isMyBorrow = Boolean(myBooking);
              const images = normalizeImageList(item);
              const itemFeedback = feedbackByItemTitle.get(normalizeTitleForFeedback(item.title)) ?? [];
              const hasTrustedFeedback = itemFeedback.length > 0;
              const isFeedbackExpanded = expandedFeedbackByItem[item.id] ?? false;
              const activeImageIndex = images.length ? ((activeImageByItemId[item.id] ?? 0) % images.length) : 0;

              return (
              <article
                key={item.id}
                className={viewMode === "grid"
                  ? "group flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 sm:p-3.5"
                  : "group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 sm:grid sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4 sm:p-4"}
              >
                <div className={viewMode === "grid" ? "relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5" : "relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5 sm:aspect-square sm:min-h-[190px]"}>
                  {item.video_url ? (
                    <MediaVideo path={item.video_url} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" controls={false} autoPlay muted loop />
                  ) : images[activeImageIndex] ? (
                    <PhotoImg path={images[activeImageIndex]} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-muted to-cream">
                      <span className="font-display text-3xl text-muted-foreground/60">{item.category}</span>
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase backdrop-blur ${
                    item.price_mode === "free" ? "bg-leaf/90 text-leaf-foreground" : "bg-foreground/85 text-background"
                  }`}>
                    {item.price_mode === "free" ? "Free" : `${formatCurrency(Number(item.price_amount ?? 0), { currency: currencyCode })}/day`}
                  </span>
                  {km != null && (
                    <span className="absolute right-3 top-3 rounded-md bg-background/90 px-2 py-1 text-[10px] font-semibold backdrop-blur">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {formatDistance(km)}</span>
                    </span>
                  )}
                  {item.video_url && (
                    <span className="absolute bottom-3 left-3 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
                      360 VIDEO
                    </span>
                  )}
                  {images.length > 1 && !item.video_url && (
                    <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
                      {activeImageIndex + 1}/{images.length}
                    </span>
                  )}

                  {images.length > 1 && !item.video_url && (
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
                    <div className="min-w-0 flex-1">
                      <h3 className="min-w-0 text-base font-semibold leading-snug sm:text-lg">{item.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {isMyBorrow && (
                          <span className="inline-flex items-center rounded-full border border-leaf/30 bg-leaf/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-leaf">
                            I borrow
                          </span>
                        )}
                        {isMyLend && (
                          <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                            I lend
                          </span>
                        )}
                        {hasTrustedFeedback && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            <ShieldCheck className="h-3 w-3" /> Trusted
                          </span>
                        )}
                      </div>
                    </div>
                    {(item.building_name || item.address) && (
                      <button
                        type="button"
                        title={[item.building_name, item.address].filter(Boolean).join(" · ")}
                        onMouseEnter={() =>  {
                          toast.dismiss();
                          toast.info([item.building_name, item.address].filter(Boolean).join(" · "), { id: `loc-${item.id}` });
                        }}
                        onClick={() => {
                          if (item.building_name != null && item.address != null) {
                            const url = `https://www.google.com/maps/search/?api=1&query=${item.building_name},${item.address}`;
                            window.open(url, "_blank", "noopener,noreferrer");
                          } else {
                            toast.error("Location not available for this item.");
                          }
                        }}
                        className="shrink-0 rounded-full border border-input bg-background p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Show location"
                      >
                        <MapPin className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.description ?? item.category}</p>

                  {hasTrustedFeedback && (
                    <div className="mt-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                      <button
                        type="button"
                        id={`item-${item.id}-toggle-feedback-button`}
                        name={`itemToggleFeedback-${item.id}`}
                        data-testid={`item-${item.id}-toggle-feedback-button`}
                        onClick={() => {
                          setExpandedFeedbackByItem((prev) => ({ ...prev, [item.id]: !isFeedbackExpanded }));
                        }}
                        className="flex w-full items-center justify-between gap-2 text-left"
                      >
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Trusted borrower feedback ({itemFeedback.length})
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">{isFeedbackExpanded ? "Collapse" : "Expand"}</span>
                      </button>

                      {isFeedbackExpanded && (
                        <div className="mt-2 space-y-2">
                          {itemFeedback.slice(0, 3).map((entry) => (
                            <article key={`${item.id}-${entry.booking_id}`} className="rounded-lg border border-emerald-500/20 bg-background/80 p-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-xs font-semibold text-foreground">{entry.borrower_name || "Neighbor"}</p>
                                <p className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
                                  <Star className="h-3 w-3 fill-current" /> {Math.max(1, Math.min(5, Number(entry.rating || 0)))}/5
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">"{entry.feedback || "Trusted borrower experience."}"</p>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

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
                      Replacement value if damaged: <strong>{formatCurrency(Number(item.deposit_amount ?? 0), { currency: currencyCode })}</strong>
                    </p>
                  )}

                  <div className="mt-auto space-y-2 pt-3">
                    <button
                      type="button"
                      id={`item-${item.id}-view-details-button`}
                      name={`itemViewDetails-${item.id}`}
                      data-testid={`item-${item.id}-view-details-button`}
                      onClick={() => navigate({ to: "/items/$itemId", params: { itemId: item.id }, search: { lend: undefined, cat: undefined, lendOpen: undefined } })}
                      className="inline-flex w-full items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      View details
                    </button>
                  </div>

                  {user?.uid !== item.owner_id && !showRequestActions && (
                    <button
                      id={`item-${item.id}-request-button`}
                      name={`itemRequest-${item.id}`}
                      data-testid={`item-${item.id}-request-button`}
                      onClick={() => {
                        if (!user) { setShowAuthPrompt(true); return; }
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
                          id={`item-${item.id}-cancel-request-button`}
                          name={`itemCancelRequest-${item.id}`}
                          data-testid={`item-${item.id}-cancel-request-button`}
                          onClick={() => setCancelBooking(myBooking!)}
                          disabled={busyBookingId === myBooking?.id}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                        >
                          {busyBookingId === myBooking?.id ? 'Working…' : 'Cancel request'}
                        </button>
                        {myBooking?.status === 'requested' && (
                          <button
                            type="button"
                            id={`item-${item.id}-remind-owner-button`}
                            name={`itemRemindOwner-${item.id}`}
                            data-testid={`item-${item.id}-remind-owner-button`}
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
                            value={item.video_url || null}
                            onChange={(path) => {
                              void updateItemVideo(item.id, path || null);
                            }}
                            folder="items"
                            accept="video"
                            dense
                            label={updatingItemId === item.id ? "Saving video..." : "Add 360 video"}
                          />
                          <PhotoUpload
                            value={null}
                            onChange={(path) => {
                              if (!path) return;
                              void updateItemImages(item.id, [path]);
                            }}
                            folder="items"
                            dense
                            label={updatingItemId === item.id ? "Saving image..." : "Add first image"}
                          />
                        </div>
                      )}

                      {images.length > 0 && cardUploadItemId === item.id && (
                        <div className="mt-3 space-y-2 rounded-xl border border-border bg-background/70 p-2">
                          <div className="rounded-lg border border-border/70 bg-background/70 p-2">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">360 video</p>
                            <PhotoUpload
                              value={item.video_url || null}
                              onChange={(path) => {
                                void updateItemVideo(item.id, path || null);
                              }}
                              folder="items"
                              accept="video"
                              dense
                              label={updatingItemId === item.id ? "Saving video..." : "Upload or replace 360 video"}
                            />
                            {item.video_url && (
                              <button
                                type="button"
                                onClick={() => {
                                  void updateItemVideo(item.id, null);
                                }}
                                className="mt-2 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                              >
                                Remove video
                              </button>
                            )}
                          </div>
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
                              dense
                              label="Add image"
                            />
                          )}
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          id={`item-${item.id}-edit-button`}
                          name={`itemEdit-${item.id}`}
                          data-testid={`item-${item.id}-edit-button`}
                          onClick={() => setEditing(item)}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          id={`item-${item.id}-manage-images-button`}
                          name={`itemManageImages-${item.id}`}
                          data-testid={`item-${item.id}-manage-images-button`}
                          onClick={() => setCardUploadItemId((prev) => (prev === item.id ? null : item.id))}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          {cardUploadItemId === item.id ? "Hide images" : "Manage images"}
                        </button>
                        <button
                          id={`item-${item.id}-delete-button`}
                          name={`itemDelete-${item.id}`}
                          data-testid={`item-${item.id}-delete-button`}
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
          <form id="lend-form" name="lendForm" data-testid="lend-form" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate} className="w-full max-w-lg space-y-2 overflow-y-auto rounded-3xl bg-card p-4 shadow-2xl sm:max-h-[88vh] sm:p-5">
            <h2 className="font-display text-2xl">Lend something</h2>
            <div className="rounded-xl border border-border bg-background/70 p-1.5">
              <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold uppercase tracking-wide">
                {[
                  { id: 1, label: "Details" },
                  { id: 2, label: "Price & location" },
                ].map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    id={`lend-form-step-${step.id}-button`}
                    name={`lendFormStep${step.id}`}
                    data-testid={`lend-form-step-${step.id}-button`}
                    onClick={() => {
                      const target = step.id as 1 | 2;
                      if (target <= lendStep || validateLendStep(lendStep)) setLendStep(target);
                    }}
                    className={`rounded-lg px-2 py-1.5 ${lendStep === step.id ? "bg-leaf text-leaf-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {step.id}. {step.label}
                  </button>
                ))}
              </div>
            </div>

            {lendStep === 1 && (
              <>
                <div className="space-y-2 rounded-2xl border border-border bg-background/70 p-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI-assisted starter</p>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested names</label>
                    <div className="flex flex-wrap gap-2">
                      {titleSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          id={`lend-form-suggested-title-${suggestion.toLowerCase().replace(/\s+/g, "-")}`}
                          name="lendFormSuggestedTitle"
                          data-testid="lend-form-suggested-title"
                          onClick={() => setForm((prev) => ({ ...prev, title: suggestion }))}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-leaf hover:text-leaf"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">Pick a smart title now. Photos and video can be added on the detail page after save.</p>
                  </div>
                </div>
                <input required placeholder="What are you sharing? (e.g. Extension ladder)"
                  id="lend-form-title-input"
                  name="lendTitle"
                  data-testid="lend-form-title-input"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
                <textarea placeholder="Anything neighbors should know? Condition, pickup notes…"
                  id="lend-form-description-textarea"
                  name="lendDescription"
                  data-testid="lend-form-description-textarea"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  id="lend-form-category-select"
                  name="lendCategory"
                  data-testid="lend-form-category-select"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
                  {categories.map((c) => (<option key={c}>{c}</option>))}
                </select>
              </>
            )}

            {lendStep === 2 && (
              <>
                <select value={form.price_mode}
                  id="lend-form-price-mode-select"
                  name="lendPriceMode"
                  data-testid="lend-form-price-mode-select"
                  onChange={(e) => setForm({ ...form, price_mode: e.target.value as "free" | "rent" })}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
                  <option value="free">Free to borrow</option>
                  <option value="rent">Rent per day</option>
                </select>
                {form.price_mode === "rent" && (
                  <input type="number" min="1" step="1" required placeholder={`Price per day (${currencyCode})`}
                    id="lend-form-price-amount-input"
                    name="lendPriceAmount"
                    data-testid="lend-form-price-amount-input"
                    value={form.price_amount} onChange={(e) => setForm({ ...form, price_amount: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
                )}
                <div>
                  <input type="number" min="0" step="1" required
                    id="lend-form-deposit-amount-input"
                    name="lendDepositAmount"
                    data-testid="lend-form-deposit-amount-input"
                    placeholder={`Replacement value if damaged (${currencyCode})`}
                    value={form.deposit_amount}
                    onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
                  <p className="mt-1 px-1 text-xs text-muted-foreground">
                    Borrower will be shown this amount up-front and asked to consent. If the item comes back damaged, they pay this full amount in cash at return.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input placeholder="Building / society"
                    id="lend-form-building-input"
                    name="lendBuildingName"
                    data-testid="lend-form-building-input"
                    value={form.building_name} onChange={(e) => setForm({ ...form, building_name: e.target.value })}
                    className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
                  <input placeholder="Address (shown at pickup only)"
                    id="lend-form-address-input"
                    name="lendAddress"
                    data-testid="lend-form-address-input"
                    value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={useMyLocation}
                    id="lend-form-use-location-button"
                    name="lendUseMyLocation"
                    data-testid="lend-form-use-location-button"
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
                id="lend-form-cancel-button"
                name="lendFormCancel"
                data-testid="lend-form-cancel-button"
                className="rounded-xl border border-border bg-background py-2.5 text-sm font-semibold">
                Cancel
              </button>
              {lendStep > 1 && (
                <button
                  type="button"
                  id="lend-form-back-button"
                  name="lendFormBack"
                  data-testid="lend-form-back-button"
                  onClick={() => setLendStep((prev) => (prev - 1) as 1 | 2)}
                  className="rounded-xl border border-border bg-background py-2.5 text-sm font-semibold"
                >
                  Back
                </button>
              )}
              {lendStep < 2 ? (
                <button
                  type="button"
                  id="lend-form-next-button"
                  name="lendFormNext"
                  data-testid="lend-form-next-button"
                  onClick={() => {
                    if (!validateLendStep(lendStep)) return;
                    setLendStep((prev) => (prev + 1) as 1 | 2);
                  }}
                  className="rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground"
                >
                  Next
                </button>
              ) : (
                <button disabled={saving}
                  id="lend-form-submit-button"
                  name="lendFormSubmit"
                  data-testid="lend-form-submit-button"
                  className="rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground sm:col-start-3">
                  {saving ? "Sharing..." : "Share with neighbors"}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShowAuthPrompt(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-3xl bg-card p-5 shadow-2xl sm:max-h-[85vh] sm:overflow-y-auto">
            <h2 className="font-display text-2xl">Sign in required</h2>
            <p className="text-sm text-muted-foreground">
              You can continue browsing here. Sign in only when you want to request, remind, or manage bookings.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                id="lend-auth-prompt-keep-browsing-button"
                name="lendAuthPromptKeepBrowsing"
                data-testid="lend-auth-prompt-keep-browsing-button"
                onClick={() => {
                  setShowAuthPrompt(false);
                  navigate({ to: "/items", search: { lend: undefined, cat: undefined, lendOpen: undefined }, replace: true });
                }}
                className="rounded-xl border border-border py-2.5 text-sm font-semibold"
              >
                Keep browsing
              </button>
              <Link
                to="/auth"
                id="lend-auth-prompt-signin-link"
                data-testid="lend-auth-prompt-signin-link"
                search={{ redirectTo: `/items?lend=1&lendOpen=${Date.now()}${search.cat ? `&cat=${encodeURIComponent(search.cat)}` : ""}` }}
                className="rounded-xl bg-leaf py-2.5 text-center text-sm font-semibold text-leaf-foreground"
                onClick={() => setShowAuthPrompt(false)}
              >
                Sign in
              </Link>
            </div>
          </div>
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
  const currencyCode = getCurrencyCode();

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
          {rent > 0 && <p><strong>Rent:</strong> {formatCurrency(rent, { currency: currencyCode })}/day × {days} = <strong>{formatCurrency(rentTotal, { currency: currencyCode })}</strong> — paid in cash at return</p>}
          <p><strong>Replacement value:</strong> {formatCurrency(deposit, { currency: currencyCode })}</p>
        </div>

        <div className="rounded-xl border-2 border-clay/40 bg-clay/5 p-4 text-sm">
          <p className="font-semibold text-clay">Please read carefully</p>
          <p className="mt-1 text-foreground">
            If the item comes back with any defect, damage or missing parts, you agree to pay the
            <strong> full replacement value of {formatCurrency(deposit, { currency: currencyCode })}</strong> to the owner in cash at return
            {rent > 0 ? ` (in addition to the ${formatCurrency(rentTotal, { currency: currencyCode })} rent).` : "."}
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
    video_url: item.video_url ?? "",
    building_name: item.building_name ?? "",
    address: item.address ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [editStep, setEditStep] = useState<1 | 2 | 3>(1);
  const currencyCode = getCurrencyCode();

  function updateCoverImage(path: string | null) {
    setForm((prev) => {
      if (path) {
        const next = [path, ...prev.image_urls.filter((entry) => entry !== path)];
        return { ...prev, image_urls: next.slice(0, 5) };
      }

      return { ...prev, image_urls: prev.image_urls.slice(1) };
    });
  }

  function validateEditStep(step: 1 | 2 | 3) {
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
      video_url: form.video_url || null,
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
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg space-y-2 overflow-y-auto rounded-3xl bg-card p-4 shadow-2xl sm:max-h-[88vh] sm:p-5">
        <h2 className="font-display text-2xl">Edit listing</h2>
        <div className="rounded-xl border border-border bg-background/70 p-1.5">
          <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold uppercase tracking-wide">
            {[
              { id: 1, label: "Details" },
              { id: 2, label: "Price" },
              { id: 3, label: "Media" },
            ].map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  const target = step.id as 1 | 2 | 3;
                  if (target <= editStep || validateEditStep(editStep)) setEditStep(target);
                }}
                className={`rounded-lg px-2 py-1.5 ${editStep === step.id ? "bg-leaf text-leaf-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {step.id}. {step.label}
              </button>
            ))}
          </div>
        </div>

        {editStep === 1 && (
          <>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
              {["Tools","Electronics","Garden","Medical","Party","Baby","Kitchen","Camping","Cleaning","Sports","Pets","Furniture","Emergency"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </>
        )}

        {editStep === 2 && (
          <>
            <select value={form.price_mode} onChange={(e) => setForm({ ...form, price_mode: e.target.value as "free" | "rent" })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
              <option value="free">Free to borrow</option>
              <option value="rent">Rent per day</option>
            </select>
            {form.price_mode === "rent" && (
              <input type="number" min="1" placeholder={`Price per day (${currencyCode})`}
                value={form.price_amount} onChange={(e) => setForm({ ...form, price_amount: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
            )}
            <input type="number" min="0" placeholder={`Replacement value if damaged (${currencyCode})`}
              value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
          </>
        )}

        {editStep === 3 && (
          <>
            <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">360 video (optional)</p>
              <PhotoUpload
                value={form.video_url || null}
                onChange={(path) => {
                  setForm((prev) => ({ ...prev, video_url: path || "" }));
                }}
                folder="items"
                accept="video"
                label="Upload 360 video"
                dense
              />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Item images</p>
              <PhotoUpload
                value={form.image_urls[0] || null}
                onChange={(path) => {
                  updateCoverImage(path);
                }}
                folder="items"
                label="Main image"
                dense
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
                  dense
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
          </>
        )}

        <div className="grid gap-2 pt-2 sm:grid-cols-3">
          <button type="button" onClick={() => { onClose(); setEditStep(1); }} className="rounded-xl border border-border bg-background py-2.5 text-sm font-semibold">
            Cancel
          </button>
          {editStep > 1 && (
            <button
              type="button"
              onClick={() => setEditStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="rounded-xl border border-border bg-background py-2.5 text-sm font-semibold"
            >
              Back
            </button>
          )}
          {editStep < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (!validateEditStep(editStep)) return;
                setEditStep((prev) => (prev + 1) as 1 | 2 | 3);
              }}
              className="rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground"
            >
              Next
            </button>
          ) : (
            <button disabled={saving} className="rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground sm:col-start-3">
              {saving ? "Saving…" : "Save changes"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
