import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebPush } from "@/hooks/useWebPush";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DISMISS_KEY = "peers-notif-prompt-dismissed";

type EmailStatus = "loading" | "on" | "off";

/**
 * Compact banner that explains push + email notification status and
 * lets neighbors turn them on (or recover when the browser blocked push).
 * Shows only for signed-in users, and can be dismissed for the session.
 */
export function NotificationPermissionPrompt({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const push = useWebPush();
  const [dismissed, setDismissed] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("loading");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("email_enabled")
        .eq("id", user.id)
        .maybeSingle();
      setEmailStatus(data?.email_enabled === false ? "off" : "on");
    })();
  }, [user]);

  if (!user || dismissed) return null;

  // Nothing to prompt: push is on AND email is on AND browser supports push.
  const pushReady = push.supported && push.permission === "granted" && push.subscribed;
  const emailReady = emailStatus === "on";
  const allGood = pushReady && emailReady;
  if (allGood) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const enablePush = async () => {
    try {
      await push.subscribe();
      if (Notification.permission === "granted") toast.success("Push notifications on.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div
      className={`rounded-lg border border-border bg-card ${
        compact ? "p-4" : "p-5"
      } shadow-sm`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-serif text-lg italic">Stay in the loop, neighbor</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn on alerts so you don't miss an urgent nearby request.
          </p>

          <div className="mt-4 space-y-3">
            <StatusRow
              label="Web push"
              state={pushStateLabel(push)}
              tone={pushStateTone(push)}
              action={pushAction(push, enablePush)}
              help={pushHelp(push)}
            />
            <StatusRow
              label="Email alerts"
              state={
                emailStatus === "loading"
                  ? "Checking…"
                  : emailReady
                    ? "On"
                    : "Off"
              }
              tone={emailReady ? "ok" : "warn"}
              action={
                <Link
                  to="/settings"
                  className="rounded-md border border-input px-3 py-1 text-xs hover:bg-accent"
                >
                  {emailReady ? "Manage" : "Turn on"}
                </Link>
              }
              help={
                emailReady
                  ? "Urgent alerts + a daily digest of nearby requests."
                  : "Enable in settings to get urgent alerts and a daily digest."
              }
            />
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  state,
  tone,
  action,
  help,
}: {
  label: string;
  state: string;
  tone: "ok" | "warn" | "bad" | "muted";
  action: React.ReactNode;
  help: string;
}) {
  const toneClass =
    tone === "ok"
      ? "bg-primary/10 text-primary"
      : tone === "warn"
        ? "bg-amber-100 text-amber-800"
        : tone === "bad"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="min-w-24 text-sm font-medium">{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneClass}`}>
        {state}
      </span>
      <span className="flex-1 text-xs text-muted-foreground">{help}</span>
      <div>{action}</div>
    </div>
  );
}

type PushLike = ReturnType<typeof useWebPush>;

function pushStateLabel(p: PushLike): string {
  if (!p.supported) return "Not supported";
  if (p.permission === "denied") return "Blocked";
  if (p.permission === "granted" && p.subscribed) return "On";
  if (p.permission === "granted") return "Needs setup";
  return "Off";
}

function pushStateTone(p: PushLike): "ok" | "warn" | "bad" | "muted" {
  if (!p.supported) return "muted";
  if (p.permission === "denied") return "bad";
  if (p.permission === "granted" && p.subscribed) return "ok";
  return "warn";
}

function pushHelp(p: PushLike): string {
  if (!p.supported) return "This browser doesn't support push notifications.";
  if (p.permission === "denied")
    return "Your browser is blocking alerts. Open site settings and allow Notifications, then reload.";
  if (!p.configured)
    return "Push isn't fully configured yet. In-app + email alerts still work.";
  if (p.permission === "granted" && p.subscribed)
    return "You'll get pop-ups for nearby and urgent requests.";
  return "One tap to get pop-ups when neighbors post nearby.";
}

function pushAction(p: PushLike, enable: () => void): React.ReactNode {
  if (!p.supported) return null;
  if (p.permission === "denied")
    return (
      <a
        href="https://support.google.com/chrome/answer/3220216"
        target="_blank"
        rel="noreferrer"
        className="rounded-md border border-input px-3 py-1 text-xs hover:bg-accent"
      >
        How to unblock
      </a>
    );
  if (p.permission === "granted" && p.subscribed)
    return (
      <Link
        to="/settings"
        className="rounded-md border border-input px-3 py-1 text-xs hover:bg-accent"
      >
        Manage
      </Link>
    );
  return (
    <button
      type="button"
      onClick={enable}
      disabled={p.busy}
      className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
    >
      {p.busy ? "…" : "Enable"}
    </button>
  );
}
