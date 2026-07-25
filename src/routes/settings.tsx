import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWebPush } from "@/hooks/useWebPush";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Notification settings — Peers+Help" },
      { name: "description", content: "Set your neighborhood, radius, and how you want to be pinged when neighbors need help." },
      { property: "og:title", content: "Notification settings — Peers+Help" },
      { property: "og:description", content: "Control your Peers+Help alerts — in-app, push, and email." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const push = useWebPush();
  const [form, setForm] = useState({
    neighborhood: "",
    lat: "" as string,
    lng: "" as string,
    radius_km: 5,
    push_enabled: true,
    email_enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("neighborhood,lat,lng,radius_km,push_enabled,email_enabled")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setForm({
          neighborhood: data.neighborhood ?? "",
          lat: data.lat != null ? String(data.lat) : "",
          lng: data.lng != null ? String(data.lng) : "",
          radius_km: data.radius_km ?? 5,
          push_enabled: data.push_enabled ?? true,
          email_enabled: data.email_enabled ?? true,
        });
      }
      setReady(true);
    })();
  }, [user, loading, navigate]);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        toast.success("Location captured.");
      },
      (err) => toast.error(err.message),
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        neighborhood: form.neighborhood || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        radius_km: form.radius_km,
        push_enabled: form.push_enabled,
        email_enabled: form.email_enabled,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Saved.");
  };

  if (loading || !ready) return <div className="p-8">Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-serif text-lg italic">Peers+Help</Link>
          <div className="flex gap-3 text-sm">
            <Link to="/requests" className="hover:text-primary">Requests</Link>
            <Link to="/items" className="hover:text-primary">Items</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-serif text-4xl italic">Your neighborhood & alerts</h1>
        <p className="mt-2 text-muted-foreground">
          Tell us where you live and how you want to hear about nearby requests.
        </p>

        <form onSubmit={save} className="mt-8 space-y-8">
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-semibold">Neighborhood</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We only show approximate distance to neighbors — never your exact address.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Neighborhood name</label>
                <input
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  placeholder="e.g. Kalyani Nagar"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Latitude</label>
                <input
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Longitude</label>
                <input
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={useMyLocation}
                  className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
                >
                  Use my current location
                </button>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Alert radius: {form.radius_km} km</label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={form.radius_km}
                  onChange={(e) => setForm({ ...form, radius_km: Number(e.target.value) })}
                  className="mt-2 w-full"
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-semibold">How should we ping you?</h2>
            <div className="mt-4 space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">In-app inbox</p>
                  <p className="text-xs text-muted-foreground">Always on. Look for the bell.</p>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.push_enabled}
                  onChange={(e) => setForm({ ...form, push_enabled: e.target.checked })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Web push notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Get pop-up alerts even when Peers+Help isn't open.
                  </p>
                  {push.supported ? (
                    push.subscribed ? (
                      <button
                        type="button"
                        onClick={push.unsubscribe}
                        disabled={push.busy}
                        className="mt-2 rounded-md border border-input px-3 py-1 text-xs hover:bg-accent"
                      >
                        Disable on this device
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => push.subscribe().catch((e) => toast.error(e.message))}
                        disabled={push.busy}
                        className="mt-2 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
                      >
                        Enable on this device
                      </button>
                    )
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">Not supported in this browser.</p>
                  )}
                  {!push.configured && (
                    <p className="mt-1 text-xs text-amber-600">
                      Server keys not configured yet — subscriptions won't deliver until VAPID keys are set.
                    </p>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.email_enabled}
                  onChange={(e) => setForm({ ...form, email_enabled: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">
                    A daily digest and urgent-request alerts to {user?.email}.
                  </p>
                </div>
              </label>
            </div>
          </section>

          <button
            disabled={saving}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </form>
      </main>
    </div>
  );
}
