import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "@/lib/sonner";

export function NotificationBell() {
  const { items, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const insideTrigger = !!wrapRef.current?.contains(target);
      const insidePanel = !!mobilePanelRef.current?.contains(target) || !!desktopPanelRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) setOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next && unreadCount > 0) {
        void markAllRead().catch(() => {
          toast.error("Could not mark notifications read.");
        });
      }
      return next;
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={toggleOpen}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-input bg-background hover:bg-accent"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          {typeof document !== "undefined" && createPortal(
            <>
              <div className="fixed inset-0 z-[95] bg-black/30 backdrop-blur-[1px] md:hidden" onClick={() => setOpen(false)} aria-hidden />
              <div ref={mobilePanelRef} className="fixed inset-x-2 bottom-2 z-[100] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-0 slide-in-from-bottom-3 duration-200 md:hidden">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold">Neighborhood inbox</p>
                  <p className="text-xs text-muted-foreground">Nearby requests and activity</p>
                </div>
               <div className="max-h-[68vh] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No notifications yet.
                    </div>
                  ) : (
                    items.map((n) => (
                      <Link
                        key={n.id}
                        to="/bookings"
                        onClick={() => setOpen(false)}
                        className="block border-b border-border/50 px-4 py-3 hover:bg-accent"
                      >
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        {n.body && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                        )}
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
                <div className="border-t border-border px-4 py-2 text-right">
                  <Link to="/settings" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">
                    Notification settings →
                  </Link>
                </div>
              </div>
            </>,
            document.body,
          )}
          <div ref={desktopPanelRef} className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-xl md:absolute md:right-0 md:z-50 md:mt-2 md:block md:w-80">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Neighborhood inbox</p>
              <p className="text-xs text-muted-foreground">Nearby requests and activity</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </div>
              ) : (
                items.map((n) => (
                  <Link
                    key={n.id}
                    to="/bookings"
                    onClick={() => setOpen(false)}
                    className="block border-b border-border/50 px-4 py-3 hover:bg-accent"
                  >
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    {n.body && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    )}
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </Link>
                ))
              )}
            </div>
            <div className="border-t border-border px-4 py-2 text-right">
              <Link to="/settings" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">
                Notification settings →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
