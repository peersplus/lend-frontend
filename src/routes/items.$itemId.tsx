import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PhotoImg } from "@/components/PhotoImg";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Immersive360Video } from "@/components/Immersive360Video";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { createBookingApi, listBookingsApi, listItemsApi, updateBookingApi, updateItemApi } from "@/lib/api-peers";
import { toast } from "@/lib/sonner";

type Item = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string;
  price_mode: "free" | "rent";
  price_amount: number | null;
  deposit_amount: number | null;
  image_url: string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
  building_name: string | null;
  address: string | null;
  created_at: string;
};

type BookingRequest = {
  id: string;
  item_id: string;
  status: string;
  urgency?: string | null;
};

function normalizeImageList(item: Pick<Item, "image_url" | "image_urls">): string[] {
  const list = Array.isArray(item.image_urls) ? item.image_urls : [];
  const first = item.image_url ? [item.image_url] : [];
  return Array.from(new Set([...list, ...first].map((entry) => String(entry || "").trim()).filter(Boolean)));
}

export const Route = createFileRoute("/items/$itemId")({
  component: ItemDetailsPage,
  head: ({ params }) => ({
    meta: [
      { title: `Item details ${params.itemId} - Peers Plus` },
      { name: "description", content: "Review item photos, pricing and pickup details before requesting." },
    ],
  }),
});

function ItemDetailsPage() {
  const { user } = useAuth();
  const { isSuperadmin } = useRole();
  const { itemId } = Route.useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [savingImages, setSavingImages] = useState(false);
  const [myBooking, setMyBooking] = useState<BookingRequest | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const items = (await listItemsApi()) as Item[];
        const found = items.find((entry) => String(entry.id) === String(itemId)) || null;
        if (mounted) {
          setItem(found);
          setActiveImage(0);
        }
      } catch {
        if (mounted) setItem(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [itemId]);

  useEffect(() => {
    if (!user || !item) {
      setMyBooking(null);
      return;
    }

    (async () => {
      try {
        const bookings = (await listBookingsApi("borrowed")) as BookingRequest[];
        const match = bookings.find((booking) => String(booking.item_id) === String(item.id)) || null;
        setMyBooking(match);
      } catch {
        setMyBooking(null);
      }
    })();
  }, [user, item]);

  const images = useMemo(() => (item ? normalizeImageList(item) : []), [item]);
  const canManageImages = !!user && !!item && (user.uid === item.owner_id || isSuperadmin);

  async function saveImages(nextImages: string[]) {
    if (!item) return;
    setSavingImages(true);
    try {
      await updateItemApi(item.id, {
        image_url: nextImages[0] || null,
        image_urls: nextImages,
      });
      setItem((prev) => (prev ? { ...prev, image_url: nextImages[0] || null, image_urls: nextImages } : prev));
      setActiveImage((idx) => {
        if (!nextImages.length) return 0;
        return Math.min(idx, nextImages.length - 1);
      });
      toast.success("Images updated.");
    } catch (error: any) {
      toast.error(error?.message || "Unable to update images");
    } finally {
      setSavingImages(false);
    }
  }

  async function saveVideo(nextVideo: string | null) {
    if (!item) return;
    setSavingImages(true);
    try {
      await updateItemApi(item.id, { video_url: nextVideo || null });
      setItem((prev) => (prev ? { ...prev, video_url: nextVideo || null } : prev));
      toast.success(nextVideo ? "360 video updated." : "360 video removed.");
    } catch (error: any) {
      toast.error(error?.message || "Unable to update 360 video");
    } finally {
      setSavingImages(false);
    }
  }

  function showPrevImage() {
    if (images.length < 2) return;
    setActiveImage((idx) => (idx - 1 + images.length) % images.length);
  }

  function showNextImage() {
    if (images.length < 2) return;
    setActiveImage((idx) => (idx + 1) % images.length);
  }

  async function refreshMyBooking() {
    if (!user || !item) return;
    try {
      const bookings = (await listBookingsApi("borrowed")) as BookingRequest[];
      const match = bookings.find((booking) => String(booking.item_id) === String(item.id)) || null;
      setMyBooking(match);
    } catch {
      setMyBooking(null);
    }
  }

  async function handleCancelRequest(bookingId: string) {
    setBusyBookingId(bookingId);
    try {
      await updateBookingApi(bookingId, { status: "cancelled" });
      toast.success("Request cancelled.");
      await refreshMyBooking();
    } catch (error: any) {
      if (String(error?.message || "").toLowerCase().includes("unauthorized")) {
        setShowAuthPrompt(true);
        return;
      }
      toast.error(error?.message || "Unable to cancel request");
    } finally {
      setBusyBookingId(null);
    }
  }

  async function handleRemindRequest(booking: BookingRequest) {
    if (booking.status !== "requested") return;
    setBusyBookingId(booking.id);
    try {
      await updateBookingApi(booking.id, { action: "remind", urgency: booking.urgency || "normal" });
      toast.success(booking.urgency === "urgent" ? "High alert sent to owner." : "Reminder sent to owner.");
      await refreshMyBooking();
    } catch (error: any) {
      if (String(error?.message || "").toLowerCase().includes("unauthorized")) {
        setShowAuthPrompt(true);
        return;
      }
      toast.error(error?.message || "Unable to remind owner");
    } finally {
      setBusyBookingId(null);
    }
  }

  const isOwner = !!user && !!item && user.uid === item.owner_id;
  const showRequestActions = !!user && !isOwner && !!myBooking && ["requested", "approved"].includes(myBooking.status);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/items" search={{}} className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">
            <ChevronLeft className="h-4 w-4" /> Back to items
          </Link>
          <p className="rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Item details
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">Loading item details...</div>
        ) : !item ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <h1 className="font-display text-2xl">Item not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This item may have been removed.</p>
            <Link to="/items" search={{}} className="mt-4 inline-flex rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground">
              Browse available items
            </Link>
          </div>
        ) : (
          <section className="grid gap-6 rounded-3xl border border-border/70 bg-card/85 p-4 shadow-sm sm:p-6 lg:grid-cols-[1.15fr_1fr] lg:gap-7">
            <div className="space-y-4">
              <div className={`relative overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5 ${item.video_url ? "mx-auto w-full max-w-3xl aspect-[16/10] sm:aspect-[16/9]" : "aspect-square sm:aspect-[4/3]"}`}>
                {item.video_url ? (
                  <Immersive360Video path={item.video_url} compact className="h-full w-full" />
                ) : images[activeImage] ? (
                  <PhotoImg path={images[activeImage]} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-muted via-card to-cream text-center">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">No media yet</p>
                      <span className="mt-2 block font-display text-2xl text-muted-foreground/80">{item.category}</span>
                    </div>
                  </div>
                )}
                <span className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase ${item.price_mode === "free" ? "bg-leaf text-leaf-foreground" : "bg-foreground text-background"}`}>
                  {item.price_mode === "free" ? "Free" : `$${item.price_amount}/day`}
                </span>

                {item.video_url && (
                  <span className="absolute bottom-3 left-3 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">360 VIDEO</span>
                )}

                {images.length > 1 && !item.video_url && (
                  <>
                    <button
                      type="button"
                      onClick={showPrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/50 px-2 py-1">
                      {images.map((_, idx) => (
                        <button
                          key={`dot-${idx}`}
                          type="button"
                          onClick={() => setActiveImage(idx)}
                          className={`h-1.5 w-1.5 rounded-full ${idx === activeImage ? "bg-white" : "bg-white/50"}`}
                          aria-label={`Show image ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {images.length > 1 && !item.video_url && (
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                  {images.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setActiveImage(idx)}
                      className={`overflow-hidden rounded-lg border ${idx === activeImage ? "border-leaf ring-1 ring-leaf" : "border-border"}`}
                    >
                      <PhotoImg path={img} alt={`${item.title} ${idx + 1}`} className="h-14 w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {canManageImages && (
                <div className="space-y-3 rounded-2xl border border-border/70 bg-background/75 p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Manage media</p>
                    <p className="text-[11px] text-muted-foreground">Cover image = first photo</p>
                  </div>
                  <PhotoUpload
                    value={item.video_url || null}
                    onChange={(path) => {
                      void saveVideo(path || null);
                    }}
                    folder="items"
                    accept="video"
                    dense
                    label={savingImages ? "Saving video..." : "Upload 360 video"}
                  />
                  {item.video_url && (
                    <button
                      type="button"
                      onClick={() => {
                        void saveVideo(null);
                      }}
                      disabled={savingImages}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      Remove video
                    </button>
                  )}
                  {images.length < 5 && (
                    <PhotoUpload
                      value={null}
                      onChange={(path) => {
                        if (!path) return;
                        void saveImages([...images, path].slice(0, 5));
                      }}
                      folder="items"
                      dense
                      label={savingImages ? "Saving image..." : "Upload image"}
                    />
                  )}
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {images.map((img, idx) => (
                        <div key={`${img}-${idx}`} className="relative overflow-hidden rounded-lg border border-border">
                          <PhotoImg path={img} alt={`${item.title} ${idx + 1}`} className="h-14 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const next = images.filter((_, i) => i !== idx);
                              void saveImages(next);
                            }}
                            className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
                            aria-label="Remove image"
                            disabled={savingImages}
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Up to 5 images and 1 immersive video.</p>
                </div>
              )}
            </div>

            <div className="space-y-4 lg:pt-1">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 sm:p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.category}</p>
                <h1 className="mt-1 font-display text-3xl leading-tight sm:text-[2.1rem]">{item.title}</h1>
              </div>

              <p className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm leading-6 text-foreground">
                {item.description || "No extra description provided by the owner yet."}
              </p>

              <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Price mode</p>
                  <p className="mt-1 font-semibold">{item.price_mode === "free" ? "Free borrow" : `Rent $${item.price_amount}/day`}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Replacement value</p>
                  <p className="mt-1 font-semibold">{item.deposit_amount != null ? `$${item.deposit_amount}` : "Not set"}</p>
                </div>
              </div>

              {(item.building_name || item.address) && (
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Pickup area</p>
                  <p className="mt-2 inline-flex items-start gap-2 text-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>{[item.building_name, item.address].filter(Boolean).join(" · ")}</span>
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Link to="/items" search={{}} className="rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">
                  Back
                </Link>
                {!user ? (
                  <button type="button" onClick={() => setShowAuthPrompt(true)} className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground shadow-sm hover:bg-leaf/90">
                    Sign in to request
                  </button>
                ) : !isOwner && !showRequestActions ? (
                  <button
                    type="button"
                    onClick={() => setRequesting(true)}
                    className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground shadow-sm hover:bg-leaf/90"
                  >
                    Request this item
                  </button>
                ) : null}
              </div>

              {showRequestActions && myBooking && (
                <div className="rounded-xl border border-leaf/20 bg-leaf/5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-leaf">
                      {myBooking.status === "requested" ? "Request sent" : "Request approved"}
                    </p>
                    <span className="rounded-full bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {myBooking.urgency === "urgent" ? "Urgent" : "Normal"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCancelOpen(true)}
                      disabled={busyBookingId === myBooking.id}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                    >
                      {busyBookingId === myBooking.id ? "Working..." : "Cancel request"}
                    </button>
                    {myBooking.status === "requested" && (
                      <button
                        type="button"
                        onClick={() => void handleRemindRequest(myBooking)}
                        disabled={busyBookingId === myBooking.id}
                        className="rounded-full bg-leaf px-3 py-1.5 text-xs font-semibold text-leaf-foreground disabled:opacity-50"
                      >
                        {busyBookingId === myBooking.id ? "Working..." : myBooking.urgency === "urgent" ? "Send high alert" : "Remind owner"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />

      {requesting && user && item && (
        <RequestConsentModal
          item={item}
          user={user}
          onClose={() => setRequesting(false)}
          onRequested={async () => {
            await refreshMyBooking();
          }}
        />
      )}

      {cancelOpen && myBooking && (
        <ConfirmActionModal
          title="Cancel request"
          description="Are you sure you want to cancel this request?"
          confirmLabel={busyBookingId === myBooking.id ? "Cancelling..." : "Yes, cancel request"}
          onCancel={() => setCancelOpen(false)}
          onConfirm={async () => {
            await handleCancelRequest(myBooking.id);
            setCancelOpen(false);
          }}
          busy={busyBookingId === myBooking.id}
        />
      )}

      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShowAuthPrompt(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-3xl bg-card p-6 shadow-2xl">
            <h2 className="font-display text-2xl">Sign in required</h2>
            <p className="text-sm text-muted-foreground">
              You can keep viewing this item. Sign in only if you want to request or manage booking actions.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setShowAuthPrompt(false)} className="rounded-xl border border-border py-2.5 text-sm font-semibold">
                Keep viewing
              </button>
              <Link to="/auth" onClick={() => setShowAuthPrompt(false)} className="rounded-xl bg-leaf py-2.5 text-center text-sm font-semibold text-leaf-foreground">
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
  item,
  user,
  onClose,
  onRequested,
}: {
  item: Item;
  user: { uid: string };
  onClose: () => void;
  onRequested?: () => void | Promise<void>;
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
      toast.success("Request sent! The owner will approve and hand it over.");
      await onRequested?.();
      onClose();
    } catch (error: any) {
      if (String(error?.message || "").toLowerCase().includes("unauthorized")) {
        toast.dismiss();
        onClose();
        return;
      }
      toast.error(error?.message || "Unable to send request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-3xl bg-card p-5 shadow-2xl sm:p-8">
        <h2 className="font-display text-2xl">Request \"{item.title}\"</h2>

        {item.price_mode === "rent" && (
          <label className="block text-sm">
            How many days?
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        )}

        <div className="space-y-2 rounded-xl bg-muted p-4 text-sm">
          <label className="block text-sm">
            Priority
            <select value={urgency} onChange={(e) => setUrgency(e.target.value as "normal" | "urgent")} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
              <option value="normal">Normal — owner can reply within 24 hours</option>
              <option value="urgent">Urgent — owner should reply within 30 minutes</option>
            </select>
          </label>
          {rent > 0 && <p><strong>Rent:</strong> ${rent}/day x {days} = <strong>${rentTotal}</strong> — paid in cash at return</p>}
          <p><strong>Replacement value:</strong> ${deposit}</p>
        </div>

        <div className="rounded-xl border-2 border-clay/40 bg-clay/5 p-4 text-sm">
          <p className="font-semibold text-clay">Please read carefully</p>
          <p className="mt-1 text-foreground">
            If the item comes back with any defect, damage or missing parts, you agree to pay the
            <strong> full replacement value of ${deposit}</strong> to the owner in cash at return
            {rent > 0 ? ` (in addition to the $${rentTotal} rent).` : "."}
          </p>
          <label className="mt-3 flex cursor-pointer items-start gap-2">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            <span>I understand and accept these terms. A confirmation will be emailed to me at pickup.</span>
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button onClick={onClose} className="rounded-xl border border-border py-2.5 text-sm font-semibold">Cancel</button>
          <button onClick={submit} disabled={!consent || submitting} className="rounded-xl bg-leaf py-2.5 text-sm font-semibold text-leaf-foreground disabled:opacity-50">
            {submitting ? "Sending..." : "Send request"}
          </button>
        </div>
      </div>
    </div>
  );
}
