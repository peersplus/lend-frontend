import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createMessageApi, listMessagesApi } from "@/lib/api-peers";
import { UserMenu } from "@/components/UserMenu";
import { CenteredLoader } from "@/components/CenteredLoader";
import { toast } from "@/lib/sonner";

export const Route = createFileRoute("/chat/request/$requestId/$peerId")({
  head: () => ({
    meta: [
      { title: "Neighbor chat — Peers Plus" },
      { name: "description", content: "Coordinate with a neighbor who offered to help on your request." },
    ],
  }),
  component: RequestChatPage,
});

type Message = { id: string; request_id: string | null; booking_id: string | null; peer_id: string | null; sender_id: string; body: string; created_at: string };
type Req = { id: string; owner_id: string; title: string; description: string | null; urgency: string; category: string };
type PeerProfile = { id: string; display_name: string | null; avatar_url: string | null; phone: string | null; building_name: string | null; address: string | null };

function RequestChatPage() {
  const { requestId, peerId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [req, setReq] = useState<Req | null>(null);
  const [peer, setPeer] = useState<PeerProfile | null>(null);
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
        const requests = await import('@/lib/api-peers').then((m) => m.listRequestsApi());
        const r = (requests as Req[]).find((x) => x.id === requestId) || null;
        if (!r) { toast.error("Request not found"); navigate({ to: "/requests" }); return; }
        setReq(r as Req);
        const msgs = await listMessagesApi({ request_id: requestId });
        setMessages((msgs as Message[]) ?? []);
        setReady(true);
      } catch (error: any) {
        toast.error(error.message || 'Unable to load request chat');
        navigate({ to: "/requests" });
      }
    })();
  }, [user, loading, requestId, peerId, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const interval = window.setInterval(async () => {
      try {
        const msgs = await listMessagesApi({ request_id: requestId });
        if (active) setMessages((msgs as Message[]) ?? []);
      } catch {
        // ignore refresh errors
      }
    }, 3000);
    return () => { active = false; window.clearInterval(interval); };
  }, [user, requestId, peerId]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !user) return;
    setSending(true);
    try {
      await createMessageApi({
        request_id: requestId,
        peer_id: peerId,
        sender_id: user.uid,
        body,
      });
      setSending(false);
      setText("");
    } catch (error: any) {
      setSending(false);
      toast.error(error.message || 'Unable to send message');
    }
  }

  if (loading || !ready) return <CenteredLoader label="Loading chat..." fullScreen />;
  if (!req) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/requests" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">← Back to requests</Link>
          <UserMenu />
        </div>
      </nav>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1fr_320px]">
        <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-border bg-card">
          <header className="border-b border-border/60 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{req.urgency === "urgent" ? "🚨 Urgent request" : "Request"}</p>
            <h1 className="mt-1 font-semibold">{req.title}</h1>
            {req.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{req.description}</p>}
          </header>

          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="mt-6 text-center text-sm text-muted-foreground">Say hi 👋 — offer help, ask timing, share what you can do.</p>
            )}
            {messages.map((m) => {
              const mine = m.sender_id === user!.id;
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
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {peer?.id === req.owner_id ? "Requester" : "Neighbor helping"}
            </p>
            {peer ? (
              <>
                <div className="mt-2 flex items-center gap-3">
                  {peer.avatar_url ? (
                    <img src={peer.avatar_url} alt="" className="size-12 rounded-full object-cover" />
                  ) : (
                    <div className="grid size-12 place-items-center rounded-full bg-leaf/15 text-sm font-semibold text-leaf">
                      {(peer.display_name || "N").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{peer.display_name ?? "Neighbor"}</p>
                    {peer.phone && <a href={`tel:${peer.phone}`} className="text-sm text-leaf underline">{peer.phone}</a>}
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  {peer.building_name && <p><span className="text-muted-foreground">🏢</span> {peer.building_name}</p>}
                  {peer.address && <p className="text-muted-foreground">{peer.address}</p>}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No profile info yet.</p>
            )}
          </div>
          <div className="rounded-3xl border border-dashed border-border p-5 text-xs text-muted-foreground">
            Keep first meetings in a public spot when possible. Peers Plus never handles cash.
          </div>
        </aside>
      </main>
    </div>
  );
}
