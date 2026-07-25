import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PhotoImg } from "@/components/PhotoImg";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Peers+Help" },
      { name: "description", content: "Manage how neighbors see you on Peers+Help — name, photo, phone, building and address." },
      { property: "og:title", content: "Your profile — Peers+Help" },
      { property: "og:description", content: "Edit your Peers+Help neighbor profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    display_name: "", avatar_url: "", phone: "",
    neighborhood: "", building_name: "", address: "",
  });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    supabase.from("profiles")
      .select("display_name,avatar_url,phone,neighborhood,building_name,address")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setForm({
          display_name: data.display_name ?? "",
          avatar_url: data.avatar_url ?? "",
          phone: (data as any).phone ?? "",
          neighborhood: data.neighborhood ?? "",
          building_name: (data as any).building_name ?? "",
          address: (data as any).address ?? "",
        });
        setReady(true);
      });
  }, [user, loading, navigate]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: form.display_name || null,
      avatar_url: form.avatar_url || null,
      phone: form.phone || null,
      neighborhood: form.neighborhood || null,
      building_name: form.building_name || null,
      address: form.address || null,
    } as never).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("✅ Profile saved", { description: "Your changes are live for neighbors to see." });

  }

  if (loading || !ready) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const initials = (form.display_name || user!.email || "N")
    .split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />


      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-4xl">Your profile</h1>
        <p className="mt-2 text-muted-foreground">This is how neighbors see you. Contact details only unlock after a booking is approved.</p>

        <form onSubmit={save} className="mt-8 space-y-6">
          <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
            {form.avatar_url ? (
              <PhotoImg path={form.avatar_url} alt="" className="size-20 rounded-full object-cover ring-2 ring-border" />
            ) : (
              <div className="grid size-20 place-items-center rounded-full bg-leaf/15 text-2xl font-display text-leaf">
                {initials || "🙂"}
              </div>
            )}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Profile photo</label>
              <PhotoUpload
                value={form.avatar_url || null}
                onChange={(p) => setForm({ ...form, avatar_url: p ?? "" })}
                folder="avatars"
                label="Upload profile photo"
              />
            </div>
          </section>

          <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Display name</label>
              <input required value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone (kept private)</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 010 1234"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
              <p className="mt-1 text-xs text-muted-foreground">Only shared with the other party after a booking is approved.</p>
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input disabled value={user!.email ?? ""} className="mt-1 w-full rounded-md border border-input bg-muted px-3 py-2 text-muted-foreground" />
            </div>
          </section>

          <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <h2 className="font-semibold">Where you live</h2>
              <p className="text-xs text-muted-foreground">Used only to compute rough distance to neighbors. Exact address is shown only after a booking is approved.</p>
            </div>
            <div>
              <label className="block text-sm font-medium">Neighborhood</label>
              <input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                placeholder="e.g. Kalyani Nagar"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Building / society name</label>
              <input value={form.building_name} onChange={(e) => setForm({ ...form, building_name: e.target.value })}
                placeholder="e.g. Sunrise Residency, Tower B"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Full address</label>
              <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Flat 302, 5th Ave, City"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
            </div>
          </section>

          <div className="flex gap-3">
            <button disabled={saving} className="rounded-full bg-leaf px-6 py-2.5 text-sm font-semibold text-leaf-foreground disabled:opacity-50">
              {saving ? "Saving…" : "Save profile"}
            </button>
            <Link to="/settings" className="rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted">
              Notification settings →
            </Link>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
