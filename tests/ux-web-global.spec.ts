// Acceptance tests for the site as a whole (area G) from the UX web loop, run
// 2026-10-18-site: WP15 (Spanish and Catalan homes, and the bare address picks the
// visitor's language), WP34 (the bare address's headers as meant; the English demo
// marked English), WP20 (the header, the language switch and the worded phone menu) and
// WP21 (titles, link previews and the 404 in each language), and round 2's WP37 (the
// language links 8 px apart, the phone menu for large-text desktops, the footer nav's
// 44 px targets), and run 2026-10-18-site round 1's WP25 (type in rem, tap feedback, 48 px
// logos, dark without JavaScript; its legal-page checks are in ux-web-legal.spec.ts), and
// round 2's WP40 (the phone header stays one row at 200% text).
// See tests/support/ux-web.ts.
import AxeBuilder from "@axe-core/playwright";
import { test as plain, type APIRequestContext, type Locator, type Page } from "./support/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  axeViolations,
  expect,
  homeUrl,
  hydrated,
  type Language,
  LANGUAGES,
  doubleTextSize,
  parseColor,
  rootFontSize,
  ROOT,
  scrollsSideways,
  test,
  textUnder,
  THEMES,
  watchHydration,
} from "./support/ux-web";
import { FOOTER, FRAME, HERO, LANGUAGE_NAMES, META, NOT_FOUND } from "./support/ux-web-copy";
import { en as siteEn } from "../src/content/site/en";

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
// `private` keeps shared caches from serving it to anyone else, so Vary is checked only on
// the redirects. WP72 (WEB-1603): the 200 is `no-cache`, not `no-store`, so Back can restore
// it from the back/forward cache.
plain("WEB-2: the English home for the bare address is private, always revalidated, and nosniff", async ({
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
    expect.soft(cacheControl, `${answer}: Cache-Control`).toContain("no-cache");
    expect.soft(cacheControl, `${answer}: Cache-Control`).not.toContain("no-store");
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

test("WEB-707: on each home the live demo takes the page's language, with no English mark around it, like the rest of the home", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const marks = await page.evaluate((pageLanguage) => {
      const closest = (selector: string) =>
        document.querySelector(selector)?.parentElement?.closest("[lang]") ?? null;
      const voice = document.querySelector("#voice");
      // Every element between #voice and <body> that carries lang="en".
      const englishAround: string[] = [];
      for (let node = voice?.parentElement ?? null; node && node !== document.body; node = node.parentElement) {
        if (node.getAttribute("lang") === "en") englishAround.push(node.tagName.toLowerCase());
      }
      return {
        voice: voice?.getAttribute("lang") ?? null,
        voiceAncestor: voice?.parentElement?.closest("[lang]")?.getAttribute("lang") ?? null,
        englishAround: pageLanguage === "en" ? [] : englishAround,
        hero: closest(".hero h1")?.getAttribute("lang") ?? null,
        features: document.querySelector("#features")?.closest("[lang]")?.getAttribute("lang") ?? null,
        questions: document.querySelector("#questions")?.closest("[lang]")?.getAttribute("lang") ?? null,
        closing: document.querySelector("#get-taskflow")?.closest("[lang]")?.getAttribute("lang") ?? null,
      };
    }, language);
    expect(marks, homeUrl(language)).toEqual({
      voice: language,
      voiceAncestor: language,
      englishAround: [],
      hero: language,
      features: language,
      questions: language,
      closing: language,
    });
  }
});

plain("WEB-2, WEB-1508: only the bare address and /delete-account/ redirect, and an unknown language is a missing page", async ({ request }) => {
  for (const url of ["/privacy/", "/es/privacy/", "/es/delete-account/", "/ca/delete-account/"]) {
    const response = await request.get(url, { headers: { "accept-language": "ca" }, maxRedirects: 0 });
    expect(response.status(), url).toBe(200);
  }
  expect((await request.get("/xx/", { maxRedirects: 0 })).status()).toBe(404);
});

plain("WEB-2: behind the edge worker, a redirect starts with the origin the worker sent, so the worker can rewrite it to the public address", async ({
  baseURL,
}) => {
  // The worker fetches Cloud Run with Host set to the run.app host, and Cloud Run adds
  // X-Forwarded-Proto: https. edge/worker.ts rewrites a Location only when it starts with
  // that origin, so the server's own bind address must never appear in it.
  const { request: send } = await import("node:http");
  const server = new URL(baseURL!);
  const location = await new Promise<string>((resolve, reject) => {
    const outgoing = send(
      {
        host: server.hostname,
        port: server.port,
        path: "/",
        headers: {
          host: "taskflow-web-example.a.run.app",
          "x-forwarded-proto": "https",
          "accept-language": "es-ES,es;q=0.9",
        },
      },
      (response) => {
        response.resume();
        resolve(String(response.headers.location ?? ""));
      },
    );
    outgoing.on("error", reject);
    outgoing.end();
  });
  expect(location).toBe("https://taskflow-web-example.a.run.app/es/");
});

// WP20: the header, the language switch and the worded phone menu.
const FRAME_PAGES: { url: string; language: Language }[] = [
  { url: "/", language: "en" },
  { url: "/privacy/", language: "en" },
  { url: "/es/privacy/", language: "es" },
  { url: "/ca/delete-account/", language: "ca" },
];
// The header's sections, as on GarBar's other product sites; Try it with your voice leads the
// phone menu and is the header's one call to action on wider screens.
const NAV = ["how", "features", "plans", "questions"] as const;
const MENU = ["voice", ...NAV] as const;
const FOOTER_SITE = ["voice", ...NAV] as const;
const ANCHORS = { voice: "#voice", how: "#how", features: "#features", plans: "#plans", questions: "#questions" };
// What a Spanish or Catalan page's header must not say.
const ENGLISH_FRAME = [
  "Open navigation",
  "Mobile navigation",
  "Main navigation",
  "Switch to",
  "Try it with your voice",
  "What it does",
  "Questions",
  "Coming soon",
  "Language",
  "Appearance",
  "Light",
  "Dark",
  "TaskFlow home",
  "Explore the app",
  "Get TaskFlow",
];

const menuButton = (page: Page) => page.locator("header .header-menu summary");
async function openMenu(page: Page) {
  await menuButton(page).click();
  await expect(page.locator("header .header-menu")).toHaveAttribute("open", "");
}

for (const theme of THEMES) {
  test.describe(`${theme} header`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-4, WEB-304: at 1440 px the header has no button and its nav is the three labels in the page's language (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "1440 × 1000 is the desktop project.");
      for (const { url, language } of FRAME_PAGES) {
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const header = page.locator("header.site-header");
        await expect(header.locator(".button"), `${url}: .button in the header`).toHaveCount(0);
        const nav = header.getByRole("navigation", { name: FRAME.navigation[language], exact: true });
        await expect(nav, url).toBeVisible();
        const links = nav.getByRole("link");
        await expect(links, url).toHaveText(NAV.map((key) => FRAME[key][language]));
        expect(
          await links.evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href"))),
          url,
        ).toEqual(NAV.map((key) => `${homeUrl(language)}${ANCHORS[key]}`));
      }
    });
  });
}

test("WEB-2: at 1440 px the header's language switch names each language in itself and marks the current one, not by colour alone", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "1440 × 1000 is the desktop project.");
  for (const { url, language } of FRAME_PAGES) {
    await page.goto(url);
    const switcher = page
      .locator("header")
      .getByRole("navigation", { name: FRAME.language[language], exact: true });
    await expect(switcher, url).toBeVisible();
    const links = switcher.getByRole("link");
    await expect(links, url).toHaveText(LANGUAGES.map((code) => LANGUAGE_NAMES[code]));
    for (const code of LANGUAGES) {
      const link = switcher.getByRole("link", { name: LANGUAGE_NAMES[code], exact: true });
      await expect(link, `${url} ${code}`).toHaveAttribute("lang", code);
      await expect(link, `${url} ${code}`).toHaveAttribute("hreflang", code);
      if (code === language) {
        await expect(link, `${url} ${code}`).toHaveAttribute("aria-current", "page");
        const style = await link.evaluate((a) => {
          const computed = getComputedStyle(a);
          return { weight: computed.fontWeight, shadow: computed.boxShadow };
        });
        expect(style.weight, `${url}: the current language's weight`).toBe("800");
        expect(style.shadow, `${url}: the current language's ring`).not.toBe("none");
      } else await expect(link, `${url} ${code}`).not.toHaveAttribute("aria-current", /.*/);
    }
  }
  await page.goto("/privacy/");
  await page.locator("header.site-header").getByRole("link", { name: "Español", exact: true }).click();
  await expect(page).toHaveURL(/\/es\/privacy\/$/);
  await page.goto("/es/");
  await page.locator("header.site-header").getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/");
});

test("WEB-2: choosing Català on / lands on /ca/ and remembers it, so the bare address then answers with /ca/", async ({
  page,
  context,
  isMobile,
}) => {
  await page.goto("/");
  await hydrated(page);
  if (isMobile) await openMenu(page);
  await page.locator("header.site-header").getByRole("link", { name: "Català", exact: true }).click();
  await expect(page).toHaveURL(/\/ca\/$/);
  const cookie = (await context.cookies()).find((entry) => entry.name === "taskflow-lang");
  expect(cookie?.value).toBe("ca");
  expect(cookie?.path).toBe("/");
  expect(cookie?.sameSite).toBe("Lax");
  // About a year (Max-Age 31536000), within a minute.
  expect(Math.abs(cookie!.expires - Date.now() / 1000 - 31_536_000)).toBeLessThan(60);
  const response = await page.request.get("/", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toMatch(/\/ca\/$/);
});

test("WEB-307, WEB-3: on a phone the header says Menu in a 48 px button, and the menu holds the switch, the three links, ‘Coming soon to Android’ and Appearance, in order", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone header (390 × 664).");
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    const button = menuButton(page);
    await expect(button, url).toBeVisible();
    await expect(button, url).toHaveText(FRAME.menu[language]);
    await expect(button, url).toHaveAccessibleName(FRAME.menu[language]);
    await expect(button, url).not.toHaveAttribute("aria-label", /.*/);
    expect((await button.boundingBox())!.height, `${url}: the menu button's height`).toBeGreaterThanOrEqual(48);
    // No theme icon in the phone header.
    await expect(page.locator("header .theme-toggle"), url).toBeHidden();
    for (const name of [FRAME.toDark[language], FRAME.toLight[language]])
      await expect(page.getByRole("button", { name, exact: true }), url).toHaveCount(0);

    await openMenu(page);
    const panel = page.locator("header .header-menu-panel");
    await expect(panel, url).toBeVisible();
    const switcher = panel.getByRole("navigation", { name: FRAME.language[language], exact: true });
    const nav = panel.getByRole("navigation", { name: FRAME.navigation[language], exact: true });
    const appearance = panel.getByRole("group", { name: FRAME.appearance[language], exact: true });
    // Everything a visitor can use in the open menu, in reading order.
    const controls = panel.locator("a, button").filter({ visible: true });
    expect(
      (await controls.allInnerTexts()).map((text) => text.replace(/\s+/g, " ").trim()),
      `${url}: the menu's rows`,
    ).toEqual([
      ...LANGUAGES.map((code) => LANGUAGE_NAMES[code]),
      ...MENU.map((key) => FRAME[key][language]),
      FRAME.comingSoon[language],
      FRAME.light[language],
      FRAME.dark[language],
    ]);
    // And on screen, top to bottom: the switch, the links, Appearance.
    const [switchBox, navBox, appearanceBox] = await Promise.all(
      [switcher, nav, appearance].map((part) => part.boundingBox()),
    );
    expect(switchBox!.y + switchBox!.height, `${url}: switch above links`).toBeLessThanOrEqual(navBox!.y + 1);
    expect(navBox!.y + navBox!.height, `${url}: links above Appearance`).toBeLessThanOrEqual(appearanceBox!.y + 1);
    await expect(nav.getByRole("link").last(), url).toHaveAttribute("href", `${url}#get-taskflow`);
    const pressed = await appearance
      .getByRole("button")
      .evaluateAll((buttons) => buttons.map((b) => b.getAttribute("aria-pressed")).sort());
    expect(pressed, `${url}: Appearance's aria-pressed`).toEqual(["false", "true"]);
    // Every row of the menu, and its button, is at least 48 px tall.
    for (const row of await panel.locator("a, button").filter({ visible: true }).all()) {
      const box = await row.boundingBox();
      expect(box!.height, `${url}: “${await row.innerText()}”`).toBeGreaterThanOrEqual(48);
    }
  }
});

test("WEB-307: in the open menu Dark switches the theme, Escape closes the menu onto its button, and a tap outside closes it", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone menu (390 × 664).");
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await hydrated(page);
  await openMenu(page);
  const appearance = page.getByRole("group", { name: FRAME.appearance.en, exact: true });
  await appearance.getByRole("button", { name: FRAME.dark.en, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(appearance.getByRole("button", { name: FRAME.dark.en, exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("header .header-menu")).not.toHaveAttribute("open", "");
  await expect(menuButton(page)).toBeFocused();

  await openMenu(page);
  const panel = (await page.locator("header .header-menu-panel").boundingBox())!;
  const viewport = page.viewportSize()!;
  // A point below the open panel that holds no link or control.
  const point = await page.evaluate(
    ({ top, height }) => {
      for (let y = Math.ceil(top + 12); y < height - 4; y += 16)
        for (const x of [12, Math.round(innerWidth / 2), innerWidth - 12]) {
          const element = document.elementFromPoint(x, y);
          if (element && !element.closest("a, button, summary, input, textarea, select, label, details"))
            return { x, y };
        }
      return null;
    },
    { top: panel.y + panel.height, height: viewport.height },
  );
  expect(point, "a free point below the open menu").not.toBeNull();
  await page.touchscreen.tap(point!.x, point!.y);
  await expect(page.locator("header .header-menu")).not.toHaveAttribute("open", "");
  expect(new URL(page.url()).pathname).toBe("/");
});

test("WEB-3: on a phone, the menu's ‘Coming soon to Android’ row closes the menu and shows the closing card, which names Android and Google Play", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone menu (390 × 664).");
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    await openMenu(page);
    await page
      .locator("header .header-menu-panel")
      .getByRole("link", { name: FRAME.comingSoon[language], exact: true })
      .click();
    await expect(page.locator("header .header-menu"), url).not.toHaveAttribute("open", "");
    const closing = page.locator("#get-taskflow");
    await expect(closing, url).toBeInViewport();
    await expect(closing.getByRole("heading", { level: 2 }), url).toContainText("Android");
    await expect(closing, url).toContainText("Google Play");
  }
});

test("WEB-304: on Spanish and Catalan pages the header and the open menu say nothing in English", async ({
  page,
}) => {
  for (const url of ["/es/", "/es/privacy/", "/ca/", "/ca/delete-account/"]) {
    await page.goto(url);
    await hydrated(page);
    if (await menuButton(page).isVisible()) await openMenu(page);
    // Its text (the closed menu's too, on desktop) and every name, title and alt in it.
    const said = await page.locator("header.site-header").evaluate((header) => {
      const found = [header.textContent ?? ""];
      for (const element of Array.from(header.querySelectorAll("*")))
        for (const name of ["aria-label", "title", "alt"]) {
          const value = element.getAttribute(name);
          if (value) found.push(value);
        }
      for (const element of Array.from(header.querySelectorAll("[aria-labelledby]")))
        for (const id of element.getAttribute("aria-labelledby")!.split(/\s+/))
          found.push(document.getElementById(id)?.textContent ?? "");
      return found.join(" \n ");
    });
    for (const words of ENGLISH_FRAME) expect(said, `${url}: “${words}”`).not.toContain(words);
  }
});

test("WEB-307: with forced colours, the phone header's menu icon still draws", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone header (390 × 664).");
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/");
  // The closed pill shows ≡; its ✕ (for the open menu) is hidden.
  const icon = menuButton(page).locator("svg:visible");
  await expect(icon).toBeVisible();
  const strokes = await icon.evaluate((svg) =>
    [svg, ...Array.from(svg.querySelectorAll("*"))].map((element) => getComputedStyle(element).stroke),
  );
  const drawn = strokes.filter(
    (stroke) => stroke !== "none" && stroke !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(stroke),
  );
  expect(drawn.length, `strokes: ${strokes.join(", ")}`).toBeGreaterThan(0);
});

test("WEB-304: the Spanish 404's header hydrates with no error", async ({ page }) => {
  const errors = watchHydration(page);
  const response = await page.goto("/es/no-such-page/");
  expect(response?.status()).toBe(404);
  await hydrated(page);
  await expect(page.locator("header .brand")).toHaveAccessibleName(FRAME.home.es);
  expect(errors).toEqual([]);
});

test("WEB-307: in Catalan at 801, 1024 and 1100 px nothing scrolls sideways, and the header fits one row or shows the phone menu", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop widths.");
  for (const url of ["/ca/", "/ca/delete-account/"])
    for (const width of [801, 1024, 1100]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      await hydrated(page);
      await page.evaluate(() => document.fonts.ready);
      const where = `${url} at ${width} px`;
      expect(await scrollsSideways(page), `${where}: sideways scroll`).toBe(false);
      if (await menuButton(page).isVisible()) continue;
      // The desktop header: every part visible, side by side on one band, each label on one line.
      const layout = await page.locator("header .header-inner").evaluate((inner) => {
        const parts = Array.from(
          inner.querySelectorAll<HTMLElement>(".brand, .desktop-nav a, .language-switch a, .theme-toggle"),
        ).filter((element) => element.checkVisibility());
        const boxes = parts.map((element) => element.getBoundingClientRect());
        // A text node that wraps draws one box per line.
        const lines = parts.map((element) => {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          let most = 0;
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            most = Math.max(most, new Set(Array.from(range.getClientRects()).map((rect) => Math.round(rect.top))).size);
          }
          return most;
        });
        return {
          count: parts.length,
          lowestTop: Math.max(...boxes.map((box) => box.top)),
          highestBottom: Math.min(...boxes.map((box) => box.bottom)),
          wrapped: parts.filter((_, index) => lines[index] > 1).map((element) => element.textContent),
          right: Math.max(...boxes.map((box) => box.right)),
        };
      });
      // Brand, four links, three languages and the theme switch.
      expect(layout.count, where).toBe(9);
      expect(layout.lowestTop, `${where}: one row`).toBeLessThan(layout.highestBottom);
      expect(layout.wrapped, `${where}: wrapped labels`).toEqual([]);
      expect(layout.right, `${where}: inside the window`).toBeLessThanOrEqual(width);
    }
});

for (const theme of THEMES) {
  test.describe(`${theme} frame axe`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-2, WEB-304, WEB-307: axe reports no violations with the menu closed and open (${theme})`, async ({
      page,
    }) => {
      for (const url of ["/", "/es/privacy/", "/ca/delete-account/"]) {
        await page.goto(url);
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(await axeViolations(page), `${url}, menu closed`).toEqual([]);
        if (!(await menuButton(page).isVisible())) continue;
        await openMenu(page);
        expect(await axeViolations(page), `${url}, menu open`).toEqual([]);
      }
    });
  });
}

// WP21: titles, link previews and the 404.
async function head(page: Page) {
  return page.evaluate(() => {
    const meta = (key: string) =>
      Array.from(document.querySelectorAll(`meta[property="${key}"], meta[name="${key}"]`)).map(
        (element) => element.getAttribute("content") ?? "",
      );
    return {
      title: document.title,
      description: meta("description"),
      ogTitle: meta("og:title"),
      ogDescription: meta("og:description"),
      ogLocale: meta("og:locale"),
      ogLocaleAlternate: meta("og:locale:alternate").sort(),
      ogImage: meta("og:image"),
      ogImageAlt: meta("og:image:alt"),
      ogUrl: meta("og:url"),
      twitterCard: meta("twitter:card"),
      twitterTitle: meta("twitter:title"),
      twitterDescription: meta("twitter:description"),
      canonical: document.querySelectorAll('link[rel="canonical"]').length,
    };
  });
}
// A PNG's width and height, from its IHDR chunk.
const pngSize = (body: Buffer) => ({ width: body.readUInt32BE(16), height: body.readUInt32BE(20) });

test("WEB-302: each home's title, description and link preview say what TaskFlow is, in its language", async ({
  page,
  request,
}) => {
  const images: Record<string, string> = {};
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    const tags = await head(page);
    expect(tags.title, `${url} title`).toBe(META.title[language]);
    expect(tags.description, `${url} description`).toEqual([META.description[language]]);
    expect(tags.ogTitle, `${url} og:title`).toEqual([META.title[language]]);
    expect(tags.ogDescription, `${url} og:description`).toEqual([META.description[language]]);
    expect(tags.ogLocale, `${url} og:locale`).toEqual([META.locale[language]]);
    expect(tags.ogLocaleAlternate, `${url} og:locale:alternate`).toEqual(
      LANGUAGES.filter((code) => code !== language)
        .map((code) => META.locale[code])
        .sort(),
    );
    expect(tags.twitterCard, `${url} twitter:card`).toEqual(["summary_large_image"]);
    expect(tags.twitterTitle, `${url} twitter:title`).toEqual([META.title[language]]);
    expect(tags.ogImage, `${url} og:image`).toHaveLength(1);
    expect(tags.ogImageAlt, `${url} og:image:alt`).toEqual([META.imageAlt[language]]);
    // The preview's address carries the production origin; fetch the same path here.
    const image = new URL(tags.ogImage[0]);
    images[language] = image.pathname + image.search;
    const response = await request.get(images[language]);
    expect(response.status(), `${url} og:image ${images[language]}`).toBe(200);
    expect(response.headers()["content-type"], `${url} og:image`).toContain("image/png");
    expect(pngSize(await response.body()), `${url} og:image size`).toEqual({ width: 1200, height: 630 });
  }
  expect(images.es, "the Spanish preview is its own image").not.toBe(images.en);
  expect(images.ca, "the Catalan preview is its own image").not.toBe(images.en);
  expect(images.ca, "the Catalan preview is its own image").not.toBe(images.es);
});

test("WEB-306: a missing page answers 404 with its three-language title, no canonical or og:url, no pun and no ‘↗’", async ({
  page,
  request,
}) => {
  const served = await request.get("/no-such-page/");
  expect(served.status()).toBe(404);
  // The served title holds all three languages, for visits without JavaScript; after
  // hydration the tab shows the address's language alone (WP73).
  expect(await served.text()).toContain(`<title>${NOT_FOUND.title}</title>`);
  await page.goto("/no-such-page/");
  const tags = await head(page);
  expect(tags.canonical, "link[rel=canonical]").toBe(0);
  expect(tags.ogUrl, "og:url").toEqual([]);
  expect(await page.locator("body").innerText()).not.toMatch(/flow again|off track/i);
  expect(await page.content()).not.toContain("↗");
});

test("WEB-306: each 404 puts the address's language first as the h1, keeps all three blocks, and hydrates with no error", async ({
  page,
}) => {
  const errors = watchHydration(page);
  for (const language of LANGUAGES) {
    const url = `${homeUrl(language)}no-such-page/`;
    const response = await page.goto(url);
    expect(response?.status(), url).toBe(404);
    await hydrated(page);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1, url).toHaveText(NOT_FOUND.heading[language]);
    expect(await h1.evaluate((element) => element.closest("[lang]")?.getAttribute("lang")), url).toBe(language);
    await expect(page.locator("main").getByRole("heading", { level: 2 }), url).toHaveText(
      LANGUAGES.filter((code) => code !== language).map((code) => NOT_FOUND.heading[code]),
    );
    for (const code of LANGUAGES) {
      const block = page.locator(`main [lang="${code}"]`, {
        has: page.getByRole("heading", { name: NOT_FOUND.heading[code], exact: true }),
      });
      await expect(block, `${url} ${code}`).toHaveCount(1);
      await expect(block.locator("p"), `${url} ${code}`).toHaveText(NOT_FOUND.body[code]);
      await expect(block.getByRole("link", { name: NOT_FOUND.home[code], exact: true })).toHaveAttribute(
        "href",
        homeUrl(code),
      );
      await expect(
        block.getByRole("link", { name: NOT_FOUND.deleteAccount[code], exact: true }),
      ).toHaveAttribute("href", `${homeUrl(code)}delete-account/`);
    }
    expect(errors, `${url}: hydration errors`).toEqual([]);
  }
});

test("WEB-306: on a phone, each 404's first deletion link is in the first viewport at 390 × 664 and 320 × 568", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Phone sizes.");
  for (const size of [
    { width: 390, height: 664 },
    { width: 320, height: 568 },
  ])
    for (const language of LANGUAGES) {
      await page.setViewportSize(size);
      await page.goto(`${homeUrl(language)}no-such-page/`);
      await hydrated(page);
      await page.evaluate(() => document.fonts.ready);
      const first = page.locator(`main [lang="${language}"]`, {
        has: page.getByRole("heading", { level: 1 }),
      });
      await expect(
        first.getByRole("link", { name: NOT_FOUND.deleteAccount[language], exact: true }),
        `${language} at ${size.width} × ${size.height}`,
      ).toBeInViewport();
    }
});

for (const theme of THEMES) {
  test.describe(`${theme} 404`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-306: axe, with document-title, reports no violations on the 404 in each language (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        const url = `${homeUrl(language)}no-such-page/`;
        await page.goto(url);
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const title = await new AxeBuilder({ page }).withRules(["document-title"]).analyze();
        expect(title.passes.map(({ id }) => id), `${url}: document-title passes`).toEqual(["document-title"]);
        expect(await axeViolations(page), url).toEqual([]);
      }
    });
  });
}

// Round 2, WP37: the language links 8 px apart, the phone menu for large-text desktops,
// and the footer nav's 44 px targets.
type Box = { name: string; left: number; right: number; top: number; bottom: number; width: number; height: number };
const boxesOf = (links: Locator): Promise<Box[]> =>
  links.evaluateAll((anchors) =>
    anchors.map((a) => {
      const { left, right, top, bottom, width, height } = a.getBoundingClientRect();
      return { name: a.textContent?.trim() ?? "", left, right, top, bottom, width, height };
    }),
  );
// Each language link is 48 px tall and 8 px from the one before it: beside it on the same
// row (its left edge minus the previous one's right edge), or below it when the row wraps.
function expectLanguageLinks(boxes: Box[], where: string) {
  expect(boxes.map(({ name }) => name), where).toEqual(LANGUAGES.map((code) => LANGUAGE_NAMES[code]));
  for (const box of boxes) expect(box.height, `${where}: “${box.name}” height`).toBeGreaterThanOrEqual(48);
  for (const [i, box] of boxes.entries()) {
    if (i === 0) continue;
    const previous = boxes[i - 1];
    const sameRow = box.top < previous.bottom && previous.top < box.bottom;
    const gap = sameRow ? box.left - previous.right : box.top - previous.bottom;
    expect(gap, `${where}: “${previous.name}” to “${box.name}”`).toBeGreaterThanOrEqual(8 - 0.1);
  }
}
const headerHeight = async (page: Page) => (await page.locator("header.site-header").boundingBox())!.height;

test("WEB-711: at 1440 px the header's language links are 48 px tall and 8 px apart", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "1440 × 1000 is the desktop project.");
  await page.emulateMedia({ colorScheme: "light" });
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    await page.evaluate(() => document.fonts.ready);
    const links = page.locator("header .header-languages").getByRole("link");
    await expect(links.first(), url).toBeVisible();
    expectLanguageLinks(await boxesOf(links), `${url} header`);
  }
});

test("WEB-711: on a phone the open menu's and the footer's language links are 48 px tall and 8 px apart", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "390 × 664 is the mobile project.");
  await page.emulateMedia({ colorScheme: "light" });
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    await page.evaluate(() => document.fonts.ready);
    await openMenu(page);
    const menu = page
      .locator("header .header-menu-panel")
      .getByRole("navigation", { name: FRAME.language[language], exact: true })
      .getByRole("link");
    await expect(menu.first(), url).toBeVisible();
    expectLanguageLinks(await boxesOf(menu), `${url} menu`);
    await page.keyboard.press("Escape");
    const footer = page
      .locator("footer")
      .getByRole("group", { name: FRAME.language[language], exact: true })
      .getByRole("link");
    await footer.first().scrollIntoViewIfNeeded();
    await expect(footer.first(), url).toBeVisible();
    expectLanguageLinks(await boxesOf(footer), `${url} footer`);
  }
});

test("WEB-711, WEB-307: in Catalan at 1025 and 1100 px with default text the desktop header is one row, with the nav and the switch and no Menu", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop widths.");
  for (const width of [1025, 1100]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/ca/");
    await hydrated(page);
    await page.evaluate(() => document.fonts.ready);
    const where = `/ca/ at ${width} px`;
    await expect(page.locator("header .desktop-nav"), where).toBeVisible();
    await expect(page.locator("header .header-languages"), where).toBeVisible();
    await expect(menuButton(page), where).toBeHidden();
    expect(await scrollsSideways(page), `${where}: sideways scroll`).toBe(false);
    expect(await headerHeight(page), `${where}: header height`).toBeLessThanOrEqual(105);
    expectLanguageLinks(await boxesOf(page.locator("header .header-languages").getByRole("link")), where);
  }
});

test("WEB-712: on a 1440 px desktop with the browser's text at 200%, the header is one row with Menu, and #questions lands below it", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Browser text size is a desktop setting (1440 × 1000).");
  await page.emulateMedia({ colorScheme: "light" });
  // text200: the browser's default font size from 16 to 32 px, as the renders do it.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Page.setFontSizes", { fontSizes: { standard: 32, fixed: 26 } });
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    await page.evaluate(() => document.fonts.ready);
    // The setting is live: the root follows the browser's text size.
    await expect
      .poll(
        () => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize)),
        { message: `${url}: the root's font size` },
      )
      .toBe(32);
    const button = menuButton(page);
    await expect(button, url).toBeVisible();
    await expect(button, url).toHaveText(FRAME.menu[language]);
    await expect(page.locator("header .desktop-nav"), url).toBeHidden();
    await expect(page.locator("header .header-languages"), url).toBeHidden();
    expect(await headerHeight(page), `${url}: header height at 200%`).toBeLessThanOrEqual(105);
    expect(await scrollsSideways(page), `${url}: sideways scroll at 200%`).toBe(false);

    await page.goto(`${url}#questions`);
    const title = page.locator("#questions-title");
    // Wait for the (smooth) scroll to the section to come to rest.
    let last = Number.NaN;
    await expect
      .poll(
        async () => {
          const y = await page.evaluate(() => window.scrollY);
          const still = y === last && y > 0;
          last = y;
          return still;
        },
        { message: `${url}#questions: the scroll settles`, intervals: [300] },
      )
      .toBe(true);
    await expect(title, `${url}#questions`).toBeInViewport();
    const headerBottom = await page
      .locator("header.site-header")
      .evaluate((header) => header.getBoundingClientRect().bottom);
    const titleTop = await title.evaluate((element) => element.getBoundingClientRect().top);
    expect(titleTop, `${url}#questions: the title's top, against the header's bottom (${headerBottom})`).toBeGreaterThanOrEqual(
      headerBottom - 0.5,
    );
  }
});

test("WEB-712: at 1440 × 1000 with default text each home keeps the desktop nav and switch, and no Menu", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "1440 × 1000 is the desktop project.");
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    await expect(page.locator("header .desktop-nav"), url).toBeVisible();
    await expect(page.locator("header .header-languages"), url).toBeVisible();
    await expect(menuButton(page), url).toBeHidden();
    expect(await headerHeight(page), `${url}: header height`).toBeLessThanOrEqual(105);
  }
});

test("WEB-703: on /ca/ every footer nav link is at least 44 × 44 px", async ({ page }) => {
  await page.goto("/ca/");
  await hydrated(page);
  await page.evaluate(() => document.fonts.ready);
  const links = page
    .locator("footer")
    .getByRole("navigation", { name: FOOTER.navigation.ca, exact: true })
    .getByRole("link");
  await expect(links).toHaveText(FOOTER_SITE.map((key) => FRAME[key].ca));
  for (const box of await boxesOf(links)) {
    expect(box.width, `“${box.name}” width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `“${box.name}” height`).toBeGreaterThanOrEqual(44);
  }
});

test("WP37: the site's styles no longer hold the dead .section-eyebrow > span rule", async ({ page }) => {
  await page.goto("/");
  const selectors = await page.evaluate(() => {
    const found: string[] = [];
    const walk = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) found.push(rule.selectorText);
        if (rule instanceof CSSGroupingRule) walk(rule.cssRules);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules);
    return found;
  });
  // The scan reads the site's own rules: .section-eyebrow itself is still there.
  expect(
    selectors.some((selector) => selector.split(",").some((part) => part.trim() === ".section-eyebrow")),
    "the .section-eyebrow rule",
  ).toBe(true);
  expect(selectors.filter((selector) => /\.section-eyebrow\s*>\s*span/.test(selector))).toEqual([]);
});

for (const theme of THEMES) {
  test.describe(`${theme} homes axe, WP37`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-711, WEB-712, WEB-703: axe reports no violations on /, /es/ and /ca/, with the menu closed and open (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        const url = homeUrl(language);
        await page.goto(url);
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(await axeViolations(page), `${url}, menu closed`).toEqual([]);
        if (!(await menuButton(page).isVisible())) continue;
        await openMenu(page);
        expect(await axeViolations(page), `${url}, menu open`).toEqual([]);
      }
    });
  });
}

// Run 2026-10-18-site, round 1, WP25: readable type in rem, tap feedback, 48 px logos and
// dark mode without JavaScript, on the homes and the 404. Its legal-page checks are in
// tests/ux-web-legal.spec.ts, with the legal pages they need.
const WP25_PAGES = [
  ...LANGUAGES.map(homeUrl),
  ...LANGUAGES.map((language) => `${homeUrl(language)}no-such-page/`),
];
const visibleParagraphSizes = (page: Page, skip: string) =>
  page.locator("main p").evaluateAll(
    (paragraphs, skip) =>
      paragraphs
        .filter((p) => p.checkVisibility() && !p.closest(skip) && (p.textContent ?? "").trim())
        .map((p) => ({
          text: (p.textContent ?? "").trim().slice(0, 50),
          size: parseFloat(getComputedStyle(p).fontSize),
        })),
    skip,
  );

test("WEB-8: no visible text under 12 px outside the demo, and main paragraphs of 16 px or more, on the homes and the 404", async ({
  page,
}, testInfo) => {
  for (const url of WP25_PAGES) {
    await page.goto(url);
    await hydrated(page);
    await page.evaluate(() => document.fonts.ready);
    expect(await textUnder(page, 12, ["#voice"]), `${url} (${testInfo.project.name}): text under 12 px`).toEqual([]);
    const small = (await visibleParagraphSizes(page, "#voice")).filter(({ size }) => size < 16);
    expect(small, `${url} (${testInfo.project.name}): main paragraphs under 16 px`).toEqual([]);
  }
});

test("WEB-8: at 390 px the hero's subheadline computes 18 px or more on each home", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "390 × 664 is the mobile project.");
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const size = await page
      .locator(".hero-description")
      .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    expect(size, homeUrl(language)).toBeGreaterThanOrEqual(18);
  }
});

test("WEB-309: with the browser's text at 200%, the homes' and the 404's text grows", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Once is enough: the CSS is the same on both projects.");
  const sizes = async () =>
    page.evaluate(() => ({
      body: parseFloat(getComputedStyle(document.body).fontSize),
      paragraph: parseFloat(getComputedStyle(document.querySelector("main p")!).fontSize),
      heading: parseFloat(getComputedStyle(document.querySelector("h1")!).fontSize),
    }));
  const before: Record<string, Awaited<ReturnType<typeof sizes>>> = {};
  for (const url of WP25_PAGES) {
    await page.goto(url);
    before[url] = await sizes();
  }
  await doubleTextSize(page);
  for (const url of WP25_PAGES) {
    await page.goto(url);
    await expect.poll(() => rootFontSize(page), { message: `${url}: the root follows the setting` }).toBe(32);
    const after = await sizes();
    expect(after.body, `${url}: body text at 200%`).toBeCloseTo(before[url].body * 2, 0);
    expect(after.paragraph, `${url}: the first paragraph at 200%`).toBeGreaterThan(before[url].paragraph * 1.5);
    expect(after.heading, `${url}: the h1 at 200%`).toBeGreaterThan(before[url].heading);
  }
});

// Visible elements that reach past the viewport's left or right edge.
async function overflowing(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((elements) =>
    elements
      .filter((element) => element.checkVisibility())
      .map((element) => ({
        what: `${element.tagName.toLowerCase()}.${[...element.classList].join(".")} “${(element.textContent ?? "").trim().slice(0, 30)}”`,
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
      }))
      .filter(({ left, right }) => left < -0.5 || right > window.innerWidth + 0.5),
  );
}
const FRAME_PARTS =
  "header.site-header, header .header-inner > *, header .language-switch a, header .header-menu-panel, footer .language-switch a";

for (const [name, setup] of [
  ["on a 390 px phone with the browser's text at 200%", async (page: Page) => doubleTextSize(page)],
  ["at 320 px wide", async (page: Page) => page.setViewportSize({ width: 320, height: 800 })],
] as const) {
  test(`WEB-309: ${name}, nothing scrolls sideways on the homes and the 404, the header fits, and the language switches wrap`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Phone sizes.");
    await setup(page);
    for (const url of WP25_PAGES) {
      await page.goto(url);
      await hydrated(page);
      await page.evaluate(() => document.fonts.ready);
      expect(await scrollsSideways(page), `${url}: sideways scroll`).toBe(false);
      expect(await overflowing(page, FRAME_PARTS), `${url}: past the edge`).toEqual([]);
      await openMenu(page);
      expect(await scrollsSideways(page), `${url}, menu open: sideways scroll`).toBe(false);
      expect(await overflowing(page, FRAME_PARTS), `${url}, menu open: past the edge`).toEqual([]);
      for (const selector of ["header .menu-languages", "footer .footer-languages"])
        await expect(page.locator(selector), `${url}: ${selector}`).toHaveCSS("flex-wrap", "wrap");
    }
  });
}

test("WEB-313: without JavaScript, a dark-mode visitor gets the dark page and no theme control", async ({
  browser,
  baseURL,
}, testInfo) => {
  const mobile = testInfo.project.name === "mobile";
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    colorScheme: "dark",
    ...(mobile ? { viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true } : {}),
  });
  const page = await context.newPage();
  const external: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url());
  });
  for (const url of [...LANGUAGES.map(homeUrl), "/no-such-page/"]) {
    await page.goto(url);
    const background = await page.evaluate(() => {
      const html = getComputedStyle(document.documentElement).backgroundColor;
      return html === "rgba(0, 0, 0, 0)" ? getComputedStyle(document.body).backgroundColor : html;
    });
    expect(background, `${url}: the page's background`).toBe("rgb(18, 28, 24)");
    await expect(page.locator("button.theme-toggle").first(), `${url}: the header's theme button`).toBeHidden();
    if (mobile) {
      await page.locator("header .header-menu summary").click();
      await expect(page.locator("header .header-menu")).toHaveAttribute("open", "");
      await expect(page.locator("header .appearance-choice"), `${url}: the menu's Appearance row`).toBeHidden();
    }
  }
  expect(external).toEqual([]);
  await context.close();
});

for (const theme of THEMES) {
  test.describe(`${theme} theme controls`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-313: with JavaScript, the theme controls show at full strength, not faded (${theme})`, async ({
      page,
      isMobile,
    }) => {
      for (const language of LANGUAGES) {
        const url = homeUrl(language);
        await page.goto(url);
        await hydrated(page);
        if (isMobile) await openMenu(page);
        const controls = page.locator("button.theme-toggle, header .appearance-choice button");
        const shown = await controls.evaluateAll((buttons) =>
          buttons
            .filter((button) => button.checkVisibility({ visibilityProperty: true }))
            .map((button) => {
              let opacity = 1;
              for (let e: Element | null = button; e; e = e.parentElement)
                opacity *= parseFloat(getComputedStyle(e).opacity);
              return { name: button.getAttribute("aria-label") ?? button.textContent?.trim(), opacity };
            }),
        );
        expect(shown.length, `${url}: theme controls shown`).toBeGreaterThan(0);
        for (const control of shown) expect(control.opacity, `${url}: “${control.name}”`).toBe(1);
      }
    });
  });
}

test("WEB-702: on a phone, header and footer links keep the browser's tap highlight", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Tap highlight is a touch behaviour.");
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await hydrated(page);
    const colours = await page
      .locator("header.site-header a, header.site-header summary, footer a")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          what: `${element.tagName.toLowerCase()} “${(element.textContent ?? "").trim().slice(0, 30)}”`,
          colour: getComputedStyle(element).getPropertyValue("-webkit-tap-highlight-color"),
        })),
      );
    expect(colours.length).toBeGreaterThan(5);
    for (const { what, colour } of colours)
      expect(parseColor(colour)[3], `${homeUrl(language)}: ${what} (${colour})`).toBeGreaterThan(0);
  }
});

// The style rules of a stylesheet's source, each with the at-rules around it.
function styleRules(css: string) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: { selector: string; body: string; within: string[] }[] = [];
  const stack: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ";") start = i + 1;
    else if (ch === "}") {
      stack.pop();
      start = i + 1;
    } else if (ch === "{") {
      const prelude = text.slice(start, i).trim();
      start = i + 1;
      if (prelude.startsWith("@")) {
        stack.push(prelude);
        continue;
      }
      const end = text.indexOf("}", i);
      rules.push({ selector: prelude, body: text.slice(i + 1, end), within: [...stack] });
      i = end;
      start = end + 1;
    }
  }
  return rules;
}

plain("WEB-702: every :hover rule in global.css that changes transform, background or colour sits inside @media (hover: hover)", () => {
  const rules = styleRules(readFileSync(path.join(ROOT, "src", "styles", "global.css"), "utf8"));
  const hover = rules.filter((rule) => rule.selector.includes(":hover"));
  expect(hover.length, "the :hover rules found").toBeGreaterThan(5);
  const changing = hover.filter((rule) => /(^|;|\s)(transform|background(-color)?|color)\s*:/.test(rule.body));
  const outside = changing
    .filter((rule) => !rule.within.some((at) => /^@media\b.*\(\s*hover\s*:\s*hover\s*\)/.test(at)))
    .map((rule) => rule.selector);
  expect(outside).toEqual([]);
});

test("WEB-703: the header and footer logos are 48 px tall or more on the homes and the 404", async ({ page }) => {
  for (const url of WP25_PAGES) {
    await page.goto(url);
    await hydrated(page);
    await page.evaluate(() => document.fonts.ready);
    for (const where of ["header.site-header", "footer"]) {
      const box = await page.locator(`${where} a.brand`).boundingBox();
      expect(box, `${url}: ${where}'s logo`).not.toBeNull();
      expect(box!.height, `${url}: ${where}'s logo height`).toBeGreaterThanOrEqual(48);
    }
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} WP25 axe`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-8, WEB-309, WEB-313, WEB-702, WEB-703: axe reports no violations on the homes and the 404 (${theme})`, async ({
      page,
    }) => {
      for (const url of WP25_PAGES) {
        await page.goto(url);
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(await axeViolations(page), url).toEqual([]);
      }
    });
  });
}

// ---- Round 2, WP40: at 200% text on phones, the sticky header stays one row ----

const WP40_PAGES = ["/", "/es/", "/ca/", "/es/privacy/"];
// The computed font size of the header wordmark's text and of the Menu label.
const headerType = (page: Page) =>
  page.locator("header.site-header").evaluate((header) => {
    const brand = header.querySelector("a.brand")!;
    const walker = document.createTreeWalker(brand, NodeFilter.SHOW_TEXT);
    let wordmark = Number.NaN;
    for (let node = walker.nextNode(); node; node = walker.nextNode())
      if (node.textContent?.includes("taskflow")) {
        wordmark = parseFloat(getComputedStyle(node.parentElement!).fontSize);
        break;
      }
    const menu = header.querySelector(".header-menu summary span");
    return { wordmark, menu: menu ? parseFloat(getComputedStyle(menu).fontSize) : Number.NaN };
  });
const centreY = (box: { y: number; height: number }) => box.y + box.height / 2;

for (const theme of THEMES) {
  test.describe(`${theme} WP40 header at 200%`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-715: on a phone with the browser's text at 200%, the header is one row of logo and Menu, at most 90 px, and #questions lands below it (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile", "390 × 664 is the mobile project.");
      await doubleTextSize(page);
      for (const url of WP40_PAGES) {
        await page.goto(url);
        await hydrated(page);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("html"), url).toHaveAttribute("data-theme", theme);
        // The setting is live: the root follows the browser's text size.
        await expect.poll(() => rootFontSize(page), { message: `${url}: the root's font size` }).toBe(32);
        const header = page.locator("header.site-header");
        const brand = header.locator("a.brand");
        const menu = menuButton(page);
        await expect(menu, url).toBeVisible();
        const type = await headerType(page);
        expect(type.wordmark, `${url}: the wordmark's font size`).toBeCloseTo(28, 1);
        expect(type.menu, `${url}: the Menu label's font size`).toBeCloseTo(32, 1);
        const height = (await header.boundingBox())!.height;
        expect(height, `${url}: header height`).toBeLessThanOrEqual(90);
        const [brandBox, menuBox] = [(await brand.boundingBox())!, (await menu.boundingBox())!];
        expect(
          Math.abs(centreY(brandBox) - centreY(menuBox)),
          `${url}: the logo's and Menu's vertical centres (${centreY(brandBox)}, ${centreY(menuBox)})`,
        ).toBeLessThanOrEqual(4);
        expect(await scrollsSideways(page), `${url}: sideways scroll`).toBe(false);

        if (url.endsWith("privacy/")) continue;
        await page.goto(`${url}#questions`);
        const title = page.locator("#questions-title");
        let last = Number.NaN;
        await expect
          .poll(
            async () => {
              const y = await page.evaluate(() => window.scrollY);
              const still = y === last && y > 0;
              last = y;
              return still;
            },
            { message: `${url}#questions: the scroll settles`, intervals: [300] },
          )
          .toBe(true);
        await expect(title, `${url}#questions`).toBeInViewport();
        const headerBottom = await header.evaluate((element) => element.getBoundingClientRect().bottom);
        const titleTop = await title.evaluate((element) => element.getBoundingClientRect().top);
        expect(titleTop, `${url}#questions: the title's top, against the header's bottom (${headerBottom})`).toBeGreaterThanOrEqual(
          headerBottom - 0.5,
        );
      }
    });
  });

  test.describe(`${theme} WP40 header at default text`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-715: with default text the header's wordmark stays 23 px, and axe reports no violations on the homes (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        const url = homeUrl(language);
        await page.goto(url);
        await hydrated(page);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("html"), url).toHaveAttribute("data-theme", theme);
        expect((await headerType(page)).wordmark, `${url}: the wordmark's font size`).toBeCloseTo(23, 1);
        expect(await axeViolations(page), url).toEqual([]);
      }
    });
  });
}

// ---- Run 2026-10-21-changes, round 1: WP55 (WEB-707's follow-up), the demo's English wrapper is gone ----

test("WEB-707: without JavaScript, the server's HTML for each home marks #voice and everything around it in the page's language, with no lang=\"en\" between #voice and <body>", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const origin = new URL(baseURL!).origin;
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
  const page = await context.newPage();
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    const marks = await page.evaluate(() => {
      const voice = document.querySelector("#voice");
      const around: { tag: string; lang: string }[] = [];
      for (let node = voice?.parentElement ?? null; node && node !== document.body; node = node.parentElement) {
        const lang = node.getAttribute("lang");
        if (lang !== null) around.push({ tag: node.tagName.toLowerCase(), lang });
      }
      return {
        voice: voice?.getAttribute("lang") ?? null,
        english: around.filter(({ lang }) => lang === "en").map(({ tag }) => tag),
        nearest: around[0]?.lang ?? document.documentElement.getAttribute("lang"),
      };
    });
    expect(marks, url).toEqual({
      voice: language,
      english: language === "en" ? marks.english : [],
      nearest: language,
    });
  }
  await context.close();
});

// ---- Run 2026-10-28-site: WP71 (WEB-1601, WEB-1602, WEB-1604): the phone menu closes like a
// menu (Tab, Escape, Android Back, a ✕), and the header lets go on short screens ----

const menuDetails = (page: Page) => page.locator("header details.header-menu");
const SHORT = { width: 320, height: 256 };
const PHONE = { width: 390, height: 664 };

// Opens the menu from the keyboard: focus on its button, then Enter.
async function openMenuByKeyboard(page: Page) {
  await menuButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(menuDetails(page)).toHaveAttribute("open", "");
}

// The first control a visitor can Tab to after the header, in document order, and whether it
// has focus and is the element on top at its centre.
async function nextAfterHeader(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector("header.site-header")!;
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
    const next = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(
      (element) =>
        !header.contains(element) &&
        header.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING &&
        element.checkVisibility({ visibilityProperty: true }),
    )!;
    const box = next.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const top = document.elementFromPoint(x, y);
    return {
      text: (next.textContent ?? "").replace(/\s+/g, " ").trim(),
      href: next.getAttribute("href"),
      focused: document.activeElement === next,
      inViewport: x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight,
      onTop: !!top && (top === next || next.contains(top)),
      topIs: top ? `${top.tagName.toLowerCase()}.${top.className}` : null,
    };
  });
}

for (const theme of THEMES) {
  test.describe(`${theme} WP71 menu keyboard`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-1601: Tab past Dark closes the menu, and focus lands on the next control, uncovered, at 390 × 664 and 320 × 256 (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile", "The phone menu (390 × 664), and 320 × 256.");
      for (const size of [PHONE, SHORT]) {
        await page.setViewportSize(size);
        for (const [url, language] of [
          ["/", "en"],
          ["/es/privacy/", "es"],
        ] as const) {
          const where = `${url} at ${size.width} × ${size.height}`;
          await page.goto(url);
          await hydrated(page);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          await openMenuByKeyboard(page);
          const dark = page
            .locator("header .header-menu-panel")
            .getByRole("button", { name: FRAME.dark[language], exact: true });
          // Tab through the menu's controls until Dark has focus.
          for (let presses = 0; presses < 20; presses++) {
            if (await dark.evaluate((button) => button === document.activeElement)) break;
            await page.keyboard.press("Tab");
          }
          await expect(dark, `${where}: Tab reaches ${FRAME.dark[language]}`).toBeFocused();
          await expect(menuDetails(page), `${where}: the menu is still open on Dark`).toHaveAttribute("open", "");
          await page.keyboard.press("Tab");
          await expect(menuDetails(page), `${where}: Tab past Dark closes the menu`).not.toHaveAttribute("open", "");
          const next = await nextAfterHeader(page);
          expect(next.focused, `${where}: focus is on the next control after the header (“${next.text}”)`).toBe(true);
          if (url === "/") {
            expect(next.text, `${where}: the hero's primary link`).toBe(siteEn.hero.primary);
            expect(next.href, where).toBe("#voice");
          }
          expect(next.inViewport, `${where}: “${next.text}” is in view`).toBe(true);
          expect(next.onTop, `${where}: “${next.text}” is on top at its centre, not ${next.topIs}`).toBe(true);
        }
      }
    });
  });
}

test("WEB-1601: Escape closes the menu and leaves focus on a page link outside it; from inside the menu it focuses Menu; a tap on Dark still switches the theme", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone menu (390 × 664).");
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await hydrated(page);
  // Focus on a page link, then the menu opens without taking focus (as a tap does in Safari).
  const hero = page.locator("main .hero-buttons a.button").first();
  await hero.focus();
  await menuDetails(page).evaluate((details) => ((details as HTMLDetailsElement).open = true));
  await expect(menuDetails(page)).toHaveAttribute("open", "");
  await expect(hero).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menuDetails(page), "Escape closes the menu").not.toHaveAttribute("open", "");
  await expect(hero, "focus stays on the page link").toBeFocused();

  // With focus inside the menu, Escape closes it onto its button.
  await openMenuByKeyboard(page);
  await page.keyboard.press("Tab");
  expect(
    await menuDetails(page).evaluate((details) => details.contains(document.activeElement)),
    "Tab moved focus into the menu",
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(menuDetails(page)).not.toHaveAttribute("open", "");
  await expect(menuButton(page)).toBeFocused();

  // A tap on Dark inside the open menu still switches the theme, and the menu stays open.
  await menuButton(page).tap();
  await expect(menuDetails(page)).toHaveAttribute("open", "");
  const dark = page.getByRole("group", { name: FRAME.appearance.en, exact: true }).getByRole("button", {
    name: FRAME.dark.en,
    exact: true,
  });
  await dark.tap();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(dark).toHaveAttribute("aria-pressed", "true");
  await expect(menuDetails(page), "the tap on Dark doesn't close the menu").toHaveAttribute("open", "");
});

// A stand-in for the browser's CloseWatcher that records every watcher the page makes.
async function stubCloseWatcher(page: Page) {
  await page.addInitScript(() => {
    type Record = { active: boolean; destroyed: boolean; closed: boolean };
    const records: Record[] = [];
    const watchers: unknown[] = [];
    class StubWatcher extends EventTarget {
      onclose: ((event: Event) => void) | null = null;
      oncancel: ((event: Event) => void) | null = null;
      record: Record = { active: true, destroyed: false, closed: false };
      constructor() {
        super();
        records.push(this.record);
        watchers.push(this);
      }
      requestClose() {
        this.close();
      }
      close() {
        if (!this.record.active) return;
        this.record.active = false;
        this.record.closed = true;
        const event = new Event("close");
        this.dispatchEvent(event);
        this.onclose?.call(this, event);
      }
      destroy() {
        this.record.active = false;
        this.record.destroyed = true;
      }
    }
    Object.defineProperty(window, "CloseWatcher", { value: StubWatcher, configurable: true, writable: true });
    Object.assign(window, { __watcherRecords: records, __watchers: watchers });
  });
}
type WatcherRecord = { active: boolean; destroyed: boolean; closed: boolean };
const watcherRecords = (page: Page) =>
  page.evaluate(() => (window as unknown as { __watcherRecords: WatcherRecord[] }).__watcherRecords);

test("WEB-1602: with CloseWatcher, opening the menu makes one watcher; its close closes the menu; a tap outside, Escape or a link destroys it", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone menu (390 × 664).");
  await stubCloseWatcher(page);
  await page.goto("/");
  await hydrated(page);
  expect(await watcherRecords(page), "no watcher while the menu is closed").toEqual([]);

  // Opening the menu creates one watcher, and Android's Back (its close) closes the menu,
  // with focus back on Menu since it was inside.
  await openMenuByKeyboard(page);
  await expect.poll(async () => (await watcherRecords(page)).length, "watchers after opening").toBe(1);
  expect((await watcherRecords(page))[0].active).toBe(true);
  await page.evaluate(() =>
    ((window as unknown as { __watchers: { close(): void }[] }).__watchers[0]).close(),
  );
  await expect(menuDetails(page), "the watcher's close closes the menu").not.toHaveAttribute("open", "");
  await expect(menuButton(page)).toBeFocused();
  expect((await watcherRecords(page))[0].active).toBe(false);

  // Each other way of closing the menu destroys its watcher, and the next opening makes a new one.
  const panel = page.locator("header .header-menu-panel");
  const dark = panel.getByRole("button", { name: FRAME.dark.en, exact: true });
  const closings: [string, () => Promise<void>][] = [
    [
      "a tap outside",
      async () => {
        const box = (await panel.boundingBox())!;
        await page.touchscreen.tap(12, Math.min(box.y + box.height + 40, page.viewportSize()!.height - 8));
      },
    ],
    ["Escape", () => page.keyboard.press("Escape")],
    [
      "a link",
      () => panel.getByRole("link", { name: FRAME.features.en, exact: true }).click(),
    ],
    [
      "Tab past the last control",
      async () => {
        await dark.focus();
        await page.keyboard.press("Tab");
      },
    ],
  ];
  for (const [index, [how, close]] of closings.entries()) {
    await page.evaluate(() => scrollTo(0, 0));
    await openMenuByKeyboard(page);
    await expect
      .poll(async () => (await watcherRecords(page)).length, `${how}: one new watcher on opening`)
      .toBe(index + 2);
    expect((await watcherRecords(page)).filter((record) => record.active), how).toHaveLength(1);
    await close();
    await expect(menuDetails(page), `${how} closes the menu`).not.toHaveAttribute("open", "");
    await expect
      .poll(async () => (await watcherRecords(page))[index + 1].destroyed, `${how} destroys the watcher`)
      .toBe(true);
    expect((await watcherRecords(page)).filter((record) => record.active), how).toEqual([]);
  }
});

test("WEB-1602: without CloseWatcher the menu opens and closes with no error", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone menu (390 × 664).");
  await page.addInitScript(() => {
    delete (window as { CloseWatcher?: unknown }).CloseWatcher;
    delete (Window.prototype as { CloseWatcher?: unknown }).CloseWatcher;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await hydrated(page);
  expect(await page.evaluate(() => "CloseWatcher" in window)).toBe(false);
  await openMenuByKeyboard(page);
  await page.keyboard.press("Escape");
  await expect(menuDetails(page)).not.toHaveAttribute("open", "");
  await menuButton(page).click();
  await expect(menuDetails(page)).toHaveAttribute("open", "");
  await menuButton(page).click();
  await expect(menuDetails(page)).not.toHaveAttribute("open", "");
  expect(errors).toEqual([]);
});

// The paths of the icon the pill shows: ≡ is three horizontal lines, ✕ two diagonals.
const MENU_PATHS = ["M4 7h16", "M4 12h16", "M4 17h16"];
const CLOSE_PATHS = ["M6 6l12 12", "M18 6 6 18"];
const shownIcon = async (page: Page) => {
  const visible = menuButton(page).locator("svg:visible");
  await expect(visible, "one icon shows in the pill").toHaveCount(1);
  return visible.locator("path").evaluateAll((paths) => paths.map((p) => p.getAttribute("d")));
};

test("WEB-1602: the closed pill shows ≡ and the open one ✕, and its name stays Menu, in each language and theme", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone menu (390 × 664).");
  for (const theme of THEMES) {
    await page.emulateMedia({ colorScheme: theme });
    for (const language of LANGUAGES) {
      const url = language === "en" ? "/" : `/${language}/privacy/`;
      const where = `${url} (${theme})`;
      await page.goto(url);
      await hydrated(page);
      expect(await shownIcon(page), `${where}: closed`).toEqual(MENU_PATHS);
      await expect(menuButton(page), where).toHaveAccessibleName(FRAME.menu[language]);
      await expect(menuButton(page), where).toHaveText(FRAME.menu[language]);
      await openMenu(page);
      expect(await shownIcon(page), `${where}: open`).toEqual(CLOSE_PATHS);
      await expect(menuButton(page), `${where}: open`).toHaveAccessibleName(FRAME.menu[language]);
      await expect(menuButton(page), `${where}: open`).toHaveText(FRAME.menu[language]);
      // Both icons stay out of the accessibility tree.
      expect(
        await menuButton(page)
          .locator("svg")
          .evaluateAll((svgs) => svgs.map((svg) => svg.getAttribute("aria-hidden"))),
        where,
      ).toEqual(["true", "true"]);
    }
  }
});

test("WEB-1602: without JavaScript, opening the menu swaps ≡ for ✕", async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone menu (390 × 664).");
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
    viewport: PHONE,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
  for (const url of ["/", "/es/privacy/"]) {
    await page.goto(url);
    expect(await shownIcon(page), `${url}: closed`).toEqual(MENU_PATHS);
    await menuButton(page).click();
    await expect(menuDetails(page), url).toHaveAttribute("open", "");
    expect(await shownIcon(page), `${url}: open`).toEqual(CLOSE_PATHS);
    await menuButton(page).click();
    await expect(menuDetails(page), url).not.toHaveAttribute("open", "");
    expect(await shownIcon(page), `${url}: closed again`).toEqual(MENU_PATHS);
  }
  await context.close();
});

const headerBox = (page: Page) =>
  page.locator("header.site-header").evaluate((header) => {
    const box = header.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, position: getComputedStyle(header).position };
  });

for (const size of [
  { width: 844, height: 390 },
  { width: 320, height: 256 },
]) {
  test(`WEB-1604: at ${size.width} × ${size.height} the header scrolls away, and Menú opens under the header at the top of the page`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto("/es/");
    await hydrated(page);
    // At the top of the page, Menú opens its panel under the header.
    await openMenu(page);
    const header = await headerBox(page);
    const panel = (await page.locator("header .header-menu-panel").boundingBox())!;
    await expect(page.locator("header .header-menu-panel")).toBeVisible();
    expect(panel.y, "the panel starts under the header").toBeGreaterThanOrEqual(header.bottom - 1);
    expect(panel.y, "the panel is just under the header").toBeLessThanOrEqual(header.bottom + 12);
    await page.keyboard.press("Escape");
    await expect(menuDetails(page)).not.toHaveAttribute("open", "");

    // After 600 px of scrolling the header is out of view.
    await page.evaluate(() => scrollTo(0, 600));
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(600);
    const scrolled = await headerBox(page);
    expect(scrolled.position, "the header isn't sticky").not.toBe("sticky");
    expect(scrolled.bottom, "the header is out of view").toBeLessThanOrEqual(0);
  });

  test(`WEB-1604: at ${size.width} × ${size.height} following the menu's link to #questions puts its heading within 24 px of the top`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto("/es/");
    await hydrated(page);
    await openMenu(page);
    await page
      .locator("header .header-menu-panel")
      .getByRole("link", { name: FRAME.questions.es, exact: true })
      .click();
    await expect(menuDetails(page)).not.toHaveAttribute("open", "");
    const heading = page.locator("#questions-title");
    await expect(heading).toBeInViewport();
    await expect
      .poll(async () => Math.round((await heading.boundingBox())!.y), "the heading's top, from the viewport's")
      .toBeLessThanOrEqual(24);
    expect((await heading.boundingBox())!.y, "the heading isn't cut off").toBeGreaterThanOrEqual(0);
  });
}

for (const size of [PHONE, { width: 720, height: 500 }]) {
  test(`WEB-1604: at ${size.width} × ${size.height} the header is still sticky`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    await hydrated(page);
    await page.evaluate(() => scrollTo(0, 600));
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(600);
    const header = await headerBox(page);
    expect(header.position).toBe("sticky");
    expect(Math.round(header.top), "the header stays at the top").toBe(0);
    expect(header.bottom).toBeGreaterThan(0);
  });
}

for (const theme of THEMES) {
  test.describe(`${theme} WP71 axe`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-1601, WEB-1602, WEB-1604: axe reports no violations with the menu open, at 390 × 664 and 320 × 256 (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile", "The phone menu.");
      for (const size of [PHONE, SHORT])
        for (const url of ["/", "/es/privacy/"]) {
          await page.setViewportSize(size);
          await page.goto(url);
          await hydrated(page);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          await openMenu(page);
          expect(await axeViolations(page), `${url} at ${size.width} × ${size.height}, menu open`).toEqual([]);
        }
    });
  });
}

// ---- Run 2026-10-28-site: WP72 (WEB-1603, WEB-1606, WEB-1608) ----
// The language switch: a choice that holds before the page has hydrated, one ‘Language’
// landmark per page, and the current language visible in forced colours. Already proved
// elsewhere in this file: the English 200 for / is `private, no-cache` and not `no-store`
// (‘the English home for the bare address is private, always revalidated’), the Accept-Language
// redirects keep `private, no-store` and Vary (‘the redirects of the bare address stay on the
// request's own origin’), axe on /, /es/privacy/ and /ca/delete-account/ with the menu closed
// and open (‘frame axe’) and on the 404 in each language (‘WEB-306: axe, with document-title’),
// light and dark, desktop and phone; the footer's language links 48 px tall and 8 px apart
// on a phone (WEB-711).
import { LEGAL_PAGES } from "./support/ux-web-copy";
import { pageUrl } from "./support/ux-web";

// The header's language switch as the visitor reaches it: in the header at 1440 px, in the
// opened phone menu on the phone (a <details>, so it opens without JavaScript too).
async function headerLanguages(page: Page, isMobile: boolean, language: Language) {
  const name = { name: FRAME.language[language], exact: true };
  if (!isMobile) return page.locator("header.site-header").getByRole("navigation", name);
  await menuButton(page).click();
  await expect(page.locator("header .header-menu")).toHaveAttribute("open", "");
  return page.locator("header .header-menu-panel").getByRole("navigation", name);
}
const footerLanguages = (page: Page, language: Language) =>
  page.locator("footer").getByRole("group", { name: FRAME.language[language], exact: true });

// The language cookie as WD5 and privacy §8 describe it: the choice, for about a year.
async function expectRemembered(context: import("@playwright/test").BrowserContext, value: Language, where: string) {
  const cookie = (await context.cookies()).find((entry) => entry.name === "taskflow-lang");
  expect(cookie?.value, `${where}: taskflow-lang`).toBe(value);
  expect(cookie?.path, `${where}: Path`).toBe("/");
  expect(cookie?.sameSite, `${where}: SameSite`).toBe("Lax");
  // Max-Age 31536000, within a minute.
  expect(Math.abs(cookie!.expires - Date.now() / 1000 - 31_536_000), `${where}: about a year`).toBeLessThan(60);
}
const isBareHome = (url: URL) => url.pathname === "/" && url.search === "";

test.describe("WP72 a Spanish browser without JavaScript", () => {
  // Chromium sends Accept-Language from the locale (an extra header doesn't reach navigations).
  test.use({ javaScriptEnabled: false, locale: "es" });
  test("WEB-1603: without JavaScript and with Accept-Language es, «English» on /es/ ends on / in English and the browser remembers it for a year", async ({
    page,
    context,
    isMobile,
  }) => {
    for (const where of ["header", "footer"] as const) {
      await context.clearCookies();
      // The browser's Spanish sends the bare address to /es/ before any choice.
      await page.goto("/");
      await expect(page, `${where}: before the choice`).toHaveURL(/\/es\/$/);
      const switcher = where === "header" ? await headerLanguages(page, isMobile, "es") : footerLanguages(page, "es");
      await switcher.getByRole("link", { name: LANGUAGE_NAMES.en, exact: true }).click();
      await expect(page, where).toHaveURL(isBareHome);
      await expect(page.getByRole("heading", { level: 1 }), where).toHaveText(HERO.title.en);
      await expectRemembered(context, "en", where);
      // And it holds: the bare address now stays English for this Spanish browser.
      await page.goto("/");
      await expect(page, `${where}: / again`).toHaveURL(isBareHome);
      await expect(page.getByRole("heading", { level: 1 }), `${where}: / again`).toHaveText(HERO.title.en);
    }
  });
});

test.describe("WP72 a Spanish browser before hydration", () => {
  test.use({ locale: "es" });
  test("WEB-1603: with JavaScript on, «English» clicked on /es/ before the page has hydrated ends on / in English and the browser remembers it for a year", async ({
    page,
    context,
    isMobile,
  }) => {
    // Hold the page's scripts until after the click, so React hasn't hydrated when it lands.
    let release!: () => void;
    const loaded = new Promise<void>((resolve) => (release = resolve));
    await page.route(/\/_next\/static\/.+\.js(\?.*)?$/, async (route) => {
      await loaded;
      await route.fallback().catch(() => undefined);
    });
    await page.goto("/es/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/es\/$/);
    // Not hydrated: the theme controls stay disabled (or absent) until React runs.
    expect(await page.locator("button.theme-toggle:not(:disabled)").count(), "hydrated before the click").toBe(0);
    const switcher = await headerLanguages(page, isMobile, "es");
    await switcher.getByRole("link", { name: LANGUAGE_NAMES.en, exact: true }).click({ noWaitAfter: true });
    // The held scripts keep the page from its load event, so wait only for the address.
    await page.waitForURL(isBareHome, { waitUntil: "commit" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(HERO.title.en);
    await expectRemembered(context, "en", "before hydration");
    release();
    await hydrated(page);
    await expect(page).toHaveURL(isBareHome);
  });
});

plain("WEB-1603: /?lang=en, es or ca is the switch's choice: a 307 to the clean address that sets taskflow-lang for a year, never stored; any other lang answers like /", async ({
  playwright,
  baseURL,
}) => {
  // A fresh request context for each request, so no cookie carries from one to the next.
  const get = async (url: string, headers: Record<string, string>) => {
    const request = await playwright.request.newContext({ baseURL });
    const response = await request.get(url, { headers, maxRedirects: 0 });
    const answer = {
      status: response.status(),
      location: response.headers()["location"] ?? "",
      cacheControl: response.headers()["cache-control"] ?? "",
      vary: (response.headers()["vary"] ?? "").toLowerCase(),
      cookies: response
        .headersArray()
        .filter(({ name }) => name.toLowerCase() === "set-cookie")
        .map(({ value }) => value),
      english: response.status() === 200 && (await response.text()).includes(HERO.description.en),
    };
    await request.dispose();
    return answer;
  };
  const where = (location: string) => new URL(location, baseURL);
  for (const [lang, to, browser] of [
    ["es", "/es/", "en-US,en;q=0.9"],
    ["ca", "/ca/", "es-ES,es;q=0.9"],
    ["en", "/", "es-ES,es;q=0.9"],
  ] as const) {
    for (const proto of ["http", "https"] as const) {
      const headers: Record<string, string> = { "accept-language": browser };
      if (proto === "https") headers["x-forwarded-proto"] = "https";
      const url = `/?lang=${lang}`;
      const answer = await get(url, headers);
      const name = `${url} (Accept-Language ${browser}, ${proto})`;
      expect(answer.status, name).toBe(307);
      expect(where(answer.location).pathname, `${name}: Location`).toBe(to);
      expect(where(answer.location).search, `${name}: the clean address`).toBe("");
      expect.soft(answer.cacheControl, `${name}: Cache-Control`).toContain("private");
      expect.soft(answer.cacheControl, `${name}: Cache-Control`).toContain("no-store");
      expect.soft(answer.vary, `${name}: Vary names Accept-Language`).toContain("accept-language");
      expect.soft(answer.vary, `${name}: Vary names Cookie`).toContain("cookie");
      const cookie = answer.cookies.filter((value) => value.startsWith("taskflow-lang="));
      expect(cookie, `${name}: one taskflow-lang cookie`).toHaveLength(1);
      const parts = cookie[0].split(";").map((part) => part.trim().toLowerCase());
      expect(parts[0], `${name}: the choice`).toBe(`taskflow-lang=${lang}`);
      expect(parts, `${name}: Path`).toContain("path=/");
      expect(parts, `${name}: Max-Age`).toContain("max-age=31536000");
      expect(parts, `${name}: SameSite`).toContain("samesite=lax");
      if (proto === "https") expect(parts, `${name}: Secure`).toContain("secure");
      else expect(parts, `${name}: no Secure on http`).not.toContain("secure");
    }
  }
  // Any other value is not a choice: the answer is the bare address's own.
  for (const headers of [
    { "accept-language": "en-US,en;q=0.9" },
    { "accept-language": "es-ES,es;q=0.9" },
    { cookie: "taskflow-lang=ca", "accept-language": "en" },
  ] as Record<string, string>[]) {
    for (const odd of ["xx", "EN", "fr", ""]) {
      const url = `/?lang=${odd}`;
      const name = `${url} (${label(headers)})`;
      const bareAnswer = await get("/", headers);
      const answer = await get(url, headers);
      expect(answer.status, name).toBe(bareAnswer.status);
      if (bareAnswer.status === 307)
        expect(where(answer.location).pathname, `${name}: Location`).toBe(where(bareAnswer.location).pathname);
      else expect(answer.english, `${name}: the English home`).toBe(true);
      expect(answer.cookies.filter((value) => value.startsWith("taskflow-lang=")), `${name}: no cookie`).toEqual([]);
      expect.soft(answer.cacheControl, `${name}: Cache-Control`).toBe(bareAnswer.cacheControl);
    }
  }
});

test("WEB-1603, WEB-1508: on /es/ and /ca/ every language switch's English link is /?lang=en, on the Spanish and Catalan delete pages /delete-account/?lang=en, and on the other legal pages the English page itself", async ({
  page,
}) => {
  const englishLinks = () =>
    page.locator('.language-switch a[hreflang="en"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  for (const language of ["es", "ca"] as const) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    const hrefs = await englishLinks();
    // The header's, the phone menu's and the footer's.
    expect(hrefs.length, `${url}: switches`).toBeGreaterThanOrEqual(3);
    expect(hrefs, url).toEqual(hrefs.map(() => "/?lang=en"));
    for (const document of LEGAL_PAGES) {
      const legal = pageUrl(language, document);
      await page.goto(legal);
      await hydrated(page);
      const legalHrefs = await englishLinks();
      expect(legalHrefs.length, `${legal}: switches`).toBeGreaterThanOrEqual(3);
      const english = document === "delete-account" ? "/delete-account/?lang=en" : `/${document}/`;
      expect(legalHrefs, legal).toEqual(legalHrefs.map(() => english));
    }
  }
});

test("WEB-1606: at 1440 × 1000 every page has exactly one navigation named ‘Language’, the header's, and the footer's switch is a group of the three languages", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "1440 × 1000 is the desktop project.");
  test.setTimeout(120_000);
  const pages: { url: string; language: Language }[] = LANGUAGES.flatMap((language) => [
    { url: homeUrl(language), language },
    ...LEGAL_PAGES.map((document) => ({ url: pageUrl(language, document), language })),
    { url: `${homeUrl(language)}ux-web-missing-page/`, language },
  ]);
  expect(pages).toHaveLength(18);
  for (const { url, language } of pages) {
    await page.goto(url);
    await hydrated(page);
    const name = { name: FRAME.language[language], exact: true };
    await expect(page.getByRole("navigation", name), `${url}: navigations named ${FRAME.language[language]}`).toHaveCount(1);
    await expect(page.locator("header.site-header").getByRole("navigation", name), `${url}: the header's`).toBeVisible();
    await expect(page.locator("footer").getByRole("navigation", name), `${url}: no footer navigation`).toHaveCount(0);
    const group = footerLanguages(page, language);
    await expect(group, `${url}: the footer's group`).toHaveCount(1);
    await expect(group.getByRole("link"), `${url}: the footer's languages`).toHaveText(
      LANGUAGES.map((code) => LANGUAGE_NAMES[code]),
    );
    // axe's own check for landmarks of one role sharing a name (a best practice, outside the
    // WCAG tags the suite's axe runs).
    const unique = await new AxeBuilder({ page }).withRules(["landmark-unique"]).analyze();
    expect(
      unique.violations.map((violation) => violation.nodes.map((node) => node.target.join(" "))),
      `${url}: landmark-unique`,
    ).toEqual([]);
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} WP72 forced colours`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-1608: with forced colours the current language has a 2 px solid outline in the desktop header and the open phone menu, the others none, and keyboard focus still shows its ring (${theme})`, async ({
      page,
      isMobile,
    }) => {
      await page.emulateMedia({ forcedColors: "active" });
      for (const language of LANGUAGES) {
        const url = homeUrl(language);
        await page.goto(url);
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches), "forced colours").toBe(true);
        const switcher = await headerLanguages(page, isMobile, language);
        await expect(switcher, url).toBeVisible();
        const where = `${url}, ${isMobile ? "phone menu" : "desktop header"}`;
        const looks = await switcher.getByRole("link").evaluateAll((links) =>
          links.map((link) => {
            const style = getComputedStyle(link);
            return {
              name: link.textContent?.trim(),
              current: link.getAttribute("aria-current") === "page",
              outline: style.outlineStyle,
              width: style.outlineWidth,
            };
          }),
        );
        // The desktop header shows EN, ES, CA (each named in full); the phone menu the names.
        expect(looks.map((look) => look.name), where).toEqual(
          LANGUAGES.map((code) => (isMobile ? LANGUAGE_NAMES[code] : code.toUpperCase())),
        );
        for (const look of looks) {
          if (look.current) expect({ outline: look.outline, width: look.width }, `${where}: ${look.name}`).toEqual({ outline: "solid", width: "2px" });
          else expect(look.outline, `${where}: ${look.name}`).toBe("none");
        }
        expect(looks.filter((look) => look.current).map((look) => look.name), where).toEqual([
          isMobile ? LANGUAGE_NAMES[language] : language.toUpperCase(),
        ]);
        // Reached by the keyboard, the current language shows the focus ring, not the marker.
        const current = switcher.getByRole("link", { name: LANGUAGE_NAMES[language], exact: true });
        for (let step = 0; step < 40 && !(await current.evaluate((link) => link === document.activeElement)); step++)
          await page.keyboard.press("Tab");
        const ring = await current.evaluate((link) => {
          const style = getComputedStyle(link);
          return {
            focused: link === document.activeElement && link.matches(":focus-visible"),
            outline: style.outlineStyle,
            width: parseFloat(style.outlineWidth),
            offset: parseFloat(style.outlineOffset),
          };
        });
        expect(ring.focused, `${where}: reached by Tab`).toBe(true);
        expect(ring.outline, `${where}: the focus ring`).not.toBe("none");
        expect(ring.width, `${where}: the focus ring's width`).toBeGreaterThanOrEqual(2);
        // The focus ring sits outside the link; the forced-colours marker sits inside (-2 px).
        expect(ring.offset, `${where}: the focus ring's offset`).toBeGreaterThan(0);
      }
    });
  });
}

// ---- Run 2026-10-28-site: WP261 (WEB-1508) ----
// /delete-account/, the deletion address Google Play shows everyone, opens in the visitor's
// language as / does (WD27): a saved choice first, then the browser's, never the location.
// Already proved elsewhere: /es/privacy/, /es/delete-account/ and /ca/delete-account/ never
// redirect (‘WEB-2, WEB-1508: only the bare address and /delete-account/ redirect’); every
// switch's English link on the Spanish and Catalan delete pages is /delete-account/?lang=en,
// on /es/privacy/ still /privacy/ (‘WEB-1603, WEB-1508: on /es/ and /ca/ every language
// switch's English link’); each legal page shows one ‘In force since’ date, company.json's
// version (WEB-213, ux-web-legal.spec.ts), which docs/LEGAL_RELEASE.md names (WEB-109, ibid.).
// Vary is checked on the redirects only, as for / since WP34 (2026-10-18-site, plan.md: Next 16
// overwrites Vary on the page it renders; the 200's `private` keeps shared caches out).
import { readdirSync } from "node:fs";

const DELETE = "/delete-account/";
const DELETE_H1: Record<Language, string> = {
  en: "Delete your TaskFlow account.",
  es: "Elimina tu cuenta de TaskFlow.",
  ca: "Suprimeix el teu compte de TaskFlow.",
};
// The delete page's own switch on a phone, the pill in its top row (WP65).
const DOCUMENT_LANGUAGE: Record<Language, string> = {
  en: "Document language",
  es: "Idioma del documento",
  ca: "Idioma del document",
};
// WEB-2's cases, sent to /delete-account/, and where each must end.
const DELETE_CASES: { headers: Record<string, string>; to: string | null }[] = [
  { headers: { "accept-language": "es-ES,es;q=0.9" }, to: "/es/delete-account/" },
  { headers: { "accept-language": "ca-ES,ca;q=0.9,es;q=0.8" }, to: "/ca/delete-account/" },
  { headers: { "accept-language": "en-US,en;q=0.9,es;q=0.8" }, to: null },
  { headers: {}, to: null },
  { headers: { "accept-language": "fr-FR" }, to: null },
  { headers: { cookie: "taskflow-lang=en", "accept-language": "es-ES" }, to: null },
  { headers: { cookie: "taskflow-lang=ca", "accept-language": "en" }, to: "/ca/delete-account/" },
];

// One request from a fresh context (no Accept-Language of its own, no cookie carried over).
async function deleteAnswer(
  playwright: import("@playwright/test").PlaywrightWorkerArgs["playwright"],
  baseURL: string | undefined,
  url: string,
  headers: Record<string, string>,
) {
  const request = await playwright.request.newContext({ baseURL });
  const response = await request.get(url, { headers, maxRedirects: 0 });
  const answer = {
    status: response.status(),
    location: response.headers()["location"] ?? "",
    cacheControl: response.headers()["cache-control"] ?? "",
    vary: (response.headers()["vary"] ?? "").toLowerCase(),
    nosniff: response.headers()["x-content-type-options"] ?? "",
    cookies: response
      .headersArray()
      .filter(({ name }) => name.toLowerCase() === "set-cookie")
      .map(({ value }) => value),
    english: response.status() === 200 && (await response.text()).includes(DELETE_H1.en),
  };
  await request.dispose();
  return answer;
}

plain("WEB-1508: /delete-account/ follows the remembered choice, then the browser's language, as / does", async ({
  playwright,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  for (const { headers, to } of DELETE_CASES) {
    const answer = await deleteAnswer(playwright, baseURL, DELETE, headers);
    const name = `${DELETE} (${label(headers) || "no Accept-Language"}) → ${answer.status}`;
    if (to) {
      expect(answer.status, name).toBe(307);
      expect(answer.location, `${name}: Location`).toBe(`${origin}${to}`);
      expect.soft(answer.cacheControl, `${name}: Cache-Control`).toContain("private");
      expect.soft(answer.cacheControl, `${name}: Cache-Control`).toContain("no-store");
      expect.soft(answer.vary, `${name}: Vary names Accept-Language`).toContain("accept-language");
      expect.soft(answer.vary, `${name}: Vary names Cookie`).toContain("cookie");
    } else {
      expect(answer.status, name).toBe(200);
      expect(answer.english, `${name}: the English delete page`).toBe(true);
      expect.soft(answer.cacheControl, `${name}: Cache-Control`).toContain("private");
      expect.soft(answer.cacheControl, `${name}: Cache-Control`).toContain("no-cache");
      expect.soft(answer.cacheControl, `${name}: Cache-Control`).not.toContain("no-store");
      expect.soft(answer.nosniff, `${name}: nosniff`).toBe("nosniff");
    }
    expect(answer.cookies.filter((value) => value.startsWith("taskflow-lang=")), `${name}: no cookie set`).toEqual([]);
  }
});

plain("WEB-1508: behind the edge worker, /delete-account/'s redirect starts with the origin the worker sent", async ({
  baseURL,
}) => {
  const { request: send } = await import("node:http");
  const server = new URL(baseURL!);
  const location = await new Promise<string>((resolve, reject) => {
    const outgoing = send(
      {
        host: server.hostname,
        port: server.port,
        path: DELETE,
        headers: {
          host: "taskflow-web-example.a.run.app",
          "x-forwarded-proto": "https",
          "accept-language": "es-ES",
        },
      },
      (response) => {
        response.resume();
        resolve(String(response.headers.location ?? ""));
      },
    );
    outgoing.on("error", reject);
    outgoing.end();
  });
  expect(location).toBe("https://taskflow-web-example.a.run.app/es/delete-account/");
});

plain("WEB-1508: /delete-account/?lang=en, es or ca is the switch's choice: a 307 to the clean address in that language that sets taskflow-lang for a year; any other lang answers like /delete-account/", async ({
  playwright,
  baseURL,
}) => {
  const where = (location: string) => new URL(location, baseURL);
  for (const [lang, to, browser] of [
    ["es", "/es/delete-account/", "en-US,en;q=0.9"],
    ["ca", "/ca/delete-account/", "es-ES,es;q=0.9"],
    ["en", "/delete-account/", "es-ES"],
  ] as const) {
    const url = `${DELETE}?lang=${lang}`;
    const answer = await deleteAnswer(playwright, baseURL, url, { "accept-language": browser });
    const name = `${url} (Accept-Language ${browser})`;
    expect(answer.status, name).toBe(307);
    expect(where(answer.location).pathname, `${name}: Location`).toBe(to);
    expect(where(answer.location).search, `${name}: the clean address`).toBe("");
    expect.soft(answer.cacheControl, `${name}: Cache-Control`).toContain("private");
    expect.soft(answer.cacheControl, `${name}: Cache-Control`).toContain("no-store");
    expect.soft(answer.vary, `${name}: Vary names Accept-Language`).toContain("accept-language");
    expect.soft(answer.vary, `${name}: Vary names Cookie`).toContain("cookie");
    const cookie = answer.cookies.filter((value) => value.startsWith("taskflow-lang="));
    expect(cookie, `${name}: one taskflow-lang cookie`).toHaveLength(1);
    const parts = cookie[0].split(";").map((part) => part.trim().toLowerCase());
    expect(parts[0], `${name}: the choice`).toBe(`taskflow-lang=${lang}`);
    expect(parts, `${name}: Path`).toContain("path=/");
    expect(parts, `${name}: Max-Age`).toContain("max-age=31536000");
    expect(parts, `${name}: SameSite`).toContain("samesite=lax");
  }
  // ?lang=en from a Spanish browser, followed: the cookie it sets keeps the page English.
  const request = await playwright.request.newContext({ baseURL });
  const followed = await request.get(`${DELETE}?lang=en`, { headers: { "accept-language": "es-ES" } });
  expect(new URL(followed.url()).pathname, "?lang=en followed").toBe(DELETE);
  expect(new URL(followed.url()).search, "?lang=en followed: the clean address").toBe("");
  expect(followed.status(), "?lang=en followed").toBe(200);
  expect(await followed.text(), "?lang=en followed: the English page").toContain(DELETE_H1.en);
  await request.dispose();
  // Any other value is not a choice: the answer is /delete-account/'s own.
  for (const headers of [
    { "accept-language": "en-US,en;q=0.9" },
    { "accept-language": "es-ES,es;q=0.9" },
    { cookie: "taskflow-lang=ca", "accept-language": "en" },
  ] as Record<string, string>[]) {
    for (const odd of ["xx", "EN", "fr", ""]) {
      const url = `${DELETE}?lang=${odd}`;
      const name = `${url} (${label(headers)})`;
      const plainAnswer = await deleteAnswer(playwright, baseURL, DELETE, headers);
      const answer = await deleteAnswer(playwright, baseURL, url, headers);
      expect(answer.status, name).toBe(plainAnswer.status);
      if (plainAnswer.status === 307)
        expect(where(answer.location).pathname, `${name}: Location`).toBe(where(plainAnswer.location).pathname);
      else expect(answer.english, `${name}: the English delete page`).toBe(true);
      expect(answer.cookies.filter((value) => value.startsWith("taskflow-lang=")), `${name}: no cookie`).toEqual([]);
      expect.soft(answer.cacheControl, `${name}: Cache-Control`).toBe(plainAnswer.cacheControl);
    }
  }
});

plain("WEB-1508: /delete-account without the slash, from a Spanish browser, ends on /es/delete-account/", async ({
  playwright,
  baseURL,
}) => {
  const request = await playwright.request.newContext({ baseURL });
  const response = await request.get("/delete-account", { headers: { "accept-language": "es-ES" } });
  expect(new URL(response.url()).pathname).toBe("/es/delete-account/");
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain(DELETE_H1.es);
  await request.dispose();
});

plain("WEB-1508: the other legal pages and the Spanish and Catalan delete pages answer 200 whatever the language or cookie", async ({
  playwright,
  baseURL,
}) => {
  for (const url of ["/es/delete-account/", "/ca/delete-account/", "/privacy/", "/es/privacy/", "/terms/"])
    for (const headers of [
      {},
      { "accept-language": "es-ES,es;q=0.9" },
      { "accept-language": "ca-ES,ca;q=0.9" },
      { "accept-language": "en-US,en;q=0.9" },
      { cookie: "taskflow-lang=es" },
      { cookie: "taskflow-lang=ca", "accept-language": "es-ES" },
      { cookie: "taskflow-lang=en", "accept-language": "ca-ES" },
    ] as Record<string, string>[]) {
      const answer = await deleteAnswer(playwright, baseURL, url, headers);
      expect(answer.status, `${url} (${label(headers) || "no Accept-Language"})`).toBe(200);
    }
});

// The delete page's language switch as the acceptance names it: the header's on desktop,
// the page's own pill on a phone.
const deleteSwitch = (page: Page, isMobile: boolean, language: Language) =>
  isMobile
    ? page.getByRole("main").getByRole("navigation", { name: DOCUMENT_LANGUAGE[language], exact: true })
    : page.locator("header.site-header").getByRole("navigation", { name: FRAME.language[language], exact: true });

test.describe("WP261 a Spanish browser", () => {
  test.use({ locale: "es-ES" });
  test("WEB-1508: in a Spanish browser, /delete-account/ opens /es/delete-account/ in Spanish, with «Español» as the current language", async ({
    page,
    isMobile,
  }) => {
    await page.goto(DELETE);
    await expect(page).toHaveURL((url) => url.pathname === "/es/delete-account/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(DELETE_H1.es);
    const switcher = deleteSwitch(page, isMobile, "es");
    await expect(switcher).toBeVisible();
    await expect(switcher.getByRole("link", { name: LANGUAGE_NAMES.es, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(switcher.locator('a[aria-current="page"]')).toHaveCount(1);
  });
});

test.describe("WP261 a Spanish browser without JavaScript", () => {
  test.use({ javaScriptEnabled: false, locale: "es-ES" });
  test("WEB-1508: without JavaScript, «English» on the Spanish delete page ends on /delete-account/ in English, remembers it for a year, and /delete-account/ then stays English", async ({
    page,
    context,
    isMobile,
  }) => {
    await page.goto(DELETE);
    await expect(page, "before the choice").toHaveURL((url) => url.pathname === "/es/delete-account/");
    await deleteSwitch(page, isMobile, "es").getByRole("link", { name: LANGUAGE_NAMES.en, exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === DELETE && url.search === "");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(DELETE_H1.en);
    await expectRemembered(context, "en", "after «English»");
    await page.goto(DELETE);
    await expect(page, "/delete-account/ again").toHaveURL((url) => url.pathname === DELETE && url.search === "");
    await expect(page.getByRole("heading", { level: 1 }), "/delete-account/ again").toHaveText(DELETE_H1.en);
  });
});

// The organizer's wording for §8's sentence: the check is about the wording.
const WP261_SECTION_8: Record<Language, { now: string; gone: string }> = {
  en: {
    now: "The bare address and our deletion page’s address open the site in your browser’s language when it’s Spanish or Catalan, and in English otherwise; we never use your location for this.",
    gone: "The bare address opens the site",
  },
  es: {
    now: "La dirección principal y la de la página de supresión abren la web en el idioma de tu navegador si es español o catalán, y en inglés si no; nunca usamos tu ubicación para ello.",
    gone: "La dirección principal abre la web",
  },
  ca: {
    now: "L’adreça principal i la de la pàgina de supressió obren el web en l’idioma del navegador si és castellà o català, i en anglès si no; no fem servir mai la teva ubicació per a això.",
    gone: "L’adreça principal obre el web",
  },
};

test("WEB-1508: privacy §8's last paragraph says the bare address and the deletion page's address follow the browser's language, in each language", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const url = pageUrl(language, "privacy");
    await page.goto(url);
    const section = page.locator("section", { has: page.getByRole("heading", { level: 2, name: /^8\./ }) });
    await expect(section, url).toHaveCount(1);
    const last = ((await section.locator("p").last().textContent()) ?? "").replace(/\s+/g, " ");
    expect(last, `${url} §8's last paragraph`).toContain(WP261_SECTION_8[language].now);
    expect(last, `${url} §8's last paragraph`).not.toContain(WP261_SECTION_8[language].gone);
  }
});

plain("WEB-1508: src/content/legal/ no longer says only the bare address follows the browser's language", () => {
  const folder = path.join(ROOT, "src", "content", "legal");
  const files = readdirSync(folder).filter((file) => /\.(ts|tsx|json)$/.test(file));
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const text = readFileSync(path.join(folder, file), "utf8");
    for (const { gone } of Object.values(WP261_SECTION_8)) expect(text, `${file}: “${gone}”`).not.toContain(gone);
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} WP261 axe`, () => {
    test.use({ colorScheme: theme });
    for (const [locale, language] of [
      ["es-ES", "es"],
      ["ca-ES", "ca"],
    ] as const) {
      test.describe(`${locale} browser`, () => {
        test.use({ locale });
        test(`WEB-1508: axe reports no violations on /${language}/delete-account/ reached through /delete-account/ (${theme})`, async ({
          page,
        }) => {
          await page.goto(DELETE);
          await expect(page).toHaveURL((url) => url.pathname === `/${language}/delete-account/`);
          await hydrated(page);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          expect(await axeViolations(page)).toEqual([]);
        });
      });
    }
    test(`WEB-1508: axe reports no violations on the three privacy pages (${theme})`, async ({ page }) => {
      for (const language of LANGUAGES) {
        const url = pageUrl(language, "privacy");
        await page.goto(url);
        await hydrated(page);
        await expect(page.locator("html"), url).toHaveAttribute("data-theme", theme);
        expect(await axeViolations(page), url).toEqual([]);
      }
    });
  });
}
