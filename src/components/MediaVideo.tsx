import { useEffect, useState } from "react";

const cache = new Map<string, { url: string; exp: number }>();

async function postWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

export function MediaVideo({
  path,
  className,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
}: {
  path: string | null | undefined;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }

    if (/^https?:\/\//.test(path)) {
      setUrl(path);
      return;
    }

    const cached = cache.get(path);
    if (cached && cached.exp > Date.now()) {
      setUrl(cached.url);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = await (await import("@/lib/firebase")).getFirebaseIdToken();
        const publicUrlEndpoint = `${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/storage/photos/public-url`;
        let res: Response;
        try {
          res = await postWithTimeout(publicUrlEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
            body: JSON.stringify({ path }),
          }, 25000);
        } catch (firstError: any) {
          if (firstError?.name !== "AbortError") throw firstError;
          res = await postWithTimeout(publicUrlEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
            body: JSON.stringify({ path }),
          }, 25000);
        }
        if (cancelled) return;
        const body = await res.json().catch(() => null);
        const nextUrl = body?.data?.publicUrl || body?.publicUrl;
        if (!nextUrl) return;
        cache.set(path, { url: nextUrl, exp: Date.now() + 55 * 60 * 1000 });
        setUrl(nextUrl);
      } catch {
        // ignore failures
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) return null;
  if (!url) return <div className={className + " animate-pulse bg-muted"} />;

  return (
    <video
      src={url}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      preload="metadata"
    />
  );
}
