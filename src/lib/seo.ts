const DEFAULT_SITE_URL = "https://peersplus.com";
const DEFAULT_OG_IMAGE_PATH = "/peers-plus-logo.png";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "") || DEFAULT_SITE_URL;
}

export const SITE_URL = trimTrailingSlash(import.meta.env.VITE_SITE_URL ?? DEFAULT_SITE_URL);

export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

type SeoOptions = {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

export function buildSeoHead({
  title,
  description,
  path,
  imagePath = DEFAULT_OG_IMAGE_PATH,
  type = "website",
  noIndex = false,
}: SeoOptions) {
  const url = absoluteUrl(path);
  const image = absoluteUrl(imagePath);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: noIndex ? "noindex, nofollow" : "index, follow" },
      { property: "og:type", content: type },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:site_name", content: "Peers Plus" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
