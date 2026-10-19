// Acceptance tests for the site as a whole (area G) from the UX web loop, run
// 2026-10-18-site: WP15 (Spanish and Catalan homes, and the bare address picks the
// visitor's language) and WP34 (the bare address's headers as meant; the English demo
// marked English). See tests/support/ux-web.ts.
import { test as plain, type APIRequestContext } from "@playwright/test";
import { expect, homeUrl, LANGUAGES, test } from "./support/ux-web";
import { HERO } from "./support/ux-web-copy";

const bare = (request: APIRequestContext, headers: Record<string, string>) =>
  request.get("/", { headers, maxRedirects: 0 });

// The cases the plan names, and where each must end.
const CASES: { headers: Record<string, string>; to: "/es/" | "/ca/" | null }[] = [
  { headers: { "accept-language": "es-ES,es;q=0.9" }, to: "/es/" },
  { headers: { "accept-language": "ca-ES,ca;q=0.9,es;q=0.8" }, to: "/ca/" },
  { headers: { "accept-language": "en-US,en;q=0.9,es;q=0.8" }, to: null },
  { headers: { cookie: "taskflow-lang=en", "accept-language": "es-ES" }, to: null },
  { headers: { cookie: "taskflow-lang=ca", "accept-language": "en" }, to: "/ca/" },
];
const label = (headers: Record<string, string>) =>
  Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join("; ");

test("WEB-2: /es/ and /ca/ are the home in Spanish and Catalan, and / is English", async ({ page }) => {
  for (const language of LANGUAGES) {
    const response = await page.goto(homeUrl(language));
    expect(response?.status(), homeUrl(language)).toBe(200);
    expect(new URL(page.url()).pathname).toBe(homeUrl(language));
    // The element that wraps the home's content carries the page's language.
    const wrapper = await page.locator("h1").evaluate((h1) => {
      const element = h1.parentElement?.closest("[lang]");
      return {
        lang: element?.getAttribute("lang"),
        isRoot: element === document.documentElement,
        holds: ["#voice", "#features", "#questions", "#get-taskflow"].every(
          (id) => !!element?.querySelector(id),
        ),
      };
    });
    expect(wrapper, homeUrl(language)).toEqual({ lang: language, isRoot: false, holds: true });
  }
});

test("WEB-2: each home links to itself as canonical and to the other two by hreflang", async ({ page }) => {
  // The links exist only when the build knew SITE_URL; the legal pages tell which build it was.
  await page.goto("/privacy/");
  test.skip(
    (await page.locator('link[rel="canonical"]').count()) === 0,
    "Built without SITE_URL: run SITE_URL=https://taskflow.garbar.tech npm run build.",
  );
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const canonical = await page.locator('link[rel="canonical"]').evaluateAll((links) =>
      links.map((link) => new URL(link.getAttribute("href")!, location.href).pathname),
    );
    expect(canonical, `${homeUrl(language)} canonical`).toEqual([homeUrl(language)]);
    const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
      Object.fromEntries(
        links.map((link) => [
          link.getAttribute("hreflang"),
          new URL(link.getAttribute("href")!, location.href).pathname,
        ]),
      ),
    );
    expect(alternates, `${homeUrl(language)} hreflang`).toEqual({
      en: "/",
      es: "/es/",
      ca: "/ca/",
      "x-default": "/",
    });
  }
});

plain("WEB-2: the bare address follows the remembered choice, then the browser's language", async ({ request }) => {
  for (const { headers, to } of CASES) {
    const response = await bare(request, headers);
    if (to) {
      expect(response.status(), label(headers)).toBe(307);
      expect(response.headers()["location"], label(headers)).toMatch(new RegExp(`${to}$`));
    } else {
      expect(response.status(), label(headers)).toBe(200);
      expect(await response.text(), label(headers)).toContain(HERO.description.en);
    }
  }
});

// WP34 replaced WP15's check 4: Next overwrites Vary on the page it renders, and the 200's
// `no-store` already keeps every cache from serving it to anyone else, so Vary is checked
// only on the redirects.
plain("WEB-2: the English home for the bare address is private, never stored, and nosniff", async ({
  playwright,
  baseURL,
}) => {
  // A fresh context sets no Accept-Language of its own, so the first case sends none.
  const request = await playwright.request.newContext({ baseURL });
  for (const headers of [
    {},
    { "accept-language": "en-US,en;q=0.9,es;q=0.8" },
    { cookie: "taskflow-lang=en", "accept-language": "es-ES" },
  ] as Record<string, string>[]) {
    const response = await bare(request, headers);
    const answer = `${label(headers) || "no Accept-Language"} → ${response.status()}`;
    expect(response.status(), answer).toBe(200);
    const cacheControl = response.headers()["cache-control"] ?? "";
    expect.soft(cacheControl, `${answer}: Cache-Control`).toContain("private");
    expect.soft(cacheControl, `${answer}: Cache-Control`).toContain("no-store");
    expect.soft(response.headers()["x-content-type-options"], `${answer}: nosniff`).toBe("nosniff");
  }
  await request.dispose();
});

plain("WEB-2: the redirects of the bare address stay on the request's own origin, are never stored and vary by language", async ({
  request,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  for (const [headers, to] of [
    [{ "accept-language": "es-ES,es;q=0.9" }, "/es/"],
    [{ "accept-language": "ca-ES,ca;q=0.9,es;q=0.8" }, "/ca/"],
  ] as [Record<string, string>, string][]) {
    const response = await bare(request, headers);
    const answer = `${label(headers)} → ${response.status()}`;
    expect(response.status(), answer).toBe(307);
    const location = response.headers()["location"] ?? "";
    // A path, or this server's own origin plus the path: never another host.
    if (location.startsWith("/")) expect(location, `${answer}: Location`).toBe(to);
    else expect(location, `${answer}: Location`).toBe(`${origin}${to}`);
    const cacheControl = response.headers()["cache-control"] ?? "";
    expect.soft(cacheControl, `${answer}: Cache-Control`).toContain("private");
    expect.soft(cacheControl, `${answer}: Cache-Control`).toContain("no-store");
    const vary = (response.headers()["vary"] ?? "").toLowerCase();
    expect.soft(vary, `${answer}: Vary names Accept-Language`).toContain("accept-language");
    expect.soft(vary, `${answer}: Vary names Cookie`).toContain("cookie");
  }
});

test("WEB-707: on /es/ and /ca/ the still-English live demo is marked English, and the rest of the home keeps the page's language", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const marks = await page.evaluate(() => {
      const closest = (selector: string) =>
        document.querySelector(selector)?.parentElement?.closest("[lang]") ?? null;
      const voice = document.querySelector("#voice");
      const demoMark = voice?.parentElement?.closest("[lang]") ?? null;
      return {
        voice: demoMark?.getAttribute("lang") ?? null,
        // The element that marks the demo draws no box of its own (it was a plain section of the page).
        voiceWrapperDisplay:
          demoMark && demoMark !== document.documentElement && demoMark.contains(voice)
            ? getComputedStyle(demoMark).display
            : null,
        hero: closest(".hero h1")?.getAttribute("lang") ?? null,
        features: document.querySelector("#features")?.closest("[lang]")?.getAttribute("lang") ?? null,
        questions: document.querySelector("#questions")?.closest("[lang]")?.getAttribute("lang") ?? null,
        closing: document.querySelector("#get-taskflow")?.closest("[lang]")?.getAttribute("lang") ?? null,
      };
    });
    expect(marks, homeUrl(language)).toEqual({
      voice: "en",
      voiceWrapperDisplay: "contents",
      hero: language,
      features: language,
      questions: language,
      closing: language,
    });
  }
});

plain("WEB-2: only the bare address redirects, and an unknown language is a missing page", async ({ request }) => {
  for (const url of ["/privacy/", "/es/privacy/"]) {
    const response = await request.get(url, { headers: { "accept-language": "ca" }, maxRedirects: 0 });
    expect(response.status(), url).toBe(200);
  }
  expect((await request.get("/xx/", { maxRedirects: 0 })).status()).toBe(404);
});
