import { useEffect, useState } from "react";

const cache = new Map<string, { url: string; exp: number }>();

/**
 * Renders an image stored in the private `photos` bucket by generating
 * a short-lived signed URL. Accepts either a storage path or a full URL
 * (falls back to plain <img> for legacy URLs).
 */
export function PhotoImg({
  path,
  alt = "",
  className,
}: {
  path: string | null | undefined;
  alt?: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) { setUrl(null); return; }
    if (/^https?:\/\//.test(path)) { setUrl(path); return; }

    const cached = cache.get(path);
    if (cached && cached.exp > Date.now()) {
      setUrl(cached.url);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await (await import('@/lib/firebase')).getFirebaseIdToken();
        const res = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/storage/photos/public-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
          body: JSON.stringify({ path }),
        });
        if (cancelled) return;
        const body = await res.json().catch(() => null);
        const url = body?.data?.publicUrl || body?.publicUrl;
        if (!url) return;
        cache.set(path, { url, exp: Date.now() + 55 * 60 * 1000 });
        setUrl(url);
      } catch {
        // ignore image URL fetch failures
      }
    })();
    return () => { cancelled = true; };
  }, [path]);

  if (!path) return null;
  if (!url) return <div className={className + " animate-pulse bg-muted"} />;
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
