import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const site =
    process.env.SITE_INDEXABLE === "true" ? process.env.SITE_URL : undefined;
  return site
    ? ["/", "/privacy/"].map((path) => ({ url: new URL(path, site).href }))
    : [];
}
