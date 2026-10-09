import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  const site =
    process.env.SITE_INDEXABLE === "true" ? process.env.SITE_URL : undefined;
  return {
    rules: site
      ? { userAgent: "*", allow: "/" }
      : { userAgent: "*", disallow: "/" },
    ...(site ? { sitemap: new URL("/sitemap.xml", site).href } : {}),
  };
}
