import { useEffect, useRef, useState } from "react";
import { listPublicAppFeedbackApi } from "@/lib/api-peers";

type HomeAppFeedbackEntry = {
  id: string;
  name: string;
  category: "feedback" | "idea";
  message: string;
  is_known_user: boolean;
  created_at: string;
};

function toSafeTime(value: string) {
  const millis = new Date(value).getTime();
  return Number.isFinite(millis) ? millis : 0;
}

function sortAppFeedbackForHome(entries: HomeAppFeedbackEntry[]) {
  return [...entries].sort((a, b) => toSafeTime(b.created_at) - toSafeTime(a.created_at));
}

export function feedbackChipLabel(entry: HomeAppFeedbackEntry) {
  return `${entry.category.toUpperCase()} ${entry.name}: ${entry.message}`;
}

export async function loadTrustedFeedback(
  fetchFeedback: () => Promise<unknown> = listPublicAppFeedbackApi,
) {
  try {
    const rows = await fetchFeedback();
    const normalized = Array.isArray(rows) ? (rows as HomeAppFeedbackEntry[]) : [];
    return sortAppFeedbackForHome(normalized);
  } catch {
    return [];
  }
}

export function HomeTrustedFeedback() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [feedbackRows, setFeedbackRows] = useState<HomeAppFeedbackEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "220px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    let cancelled = false;
    setLoading(true);
    loadTrustedFeedback().then((rows) => {
      if (cancelled) return;
      setFeedbackRows(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [shouldLoad]);

  return (
    <div ref={sectionRef} className="md:col-span-4" data-reveal data-reveal-delay="220">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-leaf-foreground/70">
        Community feedback and ideas
      </p>
      <div className="grid min-h-[8.5rem] gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="trusted-feedback-chips">
        {loading ? [1, 2, 3].map((idx) => (
          <article
            key={`feedback-skeleton-${idx}`}
            className="animate-pulse rounded-xl border border-leaf-foreground/25 bg-leaf-foreground/10 p-3"
          >
            <div className="h-4 w-16 rounded bg-leaf-foreground/20" />
            <div className="mt-2 h-3 w-24 rounded bg-leaf-foreground/20" />
            <div className="mt-2 h-3 w-full rounded bg-leaf-foreground/20" />
          </article>
        )) : feedbackRows.length ? feedbackRows.map((entry) => (
          <article
            key={entry.id}
            className="rounded-xl border border-leaf-foreground/25 bg-leaf-foreground/10 p-3"
          >
            <p className="inline-flex rounded-full border border-leaf-foreground/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-leaf-foreground/80">
              {entry.category}
            </p>
            <p className="mt-1 text-xs font-semibold text-leaf-foreground">{entry.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-leaf-foreground/85">{entry.message}</p>
          </article>
        )) : (
          <article className="rounded-xl border border-leaf-foreground/25 bg-leaf-foreground/10 p-3 text-xs font-medium text-leaf-foreground/85">
            Product feedback from users will appear here.
          </article>
        )}
      </div>
       </div>
  );
}
