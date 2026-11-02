import type { Metadata } from "next";
import { preload } from "react-dom";
import NotFoundPage from "../components/NotFoundPage";

const title =
  "Page not found · Página no encontrada · No hem trobat aquesta pàgina — TaskFlow";

// The 404 has no address of its own: no canonical and no og:url.
export const metadata: Metadata = {
  title,
  alternates: { canonical: null },
  openGraph: { type: "website", siteName: "TaskFlow", title },
  twitter: { card: "summary_large_image", title },
};

// Before the first paint, the address's language goes on <html> (whose attributes may
// differ from the server's), so CSS shows that block first while the page still holds
// the prerendered English-first order.
const firstLanguage = `(function(){var l=location.pathname.split('/')[1];document.documentElement.dataset.notFound=l==='es'||l==='ca'?l:'en';})();`;

export default function NotFound() {
  // Next preloads the layout's font on pages, not here. Must equal the layout font's
  // built URL (it changes with the woff2); tests/ux-web-frame.spec.ts checks it.
  preload("/_next/static/media/Manrope_latin-s.p.1xbpjvy34wz9n.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: firstLanguage }} />
      <NotFoundPage />
    </>
  );
}
