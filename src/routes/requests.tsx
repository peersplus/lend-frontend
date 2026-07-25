import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
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
};

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "Neighborhood requests — Peers+Help" },
      { name: "description", content: "Ask nearby neighbors for what you need — tools, medical gear, urgent help." },
      { property: "og:title", content: "Neighborhood requests — Peers+Help" },
      { property: "og:description", content: "Post a request and every neighbor inside your radius gets notified." },
    ],
  }),
  component: RequestsPage,
});

const categories = ["Tools", "Electronics", "Medical", "Companionship", "Party", "Baby", "Kitchen", "Camping", "Emergency", "Other"];

function RequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Request[]>([]);
  const [offersByReq, setOffersByReq] = useState<Record<string, Offer[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Tools",
    urgency: "normal" as "normal" | "urgent",
    radius_km: 5,
    image_url: "" as string,
  });

  async function loadOffers(requestIds: string[]) {
    if (requestIds.length === 0) return;
    const { data } = await supabase
      .from("request_offers")
      .select("id, request_id, helper_id, created_at, profiles:helper_id(display_name, avatar_url)")
      .in("request_id", requestIds);
    const grouped: Record<string, Offer[]> = {};
    (data as unknown as Offer[] | null)?.forEach((o) => {
      (grouped[o.request_id] ||= []).push(o);
    });
    setOffersByReq(grouped);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50);
      const list = (data as Request[]) ?? [];
      setRows(list);
      setLoading(false);
      await loadOffers(list.map((r) => r.id));
    })();
  }, [user?.id]);

  async function offerHelp(r: Request) {
    if (!user) return navigate({ to: "/auth" });
    const { error } = await supabase
      .from("request_offers")
      .insert({ request_id: r.id, helper_id: user.id })
      .select("id")
      .maybeSingle();
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    toast.success("You offered to help. Opening chat…");
    navigate({ to: "/chat/request/$requestId/$peerId", params: { requestId: r.id, peerId: r.owner_id } });
  }


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // pull user's stored coords for radius fan-out
    const { data: prof } = await supabase
      .from("profiles")
      .select("lat,lng,radius_km")
      .eq("id", user.id)
      .maybeSingle();
    const { data, error } = await supabase
      .from("requests")
      .insert({
        owner_id: user.id,
        title: form.title,
        description: form.description || null,
        category: form.category,
        urgency: form.urgency,
        radius_km: form.radius_km,
        image_url: form.image_url || null,
        lat: prof?.lat ?? null,
        lng: prof?.lng ?? null,
      })
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => [data as Request, ...prev]);
    setShowForm(false);
    setForm({ title: "", description: "", category: "Tools", urgency: "normal", radius_km: 5, image_url: "" });
    toast.success("Request posted — your neighborhood has been notified.");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-serif italic">Peers+Help</Link>
          <div className="flex items-center gap-3">
            <Link to="/items" className="text-sm hover:text-primary">Items</Link>
            <Link to="/settings" className="text-sm hover:text-primary">Settings</Link>
            {user && <NotificationBell />}
            {user ? (
              <button
                onClick={() => supabase.auth.signOut()}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
              >
                Sign out
              </button>
            ) : (
              <Link to="/auth" className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <NotificationPermissionPrompt />
        </div>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl italic">Neighborhood requests</h1>
            <p className="mt-2 text-muted-foreground">
              Post what you need. Every neighbor inside your radius gets a ping — in the app, by push, and by email.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowForm((s) => !s)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
            No open requests yet. Be the first to ask your neighborhood.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((r) => (
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
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.category}</span>
                  </div>
                  {r.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {r.urgency === "urgent" && <span className="font-semibold text-destructive">🚨 URGENT</span>}
                    <span>within {r.radius_km}km</span>
                    <span>· {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>

                  {user && user.id !== r.owner_id && (
                    <button
                      onClick={() => offerHelp(r)}
                      className="mt-4 w-full rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground hover:bg-leaf/90"
                    >
                      🤝 I can help — open chat
                    </button>
                  )}

                  {user && user.id === r.owner_id && (
                    <div className="mt-4 rounded-lg border border-border bg-background/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {(offersByReq[r.id]?.length ?? 0)} neighbor{(offersByReq[r.id]?.length ?? 0) === 1 ? "" : "s"} offered help
                      </p>
                      {(offersByReq[r.id] ?? []).length > 0 && (
                        <ul className="mt-2 space-y-1.5">
                          {offersByReq[r.id]!.map((o) => (
                            <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                              <span className="truncate">{o.profiles?.display_name ?? "Neighbor"}</span>
                              <Link
                                to="/chat/request/$requestId/$peerId"
                                params={{ requestId: r.id, peerId: o.helper_id }}
                                className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"
                              >
                                Chat
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}

          </div>
        )}
      </main>
    </div>
  );
}
