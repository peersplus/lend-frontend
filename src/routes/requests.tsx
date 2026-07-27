import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createRequestApi, createRequestOfferApi, deleteRequestApi, listRequestOffersApi, listRequestsApi, updateRequestApi } from "@/lib/api-peers";
import { useRole } from "@/hooks/useRole";
import { NotificationBell } from "@/components/NotificationBell";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PhotoImg } from "@/components/PhotoImg";
import { toast } from "sonner";



type Offer = { id: string; request_id: string; helper_id: string; created_at: string; profiles?: { display_name: string | null; avatar_url: string | null } | null };


type Request = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string;
  urgency: "normal" | "urgent";
  needed_by: string | null;
  radius_km: number;
  image_url: string | null;
  status: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
};

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "Neighborhood requests — Peers Plus" },
      { name: "description", content: "Ask nearby neighbors for what you need — tools, medical gear, urgent help." },
      { property: "og:title", content: "Neighborhood requests — Peers Plus" },
      { property: "og:description", content: "Post a request and every neighbor inside your radius gets notified." },
    ],
  }),
  component: RequestsPage,
});

const categories = ["Tools", "Electronics", "Medical", "Companionship", "Party", "Baby", "Kitchen", "Camping", "Emergency", "Other"];

function RequestsPage() {
  const { user } = useAuth();
  const { isSuperadmin } = useRole();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Request[]>([]);
  const [offersByReq, setOffersByReq] = useState<Record<string, Offer[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Request | null>(null);
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string>("All");
  const [filterUrg, setFilterUrg] = useState<"all" | "urgent" | "normal">("all");
  const [onlyMine, setOnlyMine] = useState(false);

  
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Tools",
    urgency: "normal" as "normal" | "urgent",
    radius_km: 5,
    image_url: "" as string,
  });

  function notifyUpdate(r: Request, status: "closed" | "open" | "deleted") {
    const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "";
    fetch("/api/public/hooks/request-updated", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anon },
      body: JSON.stringify({ request_id: r.id, status, title: r.title, owner_id: r.owner_id }),
    }).catch(() => {});
  }

  async function loadOffers(requestIds: string[]) {
    if (requestIds.length === 0) return;
    try {
      const data = await listRequestOffersApi(requestIds);
      const grouped: Record<string, Offer[]> = {};
      (data as unknown as Offer[] | null)?.forEach((o) => {
        (grouped[o.request_id] ||= []).push(o);
      });
      setOffersByReq(grouped);
    } catch {
      setOffersByReq({});
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = (await listRequestsApi()) as Request[];
        setRows(list);
        await loadOffers(list.map((r) => r.id));
      } catch (error: any) {
        toast.error(error.message || 'Unable to load requests');
        setRows([]);
      }
      setLoading(false);
    })();
  }, [user?.uid, isSuperadmin]);



  async function offerHelp(r: Request) {
    if (!user) return navigate({ to: "/auth" });
    try {
      const inserted = await createRequestOfferApi({ request_id: r.id, helper_id: user.uid });
      if (inserted?.id) {
        const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "";
        fetch("/api/public/hooks/offer-created", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: anon },
          body: JSON.stringify({ offer_id: inserted.id }),
        }).catch(() => {});
      }
    } catch (error: any) {
      toast.error(error.message || 'Unable to offer help');
      return;
    }
    toast.success("✅ You offered to help — the requester was notified by email. Opening chat…");
    navigate({ to: "/chat/request/$requestId/$peerId", params: { requestId: r.id, peerId: r.owner_id } });
  }

  async function closeRequest(r: Request, status: "closed" | "open") {
    try {
      await updateRequestApi(r.id, { status });
    } catch (error: any) {
      return toast.error(error.message || 'Unable to update request');
    }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
    notifyUpdate(r, status);
    toast.success(status === "closed" ? "Request marked inactive — helpers notified." : "Request reopened — helpers notified.");
  }

  async function deleteRequest(r: Request) {
    if (!confirm("Delete this request? This cannot be undone.")) return;
    notifyUpdate(r, "deleted");
    try {
      await deleteRequestApi(r.id);
    } catch (error: any) {
      return toast.error(error.message || 'Unable to delete request');
    }
    setRows((prev) => prev.filter((x) => x.id !== r.id));
    toast.success("Request deleted — helpers notified.");
  }



  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const profile = await import('@/lib/api-peers').then((m) => m.getMyPeerProfileApi());
      const data = await createRequestApi({
        title: form.title,
        description: form.description || null,
        category: form.category,
        urgency: form.urgency,
        radius_km: form.radius_km,
        image_url: form.image_url || null,
        lat: profile?.lat ?? null,
        lng: profile?.lng ?? null,
      });
      setRows((prev) => [data as Request, ...prev]);
    } catch (error: any) {
      toast.error(error.message || 'Unable to post request');
      return;
    }
    setShowForm(false);
    setForm({ title: "", description: "", category: "Tools", urgency: "normal", radius_km: 5, image_url: "" });
    toast.success("Request posted — your neighborhood has been notified.");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />


      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <NotificationPermissionPrompt />
        </div>
        <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:items-end sm:gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-3xl italic sm:text-4xl">Neighborhood requests</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Post what you need. Every neighbor inside your radius gets a ping — in the app, by push, and by email.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowForm((s) => !s)}
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
            >
              {showForm ? "Cancel" : "+ Post a request"}
            </button>
          )}
        </div>

        {showForm && user && (
          <form onSubmit={submit} className="mb-8 space-y-4 rounded-lg border border-border bg-card p-6">
            <div>
              <label className="block text-sm font-medium">What do you need?</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Wheelchair for the weekend"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Details</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Urgency</label>
                <select
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value as "normal" | "urgent" })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Radius (km)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.radius_km}
                  onChange={(e) => setForm({ ...form, radius_km: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Photo (optional — helps neighbors recognize the item)</label>
              <PhotoUpload
                value={form.image_url || null}
                onChange={(p) => setForm({ ...form, image_url: p ?? "" })}
                folder="requests"
                label="Snap what you need"
              />
            </div>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Notify my neighbors
            </button>
          </form>
        )}

        {!user && (
          <div className="mb-8 rounded-lg border border-dashed border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary underline">Sign in</Link> to post a request and receive nearby alerts.
            </p>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 overflow-x-auto rounded-xl border border-border bg-card p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔎 Search title or details…"
            className="min-w-[200px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="shrink-0 rounded-md border border-input bg-background px-2 py-2 text-sm"
          >
            <option>All</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <div className="flex shrink-0 overflow-hidden rounded-md border border-input text-sm">
            {(["all", "urgent", "normal"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setFilterUrg(u)}
                className={`px-3 py-2 ${filterUrg === u ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                {u === "all" ? "All" : u === "urgent" ? "🚨 Urgent" : "Normal"}
              </button>
            ))}
          </div>
          {user && (
            <label className="flex shrink-0 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
              Only mine
            </label>
          )}
          {(query || filterCat !== "All" || filterUrg !== "all" || onlyMine) && (
            <button
              onClick={() => { setQuery(""); setFilterCat("All"); setFilterUrg("all"); setOnlyMine(false); }}
              className="shrink-0 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted"
            >
              Clear
            </button>
          )}
        </div>


        {(() => {
          const q = query.trim().toLowerCase();
          const filtered = rows.filter((r) => {
            if (filterCat !== "All" && r.category !== filterCat) return false;
            if (filterUrg !== "all" && r.urgency !== filterUrg) return false;
            if (onlyMine && r.owner_id !== user?.uid) return false;
            if (q && !(r.title.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q))) return false;
            return true;
          });
          if (loading) return <p className="text-muted-foreground">Loading…</p>;
          if (filtered.length === 0) return (
            <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
              {rows.length === 0 ? "No open requests yet. Be the first to ask your neighborhood." : "No requests match your filters."}
            </div>
          );
          return (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((r) => (
              <article
                key={r.id}
                className={`overflow-hidden rounded-lg border ${
                  r.urgency === "urgent" ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"
                }`}
              >
                {r.image_url && (
                  <PhotoImg path={r.image_url} alt={r.title} className="h-40 w-full object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium">{r.title}</h3>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {r.status !== "open" && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold uppercase text-muted-foreground">Inactive</span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.category}</span>
                    </div>
                  </div>
                  {r.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {r.urgency === "urgent" && <span className="font-semibold text-destructive">🚨 URGENT</span>}
                    <span>within {r.radius_km}km</span>
                    <span>· {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>


                  {user && user.uid !== r.owner_id && r.status === "open" && (
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        onClick={() => offerHelp(r)}
                        className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground hover:bg-leaf/90"
                      >
                        🤝 I can help — chat
                      </button>
                      <Link
                        to="/items"
                        search={{ lend: r.title, cat: r.category } as never}
                        className="rounded-full border border-leaf bg-background px-4 py-2 text-center text-sm font-semibold text-leaf hover:bg-leaf/10"
                      >
                        🎁 I have this — lend it
                      </Link>
                    </div>
                  )}

                  {/* Public responses — every neighbor can see who offered help */}
                  {(offersByReq[r.id]?.length ?? 0) > 0 && (
                    <div className="mt-4 rounded-lg border border-border bg-background/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {(offersByReq[r.id]?.length ?? 0)} neighbor{(offersByReq[r.id]?.length ?? 0) === 1 ? "" : "s"} offered help
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {offersByReq[r.id]!.map((o) => (
                          <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="truncate">{o.profiles?.display_name ?? "Neighbor"}</span>
                            {user && user.uid === r.owner_id && (
                              <Link
                                to="/chat/request/$requestId/$peerId"
                                params={{ requestId: r.id, peerId: o.helper_id }}
                                className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"
                              >
                                Chat
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {user && (user.uid === r.owner_id || isSuperadmin) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setEditing(r)}
                        className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        ✏️ Edit
                      </button>
                      {r.status === "open" ? (
                        <button
                          onClick={() => closeRequest(r, "closed")}
                          className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          Mark inactive
                        </button>
                      ) : (
                        <button
                          onClick={() => closeRequest(r, "open")}
                          className="flex-1 rounded-full border border-leaf bg-leaf/10 px-3 py-1.5 text-xs font-semibold text-leaf hover:bg-leaf/20"
                        >
                          Reopen request
                        </button>
                      )}
                      <button
                        onClick={() => deleteRequest(r)}
                        className="flex-1 rounded-full border border-destructive/50 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </div>
                  )}


                </div>
              </article>
            ))}

          </div>
          );
        })()}

        <footer className="mt-16 rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Peers Plus is a free community platform.</p>
          <p className="mt-1">
            We help neighbors connect and communicate. All conversations, exchanges, payments and pickups happen directly between users —
            Peers Plus is <strong>not responsible</strong> for any communication, agreement, damage, or loss between neighbors.
            We only provide the platform to post and connect, free of cost, and support you when things go wrong.
          </p>
        </footer>
      </main>
      <SiteFooter />
      {editing && (
        <EditRequestModal
          request={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setRows((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
            setEditing(null);
          }}
        />
      )}

    </div>
  );
}


function EditRequestModal({
  request,
  onClose,
  onSaved,
}: {
  request: Request;
  onClose: () => void;
  onSaved: (updated: Request) => void;
}) {
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description ?? "");
  const [category, setCategory] = useState(request.category);
  const [urgency, setUrgency] = useState<"normal" | "urgent">(request.urgency);
  const [radiusKm, setRadiusKm] = useState<number>(request.radius_km ?? 5);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const patch = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      urgency,
      radius_km: radiusKm,
    };
    const { data, error } = await supabase
      .from("requests")
      .update(patch)
      .eq("id", request.id)
      .select("*")
      .maybeSingle();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request updated");
    onSaved({ ...request, ...(data as Request) });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit request</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Urgency</span>
              <select value={urgency} onChange={(e) => setUrgency(e.target.value as "normal" | "urgent")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Radius (km)</span>
            <input type="number" min={1} max={50} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value) || 5)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
          <button onClick={save} disabled={saving || !title.trim()} className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
