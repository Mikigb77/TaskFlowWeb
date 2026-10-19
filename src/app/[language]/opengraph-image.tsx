import { copy, type SiteLanguage } from "../../content/site";
import { linkPreview, previewSize } from "../../og/preview";

// The Spanish and Catalan homes' link preview, with its alt in the page's language.
export const contentType = "image/png";
export const dynamic = "force-static";

// Only the Spanish and Catalan homes have one; any other language is a missing page.
export function generateImageMetadata({
  params,
}: {
  params: { language: string };
}) {
  const language = params?.language;
  if (language !== "es" && language !== "ca") return [];
  return [
    {
      id: "preview",
      alt: copy[language].meta.imageAlt,
      size: previewSize,
      contentType,
    },
  ];
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  return linkPreview(language as SiteLanguage);
}
