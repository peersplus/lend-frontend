import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    supabase.storage.from("photos").createSignedUrl(path, 3600).then(({ data }) => {
      if (cancelled || !data?.signedUrl) return;
      cache.set(path, { url: data.signedUrl, exp: Date.now() + 55 * 60 * 1000 });
      setUrl(data.signedUrl);
    });
    return () => { cancelled = true; };
  }, [path]);

  if (!path) return null;
  if (!url) return <div className={className + " animate-pulse bg-muted"} />;
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
