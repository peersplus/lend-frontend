/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { getMapsBrowserKeyWithSource, getMapsChannel, type MapsKeySource } from "@/lib/maps-key";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  accent?: "leaf" | "urgent" | "muted";
};

type Props = {
  markers: MapMarker[];
  me?: { lat: number; lng: number } | null;
  height?: number;
  onMarkerClick?: (id: string) => void;
  showKeyDebug?: boolean;
};

// Global loader — shared across all MapView instances.
let mapsLoader: Promise<typeof google.maps> | null = null;

function sourceLabel(source: MapsKeySource): string {
  switch (source.type) {
    case "host":
      return `host override: ${source.var}`;
    case "bucket":
      return `env bucket: ${source.var}`;
    case "managed":
      return `managed fallback: ${source.var}`;
    case "missing":
      return "no key configured";
  }
}

function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google.maps);
  if (mapsLoader) return mapsLoader;

  const { key, source, hostname } = getMapsBrowserKeyWithSource();
  const channel = getMapsChannel();
  if (!key) {
    return Promise.reject(
      new Error(
        `Google Maps browser key missing on ${hostname}. Checked ${sourceLabel(source)}. Set a matching VITE_MAPS_KEY_* env var in build settings.`,
      ),
    );
  }

  mapsLoader = new Promise((resolve, reject) => {
    const cbName = "__peersplusInitMap";
    (window as any)[cbName] = () => resolve((window as any).google.maps);
    const script = document.createElement("script");
    const params = new URLSearchParams({ key, loading: "async", callback: cbName });
    if (channel) params.set("channel", channel);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsLoader;
}

export function MapView({ markers, me, height = 480, onMarkerClick, showKeyDebug = false }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerObjs = useRef<google.maps.Marker[]>([]);
  const [keyDebug, setKeyDebug] = useState<{ hostname: string; source: MapsKeySource; configured: boolean } | null>(null);

  // Capture key source for debug banner (client-only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { source, hostname, key } = getMapsBrowserKeyWithSource();
    setKeyDebug({ hostname, source, configured: !!key && key.length > 0 });
  }, []);

  // Initialize map once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !ref.current) return;
        const first = markers[0];
        const center = me ?? (first ? { lat: first.lat, lng: first.lng } : { lat: 20, lng: 0 });
        mapRef.current = new maps.Map(ref.current, {
          center,
          zoom: me || first ? 12 : 2,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
      })
      .catch((e) => {
        if (ref.current) {
          ref.current.innerHTML = `<div style="display:grid;place-items:center;height:100%;color:#666;padding:24px;text-align:center;font-size:14px">Map unavailable: ${e.message}</div>`;
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof google === "undefined") return;
    markerObjs.current.forEach((m) => m.setMap(null));
    markerObjs.current = [];

    const bounds = new google.maps.LatLngBounds();
    let has = false;

    if (me) {
      const meMarker = new google.maps.Marker({
        map,
        position: me,
        title: "You",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });
      markerObjs.current.push(meMarker);
      bounds.extend(me);
      has = true;
    }

    const info = new google.maps.InfoWindow();
    markers.forEach((m) => {
      const color =
        m.accent === "urgent" ? "#dc2626" : m.accent === "muted" ? "#6b7280" : "#16a34a";
      const marker = new google.maps.Marker({
        map,
        position: { lat: m.lat, lng: m.lng },
        title: m.title,
        icon: {
          path: "M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z",
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 1.5,
          scale: 1.6,
          anchor: new google.maps.Point(12, 22),
        },
      });
      marker.addListener("click", () => {
        info.setContent(
          `<div style="min-width:160px;font-family:system-ui"><div style="font-weight:600;margin-bottom:2px">${escapeHtml(m.title)}</div>${m.subtitle ? `<div style="font-size:12px;color:#555">${escapeHtml(m.subtitle)}</div>` : ""}</div>`
        );
        info.open({ anchor: marker, map });
        onMarkerClick?.(m.id);
      });
      markerObjs.current.push(marker);
      bounds.extend({ lat: m.lat, lng: m.lng });
      has = true;
    });

    if (has && (markers.length > 0 || me)) {
      if (markers.length + (me ? 1 : 0) === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(14);
      } else {
        map.fitBounds(bounds, 60);
      }
    }
  }, [markers, me, onMarkerClick]);

  return (
    <div className="relative" style={{ width: "100%", height, borderRadius: 16, overflow: "hidden" }}>
      <div ref={ref} className="absolute inset-0" />
      {showKeyDebug && keyDebug && (
        <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-24px)] rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2 font-medium">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                keyDebug.configured ? "bg-leaf" : "bg-urgent"
              }`}
            />
            <span>Maps key {keyDebug.configured ? "configured" : "missing"}</span>
          </div>
          <div className="mt-1 text-muted-foreground">
            host: <span className="font-mono text-foreground">{keyDebug.hostname}</span>
          </div>
          <div className="text-muted-foreground">
            source: <span className="font-mono text-foreground">{sourceLabel(keyDebug.source)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
