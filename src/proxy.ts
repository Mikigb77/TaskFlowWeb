import { NextResponse, type NextRequest } from "next/server";
import {
  followsVisitor,
  LANGUAGE_COOKIE,
  localisePath,
  type SiteLanguage,
} from "./content/site";

// The bare address (WD5) and /delete-account/ (WD27) follow the visitor's language: a choice
// made in the language switch wins, then the browser's Accept-Language; never the IP.
// English is the fallback, served at the address itself. The list is `followsVisitor`.
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
function scheme(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    request.nextUrl.protocol.replace(":", "")
  );
}

function origin(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  return `${scheme(request)}://${host}`;
}

// The switch's link to these addresses carries the choice (`/?lang=en`), so it holds
// before the page has hydrated and without JavaScript: remembered here exactly as the
// switch's own cookie, then sent on to the clean address. WEB-1603.
function choice(request: NextRequest): SiteLanguage | undefined {
  const lang = request.nextUrl.searchParams.get("lang");
  return lang === "en" || lang === "es" || lang === "ca" ? lang : undefined;
}

// The address as `followsVisitor` lists it, whether or not Next kept the trailing slash.
function page(request: NextRequest) {
  const path = `${request.nextUrl.pathname.replace(/\/+$/, "")}/`;
  return followsVisitor.includes(path) ? path : undefined;
}

export function proxy(request: NextRequest) {
  const path = page(request);
  if (!path) return NextResponse.next();
  const picked = choice(request);
  const language = picked ?? chosen(request);
  const response =
    language === "en" && !picked
      ? NextResponse.next()
      : NextResponse.redirect(
          new URL(localisePath(path, language), origin(request)),
          307,
        );
  if (picked) {
    const secure = scheme(request) === "https" ? "; Secure" : "";
    response.headers.append(
      "Set-Cookie",
      `${LANGUAGE_COOKIE}=${picked}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`,
    );
  }
  response.headers.set("Vary", "Accept-Language, Cookie");
  // The English page may be kept for Back (the back/forward cache) but always revalidated;
  // the redirects are never stored. `private` keeps shared caches out of both.
  response.headers.set(
    "Cache-Control",
    response.status === 307 ? "private, no-store" : "private, no-cache",
  );
  return response;
}

// A literal Next reads at build time: the addresses in `followsVisitor` (src/content/site).
export const config = { matcher: ["/", "/delete-account/"] };
