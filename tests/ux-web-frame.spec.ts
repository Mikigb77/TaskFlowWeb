// Acceptance tests for the frame (header, phone menu, footer) from the UX web loop, run
// 2026-10-18-site, that prove held changes: WP33's footer link, WP22 (layout.tsx: the page's
// language, the skip link, two theme colours, the font) and WP23 (the footer in the page's
// language). layout.tsx and Footer.tsx hold the other session's uncommitted work, so this file
// stays uncommitted with them. Round 2's WP38 (the 404 preloads the layout's font) is held
// with WP22, so its tests are here too. See tests/support/ux-web.ts.
import type { APIRequestContext } from "@playwright/test";
import {
  axeViolations,
  expect,
  homeUrl,
  hydrated,
  type Language,
  LANGUAGES,
  pageUrl,
  scrollsSideways,
  smallestText,
  test,
  THEMES,
} from "./support/ux-web";
import {
  FOOTER,
  FRAME,
  LANGUAGE_NAMES,
  LEGAL_PAGES,
  NOT_FOUND,
  SKIP_LINK,
  TRY_VOICE,
} from "./support/ux-web-copy";

test.use({ colorScheme: "light" });

test("WEB-6: no link anywhere on the homes or /privacy/ leads to the removed walkthrough (#demo)", async ({
  page,
}) => {
  const found: string[] = [];
  for (const url of ["/", "/es/", "/ca/", "/privacy/"]) {
    await page.goto(url);
    // Every link in the document: header, phone menu (open or not), main and footer.
    const links = await page
      .locator("a[href]")
      .evaluateAll((anchors) =>
        anchors
          .map((a) => `${a.textContent?.trim()} → ${a.getAttribute("href")}`)
          .filter((link) => link.endsWith("#demo")),
      );
    found.push(...links.map((link) => `${url}: ${link}`));
  }
  expect(found, "links to #demo").toEqual([]);
});

test("WEB-6: the footer's demo link reads ‘Try it with your voice’ and brings the live demo into view", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: /try the demo/i })).toHaveCount(0);
  const link = footer.getByRole("link", { name: TRY_VOICE.en, exact: true });
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute("href", "/#voice");
  await link.click();
  await expect(page).toHaveURL(/\/#voice$/);
  await expect(page.locator("#voice")).toBeInViewport();
});

// Every page the site has, with its language: the homes, the legal pages and the 404.
const ALL_PAGES: { url: string; language: Language }[] = [
  ...LANGUAGES.map((language) => ({ url: homeUrl(language), language })),
  ...LANGUAGES.flatMap((language) =>
    LEGAL_PAGES.map((name) => ({ url: pageUrl(language, name), language })),
  ),
  ...LANGUAGES.map((language) => ({ url: `${homeUrl(language)}no-such-page/`, language })),
];

// WP22: the page's head.
test("WEB-2, WEB-304: with JavaScript, <html lang> is the page's language", async ({ page }) => {
  for (const [url, lang] of [
    ["/es/", "es"],
    ["/es/privacy/", "es"],
    ["/ca/", "ca"],
    ["/ca/delete-account/", "ca"],
    ["/", "en"],
    ["/privacy/", "en"],
  ]) {
    await page.goto(url);
    await expect(page.locator("html"), url).toHaveAttribute("lang", lang);
  }
});

test("WEB-304: the first Tab stop is the skip link in the page's language, and it moves focus to the content", async ({
  page,
}) => {
  for (const [url, language] of [
    ["/es/privacy/", "es"],
    ["/ca/", "ca"],
    ["/", "en"],
  ] as [string, Language][]) {
    await page.goto(url);
    await hydrated(page);
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused, url).toHaveText(SKIP_LINK[language]);
    await expect(focused, url).toHaveAttribute("href", "#main-content");
    await expect(focused, url).toHaveAttribute("lang", language);
    await page.keyboard.press("Enter");
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.id), url)
      .toBe("main-content");
  }
});

test("WEB-313: the built head has a light and a dark theme colour, and choosing a theme sets both", async ({
  page,
  request,
  isMobile,
}) => {
  const html = await (await request.get("/")).text();
  const metas = Array.from(html.matchAll(/<meta\b[^>]*name="theme-color"[^>]*>/g)).map(([tag]) => ({
    media: /media="([^"]*)"/.exec(tag)?.[1] ?? "",
    content: /content="([^"]*)"/.exec(tag)?.[1]?.toLowerCase() ?? "",
  }));
  expect(metas, "meta[name=theme-color] in the served HTML").toHaveLength(2);
  expect(metas.find((meta) => meta.media.includes("dark"))?.content).toBe("#121c18");
  expect(metas.find((meta) => meta.media.includes("light"))?.content).toBe("#f7f8f2");

  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await hydrated(page);
  const colours = () =>
    page
      .locator('meta[name="theme-color"]')
      .evaluateAll((elements) => elements.map((meta) => meta.getAttribute("content")?.toLowerCase()));
  for (const [theme, colour] of [
    ["dark", "#121c18"],
    ["light", "#f7f8f2"],
  ] as const) {
    if (isMobile) {
      await page.locator("header .header-menu summary").click();
      await page
        .getByRole("group", { name: FRAME.appearance.en, exact: true })
        .getByRole("button", { name: FRAME[theme].en, exact: true })
        .click();
      await page.keyboard.press("Escape");
    } else
      await page
        .getByRole("button", { name: theme === "dark" ? FRAME.toDark.en : FRAME.toLight.en, exact: true })
        .click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    expect(await colours(), `after choosing ${theme}`).toEqual([colour, colour]);
  }
});

test("WEB-311: the home loads one font file, from Next's font loader, and preloads no TTF", async ({ page }) => {
  const fonts: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (request.resourceType() === "font" || /\.(woff2?|ttf|otf)$/.test(url.pathname)) fonts.push(url.pathname);
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  expect(fonts, "font requests").toHaveLength(1);
  expect(fonts[0]).toMatch(/^\/_next\/static\/media\//);
  expect(fonts).not.toContain("/fonts/Manrope.ttf");
  await expect(page.locator('link[rel="preload"][href*="Manrope.ttf"]')).toHaveCount(0);
});

test("WEB-302: no page's title or og:title keeps the slogan or ‘voice-to-task’", async ({ page }) => {
  for (const { url } of ALL_PAGES) {
    await page.goto(url);
    const titles = [
      await page.title(),
      ...(await page
        .locator('meta[property="og:title"], meta[name="twitter:title"]')
        .evaluateAll((metas) => metas.map((meta) => meta.getAttribute("content") ?? ""))),
    ];
    for (const title of titles) {
      expect(title, url).not.toContain("Make room");
      expect(title.toLowerCase(), url).not.toContain("voice-to-task");
    }
  }
});

// WP23: the footer.
const ENGLISH_FOOTER = [
  "Privacy",
  "Terms and Conditions",
  "Legal Notice",
  "Delete account",
  "Email support",
  "Contact support",
  "Back to top",
  "Footer navigation",
  "Legal and privacy",
  "A product by",
  "Try it with your voice",
  "What it does",
  "A little focus",
  "headspace",
];

test("WEB-304: on Spanish and Catalan pages the footer says nothing in English", async ({ page }) => {
  for (const url of ["/es/", "/es/privacy/", "/ca/", "/ca/delete-account/"]) {
    await page.goto(url);
    await hydrated(page);
    const said = await page.locator("footer").evaluate((footer) => {
      const found = [footer.textContent ?? ""];
      for (const element of [footer, ...Array.from(footer.querySelectorAll("*"))])
        for (const name of ["aria-label", "title", "alt"]) {
          const value = element.getAttribute(name);
          if (value) found.push(value);
        }
      return found.join(" \n ");
    });
    for (const words of ENGLISH_FOOTER) expect(said, `${url}: “${words}”`).not.toContain(words);
  }
});

test("WEB-304: the footer's links keep the page's language, with its labels and names", async ({ page }) => {
  for (const language of LANGUAGES)
    for (const url of [homeUrl(language), pageUrl(language, "privacy"), pageUrl(language, "delete-account")]) {
      await page.goto(url);
      await hydrated(page);
      const footer = page.locator("footer");
      await expect(
        footer.getByRole("navigation", { name: FOOTER.navigation[language], exact: true }).getByRole("link"),
        url,
      ).toHaveText([FRAME.voice[language], FRAME.features[language], FRAME.questions[language]]);
      const legal = footer.getByRole("navigation", { name: FOOTER.legal[language], exact: true });
      for (const { page: name, name: label } of FOOTER.links)
        await expect(legal.getByRole("link", { name: label[language], exact: true }), url).toHaveAttribute(
          "href",
          pageUrl(language, name),
        );
      await expect(
        legal.getByRole("link", { name: FOOTER.support[language], exact: true }),
        url,
      ).toHaveAttribute("href", "mailto:taskflow.support@garbar.tech");
      // Every link but the email and the switch's other languages stays in this language.
      const hrefs = await footer.locator("a[href]").evaluateAll(
        (anchors, language) =>
          anchors
            .filter((a) => !a.getAttribute("href")!.startsWith("mailto:"))
            .filter((a) => !a.hasAttribute("hreflang") || a.getAttribute("hreflang") === language)
            .map((a) => new URL(a.getAttribute("href")!, location.href).pathname),
        language,
      );
      expect(hrefs.length, url).toBeGreaterThan(8);
      for (const href of hrefs)
        if (language === "en") expect(href, url).not.toMatch(/^\/(es|ca)\//);
        else expect(href.startsWith(`/${language}/`), `${url}: ${href}`).toBe(true);
    }
});

test("WEB-2: the footer has the language switch, each name in its own language, the current one marked", async ({
  page,
}) => {
  for (const [url, language] of [
    ["/", "en"],
    ["/es/privacy/", "es"],
    ["/ca/delete-account/", "ca"],
  ] as [string, Language][]) {
    await page.goto(url);
    await hydrated(page);
    const switcher = page
      .locator("footer")
      .getByRole("group", { name: FRAME.language[language], exact: true });
    await expect(switcher.getByRole("link"), url).toHaveText(LANGUAGES.map((code) => LANGUAGE_NAMES[code]));
    for (const code of LANGUAGES) {
      const link = switcher.getByRole("link", { name: LANGUAGE_NAMES[code], exact: true });
      await expect(link, `${url} ${code}`).toHaveAttribute("lang", code);
      await expect(link, `${url} ${code}`).toHaveAttribute("hreflang", code);
      if (code === language) await expect(link, `${url} ${code}`).toHaveAttribute("aria-current", "page");
      else await expect(link, `${url} ${code}`).not.toHaveAttribute("aria-current", /.*/);
    }
  }
});

test("WEB-4: no footer link points at #demo", async ({ page }) => {
  for (const { url } of ALL_PAGES) {
    await page.goto(url);
    const demo = await page
      .locator("footer a[href]")
      .evaluateAll((anchors) => anchors.filter((a) => a.getAttribute("href")!.includes("#demo")).length);
    expect(demo, url).toBe(0);
  }
});

test("WEB-704: every page shows the trademark line in its language", async ({ page }) => {
  for (const { url, language } of ALL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    await expect(page.locator("footer").getByText(FOOTER.trademark[language], { exact: true }), url).toBeVisible();
  }
});

test("WEB-703, WEB-309: on a phone, Back to top and the legal links are 44 × 44 px or more and 8 px apart", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Measured on the phone (390 × 664).");
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    const footer = page.locator("footer");
    const back = footer.getByRole("link", { name: FOOTER.backToTop[language], exact: true });
    await expect(back, url).toHaveCount(1);
    await expect(back, url).toHaveAccessibleName(FOOTER.backToTop[language]);
    await back.scrollIntoViewIfNeeded();
    const backBox = (await back.boundingBox())!;
    expect(backBox.width, `${url}: Back to top's width`).toBeGreaterThanOrEqual(44);
    expect(backBox.height, `${url}: Back to top's height`).toBeGreaterThanOrEqual(44);
    const legal = footer.getByRole("navigation", { name: FOOTER.legal[language], exact: true });
    const boxes = await legal.getByRole("link").evaluateAll((anchors) =>
      anchors.map((a) => {
        const { left, top, right, bottom, width, height } = a.getBoundingClientRect();
        return { name: a.textContent?.trim() ?? "", left, top, right, bottom, width, height };
      }),
    );
    expect(boxes, url).toHaveLength(5);
    for (const box of boxes) {
      expect(box.width, `${url}: “${box.name}” width`).toBeGreaterThanOrEqual(44);
      expect(box.height, `${url}: “${box.name}” height`).toBeGreaterThanOrEqual(44);
    }
    for (const [i, a] of boxes.entries())
      for (const b of boxes.slice(i + 1)) {
        const dx = Math.max(b.left - a.right, a.left - b.right);
        const dy = Math.max(b.top - a.bottom, a.top - b.bottom);
        expect(Math.max(dx, dy), `${url}: “${a.name}” to “${b.name}”`).toBeGreaterThanOrEqual(8 - 0.5);
      }
  }
});

test("WEB-309: no footer text is under 12 px, and the operator line grows with the browser's text size", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await hydrated(page);
    const smallest = await smallestText(page, "footer");
    expect(smallest!.size, `${homeUrl(language)}: “${smallest!.text}”`).toBeGreaterThanOrEqual(12);
    await expect(page.locator("footer").getByText(FOOTER.operator[language]), homeUrl(language)).toBeVisible();
  }
  const operator = page.locator("footer").getByText(FOOTER.operator.en);
  await page.goto("/");
  const size = () => operator.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  const before = await size();
  // text200: the browser's default font size from 16 to 32 px, as the renders do it.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Page.setFontSizes", { fontSizes: { standard: 32, fixed: 26 } });
  await expect.poll(size, "the operator line at 200% text").toBeGreaterThan(before * 1.5);
});

for (const theme of THEMES) {
  test.describe(`${theme} frame`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-2, WEB-304, WEB-313, WEB-703: axe reports no violations on the frame's pages (${theme})`, async ({
      page,
    }) => {
      for (const url of ["/", "/es/privacy/", "/ca/", "/ca/delete-account/"]) {
        await page.goto(url);
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(await axeViolations(page), url).toEqual([]);
      }
    });
  });
}

// Round 2, WP38: the 404 preloads the same font file as every other page.
const MISSING = LANGUAGES.map((language) => ({ language, url: `${homeUrl(language)}ux-renders-missing-page/` }));
const FONT_FILE = /\.(woff2?|ttf|otf)$/;

// The <link rel="preload" as="font"> tags in the response's <head>, as the server sent them.
function fontPreloads(html: string) {
  const head = html.split("</head>")[0];
  return Array.from(head.matchAll(/<link\b[^>]*>/gi))
    .map(([tag]) => tag)
    .filter((tag) => /\brel="preload"/i.test(tag) && /\bas="font"/i.test(tag))
    .map((tag) => ({
      href: /\bhref="([^"]*)"/i.exec(tag)?.[1] ?? null,
      type: /\btype="([^"]*)"/i.exec(tag)?.[1] ?? null,
      crossorigin: /\scrossorigin(=|\s|\/|>)/i.test(tag),
    }));
}
async function homeFont(request: APIRequestContext) {
  const response = await request.get("/");
  expect(response.status(), "/").toBe(200);
  const preloads = fontPreloads(await response.text());
  expect(preloads, "/: font preloads in <head>").toHaveLength(1);
  return preloads[0].href!;
}

test("WEB-713: each 404's head holds exactly one woff2 font preload, with crossorigin, the same as the home's", async ({
  request,
}) => {
  const href = await homeFont(request);
  expect(href).toMatch(/^\/_next\/static\/media\/[^/]+\.woff2$/);
  for (const { url } of MISSING) {
    const response = await request.get(url);
    expect(response.status(), url).toBe(404);
    expect(fontPreloads(await response.text()), `${url}: font preloads in <head>`).toEqual([
      { href, type: "font/woff2", crossorigin: true },
    ]);
  }
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    const response = await request.get(url);
    expect(response.status(), url).toBe(200);
    expect(fontPreloads(await response.text()), `${url}: font preloads in <head>`).toEqual([
      { href, type: "font/woff2", crossorigin: true },
    ]);
  }
});

// One test for each address, so each starts with an empty cache.
for (const { url, notFound } of [
  ...MISSING.map(({ url }) => ({ url, notFound: true })),
  ...LANGUAGES.map((language) => ({ url: homeUrl(language), notFound: false })),
])
  test(`WEB-713: ${url} downloads one font file, the home's${notFound ? ", through its preload" : ""}, and no TTF`, async ({
    page,
    request,
  }) => {
    const href = await homeFont(request);
    const fonts: string[] = [];
    page.on("request", (sent) => {
      const { pathname } = new URL(sent.url());
      if (sent.resourceType() === "font" || FONT_FILE.test(pathname)) fonts.push(pathname);
    });
    const response = await page.goto(url);
    expect(response?.status(), url).toBe(notFound ? 404 : 200);
    await hydrated(page);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    expect(fonts, `${url}: font requests`).toEqual([href]);
    if (!notFound) return;
    const timings = await page.evaluate((pattern) => {
      const font = new RegExp(pattern);
      return performance
        .getEntriesByType("resource")
        .map((entry) => ({
          path: new URL(entry.name).pathname,
          initiator: (entry as PerformanceResourceTiming).initiatorType,
        }))
        .filter(({ path }) => font.test(path));
    }, FONT_FILE.source);
    expect(timings, `${url}: font resource timings`).toEqual([{ path: href, initiator: "link" }]);
  });

for (const theme of THEMES) {
  test.describe(`${theme} 404, WP38`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-713: each 404's h1 is in the address's language, and axe reports no violations (${theme})`, async ({
      page,
    }) => {
      for (const { language, url } of MISSING) {
        const response = await page.goto(url);
        expect(response?.status(), url).toBe(404);
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.getByRole("heading", { level: 1 }), url).toHaveText(NOT_FOUND.heading[language]);
        expect(await axeViolations(page), url).toEqual([]);
      }
    });
  });
}

// ---- Run 2026-10-28-site: WP73 (WEB-1605, WEB-1607, WEB-1609) ----
// The footer names the Privacy Policy in full and at body size, each 404's tab title is in
// the address's language, and no line ends with a lone «LLC.» or ‘website.’. axe on the
// three homes, light and dark: ux-web-home.spec.ts, “WEB-6, WEB-19, WEB-707, WEB-705,
// WEB-706: axe reports no violations on the three homes”; on the three 404s: the WP38
// test above, “WEB-713: each 404's h1 is in the address's language, and axe reports no
// violations”.

const WP73_PRIVACY: Record<Language, string> = {
  en: "Privacy Policy",
  es: "Política de privacidad",
  ca: "Política de privacitat",
};
const WP73_MISSING = (language: Language) => `${homeUrl(language)}no-such-page/`;

for (const theme of THEMES) {
  test.describe(`${theme} footer, WP73`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-1605: on the homes, the privacy pages and the 404s, the first legal link is the Privacy Policy by the page's own title, at 16 px, and the fine print stays 14 px (${theme})`, async ({
      page,
    }) => {
      const titles = {} as Record<Language, string>;
      for (const language of LANGUAGES) {
        // The page's own title is its tab title's first part: “Privacy Policy — TaskFlow”.
        await page.goto(pageUrl(language, "privacy"));
        titles[language] = (await page.title()).split(" — ")[0];
        expect(titles[language], `${pageUrl(language, "privacy")}: the page's title`).toBe(WP73_PRIVACY[language]);
      }
      for (const language of LANGUAGES)
        for (const url of [homeUrl(language), pageUrl(language, "privacy"), WP73_MISSING(language)]) {
          await page.goto(url);
          await hydrated(page);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          const footer = page.locator("footer");
          const legal = footer.getByRole("navigation", { name: FOOTER.legal[language], exact: true });
          const first = legal.getByRole("link").first();
          await expect(first, url).toHaveText(WP73_PRIVACY[language]);
          await expect(first, url).toHaveText(titles[language]);
          await expect(first, url).toHaveAttribute("href", pageUrl(language, "privacy"));
          const sizes = await legal
            .getByRole("link")
            .evaluateAll((anchors) =>
              anchors.map((a) => `${a.textContent?.trim()}: ${getComputedStyle(a).fontSize}`),
            );
          expect(sizes, url).toHaveLength(5);
          for (const size of sizes) expect(size, url).toMatch(/: 16px$/);
          const fine = await footer
            .locator(".footer-operator, .footer-fine p")
            .evaluateAll((lines) =>
              lines.map((line) => `${line.textContent?.trim()}: ${getComputedStyle(line).fontSize}`),
            );
          expect(fine, `${url}: operator, © and trademark`).toHaveLength(3);
          for (const size of fine) expect(size, url).toMatch(/: 14px$/);
        }
    });
  });
}

test("WEB-1605: at 320 × 568 the footer's legal row wraps, its links stay 44 px tall and 8 px apart, and nothing scrolls sideways", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    await page.evaluate(() => document.fonts.ready);
    const legal = page.locator("footer").getByRole("navigation", { name: FOOTER.legal[language], exact: true });
    await legal.scrollIntoViewIfNeeded();
    const boxes = await legal.getByRole("link").evaluateAll((anchors) =>
      anchors.map((a) => {
        const { left, top, right, bottom, height } = a.getBoundingClientRect();
        return { name: a.textContent?.trim() ?? "", left, top, right, bottom, height };
      }),
    );
    expect(boxes, url).toHaveLength(5);
    expect(new Set(boxes.map((box) => Math.round(box.top))).size, `${url}: rows of legal links`).toBeGreaterThan(1);
    for (const box of boxes) {
      expect(box.height, `${url}: “${box.name}” height`).toBeGreaterThanOrEqual(44);
      expect(box.right, `${url}: “${box.name}” right edge`).toBeLessThanOrEqual(320);
    }
    for (const [i, a] of boxes.entries())
      for (const b of boxes.slice(i + 1)) {
        const dx = Math.max(b.left - a.right, a.left - b.right);
        const dy = Math.max(b.top - a.bottom, a.top - b.bottom);
        expect(Math.max(dx, dy), `${url}: “${a.name}” to “${b.name}”`).toBeGreaterThanOrEqual(8 - 0.5);
      }
    expect(await scrollsSideways(page), `${url} scrolls sideways at 320 px`).toBe(false);
  }
});

test("WEB-1607: with JavaScript, each 404's tab title is in the address's language alone", async ({ page }) => {
  for (const [url, title] of [
    ["/ca/no-such-page/", "No hem trobat aquesta pàgina — TaskFlow"],
    ["/es/x/", "Página no encontrada — TaskFlow"],
    ["/x/", "Page not found — TaskFlow"],
  ]) {
    const response = await page.goto(url);
    expect(response?.status(), url).toBe(404);
    await hydrated(page);
    await expect(page, url).toHaveTitle(title);
  }
});

test("WEB-1607: without JavaScript, each 404 keeps the three-language title, with the Catalan h1's words", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const origin = new URL(baseURL!).origin;
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
  const page = await context.newPage();
  for (const url of ["/ca/no-such-page/", "/es/x/", "/x/"]) {
    const response = await page.goto(url);
    expect(response?.status(), url).toBe(404);
    await expect(page, url).toHaveTitle(
      "Page not found · Página no encontrada · No hem trobat aquesta pàgina — TaskFlow",
    );
  }
  await context.close();
});

test("WEB-1609: at 320 px ‘Google LLC.’ stays on one line in the footer, in every language", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    await page.evaluate(() => document.fonts.ready);
    const trademark = page.locator("footer .footer-fine p").filter({ hasText: "Android" });
    await expect(trademark, url).toHaveCount(1);
    const result = await trademark.evaluate((line) => {
      const node = Array.from(line.childNodes).find((child) => child.textContent?.includes("Google"))!;
      const text = node.textContent ?? "";
      const start = text.indexOf("Google");
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, text.length);
      const tops = Array.from(range.getClientRects())
        .filter((rect) => rect.width > 0)
        .map((rect) => Math.round(rect.top));
      return { phrase: JSON.stringify(text.slice(start)), lines: new Set(tops).size };
    });
    expect(result.phrase, url).toBe(JSON.stringify("Google LLC."));
    expect(result.lines, `${url}: lines that ‘Google LLC.’ spans`).toBe(1);
  }
});

test("WEB-1609: on the English 404 at 390 px the paragraph's last line holds two words or more", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  const response = await page.goto("/x/");
  expect(response?.status()).toBe(404);
  await hydrated(page);
  await page.evaluate(() => document.fonts.ready);
  const paragraph = page.locator('.not-found-block[lang="en"] p');
  await expect(paragraph).toHaveText(NOT_FOUND.body.en);
  const lines = await paragraph.evaluate((element) => {
    const node = element.firstChild!;
    const text = node.textContent ?? "";
    const words: { word: string; top: number }[] = [];
    for (const match of text.matchAll(/\S+/g)) {
      const range = document.createRange();
      range.setStart(node, match.index!);
      range.setEnd(node, match.index! + match[0].length);
      words.push({ word: match[0], top: Math.round(range.getClientRects()[0].top) });
    }
    const byLine = new Map<number, string[]>();
    for (const { word, top } of words) byLine.set(top, [...(byLine.get(top) ?? []), word]);
    return [...byLine.entries()].sort(([a], [b]) => a - b).map(([, line]) => line);
  });
  expect(lines.at(-1)!.length, `last line: “${lines.at(-1)!.join(" ")}” of ${JSON.stringify(lines)}`).toBeGreaterThanOrEqual(2);
});

test("WEB-1609: the footer's fine print and the 404's paragraphs compute text-wrap: pretty", async ({ page }) => {
  const wraps = (selector: string) =>
    page.locator(selector).evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return `${style.getPropertyValue("text-wrap-style") || style.getPropertyValue("text-wrap")}`;
      }),
    );
  await page.goto("/es/");
  await hydrated(page);
  const fine = await wraps("footer .footer-fine p");
  expect(fine, "/es/: .footer-fine p").toHaveLength(2);
  for (const wrap of fine) expect(wrap, "/es/: .footer-fine p").toMatch(/pretty/);
  for (const language of LANGUAGES) {
    const url = WP73_MISSING(language);
    await page.goto(url);
    await hydrated(page);
    const paragraphs = await wraps(".not-found p");
    expect(paragraphs, `${url}: .not-found p`).toHaveLength(3);
    for (const wrap of paragraphs) expect(wrap, `${url}: .not-found p`).toMatch(/pretty/);
  }
});

// ---- Run 2026-10-28-site: WP267 (WEB-1614) ----
// The footer's own links (‘Try it with your voice’, Features, Questions) are as large as the
// legal row under them: 16 px at weight 650, while the operator, © and trademark lines stay
// 14 px. Measured on the three homes at 1440 × 1000 (desktop), 390 × 664 and 320 × 568
// (mobile), light and dark. axe on the three homes, light and dark: ux-web-home.spec.ts,
// “WEB-6, WEB-19, WEB-707, WEB-705, WEB-706: axe reports no violations on the three homes”.

const WP267_SIZES = (project: string) =>
  project === "desktop"
    ? [{ width: 1440, height: 1000 }]
    : [
        { width: 390, height: 664 },
        { width: 320, height: 568 },
      ];

for (const theme of THEMES) {
  test.describe(`${theme} footer, WP267`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1614: on the three homes the footer's site links are 16 px at weight 650, no smaller than the legal row, and the fine print stays 14 px (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const size of WP267_SIZES(testInfo.project.name))
        for (const language of LANGUAGES) {
          await page.setViewportSize(size);
          const url = homeUrl(language);
          const where = `${url} at ${size.width} × ${size.height}`;
          await page.goto(url);
          await hydrated(page);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          const footer = page.locator("footer");
          const style = (anchors: Element[]) =>
            anchors.map((a) => {
              const computed = getComputedStyle(a);
              return {
                name: a.textContent?.trim() ?? "",
                size: parseFloat(computed.fontSize),
                weight: computed.fontWeight,
              };
            });
          const site = await footer
            .getByRole("navigation", { name: FOOTER.navigation[language], exact: true })
            .getByRole("link")
            .evaluateAll(style);
          const legal = await footer
            .getByRole("navigation", { name: FOOTER.legal[language], exact: true })
            .getByRole("link")
            .evaluateAll(style);
          expect(site, `${where}: the footer's site links`).toHaveLength(3);
          expect(legal, `${where}: the legal links`).toHaveLength(5);
          for (const link of site) {
            expect(link.size, `${where}: “${link.name}” font size`).toBe(16);
            expect(link.weight, `${where}: “${link.name}” font weight`).toBe("650");
          }
          for (const link of legal) expect(link.size, `${where}: “${link.name}” font size`).toBe(16);
          expect(
            Math.min(...site.map((link) => link.size)),
            `${where}: the smallest site link against the largest legal link`,
          ).toBeGreaterThanOrEqual(Math.max(...legal.map((link) => link.size)));
          const fine = await footer
            .locator(".footer-operator, .footer-fine p")
            .evaluateAll((lines) =>
              lines.map((line) => `${line.textContent?.trim()}: ${getComputedStyle(line).fontSize}`),
            );
          expect(fine, `${where}: operator, © and trademark`).toHaveLength(3);
          for (const line of fine) expect(line, where).toMatch(/: 14px$/);
        }
    });

    test(`WEB-1614: on the three homes nothing scrolls sideways and every footer link is 44 × 44 px or more (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const size of WP267_SIZES(testInfo.project.name))
        for (const language of LANGUAGES) {
          await page.setViewportSize(size);
          const url = homeUrl(language);
          const where = `${url} at ${size.width} × ${size.height}`;
          await page.goto(url);
          await hydrated(page);
          await page.evaluate(() => document.fonts.ready);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          const footer = page.locator("footer");
          await footer.scrollIntoViewIfNeeded();
          const boxes = await footer.locator("a[href]").evaluateAll((anchors) =>
            anchors
              .filter((a) => a.getClientRects().length > 0 && getComputedStyle(a).visibility !== "hidden")
              .map((a) => {
                const { width, height } = a.getBoundingClientRect();
                return {
                  name: a.getAttribute("aria-label") || a.textContent?.trim() || a.getAttribute("href") || "",
                  width,
                  height,
                };
              }),
          );
          // The brand, three site links, five legal links, three languages and Back to top.
          expect(boxes.length, `${where}: footer links`).toBeGreaterThanOrEqual(13);
          for (const box of boxes) {
            expect(box.width, `${where}: “${box.name}” width`).toBeGreaterThanOrEqual(44);
            expect(box.height, `${where}: “${box.name}” height`).toBeGreaterThanOrEqual(44);
          }
          expect(await scrollsSideways(page), `${where} scrolls sideways`).toBe(false);
          const overflow = await page.evaluate(() => ({
            scroll: document.documentElement.scrollWidth,
            client: document.documentElement.clientWidth,
          }));
          expect(overflow.scroll, `${where}: scrollWidth against clientWidth`).toBeLessThanOrEqual(overflow.client);
        }
    });
  });
}
