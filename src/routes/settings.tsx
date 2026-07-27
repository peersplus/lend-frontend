import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseIdToken } from "@/lib/firebase";
import { useWebPush } from "@/hooks/useWebPush";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { requestLocation } from "@/lib/geolocate";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Notification settings — Peers Plus" },
      { name: "description", content: "Set your neighborhood, radius, and how you want to be pinged when neighbors need help." },
      { property: "og:title", content: "Notification settings — Peers Plus" },
      { property: "og:description", content: "Control your Peers Plus alerts — in-app, push, and email." },
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
    require_handoff_person: false,
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
      try {
        const token = await getFirebaseIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/peer-profile/me`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const body = await response.json().catch(() => null);
        const data = body?.data;
        if (data) {
          setForm({
            neighborhood: data.neighborhood ?? "",
            lat: data.lat != null ? String(data.lat) : "",
            lng: data.lng != null ? String(data.lng) : "",
            radius_km: data.radius_km ?? 5,
            push_enabled: data.push_enabled ?? true,
            email_enabled: data.email_enabled ?? true,
            require_handoff_person: data.require_handoff_person ?? false,
          });
        }
      } catch {
        // ignore load errors
      }
      setReady(true);
    })();
  }, [user, loading, navigate]);

  const useMyLocation = () => {
    requestLocation(({ lat, lng }) => {
      setForm((f) => ({
        ...f,
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
      }));
      toast.success("Location captured.");
    });
  };


  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const token = await getFirebaseIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/peer-profile/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          neighborhood: form.neighborhood || null,
          lat: form.lat ? Number(form.lat) : null,
          lng: form.lng ? Number(form.lng) : null,
          radius_km: form.radius_km,
          push_enabled: form.push_enabled,
          email_enabled: form.email_enabled,
          require_handoff_person: form.require_handoff_person,
        }),
      });
      const body = await response.json().catch(() => null);
      setSaving(false);
      if (!response.ok) throw new Error(body?.error?.message || "Unable to save settings");
      toast.success("✅ Settings saved", { description: "Your neighborhood & alert preferences are updated." });
    } catch (error: any) {
      setSaving(false);
      toast.error(error.message || "Unable to save settings");
    }

  };

  if (loading || !ready) return <div className="p-8">Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-serif text-4xl italic">Your neighborhood & alerts</h1>
        <p className="mt-2 text-muted-foreground">
          Tell us where you live and how you want to hear about nearby requests.
        </p>

        <div className="mt-6">
          <NotificationPermissionPrompt />
        </div>

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
                    Get pop-up alerts even when Peers Plus isn't open.
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

          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-semibold">Handoff safety</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              For extra peace of mind when lending, ask for the name and a quick photo of the person who actually picks up or returns your item.
            </p>
            <label className="mt-4 flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.require_handoff_person}
                onChange={(e) => setForm({ ...form, require_handoff_person: e.target.checked })}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium">Ask for handoff person details</p>
                <p className="text-xs text-muted-foreground">
                  On pickup and return, capture their name (optional) and a photo (optional). Stays on the booking record.
                </p>
              </div>
            </label>
          </section>


          <button
            disabled={saving}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
