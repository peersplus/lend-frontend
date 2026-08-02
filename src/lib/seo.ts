const DEFAULT_SITE_URL = "https://peersplus.com";
const DEFAULT_OG_IMAGE_PATH = "/og-logos.png?v=20260802";

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
  imageAlt?: string;
};

export function buildSeoHead({
  title,
  description,
  path,
  imagePath = DEFAULT_OG_IMAGE_PATH,
  type = "website",
  noIndex = false,
  imageAlt = "Peers Plus logo",
}: SeoOptions) {
  const url = absoluteUrl(path);
  const image = absoluteUrl(imagePath);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { itemProp: "name", content: title },
      { itemProp: "description", content: description },
      { itemProp: "image", content: image },
      { name: "robots", content: noIndex ? "noindex, nofollow" : "index, follow" },
      { property: "og:type", content: type },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:secure_url", content: image },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "2064" },
      { property: "og:image:height", content: "512" },
      { property: "og:image:alt", content: imageAlt },
      { property: "og:site_name", content: "Peers Plus" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: imageAlt },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
