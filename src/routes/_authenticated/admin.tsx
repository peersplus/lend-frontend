import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Peers Plus" },
      { name: "description", content: "Superadmin overview of all Peers Plus activity." },
      { property: "og:title", content: "Admin — Peers Plus" },
      { property: "og:description", content: "Manage requests, items, and bookings across the neighborhood." },
    ],
  }),
  component: AdminPage,
});

type Tab = "requests" | "items" | "bookings" | "users";

function AdminPage() {
  const { isSuperadmin, ready } = useRole();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("requests");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && !isSuperadmin) {
      toast.error("Superadmin only");
      navigate({ to: "/" });
    }
  }, [ready, isSuperadmin, navigate]);

  useEffect(() => {
    if (!isSuperadmin) return;
    setLoading(true);
    const table = tab === "users" ? "profiles" : tab;
    supabase
      .from(table as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setRows((data as any[]) ?? []);
        setLoading(false);
      });
  }, [tab, isSuperadmin]);

  async function del(id: string) {
    if (!confirm("Delete this row?")) return;
    const table = tab === "users" ? "profiles" : tab;
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setRows((r) => r.filter((x) => x.id !== id));
  }

  if (!ready) return null;
  if (!isSuperadmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-semibold">Admin console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Superadmin view — you can see and manage every neighbor's activity.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {(["requests", "items", "bookings", "users"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition ${
                tab === t
                  ? "border-leaf bg-leaf text-leaf-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rows.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Title / Name</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {r.title ?? r.display_name ?? r.id}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.owner_id ?? r.borrower_id ?? r.id}
                    </td>
                    <td className="px-4 py-3 text-xs">{r.status ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => del(r.id)}
                        className="rounded-md border border-destructive px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
