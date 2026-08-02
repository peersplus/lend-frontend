type GeocodeComponent = {
  long_name?: string;
  types?: string[];
};

type GeocodeResult = {
  address_components?: GeocodeComponent[];
};

type GeocodeResponse = {
  status?: string;
  results?: GeocodeResult[];
};

const GOOGLE_GEOCODE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const AREA_CACHE_KEY = "nearby-area-label-v1";
const AREA_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let inFlightLookup: Promise<string | null> | null = null;

function pickAreaFromComponents(components: GeocodeComponent[]): string | null {
  const priority = [
    "neighborhood",
    "sublocality_level_1",
    "sublocality",
    "locality",
    "administrative_area_level_2",
  ];

  for (const type of priority) {
    const match = components.find((component) => Array.isArray(component.types) && component.types.includes(type));
    const value = String(match?.long_name || "").trim();
    if (value) return value;
  }

  return null;
}

async function reverseGeocodeArea(lat: number, lng: number): Promise<string | null> {
  if (!GOOGLE_GEOCODE_KEY) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("language", "en");
  url.searchParams.set("key", GOOGLE_GEOCODE_KEY);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;
    const body = (await response.json()) as GeocodeResponse;
    if (body.status !== "OK" || !Array.isArray(body.results)) return null;

    for (const result of body.results) {
      const components = Array.isArray(result.address_components) ? result.address_components : [];
      const area = pickAreaFromComponents(components);
      if (area) return area;
    }
  } catch {
    return null;
  }

  return null;
}

function getCoordsWithoutPrompt(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 },
    );
  });
}

export async function detectNearbyAreaLabel(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AREA_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { area?: string; ts?: number };
      const area = String(parsed?.area || "").trim();
      const ts = Number(parsed?.ts || 0);
      if (area && Number.isFinite(ts) && Date.now() - ts < AREA_CACHE_TTL_MS) {
        return area;
      }
    }
  } catch {
    // ignore cache read errors
  }

  if (inFlightLookup) return inFlightLookup;

  inFlightLookup = (async () => {
    try {
      try {
        if ("permissions" in navigator && (navigator as Navigator & { permissions?: Permissions }).permissions) {
          const permissionStatus = await navigator.permissions.query({ name: "geolocation" as PermissionName });
          if (permissionStatus.state !== "granted") return null;
        }
      } catch {
        return null;
      }

      const coords = await getCoordsWithoutPrompt();
      if (!coords) return null;

      const area = await reverseGeocodeArea(coords.lat, coords.lng);
      if (area) {
        try {
          window.localStorage.setItem(AREA_CACHE_KEY, JSON.stringify({ area, ts: Date.now() }));
        } catch {
          // ignore cache write errors
        }
      }
      return area;
    } finally {
      inFlightLookup = null;
    }
  })();

  return inFlightLookup;
}