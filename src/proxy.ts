import { NextResponse, type NextRequest } from "next/server";
import { homePath, LANGUAGE_COOKIE, type SiteLanguage } from "./content/site";

// The bare address follows the visitor's language (WD5): a choice made in the language
// switch wins, then the browser's Accept-Language; never the IP. English is the fallback.
function chosen(request: NextRequest): SiteLanguage {
  const cookie = request.cookies.get(LANGUAGE_COOKIE)?.value;
  if (cookie === "en" || cookie === "es" || cookie === "ca") return cookie;
  return preferred(request.headers.get("accept-language") ?? "");
}

// The highest q-value per language; equal values go to the one listed first.
function preferred(header: string): SiteLanguage {
  const ranked: { language: SiteLanguage; q: number; order: number }[] = [];
  header.split(",").forEach((range, order) => {
    const [tag, ...params] = range.trim().split(";");
    const language = tag.trim().toLowerCase().split("-")[0];
    if (language !== "en" && language !== "es" && language !== "ca") return;
    const weight = params
      .map((param) => /^\s*q\s*=\s*([0-9.]+)\s*$/i.exec(param)?.[1])
      .find(Boolean);
    const q = weight === undefined ? 1 : Number(weight);
    if (!(q > 0)) return;
    const seen = ranked.find((entry) => entry.language === language);
    if (!seen) ranked.push({ language, q, order });
    else if (q > seen.q) seen.q = q;
  });
  ranked.sort((a, b) => b.q - a.q || a.order - b.order);
  return ranked[0]?.language ?? "en";
}

// The address the request came in on, as the edge worker sent it: Cloud Run's host with
// https. The worker rewrites a Location only when it starts with that origin, so the
// redirect must carry the forwarded scheme and host, never the server's own bind address.
// Next needs an absolute Location here (a bare path fails with Invalid URL). WEB-2.
function origin(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    request.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function proxy(request: NextRequest) {
  const language = chosen(request);
  const response =
    language === "en"
      ? NextResponse.next()
      : NextResponse.redirect(new URL(homePath(language), origin(request)), 307);
  response.headers.set("Vary", "Accept-Language, Cookie");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: "/" };
