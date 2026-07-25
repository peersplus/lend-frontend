import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/UserMenu";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PhotoImg } from "@/components/PhotoImg";
import { toast } from "sonner";

type Booking = {
  id: string;
  item_id: string;
  owner_id: string;
  borrower_id: string;
  status: string;
  agreed_rent_per_day: number | null;
  agreed_days: number | null;
  agreed_deposit: number;
  consent_accepted_at: string | null;
  pickup_at: string | null;
  return_due: string | null;
  returned_at: string | null;
  has_defect: boolean;
  defect_notes: string | null;
  amount_paid: number | null;
  pickup_photo_url: string | null;
  return_photo_url: string | null;
  created_at: string;
  items: { title: string; image_url: string | null } | null;
};

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "Your bookings — Peers+Help" },
      { name: "description", content: "Track items you've borrowed and lent to neighbors: pickup, return, and payment." },
      { property: "og:title", content: "Your bookings — Peers+Help" },
      { property: "og:description", content: "Manage pickup, return, and cash payment for community rentals." },
    ],
  }),
  component: BookingsPage,
});

function BookingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"borrowed" | "lent">("borrowed");
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const col = tab === "borrowed" ? "borrower_id" : "owner_id";
    const { data, error } = await supabase
      .from("bookings")
      .select("*, items(title, image_url)")
      .eq(col, user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  }, [user, tab]);

  useEffect(() => { load(); }, [load]);

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("bookings").update(patch as never).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  async function dispatchNow(b: Booking, photo: string | null) {
    if (!photo) return toast.error("Capture a pickup photo first — this protects both of you.");
    await update(b.id, { status: "picked_up", pickup_at: new Date().toISOString(), pickup_photo_url: photo });
    // fire confirmation email to borrower
    fetch("/api/public/hooks/booking-pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: b.id }),
    }).catch(() => {});
    toast.success("Dispatched. Confirmation emailed to borrower.");
  }

  async function markReturned(b: Booking, defect: boolean, notes: string, photo: string | null) {
    if (!photo) return toast.error("Capture a return photo first.");
    const rentTotal = Number(b.agreed_rent_per_day ?? 0) * Number(b.agreed_days ?? 1);
    const amount = defect ? Number(b.agreed_deposit) + rentTotal : rentTotal;
    await update(b.id, {
      status: defect ? "defect_reported" : "returned",
      returned_at: new Date().toISOString(),
      has_defect: defect,
      defect_notes: defect ? notes : null,
      amount_paid: amount,
      return_photo_url: photo,
    });
    toast.success(defect
      ? `Return logged. Borrower owes $${amount} in cash (rent + full replacement).`
      : `Return logged. Borrower owes $${amount} in cash.`);
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Link to="/auth" className="rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-leaf-foreground">
          Sign in to see bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-leaf text-leaf-foreground font-display text-lg">P</span>
            <span className="font-display text-2xl text-leaf">Peers+Help</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link to="/items" className="hidden sm:inline rounded-full border border-border px-4 py-2 hover:bg-muted">Browse</Link>
            <Link to="/requests" className="hidden sm:inline rounded-full border border-border px-4 py-2 hover:bg-muted">Requests</Link>
            <UserMenu />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-2 font-display text-4xl">Your bookings</h1>
        <p className="mb-6 text-muted-foreground">Track pickup, return, and cash payment for shared items.</p>

        <div className="mb-6 inline-flex rounded-full border border-border bg-card p-1">
          {(["borrowed", "lent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm font-medium ${tab === t ? "bg-leaf text-leaf-foreground" : "text-muted-foreground"}`}
            >
              {t === "borrowed" ? "I borrowed" : "I lent"}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            Nothing here yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {rows.map((b) => (
              <BookingRow
                key={b.id}
                b={b}
                role={tab}
                onDispatch={(photo) => dispatchNow(b, photo)}
                onReturn={(defect, notes, photo) => markReturned(b, defect, notes, photo)}
                onCancel={() => update(b.id, { status: "cancelled" })}
                onApprove={() => update(b.id, { status: "approved" })}
                onDecline={() => update(b.id, { status: "declined" })}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function BookingRow({
  b, role, onDispatch, onReturn, onCancel, onApprove, onDecline,
}: {
  b: Booking;
  role: "borrowed" | "lent";
  onDispatch: (photo: string | null) => void;
  onReturn: (defect: boolean, notes: string, photo: string | null) => void;
  onCancel: () => void;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const [showReturn, setShowReturn] = useState(false);
  const [showDispatch, setShowDispatch] = useState(false);
  const [defect, setDefect] = useState(false);
  const [notes, setNotes] = useState("");
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
  const [returnPhoto, setReturnPhoto] = useState<string | null>(null);

  const rentTotal = Number(b.agreed_rent_per_day ?? 0) * Number(b.agreed_days ?? 1);

  return (
    <li className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
          {b.items?.image_url ? (
            <PhotoImg path={b.items.image_url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex-1 min-w-[200px]">
          <h3 className="font-semibold">{b.items?.title ?? "Item"}</h3>
          <p className="text-sm text-muted-foreground">
            {rentTotal > 0 ? `$${b.agreed_rent_per_day}/day × ${b.agreed_days} = $${rentTotal} cash on return` : "Free borrow"}
            {" · "}Replacement value ${b.agreed_deposit}
          </p>
          {b.defect_notes && (
            <p className="mt-1 text-sm text-clay">⚠ Defect: {b.defect_notes}</p>
          )}
          {b.amount_paid != null && (
            <p className="mt-1 text-sm font-medium">Amount owed: ${b.amount_paid} cash</p>
          )}
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          {b.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["approved","picked_up","returned","defect_reported","completed"].includes(b.status) && (
          <Link
            to="/chat/$bookingId"
            params={{ bookingId: b.id }}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
          >
            💬 Chat & contact
          </Link>
        )}
        {role === "lent" && b.status === "requested" && (
          <>
            <button onClick={onApprove} className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground">
              Approve
            </button>
            <button onClick={onDecline} className="rounded-full border border-border px-4 py-2 text-sm">
              Decline
            </button>
          </>
        )}
        {role === "lent" && b.status === "approved" && (
          <button onClick={() => setShowDispatch(true)} className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground">
            Dispatch / Mark picked up
          </button>
        )}
        {role === "lent" && b.status === "picked_up" && (
          <button onClick={() => setShowReturn(true)} className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
            Mark returned
          </button>
        )}
      </div>

      {(b.pickup_photo_url || b.return_photo_url) && (
        <div className="mt-3 flex gap-3">
          {b.pickup_photo_url && (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Pickup photo</p>
              <PhotoImg path={b.pickup_photo_url} alt="pickup" className="h-20 w-20 rounded-lg object-cover" />
            </div>
          )}
          {b.return_photo_url && (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Return photo</p>
              <PhotoImg path={b.return_photo_url} alt="return" className="h-20 w-20 rounded-lg object-cover" />
            </div>
          )}
        </div>
      )}

      {showDispatch && (
        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <p className="mb-2 text-sm font-medium">Capture a photo of the item at pickup</p>
          <PhotoUpload value={pickupPhoto} onChange={setPickupPhoto} folder="bookings" label="Snap pickup photo" />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { onDispatch(pickupPhoto); setShowDispatch(false); }}
              className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground"
            >
              Confirm dispatch
            </button>
            <button onClick={() => setShowDispatch(false)} className="rounded-full border border-border px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
        {role === "borrowed" && (b.status === "requested" || b.status === "approved") && (
          <button onClick={onCancel} className="rounded-full border border-border px-4 py-2 text-sm">
            Cancel
          </button>
        )}
      </div>

      {showReturn && (
        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={defect} onChange={(e) => setDefect(e.target.checked)} />
            Item has a defect / damage / missing part
          </label>
          {defect && (
            <>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the defect…"
                rows={2}
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="mt-2 text-sm text-clay">
                Borrower will owe the <strong>full replacement value of ${b.agreed_deposit}</strong> plus rent (${rentTotal}) = <strong>${Number(b.agreed_deposit) + rentTotal}</strong> in cash.
              </p>
            </>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { onReturn(defect, notes); setShowReturn(false); }}
              className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground"
            >
              Confirm return
            </button>
            <button onClick={() => setShowReturn(false)} className="rounded-full border border-border px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
