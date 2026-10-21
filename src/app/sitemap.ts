import type { MetadataRoute } from "next";
import {
  documents,
  languages,
  legalPath,
  publicationReady,
} from "../content/legal";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const site =
    process.env.SITE_INDEXABLE === "true" ? process.env.SITE_URL : undefined;
  return site
    ? [
        "/",
        "/es/",
        "/ca/",
        ...(publicationReady
          ? languages.flatMap((language) =>
              documents.map((document) => legalPath(document, language)),
            )
          : []),
      ].map((path) => ({ url: new URL(path, site).href }))
    : [];
}
