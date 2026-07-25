// Resolves the Google Maps browser API key for the current environment.
//
// Google restricts browser keys by HTTP referrer, so each environment
// (dev / staging / production custom domain) typically needs its OWN key
// with the matching domain on its allowlist.
//
// Resolution order (first match wins):
//  1. Explicit override matching current hostname (VITE_MAPS_KEY_<HOST>)
//  2. Environment bucket:
//       - production custom domain  -> VITE_MAPS_KEY_PROD
//       - *-dev.lovable.app / *-staging  -> VITE_MAPS_KEY_STAGING
//       - localhost / lovableproject.com / lovable.app preview -> VITE_MAPS_KEY_DEV
//  3. Fallback to the Lovable-managed connector key
//     (VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY) — only valid on
//     *.lovable.app and *.lovableproject.com.
//
// To add a key for a new domain: add a build-time VITE_ env var and
// (optionally) register the hostname mapping in HOST_ENV_MAP below.

export type MapsEnv = "dev" | "staging" | "production" | "preview";

const HOST_ENV_MAP: Array<{ test: (h: string) => boolean; env: MapsEnv }> = [
  { test: (h) => h === "localhost" || h === "127.0.0.1", env: "dev" },
  { test: (h) => h.endsWith("lovableproject.com"), env: "dev" },
  { test: (h) => h.includes("id-preview--") && h.endsWith("lovable.app"), env: "preview" },
  { test: (h) => h.endsWith("-dev.lovable.app") || h.endsWith("-staging.lovable.app"), env: "staging" },
  { test: (h) => h === "peersplus.com" || h === "www.peersplus.com", env: "production" },
  { test: (h) => h.endsWith("lovable.app"), env: "preview" },
];

export function detectMapsEnv(hostname = typeof window !== "undefined" ? window.location.hostname : ""): MapsEnv {
  const match = HOST_ENV_MAP.find((r) => r.test(hostname));
  return match?.env ?? "production";
}

function readEnv(name: string): string | undefined {
  const v = (import.meta.env as Record<string, string | undefined>)[name];
  return v && v.length > 0 ? v : undefined;
}

/** Sanitize a hostname to a valid env var suffix. */
function hostKey(hostname: string): string {
  return hostname.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function getMapsBrowserKey(hostname = typeof window !== "undefined" ? window.location.hostname : ""): string | undefined {
  return getMapsBrowserKeyWithSource(hostname).key;
}

export type MapsKeySource =
  | { type: "host"; var: string }
  | { type: "bucket"; env: MapsEnv; var: string }
  | { type: "managed"; var: string }
  | { type: "missing" };

export function getMapsBrowserKeyWithSource(
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
): { key: string | undefined; source: MapsKeySource; hostname: string } {
  // 1. Per-host override
  const hostVar = `VITE_MAPS_KEY_${hostKey(hostname)}`;
  const perHost = readEnv(hostVar);
  if (perHost) return { key: perHost, source: { type: "host", var: hostVar }, hostname };

  // 2. Environment bucket
  const env = detectMapsEnv(hostname);
  const bucketVar =
    env === "production"
      ? "VITE_MAPS_KEY_PROD"
      : env === "staging"
      ? "VITE_MAPS_KEY_STAGING"
      : "VITE_MAPS_KEY_DEV";
  const bucket = readEnv(bucketVar);
  if (bucket) return { key: bucket, source: { type: "bucket", env, var: bucketVar }, hostname };

  // 3. Fallback: Lovable-managed connector key (only works on *.lovable.app / *.lovableproject.com)
  const managedVar = "VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY";
  const managed = readEnv(managedVar);
  if (managed) return { key: managed, source: { type: "managed", var: managedVar }, hostname };

  return { key: undefined, source: { type: "missing" }, hostname };
}

export function getMapsChannel(): string | undefined {
  return readEnv("VITE_MAPS_CHANNEL") ?? readEnv("VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID");
}
