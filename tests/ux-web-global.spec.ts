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
import { test as plain, type APIRequestContext, type Locator, type Page } from "@playwright/test";
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
const NAV = ["voice", "features", "questions"] as const;
const ANCHORS = { voice: "#voice", features: "#features", questions: "#questions" };
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
      ...NAV.map((key) => FRAME[key][language]),
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
  const icon = menuButton(page).locator("svg");
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
      // Brand, three links, three languages and the theme switch.
      expect(layout.count, where).toBe(8);
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
  expect((await request.get("/no-such-page/")).status()).toBe(404);
  await page.goto("/no-such-page/");
  const tags = await head(page);
  expect(tags.title).toBe(NOT_FOUND.title);
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
      .getByRole("navigation", { name: FRAME.language[language], exact: true })
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
  await expect(links).toHaveText([FRAME.voice.ca, FRAME.features.ca, FRAME.questions.ca]);
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
