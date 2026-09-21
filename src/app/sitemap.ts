import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.SITE_URL;
  return site
    ? ["/", "/privacy/"].map((path) => ({ url: new URL(path, site).href }))
    : [];
}
