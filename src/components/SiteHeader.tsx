import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { LOGO_URL } from "@/lib/brand";

/**
 * Shared top navigation used across every page.
 * Keeps branding, primary links and auth surface consistent.
 */
export function SiteHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const primary = [
    { to: "/items", label: "Browse" },
    { to: "/requests", label: "Requests" },
    { to: "/bookings", label: "Bookings" },
    { to: "/safety", label: "Safety" },
    { to: "/about", label: "About" },
  ] as const;

  return (
    <nav className="sticky top-0 z-40 border-b border-leaf/20 bg-leaf/10 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Peers+Help home">
          <img
            src={LOGO_URL}
            alt="Peers+Help"
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          {primary.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-sm font-semibold text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {user ? (
            <Link
              to="/requests"
              className="hidden rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground hover:bg-leaf/90 sm:inline"
            >
              Post request
            </Link>
          ) : null}
          <UserMenu />
          <button
            type="button"
            aria-label="Menu"
            className="grid size-9 place-items-center rounded-full border border-border md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-lg">☰</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2 text-sm">
            {primary.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-2 text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <Link to="/contact" onClick={() => setOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">
              Contact support
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
