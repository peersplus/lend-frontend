import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createMessageApi, getProfileApi, listBookingsApi, listMessagesApi } from "@/lib/api-peers";
import { UserMenu } from "@/components/UserMenu";
import { PhotoImg } from "@/components/PhotoImg";
import { toast } from "sonner";

export const Route = createFileRoute("/chat/$bookingId")({
  head: ({ params }) => ({
    meta: [
      { title: `Chat — Peers Plus` },
      { name: "description", content: `Private conversation with your neighbor about booking ${params.bookingId}.` },
    ],
  }),
  component: ChatPage,
});

type Message = { id: string; booking_id: string; sender_id: string; body: string; created_at: string };
type BookingLite = { id: string; status: string; owner_id: string; borrower_id: string; items: { title: string; image_url: string | null } | null };
type Contact = { user_id: string; display_name: string | null; avatar_url: string | null; phone: string | null; building_name: string | null; address: string | null; role: string };

type ViewerRole = "owner" | "borrower";

function ChatPage() {
  const { bookingId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingLite | null>(null);
  const [viewerRole, setViewerRole] = useState<ViewerRole | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }

    (async () => {
      try {
        const [borrowedBookings, lentBookings] = await Promise.all([
          listBookingsApi('borrowed'),
          listBookingsApi('lent'),
        ]);

        const b = ((borrowedBookings as any[]) ?? []).find((x) => x.id === bookingId)
          || ((lentBookings as any[]) ?? []).find((x) => x.id === bookingId)
          || null;

        if (!b) {
          toast.error("Booking not found");
          navigate({ to: "/bookings" });
          return;
        }

        const nextViewerRole: ViewerRole = user.uid === b.owner_id ? 'owner' : 'borrower';
        setBooking(b as unknown as BookingLite);
        setViewerRole(nextViewerRole);

        const active = ["approved","picked_up","returned","defect_reported","completed"].includes((b as any).status);
        if (active) {
          const msgs = await listMessagesApi({ booking_id: bookingId });
          setMessages((msgs as Message[]) ?? []);
        }

        const otherUserId = nextViewerRole === 'owner' ? b.borrower_id : b.owner_id;
        if (otherUserId) {
          const profile = await getProfileApi(otherUserId);
          setContact({
            user_id: otherUserId,
            display_name: profile?.display_name ?? profile?.full_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
            phone: profile?.phone ?? null,
            building_name: profile?.building_name ?? null,
            address: profile?.address ?? null,
            role: nextViewerRole === 'owner' ? 'borrower' : 'owner',
          });
        } else {
          setContact(null);
        }

        setReady(true);
      } catch (error: any) {
        toast.error(error.message || 'Unable to load chat');
        navigate({ to: "/bookings" });
      }
    })();
  }, [user, loading, bookingId, navigate]);

  useEffect(() => {
    if (!booking) return;
    let active = true;
    const interval = window.setInterval(async () => {
      try {
        const msgs = await listMessagesApi({ booking_id: bookingId });
        if (active) setMessages((msgs as Message[]) ?? []);
      } catch {
        // ignore refresh errors
      }
    }, 3000);
    return () => { active = false; window.clearInterval(interval); };
  }, [booking, bookingId]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !user) return;
    setSending(true);
    try {
      await createMessageApi({ booking_id: bookingId, sender_id: user.uid, body });
      setSending(false);
      setText("");
    } catch (error: any) {
      setSending(false);
      toast.error(error.message || 'Unable to send message');
    }
  }

  if (loading || !ready) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!booking) return null;

  const active = ["approved","picked_up","returned","defect_reported","completed"].includes(booking.status);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/bookings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            ← Back to bookings
          </Link>
          <UserMenu />
        </div>
      </nav>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1fr_320px]">
        <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-border bg-card">
          <header className="flex items-center gap-3 border-b border-border/60 p-4">
            <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
              {booking.items?.image_url && <img src={booking.items.image_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-semibold">{booking.items?.title ?? "Item"}</h1>
              <p className="text-xs text-muted-foreground">
                Status: <span className="font-semibold">{booking.status.replace("_"," ")}</span>
              </p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {viewerRole === 'owner' ? 'You are the owner' : 'You are the borrower'}
              </p>
            </div>
          </header>

          {!active ? (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div className="max-w-sm">
                <p className="font-display text-2xl">Chat unlocks after approval</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Once the owner approves this booking, you'll both be able to message here and see each other's phone number for pickup.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">Say hi 👋 — coordinate pickup, timing, and any details.</p>
                )}
                {messages.map((m) => {
                  const mine = m.sender_id === user!.uid;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-leaf text-leaf-foreground" : "bg-muted text-foreground"}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-leaf-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottom} />
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-border/60 p-3">
                <input
                  value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm"
                />
                <button disabled={sending || !text.trim()}
                  className="rounded-full bg-leaf px-5 py-2 text-sm font-semibold text-leaf-foreground disabled:opacity-50">
                  Send
                </button>
              </form>
            </>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {active ? (contact?.role === "owner" ? "Item owner" : "Borrower") : "Contact"}
            </p>
            {active && contact ? (
              <>
                <div className="mt-2 flex items-center gap-3">
                  {contact.avatar_url ? (
                    <PhotoImg path={contact.avatar_url} alt="" className="size-12 rounded-full object-cover" />
                  ) : (
                    <div className="grid size-12 place-items-center rounded-full bg-leaf/15 text-sm font-semibold text-leaf">
                      {(contact.display_name || "N").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{contact.display_name ?? "Neighbor"}</p>
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="text-sm text-leaf underline">{contact.phone}</a>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  {contact.building_name && <p><span className="text-muted-foreground">🏢</span> {contact.building_name}</p>}
                  {contact.address && <p className="text-muted-foreground">{contact.address}</p>}
                  {!contact.phone && !contact.building_name && (
                    <p className="text-xs text-muted-foreground">The other party hasn't added phone or address yet — ask them in chat.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Phone and address will appear here once the owner approves the request.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-dashed border-border p-5 text-xs text-muted-foreground">
            Meet in a public spot when possible. Peers Plus never handles cash — payment happens in person at return.
          </div>
        </aside>
      </main>
    </div>
  );
}
