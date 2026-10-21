import { copy } from "../content/site";
import { linkPreview, previewSize } from "../og/preview";

export const alt = copy.en.meta.imageAlt;
export const size = previewSize;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpenGraphImage() {
  return linkPreview("en");
}
