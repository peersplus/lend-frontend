import logoAsset from "@/assets/peers-plus-logo-transparent.png.asset.json";

/** Public site origin — used to build absolute URLs (emails, OG tags). */
export const SITE_URL = "https://project--ded194ea-5232-4886-86cb-a35e37bf8690.lovable.app";

/** Relative CDN URL — safe for in-app <img src>. */
export const LOGO_URL = logoAsset.url;

/** Absolute CDN URL — required for email clients. */
export const LOGO_ABSOLUTE_URL = `${SITE_URL}${logoAsset.url}`;

export const SITE_NAME = "Peers Plus";
