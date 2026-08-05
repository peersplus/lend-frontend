import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { LOGO_URL } from "@/lib/brand";

/**
 * Shared top navigation used across every page.
 * Keeps branding, primary links and auth surface consistent.
 */
export function SiteHeader() {
  const { user } = useAuth();
  const { isSuperadmin } = useRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const primary = [
    { to: "/items", label: "Browse" },
    { to: "/requests", label: "Requests" },
    { to: "/bookings", label: "Bookings" },
    { to: "/feedback", label: "Feedback" },
    { to: "/safety", label: "Safety" },
    { to: "/about", label: "About" },
    ...(isSuperadmin ? [{ to: "/admin", label: "Admin" }] : []),
  ] as { to: string; label: string }[];

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Peers Plus home">
          <img
            src={LOGO_URL}
            alt="Peers Plus"
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
          <button
            type="button"
            id="header-post-lend-button"
            name="headerPostLend"
            data-testid="header-post-lend-button"
            onClick={() => {
              navigate({
                to: "/items",
                search: { lend: "1", cat: undefined, lendOpen: String(Date.now()) },
              });
            }}
            data-header-cta
            className="inline-flex h-9 w-9 items-center justify-center gap-1.5 rounded-full bg-leaf px-0 text-sm font-semibold text-leaf-foreground shadow-sm shadow-leaf/20 transition-transform hover:-translate-y-0.5 hover:bg-leaf/90 sm:w-[136px] sm:px-4"
            aria-label="Post a lend"
          >
            <span aria-hidden className="text-base leading-none text-leaf-foreground">+</span>
            <span className="hidden sm:inline">Post a Lend</span>
          </button>
          <div className="w-auto sm:w-[168px]">
            <UserMenu />
          </div>
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
