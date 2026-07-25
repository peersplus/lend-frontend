import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Profile = {
  display_name: string | null;
  avatar_url: string | null;
  neighborhood: string | null;
};

export function UserMenu() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from("profiles")
      .select("display_name,avatar_url,neighborhood")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <Link to="/auth" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90">
        Sign in
      </Link>
    );
  }

  const name = profile?.display_name || user.email?.split("@")[0] || "Neighbor";
  const initials = name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <div ref={wrap} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3 text-sm font-medium hover:bg-muted"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-leaf/15 text-xs font-semibold text-leaf">
            {initials || "🙂"}
          </span>
        )}
        <span className="hidden max-w-[9rem] truncate sm:inline">{name}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="truncate font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            {profile?.neighborhood && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">📍 {profile.neighborhood}</p>
            )}
          </div>
          <nav className="py-1 text-sm">
            <Link to="/profile" className="block px-4 py-2 hover:bg-muted" onClick={() => setOpen(false)}>Your profile</Link>
            <Link to="/bookings" className="block px-4 py-2 hover:bg-muted" onClick={() => setOpen(false)}>My bookings</Link>
            <Link to="/items" className="block px-4 py-2 hover:bg-muted" onClick={() => setOpen(false)}>Browse items</Link>
            <Link to="/requests" className="block px-4 py-2 hover:bg-muted" onClick={() => setOpen(false)}>Requests feed</Link>
            <Link to="/settings" className="block px-4 py-2 hover:bg-muted" onClick={() => setOpen(false)}>Notifications & neighborhood</Link>
          </nav>
          <button
            onClick={signOut}
            className="block w-full border-t border-border/60 px-4 py-2.5 text-left text-sm text-clay hover:bg-clay/5"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
