// Acceptance tests for the legal pages from the UX web loop, run 2026-10-18-site, that prove
// held changes (src/content/legal/ is the other session's untracked work): WP33's privacy §8.
// This file stays uncommitted with it. Round 1 adds WP24 (the legal pages keep the
// visitor's language) and WP25's checks on the legal pages; round 2 adds WP41 (the back
// link's arrow grows with its label). Batch 4, round 1 adds WP30 (each page names its
// document, readable text, plain labels, link previews), WP31 (privacy and terms say what
// the app and the site do today) and WP32 (the delete page). Batch 5 adds WP47 (suggested
// tasks and limits, not drafts, allowances or transcripts). See tests/support/ux-web.ts.
import { test as plain, type Page } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { ca as siteCa } from "../src/content/site/ca";
import { en as siteEn } from "../src/content/site/en";
import { es as siteEs } from "../src/content/site/es";
import {
  axeViolations,
  contrast,
  doubleTextSize,
  expect,
  homeUrl,
  hydrated,
  parseColor,
  ROOT,
  rootFontSize,
  scrollsSideways,
  test,
  textUnder,
  THEMES,
} from "./support/ux-web";

// The exact first paragraph of §8 the plan gives (WP33): today's sentences, words removed.
const FIRST_PARAGRAPH = {
  "/privacy/":
    "Live demo: we don’t keep your recording. The text and the tasks found in it are kept encrypted for up to 24 hours, so trying again doesn’t use another try, and are then deleted automatically. The live demo sends your recording or text to Google only when you tap Done, or when a recording reaches its one-minute limit. Nothing from it is saved to an app account.",
  "/es/privacy/":
    "Demo en directo: no guardamos tu grabación. El texto y las tareas encontradas se guardan cifrados hasta 24 horas, para que volver a probar no gaste otro intento, y después se borran automáticamente. La demo en directo envía tu grabación o tu texto a Google solo cuando tocas Listo, o cuando una grabación llega a su límite de un minuto. Nada de ella se guarda en una cuenta de la app.",
  "/ca/privacy/":
    "Demo en directe: no desem la gravació. El text i les tasques trobades es desen xifrats fins a 24 hores, perquè tornar-ho a provar no gasti un altre intent, i després s’esborren automàticament. La demo en directe envia la gravació o el text a Google només quan toques Fet, o quan una gravació arriba al seu límit d’un minut. Res d’ella es desa en un compte de l’app.",
};
const GONE = ["walkthrough", "recorrido", "recorregut", "separate live demo", "en vivo independiente"];

test("WEB-6: privacy §8 no longer mentions the removed walkthrough, in every language", async ({ page }) => {
  for (const [url, paragraph] of Object.entries(FIRST_PARAGRAPH)) {
    await page.goto(url);
    const section = page.locator("section", {
      has: page.getByRole("heading", { level: 2, name: /^8\./ }),
    });
    await expect(section, url).toHaveCount(1);
    await expect(section.locator("p").first(), url).toHaveText(paragraph);
    const text = ((await section.textContent()) ?? "").toLowerCase();
    for (const words of GONE) expect(text, `${url} §8: “${words}”`).not.toContain(words);
  }
});

for (const theme of THEMES) {
  test.describe(theme, () => {
    test.use({ colorScheme: theme });
    test(`WEB-6: axe reports no violations on /privacy/ (${theme})`, async ({ page }) => {
      await page.goto("/privacy/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(await axeViolations(page)).toEqual([]);
    });
  });
}

// Run 2026-10-18-site, round 1: WP24 (the legal pages keep the visitor's language) and
// WP25's checks on the legal pages (type, 200% text, 320 px, logos, axe).
// The legal content (src/content/legal/) imports company.json, which Playwright's loader
// can't import without an import attribute, so the paths and labels are written here.
type Language = "en" | "es" | "ca";
const languages: Language[] = ["en", "es", "ca"];
const documents = ["privacy", "terms", "legal", "delete-account"] as const;
const legalPath = (document: string, language: Language) =>
  `${language === "en" ? "" : `/${language}`}/${document}/`;
// ui.back (unchanged by WP24) and ui.language, the switch's accessible name.
const ui: Record<Language, { back: string; language: string }> = {
  en: { back: "Back to TaskFlow", language: "Document language" },
  es: { back: "Volver a TaskFlow", language: "Idioma del documento" },
  ca: { back: "Tornar a TaskFlow", language: "Idioma del document" },
};
const LEGAL_PAGES = languages.flatMap((language) =>
  documents.map((document) => ({ language, document, url: legalPath(document, language) })),
);
const languageSwitch = (page: Page, language: Language) =>
  page.getByRole("main").getByRole("navigation", { name: ui[language].language, exact: true });
// Run 2026-10-28-site, WP65 (WEB-1504): above the header's phone-menu breakpoint (64em) the
// page's pill is hidden, the header's switch being the one; at 200% text the desktop header
// shows Menu and the pill is back. So a test of the pill doubles the desktop's text.
const showThePill = async (page: Page, project: string) => {
  if (project === "desktop") await doubleTextSize(page);
};

test("WEB-2: each legal page's back link goes to the home in the page's language", async ({ page }) => {
  for (const { language, document, url } of LEGAL_PAGES) {
    await page.goto(url);
    const back = page.getByRole("main").getByRole("link", { name: ui[language].back, exact: true });
    // WP65 (WEB-1501): the delete page's top row holds the language switch instead; the logo
    // and the footer lead home.
    if (document === "delete-account") {
      await expect(back, url).toHaveCount(0);
      continue;
    }
    await expect(back, url).toHaveCount(1);
    expect(new URL((await back.getAttribute("href"))!, page.url()).pathname, url).toBe(homeUrl(language));
    // The arrow is an icon hidden from screen readers, not a ‘←’ glyph.
    expect(await back.textContent(), url).not.toMatch(/[←↗↑]/);
    await expect(back.locator("svg"), url).toHaveAttribute("aria-hidden", "true");
  }
  // Followed: /es/privacy/ to /es/, /ca/terms/ to /ca/, /legal/ to /.
  for (const [url, home] of [
    ["/es/privacy/", "/es/"],
    ["/ca/terms/", "/ca/"],
    ["/legal/", "/"],
  ] as const) {
    await page.goto(url);
    const language = (home === "/" ? "en" : home.slice(1, 3)) as Language;
    await page.getByRole("main").getByRole("link", { name: ui[language].back, exact: true }).click();
    await expect(page, url).toHaveURL(new RegExp(`${home.replace(/\//g, "\\/")}$`));
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} legal language switch`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-208: on every legal page the switch marks the current language with aria-current, weight 800 and a 3:1 inset ring, and links to the same document (${theme})`, async ({
      page,
    }, testInfo) => {
      await showThePill(page, testInfo.project.name);
      for (const { language, document, url } of LEGAL_PAGES) {
        await page.goto(url);
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const links = languageSwitch(page, language).getByRole("link");
        await expect(links, url).toHaveCount(3);
        for (const [i, other] of languages.entries()) {
          const link = links.nth(i);
          expect(new URL((await link.getAttribute("href"))!, page.url()).pathname, `${url} → ${other}`).toBe(
            legalPath(document, other),
          );
          if (other !== language) await expect(link, `${url}: ${other}`).not.toHaveAttribute("aria-current", /.+/);
        }
        const current = languageSwitch(page, language).locator('a[aria-current="page"]');
        await expect(current, url).toHaveCount(1);
        await expect(current, url).toHaveAttribute("hreflang", language);
        const look = await current.evaluate((link) => {
          const style = getComputedStyle(link);
          let background = "rgba(0, 0, 0, 0)";
          for (let e: Element | null = link; e; e = e.parentElement) {
            const fill = getComputedStyle(e).backgroundColor;
            if (fill !== "rgba(0, 0, 0, 0)" && fill !== "transparent") {
              background = fill;
              break;
            }
          }
          return { weight: style.fontWeight, shadow: style.boxShadow, background };
        });
        expect(look.weight, `${url}: font weight`).toBe("800");
        expect(look.shadow, `${url}: box-shadow`).toContain("inset");
        const ring = /rgba?\([^)]+\)/.exec(look.shadow)?.[0];
        expect(ring, `${url}: the ring's colour`).toBeDefined();
        expect(contrast(parseColor(ring!), parseColor(look.background)), `${url}: the ring (${ring}) on ${look.background}`).toBeGreaterThanOrEqual(3);
      }
    });
  });
}

test("WEB-2, WEB-208: choosing Català on /privacy/ lands on /ca/privacy/ and remembers it for the bare address", async ({
  page,
  context,
}, testInfo) => {
  await showThePill(page, testInfo.project.name);
  await page.goto("/privacy/");
  await hydrated(page);
  await languageSwitch(page, "en").getByRole("link", { name: "Català", exact: true }).click();
  await expect(page).toHaveURL(/\/ca\/privacy\/$/);
  const cookie = (await context.cookies()).find((entry) => entry.name === "taskflow-lang");
  expect(cookie?.value).toBe("ca");
  expect(cookie?.path).toBe("/");
  const response = await page.request.get("/", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toMatch(/\/ca\/$/);
});

plain("WEB-2: with SITE_INDEXABLE=true and SITE_URL set, the sitemap lists /, /es/ and /ca/", async () => {
  const saved = { indexable: process.env.SITE_INDEXABLE, url: process.env.SITE_URL };
  process.env.SITE_INDEXABLE = "true";
  process.env.SITE_URL = "https://taskflow.garbar.tech";
  // Lets the sitemap's import of src/content/legal/company.json load as JSON.
  const hooks = registerHooks({
    load: (url, context, next) =>
      next(url, url.endsWith(".json") ? { ...context, importAttributes: { type: "json" } } : context),
  });
  try {
    const { default: sitemap } = await import("../src/app/sitemap");
    const urls = sitemap().map((entry) => entry.url);
    for (const path of ["/", "/es/", "/ca/"]) expect(urls, path).toContain(`https://taskflow.garbar.tech${path}`);
    expect(urls.slice(0, 3)).toEqual(["/", "/es/", "/ca/"].map((path) => `https://taskflow.garbar.tech${path}`));
  } finally {
    hooks.deregister();
    if (saved.indexable === undefined) delete process.env.SITE_INDEXABLE;
    else process.env.SITE_INDEXABLE = saved.indexable;
    if (saved.url === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = saved.url;
  }
});

// Visible elements that reach past the viewport's left or right edge.
const pastTheEdge = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((elements) =>
    elements
      .filter((element) => element.checkVisibility())
      .map((element) => ({
        what: `${element.tagName.toLowerCase()}.${[...element.classList].join(".")} “${(element.textContent ?? "").trim().slice(0, 30)}”`,
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
      }))
      .filter(({ left, right }) => left < -0.5 || right > window.innerWidth + 0.5),
  );

for (const [name, width, doubled] of [
  ["at 320 px wide", 320, false],
  ["on a 390 px phone with the browser's text at 200%", 390, true],
  ["at 320 px wide with the browser's text at 200%", 320, true],
] as const) {
  test(`WEB-208, WEB-309: ${name}, the legal pages' language switch wraps and nothing scrolls sideways`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Phone sizes.");
    await page.setViewportSize({ width, height: 800 });
    if (doubled) await doubleTextSize(page);
    for (const { language, url } of LEGAL_PAGES) {
      await page.goto(url);
      await hydrated(page);
      await page.evaluate(() => document.fonts.ready);
      if (doubled) expect(await rootFontSize(page), `${url}: the root at 200%`).toBe(32);
      const pill = languageSwitch(page, language);
      await expect(pill, url).toHaveCSS("flex-wrap", "wrap");
      expect(await scrollsSideways(page), `${url}: sideways scroll`).toBe(false);
      expect(
        await pastTheEdge(page, "header.site-header, header .header-inner > *, main .legal-utility, main .legal-languages a, footer .language-switch a"),
        `${url}: past the edge`,
      ).toEqual([]);
    }
  });
}

test("WEB-8: on the legal pages no visible text outside the legal article is under 12 px", async ({ page }, testInfo) => {
  for (const { url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    await page.evaluate(() => document.fonts.ready);
    expect(await textUnder(page, 12, ["article.legal-page"]), `${url} (${testInfo.project.name})`).toEqual([]);
  }
});

// The frame's text on a legal page: the header, the back link, the language switch, the footer.
// Hidden links count too (at 200% the desktop header folds its nav into Menu), so the same
// links are compared before and after.
const FRAME_TEXT = "header.site-header a, main .legal-utility a, footer a";
const frameSizes = (page: Page) =>
  page.locator(FRAME_TEXT).evaluateAll((links) =>
    links
      .filter((link) => (link.textContent ?? "").trim())
      .map((link) => ({
        text: (link.textContent ?? "").trim().slice(0, 30),
        size: parseFloat(getComputedStyle(link).fontSize),
      })),
  );

test("WEB-8, WEB-309: on the legal pages the back link and the language switch are 12 px or more, and the frame's text grows with the browser's text size", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Once is enough: the CSS is the same on both projects.");
  const before: Record<string, { body: number; links: { text: string; size: number }[] }> = {};
  for (const { document, url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    const links = await frameSizes(page);
    const utility = await page
      .locator("main .legal-utility a")
      .evaluateAll((elements) => elements.map((element) => parseFloat(getComputedStyle(element).fontSize)));
    // WP65 (WEB-1501): the delete page's top row has the switch's three links and no back link.
    expect(utility.length, `${url}: the back link and the switch's links`).toBe(document === "delete-account" ? 3 : 4);
    for (const size of utility) expect(size, `${url}: back link or switch text`).toBeGreaterThanOrEqual(12);
    before[url] = { body: parseFloat(await page.locator("body").evaluate((body) => getComputedStyle(body).fontSize)), links };
  }
  await doubleTextSize(page);
  for (const { url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    expect(await rootFontSize(page), `${url}: the root at 200%`).toBe(32);
    const body = parseFloat(await page.locator("body").evaluate((element) => getComputedStyle(element).fontSize));
    expect(body, `${url}: body text at 200%`).toBeCloseTo(before[url].body * 2, 0);
    const after = await frameSizes(page);
    // The same links, in the same order, each larger than at 100%.
    expect(after.map(({ text }) => text), `${url}: the frame's links`).toEqual(before[url].links.map(({ text }) => text));
    const stayed = after.filter((link, i) => link.size <= before[url].links[i].size).map(({ text }) => text);
    expect(stayed, `${url}: frame text that didn't grow`).toEqual([]);
  }
});

test("WEB-703: on the legal pages the header and footer logos are 48 px tall or more", async ({ page }) => {
  for (const { url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    await page.evaluate(() => document.fonts.ready);
    for (const where of ["header.site-header", "footer"]) {
      const box = await page.locator(`${where} a.brand`).boundingBox();
      expect(box!.height, `${url}: ${where}'s logo height`).toBeGreaterThanOrEqual(48);
    }
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} legal pages axe`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-2, WEB-208, WEB-8, WEB-203, WEB-205, WEB-212, WEB-113, WEB-202, WEB-206: axe reports no violations on the 12 legal pages (${theme})`, async ({ page }) => {
      // Twelve pages and twelve axe runs take about 17 s alone, and more beside other workers.
      test.slow();
      for (const { url } of LEGAL_PAGES) {
        await page.goto(url);
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(await axeViolations(page), url).toEqual([]);
      }
    });
  });
}

// ---- Round 2, WP41: the back link's arrow grows with its label ----

const WP41_PAGES: { url: string; language: Language }[] = [
  { url: "/privacy/", language: "en" },
  { url: "/es/privacy/", language: "es" },
  // WP65 (WEB-1501): the delete pages have no back link now.
  { url: "/ca/terms/", language: "ca" },
];
// The back link's computed font size, and its arrow's rendered size.
const backArrow = (page: Page, language: Language) =>
  page
    .getByRole("main")
    .getByRole("link", { name: ui[language].back, exact: true })
    .evaluate((link) => {
      const svg = link.querySelector("svg")!;
      const { width, height } = svg.getBoundingClientRect();
      return { font: parseFloat(getComputedStyle(link).fontSize), width, height };
    });

for (const theme of THEMES) {
  test.describe(`${theme} WP41 back arrow`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-714: the legal back link's arrow is as wide and as tall as its label's text, at 100% and 200% text, and the link is named by its label alone (${theme})`, async ({
      page,
    }) => {
      for (const doubled of [false, true]) {
        if (doubled) await doubleTextSize(page);
        for (const { url, language } of WP41_PAGES) {
          const where = `${url}${doubled ? " at 200%" : ""}`;
          await page.goto(url);
          await hydrated(page);
          await expect(page.locator("html"), where).toHaveAttribute("data-theme", theme);
          if (doubled) await expect.poll(() => rootFontSize(page), { message: `${where}: the root` }).toBe(32);
          const back = page.getByRole("main").getByRole("link", { name: ui[language].back, exact: true });
          await expect(back, where).toHaveCount(1);
          await expect(back, where).toHaveAccessibleName(ui[language].back);
          await expect(back.locator("svg"), where).toHaveAttribute("aria-hidden", "true");
          const arrow = await backArrow(page, language);
          expect(Math.abs(arrow.width - arrow.font), `${where}: arrow width ${arrow.width} against ${arrow.font} px text`).toBeLessThanOrEqual(1);
          expect(Math.abs(arrow.height - arrow.font), `${where}: arrow height ${arrow.height} against ${arrow.font} px text`).toBeLessThanOrEqual(1);
          if (!doubled) expect(await axeViolations(page), where).toEqual([]);
        }
      }
    });
  });
}

// ---- Batch 4, round 1: WP30, WP31 and WP32 ----

type Copy = Record<Language, string>;
type Document = (typeof documents)[number];
const SITE = { en: siteEn, es: siteEs, ca: siteCa };
const flat = (text: string | null) => (text ?? "").replace(/\s+/g, " ").trim();
const COMPANY = JSON.parse(readFileSync(path.join(ROOT, "src", "content", "legal", "company.json"), "utf8")) as {
  version: string;
  commercialRegister: string;
};
// The legal content itself, loaded as the sitemap test loads it (company.json needs an import
// attribute), for the descriptions the pages carry in their metadata.
type LegalContent = typeof import("../src/content/legal");
let legalModule: Promise<LegalContent> | undefined;
function legalContent() {
  legalModule ??= (async () => {
    const hooks = registerHooks({
      load: (url, context, next) =>
        next(url, url.endsWith(".json") ? { ...context, importAttributes: { type: "json" } } : context),
    });
    try {
      return (await import("../src/content/legal")) as LegalContent;
    } finally {
      hooks.deregister();
    }
  })();
  return legalModule;
}
const article = (page: Page) => page.locator("article.legal-page");
const meta = (page: Page, key: string) =>
  page.locator(`head meta[property="${key}"], head meta[name="${key}"]`).first().getAttribute("content");
const fontsReady = (page: Page) => page.evaluate(() => document.fonts.ready.then(() => undefined));

// ---- WP30: each page names its document ----

// The plan's document names (WP30); the delete page's H1 is WP32's, unchanged by WP30.
const H1: Record<Document, Copy> = {
  privacy: {
    en: "TaskFlow Privacy Policy",
    es: "Política de privacidad de TaskFlow",
    ca: "Política de privacitat de TaskFlow",
  },
  terms: {
    en: "TaskFlow Terms and Conditions",
    es: "Términos y condiciones de TaskFlow",
    ca: "Termes i condicions de TaskFlow",
  },
  legal: {
    en: "Legal notice: the company behind TaskFlow",
    es: "Aviso legal: la empresa detrás de TaskFlow",
    ca: "Avís legal: l’empresa darrere de TaskFlow",
  },
  "delete-account": {
    en: "Delete your TaskFlow account.",
    es: "Elimina tu cuenta de TaskFlow.",
    ca: "Suprimeix el teu compte de TaskFlow.",
  },
};

test("WEB-203: each legal page's header names its document in an h1, with no eyebrow and no description under it; the description stays the meta description", async ({
  page,
}) => {
  const { copy } = await legalContent();
  for (const { language, document, url } of LEGAL_PAGES) {
    await page.goto(url);
    const hero = page.locator(".legal-hero");
    await expect(page.getByRole("heading", { level: 1 }), url).toHaveText(H1[document][language]);
    await expect(hero.locator(".eyebrow"), `${url}: eyebrow`).toHaveCount(0);
    await expect(hero.locator(".legal-description"), `${url}: description`).toHaveCount(0);
    const description = copy[language][document].description;
    expect(description.length, `${url}: the document's description`).toBeGreaterThan(10);
    expect(flat(await hero.innerText()), `${url}: the description in the header`).not.toContain(description);
    expect(await meta(page, "description"), `${url}: meta description`).toBe(description);
  }
});

// The privacy summary's first line (WP30).
const PRIVACY_FIRST_LINE: Copy = {
  en: "We don’t sell your data or show you ads.",
  es: "No vendemos tus datos ni te mostramos anuncios.",
  ca: "No venem les teves dades ni et mostrem anuncis.",
};

test("WEB-203: at 390 × 664, each privacy page shows its first privacy fact in the first screen, under an h1 that ends in the upper half", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "A phone's first screen.");
  await page.setViewportSize({ width: 390, height: 664 });
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    await hydrated(page);
    await fontsReady(page);
    const first = page.locator(".legal-summary li").first();
    await expect(first.locator("p"), url).toHaveText(PRIVACY_FIRST_LINE[language]);
    await expect(first, `${url}: the first line in the first screen`).toBeInViewport({ ratio: 1 });
    const h1 = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    expect(h1.y + h1.height, `${url}: where the h1 ends`).toBeLessThanOrEqual(664 / 2);
  }
});

// ---- WP30: readable text ----

test("WEB-205: legal body text is 16 px or more, at most 52ch wide, with no line over 80 characters at 1440 px", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Line length at 1440 px.");
  const long: { url: string; text: string; characters: number }[] = [];
  for (const { url } of LEGAL_PAGES) {
    await page.goto(url);
    await fontsReady(page);
    const blocks = await page.locator(".legal-body").evaluate((body) => {
      const range = document.createRange();
      return [...body.querySelectorAll("p, li")]
        .filter((element) => element.checkVisibility() && (element.textContent ?? "").trim())
        .map((element) => {
          // 52ch in the element's own font.
          const ruler = document.createElement("span");
          ruler.style.cssText = "position:absolute;visibility:hidden;width:52ch;";
          element.appendChild(ruler);
          const limit = ruler.getBoundingClientRect().width;
          ruler.remove();
          // The longest rendered line, in characters.
          let longest = 0;
          let current = 0;
          let top: number | null = null;
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            for (let i = 0; i < (node.textContent ?? "").length; i++) {
              range.setStart(node, i);
              range.setEnd(node, i + 1);
              const rect = range.getClientRects()[0];
              if (!rect) continue;
              if (top === null || rect.top > top + 4) {
                longest = Math.max(longest, current);
                current = 0;
                top = rect.top;
              }
              current++;
            }
          }
          longest = Math.max(longest, current);
          return {
            text: (element.textContent ?? "").trim().slice(0, 40),
            size: parseFloat(getComputedStyle(element).fontSize),
            width: element.getBoundingClientRect().width,
            limit,
            longest,
          };
        });
    });
    expect(blocks.length, url).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(block.size, `${url} “${block.text}”: font size`).toBeGreaterThanOrEqual(16);
      expect(block.width, `${url} “${block.text}”: width against 52ch (${block.limit} px)`).toBeLessThanOrEqual(block.limit + 1);
      if (block.longest > 80) long.push({ url, text: block.text, characters: block.longest });
    }
  }
  // Every block whose longest line is over 80 characters, on every page.
  expect(
    { blocks: long.length, longest: Math.max(0, ...long.map(({ characters }) => characters)), first: long.slice(0, 5) },
    "lines over 80 characters",
  ).toEqual({ blocks: 0, longest: 0, first: [] });
});

test("WEB-205: with the browser's text at 200%, legal body text doubles and nothing scrolls sideways on a 390 px phone", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "A 390 px phone.");
  const bodySize = () =>
    page.locator(".legal-body p").first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  const before: Record<string, number> = {};
  for (const { url } of LEGAL_PAGES) {
    await page.goto(url);
    before[url] = await bodySize();
    expect(before[url], `${url}: body text at 100%`).toBeGreaterThanOrEqual(16);
  }
  await doubleTextSize(page);
  for (const { url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    await fontsReady(page);
    expect(await rootFontSize(page), `${url}: the root at 200%`).toBe(32);
    expect(await bodySize(), `${url}: body text at 200%`).toBe(before[url] * 2);
    expect(await scrollsSideways(page), `${url}: sideways scroll at 200%`).toBe(false);
  }
});

// Links that stand on their own, not inside a sentence.
const STANDALONE_LINKS =
  ".legal-utility a, .legal-actions a, .legal-toc a, .legal-related a, .legal-links a, .legal-company a, .legal-contact a, .legal-request a";

test("WEB-205: on phones, every legal link outside a sentence is 44 px tall or more", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Touch targets on a phone.");
  for (const { url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    await fontsReady(page);
    const short = await article(page)
      .locator(STANDALONE_LINKS)
      .evaluateAll((links) =>
        links
          .filter((link) => link.checkVisibility())
          .map((link) => ({ text: (link.textContent ?? "").trim().slice(0, 40), height: link.getBoundingClientRect().height }))
          .filter(({ height }) => height < 44),
      );
    expect(short, `${url}: links under 44 px`).toEqual([]);
  }
});

test("WEB-205: on desktop, no focus ring in the legal sidebar is cut by its scroll box", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The sticky sidebar is a desktop layout.");
  // Twelve pages, each link focused in turn: under the round check's parallel load it outran 30 s.
  test.slow();
  for (const { url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    await fontsReady(page);
    // A key press first, so focus() draws the keyboard ring (:focus-visible).
    await page.keyboard.press("Shift");
    const links = page.locator(".legal-sidebar a");
    const count = await links.count();
    expect(count, url).toBeGreaterThan(0);
    const cut: { text: string; side: string; by: number }[] = [];
    for (let i = 0; i < count; i++) {
      await links.nth(i).focus();
      cut.push(
        ...(await links.nth(i).evaluate((link) => {
          const style = getComputedStyle(link);
          if (style.outlineStyle === "none") return [{ text: (link.textContent ?? "").trim(), side: "no ring", by: 0 }];
          const out = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
          const ring = link.getBoundingClientRect();
          const found: { text: string; side: string; by: number }[] = [];
          for (let box = link.parentElement; box; box = box.parentElement) {
            const overflow = getComputedStyle(box);
            if (overflow.overflowX === "visible" && overflow.overflowY === "visible") continue;
            const outer = box.getBoundingClientRect();
            const left = outer.left + box.clientLeft;
            const top = outer.top + box.clientTop;
            const edges = {
              left: left - (ring.left - out),
              right: ring.right + out - (left + box.clientWidth),
              top: top - (ring.top - out),
              bottom: ring.bottom + out - (top + box.clientHeight),
            };
            for (const [side, by] of Object.entries(edges))
              if (by > 0.5) found.push({ text: (link.textContent ?? "").trim().slice(0, 30), side: `${side} of ${box.className}`, by });
          }
          return found;
        })),
      );
    }
    expect(cut, `${url}: focus rings cut`).toEqual([]);
  }
});

// ---- WP30: one arrow for each kind of link, plain labels ----

const ARROW = "M4 12h16"; // Icon name="arrow": →
const ARROW_UP = "M6 18 18 6"; // Icon name="arrowUp": ↗
const WRITE: Copy = { en: "Email support", es: "Escribir a soporte", ca: "Escriu al suport" };
const OLD_LABELS = ["Contact TaskFlow", "Contactar con TaskFlow", "Contactar amb TaskFlow", "Soporte y privacidad"];

test("WEB-212: on the legal pages, links to this site use →, links to other websites ↗, email links no arrow, and support is ‘Email support’", async ({
  page,
}) => {
  for (const { language, document, url } of LEGAL_PAGES) {
    await page.goto(url);
    // The back link and the language switch are WP24's and WP41's.
    const links = await article(page)
      .locator("a")
      .evaluateAll((elements) =>
        elements
          .filter((link) => !link.closest(".legal-utility"))
          .map((link) => ({
            href: link.getAttribute("href") ?? "",
            text: (link.textContent ?? "").trim().slice(0, 40),
            paths: [...link.querySelectorAll("svg path")].map((shape) => shape.getAttribute("d") ?? ""),
          })),
      );
    for (const link of links) {
      const where = `${url} “${link.text}” (${link.href})`;
      if (link.href.startsWith("mailto:")) expect(link.paths, `${where}: an email link's arrow`).toEqual([]);
      else if (link.href.startsWith("http")) {
        expect(link.paths, `${where}: ↗`).toContain(ARROW_UP);
        expect(link.paths, `${where}: →`).not.toContain(ARROW);
      } else if (link.href.startsWith("/")) {
        expect(link.paths, `${where}: →`).toContain(ARROW);
        expect(link.paths, `${where}: ↗`).not.toContain(ARROW_UP);
      }
    }
    expect(links.filter((link) => link.href.startsWith("/")).length, `${url}: links to this site`).toBeGreaterThan(0);
    const text = flat(await article(page).innerText());
    for (const label of OLD_LABELS) expect(text, `${url}: “${label}”`).not.toContain(label);
    if (document !== "delete-account")
      await expect(page.locator(".legal-actions a[href^='mailto:']"), `${url}: the header's email link`).toHaveText(
        WRITE[language],
      );
  }
  // The privacy page's own contact button carries the same label.
  for (const language of languages) {
    await page.goto(legalPath("privacy", language));
    const contact = page.locator(".legal-body .legal-contact a.button");
    await expect(contact.first(), language).toHaveText(WRITE[language]);
  }
});

// ---- WP30: in force since ----

const IN_FORCE: Copy = { en: "In force since", es: "En vigor desde el", ca: "En vigor des del" };
const DATE_LOCALE: Copy = { en: "en-GB", es: "es", ca: "ca" };

test("WEB-213: each legal page says ‘In force since’ and the long date in its language, in a time element dated company.json's version", async ({
  page,
}) => {
  expect(COMPANY.version, "company.json's version: files of completed tasks deleted after 15 days, and the upload allowances").toBe("2026-11-08");
  // The examples for 2026-11-08. The brief asks for Intl's long date; for Catalan, ICU
  // writes «8 de novembre del 2026» where a plan's example may have «de 2026»: either is the long date.
  const examples: Record<Language, RegExp> = {
    en: /^8 November 2026$/,
    es: /^8 de noviembre de 2026$/,
    ca: /^8 de novembre del? 2026$/,
  };
  for (const { language, url } of LEGAL_PAGES) {
    await page.goto(url);
    const date = new Intl.DateTimeFormat(DATE_LOCALE[language], { dateStyle: "long", timeZone: "UTC" }).format(
      new Date(`${COMPANY.version}T00:00:00Z`),
    );
    expect(date.replace("'", "’"), `${language}: the long date`).toMatch(examples[language]);
    const time = page.locator(".legal-version time");
    await expect(time, url).toHaveAttribute("datetime", COMPANY.version);
    await expect(time, url).toHaveText(date);
    await expect(page.locator(".legal-version span", { has: page.locator("time") }), url).toHaveText(
      `${IN_FORCE[language]} ${date}`,
    );
  }
});

// ---- WP30: the legal notice ----

const NOTICE_LINE_3: Copy = {
  en: "Write to us at taskflow@garbar.tech.",
  es: "Escríbenos a taskflow@garbar.tech.",
  ca: "Escriu-nos a taskflow@garbar.tech.",
};
const REGISTRY: Copy = {
  en: "Registered in the Barcelona Mercantile Registry, volume 49105, folio 130, sheet 607875, entry 1",
  es: "Inscrita en el Registro Mercantil de Barcelona, tomo 49105, folio 130, hoja 607875, inscripción 1",
  ca: COMPANY.commercialRegister,
};

test("WEB-211: the legal notice's summary says where to write, and the company card's registry line is in the page's language", async ({
  page,
}) => {
  expect(COMPANY.commercialRegister, "company.json keeps the Catalan line").toMatch(/^Societat inscrita al Registre Mercantil de Barcelona/);
  for (const language of languages) {
    const url = legalPath("legal", language);
    await page.goto(url);
    await expect(page.locator(".legal-summary li").nth(2).locator("p"), url).toHaveText(NOTICE_LINE_3[language]);
    const registry = page.locator(".legal-company dd", { hasText: "49105" });
    await expect(registry, url).toHaveCount(1);
    await expect(registry, url).toHaveText(REGISTRY[language]);
    await expect(article(page), url).not.toContainText("Company and contact information belongs here");
  }
  // Every other page with the company card says the same.
  for (const { language, url } of LEGAL_PAGES) {
    await page.goto(url);
    const registry = page.locator(".legal-company dd", { hasText: "49105" });
    for (let i = 0; i < (await registry.count()); i++) await expect(registry.nth(i), url).toHaveText(REGISTRY[language]);
  }
});

// ---- WP30: link previews ----

const OG_LOCALE: Copy = { en: "en_US", es: "es_ES", ca: "ca_ES" };

test("WEB-312: each legal page shares with its language's preview image, og:locale and its alternates, og:site_name TaskFlow, and X tags with its own title", async ({
  page,
  request,
}) => {
  // The preview image each home uses (WP21).
  const preview: Partial<Record<Language, string>> = {};
  for (const language of languages) {
    await page.goto(homeUrl(language));
    preview[language] = new URL((await meta(page, "og:image"))!).pathname;
  }
  const answered = new Map<string, number>();
  for (const { language, url } of LEGAL_PAGES) {
    await page.goto(url);
    const image = await meta(page, "og:image");
    expect(image, `${url}: og:image`).toBeTruthy();
    const imageUrl = new URL(image!);
    expect(imageUrl.pathname, `${url}: the ${language} preview`).toBe(preview[language]);
    if (!answered.has(imageUrl.pathname)) {
      const response = await request.get(`${imageUrl.pathname}${imageUrl.search}`);
      answered.set(imageUrl.pathname, response.status());
      expect(response.headers()["content-type"], `${url}: the image's type`).toContain("image/png");
    }
    expect(answered.get(imageUrl.pathname), `${url}: the image answers`).toBe(200);
    expect(await meta(page, "og:locale"), `${url}: og:locale`).toBe(OG_LOCALE[language]);
    const alternates = await page
      .locator('head meta[property="og:locale:alternate"]')
      .evaluateAll((tags) => tags.map((tag) => tag.getAttribute("content")).sort());
    expect(alternates, `${url}: og:locale:alternate`).toEqual(
      languages.filter((other) => other !== language).map((other) => OG_LOCALE[other]).sort(),
    );
    expect(await meta(page, "og:site_name"), `${url}: og:site_name`).toBe("TaskFlow");
    expect(await meta(page, "og:type"), `${url}: og:type`).toBe("website");
    expect(await meta(page, "twitter:card"), `${url}: twitter:card`).toBe("summary_large_image");
    const title = await meta(page, "og:title");
    expect(await meta(page, "twitter:title"), `${url}: twitter:title`).toBe(title);
    // The document's own title: the name the related-documents list gives this page.
    const name = flat(await page.locator(".legal-related a[aria-current='page']").textContent());
    expect(title, `${url}: og:title`).toContain(name);
    const description = await meta(page, "description");
    expect(await meta(page, "og:description"), `${url}: og:description`).toBe(description);
    expect(await meta(page, "twitter:description"), `${url}: twitter:description`).toBe(description);
  }
});

// ---- WP31: privacy and terms say what the app and the site do today ----

const PRIVACY = {
  codes: { en: /email[- ]confirmation/i, es: /confirma(?:r el|ción del) correo/, ca: /confirma(?:r el|ció del) correu/ },
  firstName: { en: "first name", es: "nombre de pila", ca: "nom de pila" } as Copy,
  cloud: ["cloud transcription", "transcripción en la nube", "transcripció al núvol"],
  createdBy: { en: "“Created by”", es: "«Creada por»", ca: "«Creada per»" } as Copy,
  staysOnPhone: { en: "stay on the phone", es: "se quedan en el teléfono", ca: "es queden al telèfon" } as Copy,
  alsoAsk: { en: "we also ask", es: "también pedimos", ca: "també demanem" } as Copy,
  oldRevenueCat: [
    "does not automatically delete RevenueCat",
    "no borra automáticamente el registro independiente de cliente de RevenueCat",
    "no esborra automàticament el registre independent de client de RevenueCat",
  ],
};
const sectionText = async (page: Page, id: string) => flat(await page.locator(`.legal-body section#${id}`).innerText());

test("WEB-113, WEB-501: the privacy policy tells the app's email codes, first name, speech on the phone, shared names, calendars, and RevenueCat's deletion, in each language", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    for (const id of ["controller", "sharing", "retention"])
      expect(await sectionText(page, id), `${url} #${id}: email confirmation codes`).toMatch(PRIVACY.codes[language]);
    expect(await sectionText(page, "data"), `${url} #data`).toContain(PRIVACY.firstName[language]);
    const voice = await sectionText(page, "voice");
    for (const words of PRIVACY.cloud) expect(voice, `${url} #voice: “${words}”`).not.toContain(words);
    expect(await sectionText(page, "sharing"), `${url} #sharing`).toContain(PRIVACY.createdBy[language]);
    expect(await sectionText(page, "permissions"), `${url} #permissions`).toContain(PRIVACY.staysOnPhone[language]);
    const retention = await sectionText(page, "retention");
    expect(retention, `${url} #retention: 30 or 90`).not.toMatch(/30 (or|o) 90/);
    expect(retention, `${url} #retention: RevenueCat`).toContain("RevenueCat");
    expect(retention, `${url} #retention: we also ask`).toContain(PRIVACY.alsoAsk[language]);
    for (const words of PRIVACY.oldRevenueCat) expect(retention, `${url} #retention: “${words}”`).not.toContain(words);
  }
});

const WEBSITE_GONE = ["walkthrough", "recorrido", "recorregut", "Create drafts"];
const NO_RECORDING: Copy = {
  en: "we don’t keep your recording",
  es: "no guardamos tu grabación",
  ca: "no desem la gravació",
};
const TAP: Copy = { en: "tap", es: "tocas", ca: "toques" };

test("WEB-207, WEB-602: privacy §8 opens with ‘we don’t keep your recording’, names the demo's Done button as the demo does, and tells the language cookie", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    const website = await sectionText(page, "website");
    for (const words of WEBSITE_GONE) expect(website, `${url} #website: “${words}”`).not.toContain(words);
    const first = flat(await page.locator(".legal-body section#website p").first().textContent());
    const sentence = first.slice(0, first.indexOf(". ") + 1);
    expect(sentence, `${url}: §8's first sentence`).toContain(NO_RECORDING[language]);
    // The demo's send button, in the demo's own words.
    expect(website, `${url}: the demo's button`).toContain(`${TAP[language]} ${SITE[language].voice.done}`);
    expect(website, `${url}: the language cookie`).toContain("taskflow-lang");
  }
});

const JARGON = [
  /Test Store/i,
  /staging/i,
  /\bAPK/,
  /\bTTL\b/,
  /hash/i,
  /endpoint/i,
  /\bSDK/,
  /PostgreSQL/i,
  /Cloud Run/i,
  /backend/i,
  /project\/list/i,
  /projects\/lists/i,
  /voice-to-task/i,
  /punto de acceso/i,
  /punt d’accés/i,
  /proyectos\/listas/i,
  /projectes\/llistes/i,
];

test("WEB-209: the privacy, terms and legal notice pages use none of the engineering words", async ({ page }) => {
  for (const { document, url } of LEGAL_PAGES) {
    if (document === "delete-account") continue;
    await page.goto(url);
    const text = flat(await article(page).innerText());
    for (const word of JARGON) expect(text, `${url}: ${word}`).not.toMatch(word);
  }
});

test("WEB-210: no privacy, terms or delete page names Apple, and no delete page links to Apple's support", async ({ page }) => {
  for (const { document, url } of LEGAL_PAGES) {
    if (document === "legal") continue;
    await page.goto(url);
    expect(flat(await article(page).innerText()), `${url}: Apple`).not.toContain("Apple");
    await expect(page.locator("a[href*='apple.com']"), `${url}: links to apple.com`).toHaveCount(0);
  }
});

// ---- WP32: the delete page ----

const DELETED: Copy = { en: "tasks, notes and files", es: "tareas, notas y archivos", ca: "tasques, notes i fitxers" };
const DELETE_GONE = ["customer record", "base de datos", "base de dades", "Test Store", "staging", "ventana móvil", "finestra mòbil", "Apple"];
const OLD_DELETE_REVENUECAT = [
  "does not automatically delete the RevenueCat",
  "no elimina automáticamente el cliente de RevenueCat",
  "no elimina automàticament el client de RevenueCat",
];

test("WEB-202, WEB-501: the delete page says what goes in plain words, and that RevenueCat is asked to delete its record", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("delete-account", language);
    await page.goto(url);
    expect(flat(await page.locator(".legal-summary").innerText()), `${url}: the summary`).toContain(DELETED[language]);
    for (const id of ["scope", "timing", "subscription"]) {
      const text = await sectionText(page, id);
      for (const words of DELETE_GONE) expect(text, `${url} #${id}: “${words}”`).not.toContain(words);
      for (const words of OLD_DELETE_REVENUECAT) expect(text, `${url} #${id}: “${words}”`).not.toContain(words);
    }
    const firstBullet = page.locator(".legal-body section#scope li").first();
    await expect(firstBullet, `${url}: #scope's first bullet`).toContainText("RevenueCat");
  }
});

const IN_APP_LINE: Copy = {
  en: "With the app: Settings → Account → Delete account. You’ll see what will be deleted before you confirm.",
  es: "Con la app: Ajustes → Cuenta → Eliminar cuenta. Verás lo que se eliminará antes de confirmar.",
  ca: "Amb l’app: Configuració → Compte → Suprimeix el compte. Veuràs el que es suprimirà abans de confirmar.",
};
const EMAIL_LINE: Copy = {
  en: "No app, or can’t sign in? Email us:",
  es: "¿Sin la app o no puedes entrar? Escríbenos:",
  ca: "Sense l’app o no pots entrar? Escriu-nos:",
};

for (const theme of THEMES) {
  test.describe(`${theme} WP32 request box`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-204: the request box shows the in-app route first, in ink at 16 px and 4.5:1, and ‘No app…? Email us:’ directly above the email button (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("delete-account", language);
        await page.goto(url);
        await hydrated(page);
        await expect(page.locator("html"), url).toHaveAttribute("data-theme", theme);
        const box = page.locator(".legal-request");
        await expect(box.locator("p").first(), `${url}: the first line`).toHaveText(IN_APP_LINE[language]);
        const intro = box.getByText(IN_APP_LINE[language], { exact: true });
        const look = await intro.evaluate((element) => {
          const ink = document.createElement("span");
          ink.style.color = "var(--ink)";
          element.appendChild(ink);
          const inkColour = getComputedStyle(ink).color;
          ink.remove();
          let background = "rgba(0, 0, 0, 0)";
          for (let e: Element | null = element; e; e = e.parentElement) {
            const fill = getComputedStyle(e).backgroundColor;
            if (fill !== "rgba(0, 0, 0, 0)" && fill !== "transparent") {
              background = fill;
              break;
            }
          }
          const style = getComputedStyle(element);
          return { colour: style.color, ink: inkColour, size: parseFloat(style.fontSize), background };
        });
        expect(look.colour, `${url}: the in-app line's colour is ink`).toBe(look.ink);
        expect(look.size, `${url}: the in-app line's size`).toBeGreaterThanOrEqual(16);
        expect(contrast(parseColor(look.colour), parseColor(look.background)), `${url}: contrast`).toBeGreaterThanOrEqual(4.5);
        const line = box.getByText(EMAIL_LINE[language], { exact: true });
        await expect(line, url).toBeVisible();
        expect(
          await line.evaluate((element) => {
            const next = element.nextElementSibling;
            return next?.tagName === "A" && (next.getAttribute("href") ?? "").startsWith("mailto:");
          }),
          `${url}: the email button comes right after the line`,
        ).toBe(true);
        const [first, second, button] = [
          (await intro.boundingBox())!,
          (await line.boundingBox())!,
          (await box.locator("a.button").boundingBox())!,
        ];
        // Read first: above the email line, or in the column to its left (the desktop box has two).
        expect(
          first.y + first.height <= second.y + 1 || first.x + first.width <= second.x + 1,
          `${url}: the in-app line before the email line (${JSON.stringify({ first, second })})`,
        ).toBe(true);
        expect(button.y - (second.y + second.height), `${url}: from the email line to the button`).toBeLessThanOrEqual(24);
        expect(button.y, `${url}: the button under the email line`).toBeGreaterThanOrEqual(second.y + second.height - 1);
      }
    });
  });
}

for (const [width, height] of [
  [390, 664],
  [320, 568],
] as const) {
  test(`WEB-204: at ${width} × ${height}, the delete page's email button is fully inside the first screen, in each language`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "A phone's first screen.");
    await page.setViewportSize({ width, height });
    for (const language of languages) {
      const url = legalPath("delete-account", language);
      await page.goto(url);
      await hydrated(page);
      await fontsReady(page);
      const button = page.locator(".legal-request a.button");
      const box = (await button.boundingBox())!;
      expect
        .soft(box.y + box.height, `${url}: the email button's bottom edge at ${width} × ${height}`)
        .toBeLessThanOrEqual(height);
      expect.soft(box.y, `${url}: the email button's top edge`).toBeGreaterThanOrEqual(0);
    }
  });
}

test("WEB-206: the Catalan delete page says «Suprimeix», «Suprimir» or «supressió» wherever it names the action, and no Catalan legal page says «Eliminar compte», «Elimina el teu compte» or «eliminació»", async ({
  page,
}) => {
  const verb = /Suprimeix|Suprimir|supressió/;
  await page.goto("/ca/delete-account/");
  await expect(page.getByRole("heading", { level: 1 }), "h1").toHaveText(/^Suprimeix/);
  expect(await page.title(), "title").toMatch(verb);
  expect(await meta(page, "og:title"), "og:title").toMatch(verb);
  await expect(page.locator(".legal-request a.button"), "the button").toHaveText(verb);
  await expect(page.locator(".legal-related a[aria-current='page']"), "the related-documents link").toHaveText(verb);
  const mail = new URL((await page.locator(".legal-request a.button").getAttribute("href"))!);
  expect(mail.searchParams.get("subject"), "the mailto subject").toBe("Suprimir el meu compte de TaskFlow");
  expect(mail.searchParams.get("body"), "the mailto body").toContain("supressió");
  await expect(page.locator(".legal-body section#scope h2"), "the §3 heading").toHaveText(/suprimeix/i);
  for (const document of documents) {
    const url = legalPath(document, "ca");
    await page.goto(url);
    const text = `${await page.title()} ${flat(await article(page).innerText())}`;
    for (const words of [/Eliminar compte/i, /Elimina el teu compte/i, /eliminació/i])
      expect(text, `${url}: ${words}`).not.toMatch(words);
    const mailto = await article(page)
      .locator("a[href^='mailto:']")
      .evaluateAll((links) => links.map((link) => decodeURIComponent(link.getAttribute("href") ?? "")));
    for (const href of mailto) expect(href, `${url}: a mailto link`).not.toMatch(/eliminació/i);
  }
});

// ---- Batch 4, round 2, WP44: 80-character lines, the delete button above a small phone's
// fold, three copy fixes ----

const REQUEST_REGION: Copy = {
  en: "In the app or by email",
  es: "Desde la app o por correo",
  ca: "Des de l’app o per correu",
};
const deletePath = (language: Language) => legalPath("delete-account", language);
const switchInArticle = (page: Page) => article(page).locator(".legal-languages");

test("WEB-205: the company card's and the mail details' values compute to 16 px or more on every legal page that shows them", async ({
  page,
}) => {
  let seen = 0;
  for (const { url } of LEGAL_PAGES) {
    await page.goto(url);
    await fontsReady(page);
    const values = await page.locator(".legal-company dd, .legal-mail-details dd").evaluateAll((items) =>
      items
        .filter((item) => item.checkVisibility())
        .map((item) => ({ text: (item.textContent ?? "").trim().slice(0, 40), size: parseFloat(getComputedStyle(item).fontSize) })),
    );
    seen += values.length;
    for (const value of values) expect(value.size, `${url} “${value.text}”`).toBeGreaterThanOrEqual(16);
  }
  // The legal notice's company card and the delete page's mail details, in three languages.
  expect(seen, "values checked").toBeGreaterThanOrEqual(6);
});

// WP45 (WEB-728): the request box's ‘Send to’ value may wrap only at the ‘@’. Its rendered
// lines come from one Range per character, grouped by the top of the character's box.
const recipientLines = (page: Page) =>
  page.locator(".legal-request .legal-mail-details dd").first().evaluate((dd) => {
    const lines: { top: number; text: string }[] = [];
    const walker = document.createTreeWalker(dd, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      for (let index = 0; index < text.length; index++) {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + 1);
        const rect = [...range.getClientRects()].find((box) => box.width > 0 || box.height > 0);
        if (!rect) continue;
        const line = lines.find((entry) => Math.abs(entry.top - rect.top) < rect.height / 2);
        if (line) line.text += text[index];
        else lines.push({ top: rect.top, text: text[index] });
      }
    }
    return lines.sort((a, b) => a.top - b.top).map((line) => line.text);
  });

for (const theme of THEMES) {
  test.describe(`${theme} WP45 recipient`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-728: on the delete pages the support address wraps only at the @ (${theme})`, async ({ page }, testInfo) => {
      const sizes =
        testInfo.project.name === "mobile"
          ? ([
              [320, 568],
              [390, 664],
            ] as const)
          : ([[1440, 1000]] as const);
      for (const [width, height] of sizes) {
        await page.setViewportSize({ width, height });
        for (const language of languages) {
          const url = deletePath(language);
          await page.goto(url);
          await hydrated(page);
          await fontsReady(page);
          await expect(page.locator("html"), url).toHaveAttribute("data-theme", theme);
          const where = `${url} at ${width} × ${height}`;
          const href = (await page.locator(".legal-request a.button").first().getAttribute("href")) ?? "";
          expect(href, `${where}: the email button's link`).toMatch(/^mailto:/);
          const address = decodeURIComponent(new URL(href).pathname);
          expect(address, `${where}: the mailto address`).toMatch(/^[^@\s]+@[^@\s]+$/);
          const dd = page.locator(".legal-request .legal-mail-details dd").first();
          await expect(dd, where).toBeVisible();
          expect(await dd.evaluate((item) => item.textContent), `${where}: the dd's text`).toBe(address);
          const selected = await dd.evaluate((item) => {
            const selection = window.getSelection()!;
            selection.removeAllRanges();
            const range = document.createRange();
            range.selectNodeContents(item);
            selection.addRange(range);
            const text = selection.toString();
            selection.removeAllRanges();
            return text;
          });
          expect(selected, `${where}: a selection of the dd`).toBe(address);
          const lines = await recipientLines(page);
          const at = address.indexOf("@");
          if (width === 320) {
            expect(
              await dd.evaluate((item) => parseFloat(getComputedStyle(item).fontSize)),
              `${where}: the dd's font size`,
            ).toBe(16);
            // One line, or exactly two split at the ‘@’; three lines or any other split fails.
            expect(lines, `${where}: the address's rendered lines`).toEqual(
              lines.length === 1 ? [address] : [address.slice(0, at), address.slice(at)],
            );
            expect(await scrollsSideways(page), `${where}: scrolls sideways`).toBe(false);
          } else {
            expect(lines, `${where}: the address's rendered lines`).toEqual([address]);
          }
        }
      }
    });
  });
}

for (const theme of THEMES) {
  test.describe(`${theme} WP44 delete button`, () => {
    test.use({ colorScheme: theme });
    for (const [width, height] of [
      [320, 568],
      [390, 664],
    ] as const) {
      test(`WEB-204: at ${width} × ${height}, each delete page's email button is fully in the first screen, under the in-app line and directly under ‘No app…? Email us:’ (${theme})`, async ({
        page,
      }, testInfo) => {
        test.skip(testInfo.project.name !== "mobile", "A phone's first screen.");
        await page.setViewportSize({ width, height });
        for (const language of languages) {
          const url = deletePath(language);
          await page.goto(url);
          await hydrated(page);
          await fontsReady(page);
          await expect(page.locator("html"), url).toHaveAttribute("data-theme", theme);
          const box = page.locator(".legal-request");
          const button = box.locator("a.button");
          const inApp = box.getByText(IN_APP_LINE[language], { exact: true });
          const email = box.getByText(EMAIL_LINE[language], { exact: true });
          await expect(inApp, url).toBeVisible();
          await expect(email, url).toBeVisible();
          const [first, line, target] = [
            (await inApp.boundingBox())!,
            (await email.boundingBox())!,
            (await button.boundingBox())!,
          ];
          expect(target.y, `${url}: the button's top edge`).toBeGreaterThanOrEqual(0);
          expect(target.y + target.height, `${url}: the button's bottom edge at ${width} × ${height}`).toBeLessThanOrEqual(height);
          expect(first.y + first.height, `${url}: the in-app line above the email line`).toBeLessThanOrEqual(line.y + 1);
          expect(target.y, `${url}: the button under the email line`).toBeGreaterThanOrEqual(line.y + line.height - 1);
          expect(target.y - (line.y + line.height), `${url}: from the email line to the button`).toBeLessThanOrEqual(24);
          expect(
            await email.evaluate((element) => element.nextElementSibling?.matches("a.button") ?? false),
            `${url}: the button is the next element after the email line`,
          ).toBe(true);
        }
      });
    }
  });
}

for (const [width, height] of [
  [1440, 1000],
  [390, 664],
  [320, 568],
] as const) {
  test(`WEB-204: at ${width} × ${height}, the delete page's request box is a region named by its heading, which ${width > 520 ? "shows" : "takes no visible space"}`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== (width > 520 ? "desktop" : "mobile"), "Each size on its own project.");
    await page.setViewportSize({ width, height });
    for (const language of languages) {
      const url = deletePath(language);
      await page.goto(url);
      await hydrated(page);
      const region = page.getByRole("region", { name: REQUEST_REGION[language], exact: true });
      await expect(region, url).toHaveCount(1);
      await expect(region, url).toHaveClass(/legal-request/);
      const heading = region.getByRole("heading", { level: 2, name: REQUEST_REGION[language], exact: true });
      await expect(heading, url).toHaveCount(1);
      const shape = (await heading.boundingBox())!;
      if (width > 520) {
        await expect(heading, url).toBeVisible();
        expect(shape.height, `${url}: the heading's height`).toBeGreaterThan(10);
      } else {
        expect(shape.width <= 1 && shape.height <= 1, `${url}: the heading's box (${JSON.stringify(shape)})`).toBe(true);
      }
    }
  });
}

// WP65 (WEB-1501) moved the delete page's switch from under the request box into its top row,
// in place of the back link, so a visitor from Google Play finds her language in the first screen.
test("WEB-204, WEB-1501: on every legal page the language switch is in the top row, above the h1; on the delete pages it comes before the request box, in the DOM and on screen, and goes to the delete page in each language", async ({
  page,
}, testInfo) => {
  await showThePill(page, testInfo.project.name);
  for (const { language, document, url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    const pill = switchInArticle(page);
    await expect(pill, url).toHaveCount(1);
    await expect(pill, url).toBeVisible();
    expect(await pill.evaluate((element) => !!element.closest(".legal-utility")), `${url}: the switch in the top row`).toBe(true);
    const [at, h1] = [(await pill.boundingBox())!, (await page.getByRole("heading", { level: 1 }).boundingBox())!];
    expect(at.y + at.height, `${url}: the switch above the h1`).toBeLessThanOrEqual(h1.y + 1);
    if (document === "delete-account") {
      const beforeBox = await pill.evaluate((element) => {
        const box = element.ownerDocument.querySelector("article.legal-page .legal-request")!;
        return !!(box.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING);
      });
      expect(beforeBox, `${url}: the switch before the request box in the DOM`).toBe(true);
      const box = (await article(page).locator(".legal-request").boundingBox())!;
      expect(at.y + at.height, `${url}: the switch above the request box`).toBeLessThanOrEqual(box.y + 1);
      const targets = await pill
        .getByRole("link")
        .evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).pathname));
      for (const other of languages.filter((other) => other !== language))
        expect(targets, `${url}: a link to the ${other} delete page`).toContain(deletePath(other));
      expect(targets.every((target) => target.endsWith("/delete-account/")), `${url}: ${targets.join(", ")}`).toBe(true);
    }
  }
});

for (const width of [390, 320] as const) {
  test(`WEB-726: at ${width} px, each legal page's version line is one line, says only ‘In force since’ and the date, and the footer still names the company`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Phone widths.");
    await page.setViewportSize({ width, height: width === 320 ? 568 : 664 });
    for (const { language, document, url } of LEGAL_PAGES) {
      await page.goto(url);
      await fontsReady(page);
      const date = new Intl.DateTimeFormat(DATE_LOCALE[language], { dateStyle: "long", timeZone: "UTC" }).format(
        new Date(`${COMPANY.version}T00:00:00Z`),
      );
      const version = page.locator(".legal-version");
      await expect(version, url).toHaveText(`${IN_FORCE[language]} ${date}`);
      const text = flat(await version.textContent());
      expect(text, `${url}: a dot`).not.toContain("·");
      expect(text, `${url}: the company`).not.toContain("GARBAR");
      // WP65 (WEB-1501): under 360 px the delete page hides its version line, so the email
      // button fits the first screen under the language switch.
      if (document === "delete-account" && width === 320) {
        await expect(version, `${url}: the version line at 320 px`).toBeHidden();
        await expect(page.locator("footer"), `${url}: the footer`).toContainText("GARBAR, IN-TEC, S.L.");
        continue;
      }
      // Each rendered line's top: one line has one.
      const lines = await version.evaluate((element) => {
        const range = element.ownerDocument.createRange();
        range.selectNodeContents(element);
        return new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top))).size;
      });
      expect(lines, `${url}: lines in the version line`).toBe(1);
      await expect(page.locator("footer"), `${url}: the footer`).toContainText("GARBAR, IN-TEC, S.L.");
    }
  });
}

const PHOTO: Copy = { en: "We don’t keep your photo.", es: "No guardamos tu foto.", ca: "No desem la foto." };
const SURNAME: Copy = { en: "surname", es: "apellidos", ca: "cognoms" };

test("WEB-727: privacy §2 says only that the photo isn't kept, and promises nothing about the surname, in each language", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    const text = await sectionText(page, "data");
    expect(text, url).toContain(PHOTO[language]);
    expect(text.toLowerCase(), `${url}: ${SURNAME[language]}`).not.toContain(SURNAME[language]);
  }
});

const BACKUPS: Copy = {
  en: "Backups expire on their own. Restricted",
  es: "caducan solas. Los registros",
  ca: "caduquen soles. Els registres",
};

test("WEB-725: the delete page's §4 has its space after ‘on their own.’, in each language", async ({ page }) => {
  for (const language of languages) {
    const url = deletePath(language);
    await page.goto(url);
    expect(await sectionText(page, "timing"), url).toContain(BACKUPS[language]);
  }
});

test("WEB-725: no legal text runs one sentence into the next without a space, apart from S.L. and web or email addresses", () => {
  const joined: string[] = [];
  for (const language of languages) {
    const file = path.join(ROOT, "src", "content", "legal", `${language}.ts`);
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        for (const match of line.matchAll(/[a-zà-ú]\.[A-ZÀ-Ú][a-zà-ú]/g)) {
          // The run of text without spaces the match sits in.
          const start = line.lastIndexOf(" ", match.index) + 1;
          const end = line.indexOf(" ", match.index);
          const word = line.slice(start, end === -1 ? undefined : end);
          if (/S\.L\.|@|:\/\/|www\./.test(word)) continue;
          joined.push(`${language}.ts:${index + 1}: ${word}`);
        }
      });
  }
  expect(joined).toEqual([]);
});

// ---- Batch 5, WP47: suggested tasks and limits, not drafts, allowances, transcripts or an
// API route (WEB-109, WEB-729) ----

// The words no privacy or terms page says, by the page's language (WP47's acceptance).
const WP47_GONE: Record<Language, RegExp[]> = {
  en: [/draft/i, /allowance/i, /transcri/i, /AI Studio/i],
  es: [/borrador/i, /transcri/i, /AI Studio/i],
  ca: [/esborrany/i, /transcri/i, /AI Studio/i],
};
// The visible text of the legal article's headings, summary and body. The mail box
// (.legal-contact) keeps the mail app's own ‘email draft’ (WP47's brief), so it's left out.
const documentText = (page: Page) =>
  article(page).evaluate((root) => {
    const parts: string[] = [];
    for (const area of root.querySelectorAll(".legal-hero h1, .legal-summary, .legal-toc, .legal-body")) {
      const walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        if (!parent || !parent.checkVisibility() || parent.closest(".legal-contact")) continue;
        parts.push(node.textContent ?? "");
      }
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  });

test("WEB-109, WEB-729: the privacy and terms pages say no draft, allowance, transcript or AI Studio, in each language", async ({
  page,
}) => {
  for (const language of languages) {
    for (const document of ["privacy", "terms"] as const) {
      const url = legalPath(document, language);
      await page.goto(url);
      const text = await documentText(page);
      expect(text.length, `${url}: the document's text`).toBeGreaterThan(1000);
      for (const word of WP47_GONE[language]) expect(text, `${url}: ${word}`).not.toMatch(word);
    }
  }
});

// The plan's exact copy (WP47).
const WP47_PRIVACY = {
  data: {
    en: "the text of what you said, suggested tasks and changes",
    es: "el texto de lo que dijiste, tareas y cambios sugeridos",
    ca: "el text del que has dit, tasques i canvis suggerits",
  } as Copy,
  route: {
    en: "The app and the website demonstration use Google Cloud’s Vertex AI.",
    es: "La app y la demo web utilizan Vertex AI de Google Cloud.",
    ca: "L’app i la demo web fan servir Vertex AI de Google Cloud.",
  } as Copy,
  outsideEu: {
    en: "Google can process it outside the EU",
    es: "Google puede procesarlo fuera de la UE",
    ca: "Google ho pot processar fora de la UE",
  } as Copy,
  // §4's contractual paragraph, on Vertex AI since the owner's Vertex-only decision (2026-11-05).
  third: {
    en: "Under Google Cloud’s terms, Google doesn’t use what we send to Vertex AI to train its models without our permission. Google can still keep some data for a limited time, for caching, safety and abuse monitoring. See the linked provider terms. We do not promise zero retention or EU-only processing.",
    es: "Según las condiciones de Google Cloud, Google no usa lo que enviamos a Vertex AI para entrenar sus modelos sin nuestro permiso. Google puede conservar algunos datos durante un tiempo limitado, para caché, seguridad y prevención de abusos. No prometemos retención cero ni tratamiento exclusivamente en la UE.",
    ca: "Segons les condicions de Google Cloud, Google no fa servir el que enviem a Vertex AI per entrenar els seus models sense el nostre permís. Google pot conservar algunes dades durant un temps limitat, per a memòria cau, seguretat i prevenció d’abusos. No prometem retenció zero ni tractament exclusiu a la UE.",
  } as Copy,
};

test("WEB-729: privacy §2 lists the text of what you said and suggested tasks, and §4 names Vertex AI, and its contractual paragraph is on Vertex AI", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    expect(await sectionText(page, "data"), `${url} #data`).toContain(WP47_PRIVACY.data[language]);
    const voice = await sectionText(page, "voice");
    expect(voice, `${url} #voice: the route`).toContain(WP47_PRIVACY.route[language]);
    expect(voice, `${url} #voice: outside the EU`).toContain(WP47_PRIVACY.outsideEu[language]);
    await expect(page.locator(".legal-body section#voice > p").nth(3), `${url} #voice: the contractual paragraph`).toHaveText(
      WP47_PRIVACY.third[language],
    );
  }
});

const WP47_TERMS = {
  description: {
    en: "Terms and Conditions for using TaskFlow, including accounts, shared projects, dictation and subscriptions.",
    es: "Términos y condiciones de TaskFlow: cuentas, proyectos compartidos, dictado, suscripciones y derechos de consumo.",
    ca: "Termes i condicions de TaskFlow: compte, projectes compartits, dictat, subscripcions i drets de consum.",
  } as Copy,
  ai: { en: "5. AI suggestions", es: "5. Sugerencias de la IA", ca: "5. Suggeriments de la IA" } as Copy,
};

test("WEB-109: the terms' description, og:description and twitter:description are the new line, and §5 is headed AI suggestions, in each language", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("terms", language);
    await page.goto(url);
    for (const key of ["description", "og:description", "twitter:description"])
      expect(await meta(page, key), `${url}: ${key}`).toBe(WP47_TERMS.description[language]);
    await expect(page.locator("section#ai h2"), `${url}: §5's heading`).toHaveText(WP47_TERMS.ai[language]);
  }
});

plain("WEB-109, WEB-729: docs/LEGAL_RELEASE.md names company.json's version as the effective day", () => {
  const release = readFileSync(path.join(ROOT, "docs", "LEGAL_RELEASE.md"), "utf8");
  const day = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${COMPANY.version}T00:00:00Z`),
  );
  expect(release).toContain(`effective **${day}**`);
});

// ---- Run 2026-10-21-changes, round 1: WP54 (WEB-1002), your words go to Google to add, find or change tasks ----
// The plan's exact copy: the check is about the wording.

const SUMMARY_02: Copy = {
  en: "Your words go to Google’s AI only when you ask TaskFlow to understand them: to add, find or change tasks, to ask for reminders in your own words, or to make notes from a meeting you record, with everyone’s words in it.",
  es: "Tus palabras solo van a la IA de Google cuando pides a TaskFlow que las entienda: para añadir, buscar o cambiar tareas, para pedir recordatorios con tus palabras o para hacer notas de una reunión que grabas, con lo que dice cada persona.",
  ca: "Les teves paraules només van a la IA de Google quan demanes a TaskFlow que les entengui: per afegir, cercar o canviar tasques, per demanar recordatoris amb les teves paraules o per fer notes d’una reunió que enregistres, amb el que hi diu cadascú.",
};
const WP54_DATA: Copy = {
  en: "the text of what you said, suggested tasks and changes",
  es: "el texto de lo que dijiste, tareas y cambios sugeridos",
  ca: "el text del que has dit, tasques i canvis suggerits",
};
// §4's first paragraph, where its purpose clause was cut, and the second paragraph's new first sentence.
// Since 2026-11-06 the recording goes online by default; on-device speech, where chosen, sends only the words.
const WP54_ONLY_WORDS: Copy = {
  en: "By default, the recording is sent to be turned into text online when you finish. If you choose in the app’s voice settings to have your phone recognise speech by itself, and it can, your voice becomes text on the phone and no audio leaves it; only the words are sent.",
  es: "De forma predeterminada, la grabación se envía para convertirla en texto en línea al terminar. Si en los ajustes de voz de la app eliges que tu teléfono reconozca la voz por sí solo, y puede hacerlo, tu voz se convierte en texto en el propio teléfono y el audio no sale de él; solo se envían las palabras.",
  ca: "De manera predeterminada, la gravació s’envia per convertir-la en text en línia en acabar. Si als ajustos de veu de l’app tries que el telèfon reconegui la veu tot sol, i pot fer-ho, la veu es converteix en text al mateix telèfon i l’àudio no en surt; només s’envien les paraules.",
};
const WP54_GOOGLE: Copy = {
  en: "Google processes submitted recordings/text and the relevant context to return suggested tasks and changes and, for a recording, the text of what you said, and for a meeting, its text and notes.",
  es: "Google procesa el audio/texto y el contexto pertinente para devolver tareas y cambios sugeridos y, si es una grabación, el texto de lo que dijiste y, si es una reunión, su texto y sus notas.",
  ca: "Google processa l’àudio/text i el context pertinent per retornar tasques i canvis suggerits i, si és una gravació, el text del que has dit i, si és una reunió, el seu text i les seves notes.",
};
const WP54_GONE = [
  "turn them into tasks",
  "to become tasks",
  "las convierta en tareas",
  "para crear las tareas",
  "les converteixi en tasques",
  "per crear les tasques",
];
// §3, which WP54 leaves alone.
const WP54_PURPOSES: Record<Language, string[]> = {
  en: ["the suggested tasks you ask for", "The AI suggests titles, dates and priorities for your review"],
  es: ["las tareas sugeridas que pides", "La IA propone títulos, fechas y prioridades para tu revisión"],
  ca: ["les tasques suggerides que demanes", "La IA proposa títols, dates i prioritats perquè els revisis"],
};
const summary02 = (page: Page) => page.locator(".legal-summary li").nth(1);

for (const theme of THEMES) {
  test.describe(`${theme} WP54 privacy`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-1002: the privacy summary's second item says your words go to Google only to add, find or change tasks (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("privacy", language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator(".legal-summary li"), url).toHaveCount(3);
        await expect(summary02(page).locator("p"), url).toHaveText(SUMMARY_02[language]);
        await expect(summary02(page), url).toBeVisible();
      }
    });
  });
}

test("WEB-1002: privacy §2 lists suggested tasks and changes, §4 sends only the words and Google returns suggested tasks and changes, its third paragraph unchanged", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    expect(await sectionText(page, "data"), `${url} #data`).toContain(WP54_DATA[language]);
    const paragraphs = page.locator(".legal-body section#voice > p");
    expect(flat(await paragraphs.nth(0).innerText()), `${url} #voice: the first paragraph`).toContain(
      WP54_ONLY_WORDS[language],
    );
    // nth(1) is the meeting-notes paragraph (2026-11-05).
    const second = flat(await paragraphs.nth(2).innerText());
    expect(second.startsWith(WP54_GOOGLE[language]), `${url} #voice: the second paragraph begins “${second.slice(0, 90)}…”`).toBe(
      true,
    );
    // The second paragraph's next sentences stay as they were.
    expect(second, `${url} #voice: the route`).toContain(WP47_PRIVACY.route[language]);
    await expect(paragraphs.nth(3), `${url} #voice: the contractual paragraph`).toHaveText(WP47_PRIVACY.third[language]);
  }
});

test("WEB-1002: no legal page says words are sent to become tasks, and privacy §3 keeps its suggested tasks and its review line", async ({
  page,
}) => {
  for (const { language, document, url } of LEGAL_PAGES) {
    await page.goto(url);
    const text = flat(await page.locator("body").innerText());
    for (const phrase of WP54_GONE) expect(text, `${url}: “${phrase}”`).not.toContain(phrase);
    if (document === "privacy") {
      const purposes = await sectionText(page, "purposes");
      for (const line of WP54_PURPOSES[language]) expect(purposes, `${url} #purposes`).toContain(line);
    }
  }
});

test("WEB-1002: on /es/privacy/ and /ca/privacy/ at 390 × 664, summary 02 starts inside the first screen", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "A phone's first screen.");
  await page.setViewportSize({ width: 390, height: 664 });
  for (const language of ["es", "ca"] as const) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    await hydrated(page);
    await fontsReady(page);
    await expect(summary02(page).locator("p"), url).toHaveText(SUMMARY_02[language]);
    const box = (await summary02(page).boundingBox())!;
    expect(box.y, `${url}: summary 02's top`).toBeGreaterThanOrEqual(0);
    expect(box.y, `${url}: summary 02's top`).toBeLessThan(664);
  }
});

test("WEB-1002: at 1440 × 1000, summary 02 is wholly inside the first viewport on each privacy page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Measured at 1440 × 1000.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    await hydrated(page);
    await fontsReady(page);
    await expect(summary02(page), url).toBeInViewport({ ratio: 1 });
  }
});

test("WEB-1002: at 320 × 800, no privacy page scrolls sideways", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    await hydrated(page);
    await fontsReady(page);
    expect(await scrollsSideways(page), `${url} at 320 px`).toBe(false);
  }
});

test("WEB-1002: on the phone with the browser's text doubled, no privacy page scrolls sideways", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone (390 × 664).");
  await doubleTextSize(page);
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    await hydrated(page);
    await fontsReady(page);
    expect(await rootFontSize(page), `${url}: the root at 200%`).toBe(32);
    expect(await scrollsSideways(page), `${url} at 200% text`).toBe(false);
  }
});

// ---- Run 2026-10-22-changes, round 1: WP58 (WEB-1101), privacy §4's task form sentence is
// narrowed to accounts without Pro ----
// The plan's exact copy: the check is about the wording.

// §4's first paragraph ends with these two sentences.
const WP58_ENDING: Copy = {
  en: "With Pro, words you type for the AI, and reminders you ask for in your own words, are sent the same way. Without Pro, the task form never sends anything to the AI.",
  es: "Con Pro, lo que escribes para la IA y los recordatorios que pides con tus palabras se envían igual. Sin Pro, el formulario de tareas nunca envía nada a la IA.",
  ca: "Amb Pro, el que escrius per a la IA i els recordatoris que demanes amb les teves paraules s’envien igual. Sense Pro, el formulari de tasques no envia mai res a la IA.",
};
// The absolute that is gone: no sentence on a legal page begins with these words.
const WP58_GONE_START = ["The task form", "El formulario de tareas", "El formulari de tasques"];
// The same check in the source: the old sentence after another one.
const WP58_GONE_SOURCE = [
  ". The task form never",
  ". El formulario de tareas nunca",
  ". El formulari de tasques no envia mai",
];
// §4's fourth paragraph still offers manual entry.
const WP58_MANUAL: Copy = {
  en: "You can use manual task entry instead of AI.",
  es: "Puedes escribir tareas manualmente.",
  ca: "Pots escriure tasques manualment.",
};

for (const theme of THEMES) {
  test.describe(`${theme} WP58 privacy`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-1101: privacy §4's first paragraph ends ‘Without Pro, the task form never sends anything to the AI.’ and still sends only the words, in each language (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("privacy", language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const first = page.locator(".legal-body section#voice > p").first();
        await expect(first, url).toBeVisible();
        const text = flat(await first.innerText());
        expect(text.endsWith(WP58_ENDING[language]), `${url} #voice: the first paragraph ends “…${text.slice(-140)}”`).toBe(
          true,
        );
        expect(text, `${url} #voice: WP54's only the words`).toContain(WP54_ONLY_WORDS[language]);
      }
    });
  });
}

test("WEB-1101: no legal page has a sentence that begins ‘The task form’, ‘El formulario de tareas’ or ‘El formulari de tasques’", async ({
  page,
}) => {
  for (const { url } of LEGAL_PAGES) {
    await page.goto(url);
    // Each line of the page's text starts a block: a paragraph, item or heading.
    const lines = (await page.locator("body").innerText()).split("\n").map(flat).filter(Boolean);
    expect(lines.length, `${url}: the page's text`).toBeGreaterThan(10);
    for (const line of lines)
      for (const start of WP58_GONE_START) {
        expect(line.startsWith(start), `${url}: a paragraph begins “${start}”`).toBe(false);
        expect(line, `${url}: a sentence begins “${start}”`).not.toContain(`. ${start}`);
      }
  }
});

plain("WEB-1101: no line in src/content/legal/ says the task form never sends anything, after another sentence", () => {
  const found: string[] = [];
  const folder = path.join(ROOT, "src", "content", "legal");
  const files = readdirSync(folder);
  expect(files).toEqual(expect.arrayContaining(["en.ts", "es.ts", "ca.ts"]));
  for (const file of files) {
    readFileSync(path.join(folder, file), "utf8")
      .split("\n")
      .forEach((line, index) => {
        for (const words of WP58_GONE_SOURCE)
          if (line.includes(words)) found.push(`${file}:${index + 1}: “${words}”`);
      });
  }
  expect(found).toEqual([]);
});

test("WEB-1101: privacy §4's last paragraph still offers manual task entry, and §4 has five paragraphs, in each language", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    const paragraphs = page.locator(".legal-body section#voice > p");
    await expect(paragraphs, `${url} #voice`).toHaveCount(5);
    expect(flat(await paragraphs.nth(4).innerText()), `${url} #voice: the last paragraph`).toContain(
      WP58_MANUAL[language],
    );
  }
});

// ---- Run 2026-10-28-site: WP65 (WEB-1501, WEB-1504, WEB-1505) ----
// The delete page's language switch in the first screen, one language switch on desktop
// legal pages, legal headings without hyphens. Already proved elsewhere in this file:
// WEB-204's email button in the first screen at 320 × 568 and 390 × 664, light and dark
// (‘WP44 delete button’); axe on the 12 legal pages, light and dark, phone and desktop
// (‘legal pages axe’); no sideways scroll at 320 px and at 200% text (WEB-208, WEB-309).

const DOCUMENT_PAGES = LEGAL_PAGES.filter(({ document }) => document !== "delete-account");
// The visible language switches on the page, wherever they are: header, main or footer.
const visibleSwitches = (page: Page) =>
  page.locator("nav.language-switch").evaluateAll((navs) =>
    navs
      .filter((nav) => nav.checkVisibility())
      .map((nav) => ({
        where: nav.closest("header.site-header") ? "header" : nav.closest("footer") ? "footer" : nav.closest("main") ? "main" : "other",
        label: nav.getAttribute("aria-label") ?? "",
      })),
  );

for (const theme of THEMES) {
  test.describe(`${theme} WP65 delete page switch`, () => {
    test.use({ colorScheme: theme });
    for (const [width, height] of [
      [390, 664],
      [320, 568],
    ] as const) {
      test(`WEB-1501: at ${width} × ${height}, each delete page's ‘Document language’ navigation is in the first screen, before the request in the DOM, with no back link, and the email button stays in the first screen (${theme})`, async ({
        page,
      }, testInfo) => {
        test.skip(testInfo.project.name !== "mobile", "A phone's first screen.");
        await page.setViewportSize({ width, height });
        for (const language of languages) {
          const url = deletePath(language);
          await page.goto(url);
          await hydrated(page);
          await fontsReady(page);
          await expect(page.locator("html"), url).toHaveAttribute("data-theme", theme);
          const nav = languageSwitch(page, language);
          await expect(nav, url).toHaveCount(1);
          await expect(nav, url).toBeVisible();
          const at = (await nav.boundingBox())!;
          expect(at.y, `${url}: the switch's top`).toBeGreaterThanOrEqual(0);
          expect(at.y + at.height, `${url}: the switch's bottom at ${width} × ${height}`).toBeLessThanOrEqual(height);
          // Every language's name is on screen, not cut by the fold.
          for (const name of ["English", "Español", "Català"])
            await expect(nav.getByRole("link", { name, exact: true }), `${url}: ${name}`).toBeInViewport({ ratio: 1 });
          const region = page.getByRole("region", { name: REQUEST_REGION[language], exact: true });
          await expect(region, url).toHaveCount(1);
          expect(
            await nav.evaluate((element) => {
              const box = element.ownerDocument.querySelector("article.legal-page .legal-request")!;
              return !!(box.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING);
            }),
            `${url}: the switch before the request in the DOM`,
          ).toBe(true);
          for (const other of languages)
            await expect(page.getByRole("link", { name: ui[other].back, exact: true }), `${url}: ‘${ui[other].back}’`).toHaveCount(0);
          const button = (await region.locator("a.button").boundingBox())!;
          expect(button.y + button.height, `${url}: the email button's bottom at ${width} × ${height}`).toBeLessThanOrEqual(height);
        }
      });
    }
  });
}

test("WEB-1501: on phones, the privacy, terms and legal notice pages keep the back link and the pill in their top row, above the h1, in each language", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Phones.");
  for (const { language, url } of DOCUMENT_PAGES) {
    await page.goto(url);
    await hydrated(page);
    await fontsReady(page);
    const row = article(page).locator(".legal-utility");
    await expect(row, url).toHaveCount(1);
    const back = row.getByRole("link", { name: ui[language].back, exact: true });
    const pill = row.getByRole("navigation", { name: ui[language].language, exact: true });
    await expect(back, url).toBeVisible();
    await expect(pill, url).toBeVisible();
    const h1 = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    for (const [what, element] of [
      ["the back link", back],
      ["the pill", pill],
    ] as const) {
      const box = (await element.boundingBox())!;
      expect(box.y + box.height, `${url}: ${what} above the h1`).toBeLessThanOrEqual(h1.y + 1);
    }
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} WP65 one desktop switch`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-1504: at 1440 × 1000, every legal page shows one language switch above the footer, the header's, and the delete page's h1 is no lower than the privacy page's (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "The desktop's header.");
      await page.setViewportSize({ width: 1440, height: 1000 });
      const h1Top: Record<string, number> = {};
      for (const { language, url } of LEGAL_PAGES) {
        await page.goto(url);
        await hydrated(page);
        await fontsReady(page);
        await expect(page.locator("html"), url).toHaveAttribute("data-theme", theme);
        await expect(article(page).locator(".legal-languages"), url).toBeHidden();
        await expect(page.getByRole("navigation", { name: ui[language].language, exact: true }), url).toBeHidden();
        const shown = (await visibleSwitches(page)).filter(({ where }) => where !== "footer");
        expect(shown, `${url}: the visible language switches outside the footer`).toEqual([
          { where: "header", label: expect.any(String) },
        ]);
        h1Top[url] = (await page.getByRole("heading", { level: 1 }).boundingBox())!.y;
      }
      for (const language of languages) {
        const [deletion, privacy] = [deletePath(language), legalPath("privacy", language)];
        expect(h1Top[deletion], `${deletion}: the h1's top against ${privacy}'s`).toBeLessThanOrEqual(h1Top[privacy] + 1);
      }
    });
  });
}

test("WEB-1504: with the desktop's text at 200% the header shows Menu, and every legal page shows its pill", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desktop at 200% text; phones are the next test.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await doubleTextSize(page);
  for (const { language, url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    expect(await rootFontSize(page), `${url}: the root at 200%`).toBe(32);
    await expect(page.locator("header.site-header .header-menu summary"), `${url}: Menu`).toBeVisible();
    await expect(languageSwitch(page, language), url).toBeVisible();
  }
});

test("WEB-1504: on phones every legal page shows its pill", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Phones.");
  for (const { language, url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    await expect(languageSwitch(page, language), url).toBeVisible();
  }
});

// The h1's rendered lines, from one Range per character, grouped by the character box's top.
const headingLines = (page: Page) =>
  page.getByRole("heading", { level: 1 }).evaluate((h1) => {
    const lines: { top: number; text: string }[] = [];
    const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      for (let index = 0; index < text.length; index++) {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + 1);
        const rect = [...range.getClientRects()].find((box) => box.width > 0 || box.height > 0);
        if (!rect) continue;
        const line = lines.find((entry) => Math.abs(entry.top - rect.top) < rect.height / 2);
        if (line) line.text += text[index];
        else lines.push({ top: rect.top, text: text[index] });
      }
    }
    return lines.sort((a, b) => a.top - b.top).map((line) => line.text);
  });

for (const [width, height] of [
  [390, 664],
  [320, 568],
] as const) {
  test(`WEB-1505: at ${width} px, no legal h1 hyphenates: its hyphens are manual, and every line ends at a space, never mid-word or on a hyphen, in each language`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Phone widths.");
    await page.setViewportSize({ width, height });
    for (const { url } of LEGAL_PAGES) {
      await page.goto(url);
      await fontsReady(page);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1, url).toHaveCSS("hyphens", "manual");
      expect(await h1.textContent(), `${url}: a soft hyphen in the h1`).not.toContain("­");
      const lines = await headingLines(page);
      for (let index = 0; index < lines.length - 1; index++) {
        const [line, next] = [lines[index], lines[index + 1]];
        const what = `${url}: “${flat(line)}” / “${flat(next)}”`;
        expect(line.trimEnd(), what).not.toMatch(/[-‐‑]$/);
        // A break between two letters, with no space, is a word split across lines.
        expect(/\p{L}$/u.test(line) && /^\p{L}/u.test(next), `${what}: a word split across lines`).toBe(false);
      }
    }
  });
}

// ---- Run 2026-10-28-site: WP66 (WEB-1502, WEB-1507, WEB-1302, WEB-1503, WEB-1506, WEB-1509),
// the legal edit: reminders asked for in your own words, files upload on save, the demo's
// one-minute limit, English terms that match ES and CA, reminders aren't shared ----
// The plan's exact copy: each check is about the wording. Summary 02 is SUMMARY_02 above,
// §4's ending WP58_ENDING and §8's first paragraph FIRST_PARAGRAPH, which the package updated.

// WEB-1502: the summaries' old ending, gone in each language.
const WP66_OLD_SUMMARY_END = ["to add, find or change tasks.", "cambiar tareas.", "canviar tasques."];
// WEB-1502: §4's new Pro sentence and WEB-1101's last sentence.
const WP66_PRO: Copy = {
  en: "With Pro, words you type for the AI, and reminders you ask for in your own words, are sent the same way.",
  es: "Con Pro, lo que escribes para la IA y los recordatorios que pides con tus palabras se envían igual.",
  ca: "Amb Pro, el que escrius per a la IA i els recordatoris que demanes amb les teves paraules s’envien igual.",
};
const WP66_WITHOUT_PRO: Copy = {
  en: "Without Pro, the task form never sends anything to the AI.",
  es: "Sin Pro, el formulario de tareas nunca envía nada a la IA.",
  ca: "Sense Pro, el formulari de tasques no envia mai res a la IA.",
};
// WEB-1502: §2's Organisation list names reminders after dates.
const WP66_ORGANISATION: Copy = {
  en: "tasks, notes, dates, reminders, priorities,",
  es: "tareas, notas, fechas, recordatorios, prioridades,",
  ca: "tasques, notes, dates, recordatoris, prioritats,",
};
const WP66_ORGANISATION_START: Copy = { en: "Organisation:", es: "Organización:", ca: "Organització:" };
// WEB-1507: §2's Files paragraph, and the old sentence that's gone from the source.
const WP66_FILES: Copy = {
  en: "Files you attach upload to your account when you save the task.",
  es: "Los archivos que adjuntas se suben a tu cuenta al guardar la tarea.",
  ca: "Els fitxers que adjuntes es pugen al compte en desar la tasca.",
};
const WP66_FILES_START: Copy = { en: "Files:", es: "Archivos:", ca: "Fitxers:" };
const WP66_FILES_GONE = ["cloud backup/sharing", "copia en la nube o el uso compartido", "còpia al núvol o la compartició"];
// WEB-1302: §8's demo sentence, and the sentence end that's gone from every legal page.
const WP66_DEMO: Copy = {
  en: "The live demo sends your recording or text to Google only when you tap Done, or when a recording reaches its one-minute limit.",
  es: "La demo en directo envía tu grabación o tu texto a Google solo cuando tocas Listo, o cuando una grabación llega a su límite de un minuto.",
  ca: "La demo en directe envia la gravació o el text a Google només quan toques Fet, o quan una gravació arriba al seu límit d’un minut.",
};
const WP66_DEMO_GONE = ["only when you tap Done.", "solo cuando tocas Listo.", "només quan toques Fet."];
// WEB-1503: the English terms' §3 and §5, the words that are gone, and the Spanish and
// Catalan paragraphs they now match, unchanged.
const WP66_TERMS_EN = {
  service: "TaskFlow provides task/note planning, calendars, reminders, optional AI, synchronisation and shared projects where enabled.",
  ai: "The AI is optional.",
};
const WP66_TERMS_GONE = ["turns what you say into tasks", "AI capture"];
const WP66_TERMS_KEPT: Record<"es" | "ca", { service: string; ai: string }> = {
  es: {
    service:
      "TaskFlow ofrece organización de tareas/notas, calendarios, recordatorios, IA opcional, sincronización y proyectos compartidos cuando estén habilitados. Las funciones y límites de archivos o IA figuran en la app y la oferta contratada. Una demo o previsión no garantiza una función todavía no disponible.",
    ai: "La IA es opcional y envía entrada/contexto al proveedor descrito en la política. Puede omitir, interpretar mal o inventar detalles. Revisa título, fecha, hora, prioridad, notas y destinatarios antes de guardarlos, compartirlos o fiarte de ellos. No es asesoramiento profesional ni garantía de exactitud.",
  },
  ca: {
    service:
      "TaskFlow ofereix tasques/notes, calendaris, recordatoris, IA opcional, sincronització i projectes compartits quan estiguin habilitats. Funcions i límits consten a l’app i l’oferta. Una demo o previsió no garanteix una funció futura.",
    ai: "La IA opcional envia entrada/context al proveïdor descrit. Pot ometre, malinterpretar o inventar. Revisa títol, data, hora, prioritat, notes, projecte i destinataris abans de desar-los, compartir-los o refiar-te’n. No és assessorament ni garantia d’exactitud.",
  },
};
// WEB-1506: §5's Cloudflare link, which stays.
const WP66_CLOUDFLARE: Copy = {
  en: "Cloudflare privacy notice",
  es: "Privacidad de Cloudflare",
  ca: "Privacitat de Cloudflare",
};
// WEB-1509: §5's first paragraph before this run, the sentence the new one follows, and the
// new one. The paragraph must be the old one with only the new sentence put in after its anchor.
const WP66_SHARING_BEFORE: Copy = {
  en: "Personal content is not made public by default. Members of a shared project see your name on the tasks you create there (“Created by”), on tasks assigned to you, and in a task’s Activity, next to each change you made and its date; if you haven’t given a name, they see the start of your email address. They can also show just one person’s tasks. A task, note or file placed in a shared project is available to its authorised members according to their roles. Group administrators/owners can manage access. Other members may download or copy content; leaving a group or deleting your account cannot remotely erase their independent copies.",
  es: "Tu contenido personal no es público por defecto. Los miembros de un proyecto compartido ven tu nombre en las tareas que creas en él («Creada por»), en las que tienes asignadas y en la «Actividad» de cada tarea, junto a cada cambio que hiciste y su fecha; si no has dado un nombre, ven el principio de tu correo. También pueden ver solo las tareas de una persona. Lo que colocas en un proyecto compartido es accesible a sus miembros autorizados según sus roles. Los responsables del grupo administran el acceso. Los miembros pueden descargar copias; abandonar un grupo o eliminar la cuenta no borra remotamente esas copias independientes.",
  ca: "El contingut personal no és públic per defecte. Els membres d’un projecte compartit veuen el teu nom a les tasques que hi crees («Creada per»), a les que tens assignades i a l’«Activitat» de cada tasca, al costat de cada canvi que hi has fet i la data; si no has donat cap nom, veuen l’inici del teu correu. També poden veure només les tasques d’una persona. El contingut d’un projecte compartit és accessible als membres autoritzats segons el rol. Els responsables gestionen l’accés. Els membres poden descarregar còpies; sortir del grup o suprimir el compte no les esborra remotament.",
};
const WP66_SHARING_ANCHOR: Copy = {
  en: "They can also show just one person’s tasks.",
  es: "También pueden ver solo las tareas de una persona.",
  ca: "També poden veure només les tasques d’una persona.",
};
const WP66_NOT_SHARED: Copy = {
  en: "Reminders aren’t shared: each person has their own.",
  es: "Los recordatorios no se comparten: cada persona tiene los suyos.",
  ca: "Els recordatoris no es comparteixen: cada persona té els seus.",
};
const WP66_CREATED_BY: Copy = { en: "“Created by”", es: "«Creada por»", ca: "«Creada per»" };

const privacySection = (page: Page, id: string) => page.locator(`.legal-body section#${id}`);
const bulletStarting = async (page: Page, id: string, start: string) => {
  const bullets = (await privacySection(page, id).locator("li").allInnerTexts()).map(flat);
  return bullets.filter((bullet) => bullet.startsWith(start));
};

for (const theme of THEMES) {
  test.describe(`${theme} WP66 privacy`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-1502: summary 02 says words go to Google's AI also to ask for reminders in your own words, and no summary ends ‘…to add, find or change tasks.’ (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("privacy", language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(summary02(page), url).toBeVisible();
        await expect(summary02(page).locator("p"), url).toHaveText(SUMMARY_02[language]);
        for (const item of (await page.locator(".legal-summary li").allInnerTexts()).map(flat))
          for (const end of WP66_OLD_SUMMARY_END)
            expect(item.endsWith(end), `${url}: a summary ends “…${end}”`).toBe(false);
      }
    });

    test(`WEB-1509: privacy §5's first paragraph says reminders aren't shared, right after ‘…just one person’s tasks.’, and nothing else in it changed (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("privacy", language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const first = privacySection(page, "sharing").locator("p").first();
        await expect(first, url).toBeVisible();
        const before = WP66_SHARING_BEFORE[language];
        expect(before, `${url}: the anchor sentence`).toContain(WP66_SHARING_ANCHOR[language]);
        const expected = before.replace(
          WP66_SHARING_ANCHOR[language],
          `${WP66_SHARING_ANCHOR[language]} ${WP66_NOT_SHARED[language]}`,
        );
        await expect(first, `${url} #sharing: the first paragraph`).toHaveText(expected);
        expect(flat(await first.innerText()), `${url} #sharing`).toContain(WP66_CREATED_BY[language]);
      }
    });
  });
}

test("WEB-1502: at 390 × 664, summary 02's last line holds two words or more on /es/privacy/ and /ca/privacy/", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "A 390 px phone.");
  await page.setViewportSize({ width: 390, height: 664 });
  for (const language of ["es", "ca"] as const) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    await hydrated(page);
    await fontsReady(page);
    const text = summary02(page).locator("p");
    await expect(text, url).toHaveText(SUMMARY_02[language]);
    // Each word's top, from a Range over its characters: the last line's words share the largest top.
    const tops = await text.evaluate((element) => {
      const result: number[] = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const value = node.textContent ?? "";
        for (const match of value.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index!);
          range.setEnd(node, match.index! + match[0].length);
          const rects = range.getClientRects();
          result.push(rects[rects.length - 1].top);
        }
      }
      return result;
    });
    expect(tops.length, `${url}: summary 02's words`).toBe(SUMMARY_02[language].split(" ").length);
    const last = Math.max(...tops);
    const lastLine = tops.filter((top) => Math.abs(top - last) < 2).length;
    expect(lastLine, `${url}: words on summary 02's last line`).toBeGreaterThanOrEqual(2);
  }
});

test("WEB-1502: privacy §4's first paragraph has the Pro sentence with reminders and still ends with WEB-1101's sentence; §2 lists dates, reminders, priorities", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    const first = flat(await privacySection(page, "voice").locator("p").first().innerText());
    expect(first, `${url} #voice: the Pro sentence`).toContain(WP66_PRO[language]);
    expect(first.endsWith(WP66_WITHOUT_PRO[language]), `${url} #voice ends “…${first.slice(-90)}”`).toBe(true);
    const organisation = await bulletStarting(page, "data", WP66_ORGANISATION_START[language]);
    expect(organisation, `${url} #data: the Organisation item`).toHaveLength(1);
    expect(organisation[0], `${url} #data: Organisation`).toContain(WP66_ORGANISATION[language]);
  }
});

test("WEB-1507: privacy §2's Files item says attached files upload to your account when you save the task, in each language", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    const files = await bulletStarting(page, "data", WP66_FILES_START[language]);
    expect(files, `${url} #data: the Files item`).toHaveLength(1);
    expect(files[0], `${url} #data: Files`).toContain(WP66_FILES[language]);
    for (const words of WP66_FILES_GONE) expect(files[0], `${url} #data: “${words}”`).not.toContain(words);
  }
});

plain("WEB-1507, WEB-1503: src/content/legal/ says no ‘cloud backup/sharing’ in any language, and en.ts no ‘turns what you say into tasks’ or ‘AI capture’", () => {
  const folder = path.join(ROOT, "src", "content", "legal");
  const files = readdirSync(folder);
  expect(files).toEqual(expect.arrayContaining(["en.ts", "es.ts", "ca.ts"]));
  const found: string[] = [];
  for (const file of files) {
    const text = readFileSync(path.join(folder, file), "utf8");
    for (const words of WP66_FILES_GONE) if (text.includes(words)) found.push(`${file}: “${words}”`);
  }
  const en = readFileSync(path.join(folder, "en.ts"), "utf8");
  for (const words of WP66_TERMS_GONE) if (en.includes(words)) found.push(`en.ts: “${words}”`);
  expect(found).toEqual([]);
});

test("WEB-1302: privacy §8's first paragraph says the demo also sends a recording that reaches its one-minute limit, and no legal page says ‘only when you tap Done.’", async ({
  page,
}) => {
  for (const { language, document, url } of LEGAL_PAGES) {
    await page.goto(url);
    if (document === "privacy") {
      const first = flat(await privacySection(page, "website").locator("p").first().innerText());
      expect(first, `${url} #website: the demo sentence`).toContain(WP66_DEMO[language]);
    }
    const text = flat(await page.locator("body").innerText());
    for (const end of WP66_DEMO_GONE) expect(text, `${url}: “${end}”`).not.toContain(end);
  }
});

test("WEB-1503: the English terms' §3 offers ‘optional AI’ and §5 begins ‘The AI is optional.’; the Spanish and Catalan §3 and §5 are unchanged", async ({
  page,
}) => {
  await page.goto("/terms/");
  const service = flat(await page.locator(".legal-body section#service p").first().innerText());
  expect(service.startsWith(WP66_TERMS_EN.service), `/terms/ #service: “${service.slice(0, 140)}…”`).toBe(true);
  const ai = flat(await page.locator(".legal-body section#ai p").first().innerText());
  expect(ai.startsWith(`${WP66_TERMS_EN.ai} `), `/terms/ #ai: “${ai.slice(0, 60)}…”`).toBe(true);
  const terms = flat(await page.locator(".legal-body").innerText());
  for (const words of WP66_TERMS_GONE) expect(terms, `/terms/: “${words}”`).not.toContain(words);
  for (const language of ["es", "ca"] as const) {
    const url = legalPath("terms", language);
    await page.goto(url);
    await expect(page.locator(".legal-body section#service p").first(), `${url} #service`).toHaveText(
      WP66_TERMS_KEPT[language].service,
    );
    await expect(page.locator(".legal-body section#ai p").first(), `${url} #ai`).toHaveText(WP66_TERMS_KEPT[language].ai);
  }
});

test("WEB-1506: privacy §8 has no links in any language, and §5 still links Cloudflare's privacy notice", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    const website = privacySection(page, "website");
    await expect(website, `${url} #website`).toHaveCount(1);
    await expect(website.getByRole("link"), `${url} #website: links`).toHaveCount(0);
    await expect(website.locator(".legal-links"), `${url} #website: a link list`).toHaveCount(0);
    const cloudflare = privacySection(page, "sharing").getByRole("link", { name: WP66_CLOUDFLARE[language] });
    await expect(cloudflare, `${url} #sharing: Cloudflare`).toHaveCount(1);
    await expect(cloudflare, `${url} #sharing: Cloudflare`).toHaveAttribute("href", "https://www.cloudflare.com/privacypolicy/");
  }
});

// ---- Run 2026-11-02-changes: WP268 (WEB-1801, WEB-1802, WEB-1803), privacy §7 says what a
// deletion leaves on the server, §5 names a task's Activity, the delete page's §3 names notes;
// one version move (proved by WEB-213's and WEB-109's tests above, axe by the 12 legal pages' test).

// WEB-1801: privacy §7's first bullet, the brief's exact copy.
const WP268_RETENTION: Copy = {
  en: "Account and personal cloud content: kept while you have your account. We never delete your tasks on our own, done or not. A task, note or project you delete leaves your devices and its files are removed, but our server keeps the rest of it, hidden, until you delete your account (if it was in a shared project, it stays with that project). Account deletion removes your personal database records and sessions.",
  es: "Cuenta y contenido personal en la nube: se conservan mientras tengas la cuenta. Nunca borramos tus tareas por nuestra cuenta, estén hechas o no. Una tarea, nota o proyecto que borras desaparece de tus dispositivos y se eliminan sus archivos, pero nuestro servidor guarda el resto, oculto, hasta que elimines tu cuenta (si estaba en un proyecto compartido, se queda con ese proyecto). Eliminar la cuenta suprime sus registros personales en la base de datos y sus sesiones.",
  ca: "Compte i contingut personal al núvol: es conserven mentre tinguis el compte. No esborrem mai les teves tasques pel nostre compte, fetes o no. Una tasca, nota o projecte que esborres desapareix dels teus dispositius i se’n suprimeixen els fitxers, però el nostre servidor en conserva la resta, oculta, fins que suprimeixis el compte (si era en un projecte compartit, es queda amb aquell projecte). Suprimir el compte elimina els registres personals de la base de dades i les sessions.",
};
const WP268_NEVER_DELETE: Copy = {
  en: "We never delete your tasks on our own, done or not.",
  es: "Nunca borramos tus tareas por nuestra cuenta, estén hechas o no.",
  ca: "No esborrem mai les teves tasques pel nostre compte, fetes o no.",
};
const WP268_RETENTION_GONE = [
  "synchronisation metadata",
  "metadatos de sincronización",
  "metadades de sincronització",
  "until you delete the content",
  "hasta que eliminas el contenido",
  "fins que suprimeixes el contingut",
];

// WEB-1802: §5's first paragraph as it was at d4c4e94 (WD28's sentence included), its old
// second sentence, and the brief's new one. Only that sentence may change.
const WP268_SHARING_OLD: Copy = {
  en: "Personal content is not made public by default. Members of a shared project see your name on the tasks you create there (“Created by”) and on tasks assigned to you; if you haven’t given a name, they see the start of your email address. They can also show just one person’s tasks. Reminders aren’t shared: each person has their own. A task, note or file placed in a shared project is available to its authorised members according to their roles. Group administrators/owners can manage access. Other members may download or copy content; leaving a group or deleting your account cannot remotely erase their independent copies.",
  es: "Tu contenido personal no es público por defecto. Los miembros de un proyecto compartido ven tu nombre en las tareas que creas en él («Creada por») y en las que tienes asignadas; si no has dado un nombre, ven el principio de tu correo. También pueden ver solo las tareas de una persona. Los recordatorios no se comparten: cada persona tiene los suyos. Lo que colocas en un proyecto compartido es accesible a sus miembros autorizados según sus roles. Los responsables del grupo administran el acceso. Los miembros pueden descargar copias; abandonar un grupo o eliminar la cuenta no borra remotamente esas copias independientes.",
  ca: "El contingut personal no és públic per defecte. Els membres d’un projecte compartit veuen el teu nom a les tasques que hi crees («Creada per») i a les que tens assignades; si no has donat cap nom, veuen l’inici del teu correu. També poden veure només les tasques d’una persona. Els recordatoris no es comparteixen: cada persona té els seus. El contingut d’un projecte compartit és accessible als membres autoritzats segons el rol. Els responsables gestionen l’accés. Els membres poden descarregar còpies; sortir del grup o suprimir el compte no les esborra remotament.",
};
const WP268_SHARING_OLD_SECOND: Copy = {
  en: "Members of a shared project see your name on the tasks you create there (“Created by”) and on tasks assigned to you; if you haven’t given a name, they see the start of your email address.",
  es: "Los miembros de un proyecto compartido ven tu nombre en las tareas que creas en él («Creada por») y en las que tienes asignadas; si no has dado un nombre, ven el principio de tu correo.",
  ca: "Els membres d’un projecte compartit veuen el teu nom a les tasques que hi crees («Creada per») i a les que tens assignades; si no has donat cap nom, veuen l’inici del teu correu.",
};
const WP268_SHARING_SECOND: Copy = {
  en: "Members of a shared project see your name on the tasks you create there (“Created by”), on tasks assigned to you, and in a task’s Activity, next to each change you made and its date; if you haven’t given a name, they see the start of your email address.",
  es: "Los miembros de un proyecto compartido ven tu nombre en las tareas que creas en él («Creada por»), en las que tienes asignadas y en la «Actividad» de cada tarea, junto a cada cambio que hiciste y su fecha; si no has dado un nombre, ven el principio de tu correo.",
  ca: "Els membres d’un projecte compartit veuen el teu nom a les tasques que hi crees («Creada per»), a les que tens assignades i a l’«Activitat» de cada tasca, al costat de cada canvi que hi has fet i la data; si no has donat cap nom, veuen l’inici del teu correu.",
};
const WP268_ACTIVITY: Copy = { en: "Activity", es: "«Actividad»", ca: "«Activitat»" };

// WEB-1803: the delete page's §3 second bullet: the brief's first sentence, then the rest as it was.
const WP268_STAYS: Copy = {
  en: "Stays for the others: tasks, notes and files you added to shared projects.",
  es: "Se queda para los demás: las tareas, notas y archivos que añadiste a proyectos compartidos.",
  ca: "Es queda per als altres: les tasques, les notes i els fitxers que vas afegir a projectes compartits.",
};
const WP268_STAYS_REST: Copy = {
  en: "Your name is taken off them, “Created by” included, but what you wrote inside them doesn’t change. Projects and groups you own pass to another member; the app tells you who before you confirm. Ask support about personal details inside shared content.",
  es: "Se quita tu nombre, también de «Creada por», pero lo que escribiste en ellos no cambia. Los proyectos y grupos que son tuyos pasan a otro miembro; la app te dice a quién antes de confirmar. Si dentro hay datos personales tuyos, escribe a soporte.",
  ca: "Se’n treu el teu nom, també de «Creada per», però el que hi vas escriure no canvia. Els projectes i grups que són teus passen a un altre membre; l’app et diu a qui abans de confirmar. Si a dins hi ha dades personals teves, escriu a suport.",
};
const WP268_NOTES: Copy = { en: "notes", es: "notas", ca: "notes" };
const WP268_STAYS_GONE = ["tasks and files you added", "las tareas y archivos que añadiste", "les tasques i els fitxers que vas afegir"];

for (const theme of THEMES) {
  test.describe(`${theme} WP268 legal`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1801: privacy §7's first bullet says a deleted task, note or project stays hidden on our server until the account goes, keeps ‘We never delete your tasks…’ and drops the sync-metadata wording (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("privacy", language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const first = privacySection(page, "retention").locator("li").first();
        await expect(first, `${url} #retention`).toBeVisible();
        await expect(first, `${url} #retention: the first bullet`).toHaveText(WP268_RETENTION[language]);
        expect(flat(await first.innerText()), `${url} #retention`).toContain(WP268_NEVER_DELETE[language]);
        const retention = await sectionText(page, "retention");
        for (const words of WP268_RETENTION_GONE) expect(retention, `${url} #retention: “${words}”`).not.toContain(words);
      }
    });

    test(`WEB-1802: privacy §5's first paragraph names a task's Activity in its second sentence, keeps WD28's reminders sentence after ‘…just one person’s tasks.’, and nothing else in it changed (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("privacy", language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const first = privacySection(page, "sharing").locator("p").first();
        await expect(first, url).toBeVisible();
        const old = WP268_SHARING_OLD[language];
        expect(old, `${url}: the old second sentence`).toContain(WP268_SHARING_OLD_SECOND[language]);
        await expect(first, `${url} #sharing: the first paragraph`).toHaveText(
          old.replace(WP268_SHARING_OLD_SECOND[language], WP268_SHARING_SECOND[language]),
        );
        const text = flat(await first.innerText());
        expect(text, `${url} #sharing: the second sentence, then the anchor and WD28's sentence`).toContain(
          `${WP268_SHARING_SECOND[language]} ${WP66_SHARING_ANCHOR[language]} ${WP66_NOT_SHARED[language]}`,
        );
        expect(text, `${url} #sharing`).toContain(WP66_CREATED_BY[language]);
        expect(text, `${url} #sharing`).toContain(WP268_ACTIVITY[language]);
      }
    });

    test(`WEB-1803: the delete page's §3 second bullet starts ‘Stays for the others: tasks, notes and files…’, its rest unchanged, and summary 01 and §3's first two bullets each name notes (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("delete-account", language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const bullets = page.locator(".legal-body section#scope li");
        await expect(bullets.nth(1), `${url} #scope`).toBeVisible();
        await expect(bullets.nth(1), `${url} #scope: the second bullet`).toHaveText(
          `${WP268_STAYS[language]} ${WP268_STAYS_REST[language]}`,
        );
        const notes = new RegExp(`\\b${WP268_NOTES[language]}\\b`);
        const summary01 = flat(await page.locator(".legal-summary li").first().innerText());
        expect(summary01, `${url}: summary 01`).toMatch(notes);
        for (const index of [0, 1])
          expect(flat(await bullets.nth(index).innerText()), `${url} #scope: bullet ${index + 1}`).toMatch(notes);
      }
    });
  });
}

plain("WEB-1803: src/content/legal/ says no ‘tasks and files you added’ in any language", () => {
  const folder = path.join(ROOT, "src", "content", "legal");
  const files = readdirSync(folder);
  expect(files).toEqual(expect.arrayContaining(["en.ts", "es.ts", "ca.ts"]));
  const found: string[] = [];
  for (const file of files) {
    const text = readFileSync(path.join(folder, file), "utf8");
    for (const words of WP268_STAYS_GONE) if (text.includes(words)) found.push(`${file}: “${words}”`);
  }
  expect(found).toEqual([]);
});

test("WEB-1801, WEB-1803: at 320 × 800, the Spanish and Catalan privacy and delete pages don't scroll sideways, and the changed bullets reflow inside the screen", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The narrowest phone.");
  await page.setViewportSize({ width: 320, height: 800 });
  for (const language of ["es", "ca"] as const)
    for (const [document, id, index] of [
      ["privacy", "retention", 0],
      ["privacy", "sharing", -1],
      ["delete-account", "scope", 1],
    ] as const) {
      const url = legalPath(document, language);
      await page.goto(url);
      await hydrated(page);
      await fontsReady(page);
      expect(await scrollsSideways(page), `${url} at 320 px`).toBe(false);
      const changed =
        index < 0 ? privacySection(page, id).locator("p").first() : privacySection(page, id).locator("li").nth(index);
      const box = await changed.boundingBox();
      expect(box, `${url} #${id}`).not.toBeNull();
      expect(box!.x, `${url} #${id}: left edge`).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `${url} #${id}: right edge`).toBeLessThanOrEqual(320.5);
      expect(box!.height, `${url} #${id}: wraps onto several lines`).toBeGreaterThan(60);
    }
});

// ---- Run 2026-11-05-pages: WP271 (WEB-2001, WEB-1904, WEB-1502, WEB-1906, WEB-1905, WEB-1907),
// the privacy summary, §2–§4 and §9 and terms §5: meeting wording, no review-before-saving
// promise, no widow. The copy is the plan's, exact: the checks are about the wording. ----

// Summary 02 before WP271, and the last clause WEB-1905 changes in it.
const WP271_SUMMARY_02_BEFORE: Copy = {
  en: "Your words go to Google’s AI only when you ask TaskFlow to understand them: to add, find or change tasks, to ask for reminders in your own words, or to make notes from a meeting you record.",
  es: "Tus palabras solo van a la IA de Google cuando pides a TaskFlow que las entienda: para añadir, buscar o cambiar tareas, para pedir recordatorios con tus palabras o para hacer notas de una reunión que grabas.",
  ca: "Les teves paraules només van a la IA de Google quan demanes a TaskFlow que les entengui: per afegir, cercar o canviar tasques, per demanar recordatoris amb les teves paraules o per fer notes d’una reunió que graves.",
};
const WP271_SUMMARY_02_OLD_END: Copy = {
  en: "…or to make notes from a meeting you record.",
  es: "…o para hacer notas de una reunión que grabas.",
  ca: "…o per fer notes d’una reunió que graves.",
};
const WP271_SUMMARY_02_NEW_END: Copy = {
  en: "…or to make notes from a meeting you record, with everyone’s words in it.",
  es: "…o para hacer notas de una reunión que grabas, con lo que dice cada persona.",
  ca: "…o per fer notes d’una reunió que enregistres, amb el que hi diu cadascú.",
};
const wp271Summary02 = (language: Language) =>
  WP271_SUMMARY_02_BEFORE[language].replace(
    WP271_SUMMARY_02_OLD_END[language].slice(1),
    WP271_SUMMARY_02_NEW_END[language].slice(1),
  );

// WEB-2001: terms §5's checking sentence, and privacy §4's last sentence.
const WP271_TERMS_CHECK: Copy = {
  en: "Check titles, dates, times, priorities, notes, recipients and project assignments before saving, sharing or relying on them.",
  es: "Revisa título, fecha, hora, prioridad, notas y destinatarios antes de guardarlos, compartirlos o fiarte de ellos.",
  ca: "Revisa títol, data, hora, prioritat, notes, projecte i destinataris abans de desar-los, compartir-los o refiar-te’n.",
};
const WP271_TERMS_GONE: Copy = { en: "before saving or sharing", es: "antes de guardar o compartir", ca: "abans de desar/compartir" };
const WP271_PRIVACY_REVIEW: Copy = {
  en: "Review every generated date, time, assignment and note before saving or relying on it.",
  es: "Revisa fechas, horas, asignaciones y notas antes de guardarlas o fiarte de ellas.",
  ca: "Revisa dates, hores, assignacions i notes abans de desar-les o refiar-te’n.",
};

// WEB-1904: the meeting sentences' words, and §4 ¶2's list of what the notes hold.
const WP271_MEETING_LIST: Copy = {
  en: "(a summary, to-dos, decisions and open questions)",
  es: "(un resumen, las cosas por hacer, las decisiones y las preguntas abiertas)",
  ca: "(un resum, les coses per fer, les decisions i les preguntes obertes)",
};
const WP271_CA_MEETING = {
  data: "Amb Pro, una reunió que enregistres:",
  second: "Amb Pro pots enregistrar una reunió per tenir-ne notes. Mentre enregistres, l’app envia",
  last: "Avisa les persones d’una reunió abans d’enregistrar-la, i no gravis tercers",
};
const WP271_CA_GONE = ["gravar una reunió", "que graves", "Mentre graves", "abans de gravar-la"];
const WP271_TODOS_GONE = ["tareas pendientes", "tasques pendents"];

// WEB-1906: §4's provider paragraphs and the provider link.
const WP271_GOOGLE_RETURNS: Copy = {
  en: "and for a meeting, its text and notes.",
  es: "y, si es una reunión, su texto y sus notas.",
  ca: "i, si és una reunió, el seu text i les seves notes.",
};
const WP271_OUTSIDE_EU_GONE: Copy = {
  en: "and process it outside the EU",
  es: "y procesarlos fuera de la UE",
  ca: "i processar-les fora de la UE",
};
const WP271_KEEP_END: Copy = {
  en: "for caching, safety and abuse monitoring.",
  es: "para caché, seguridad y prevención de abusos.",
  ca: "per a memòria cau, seguretat i prevenció d’abusos.",
};
const WP271_KEPT: Record<Language, string[]> = {
  en: ["Google can process it outside the EU.", "We do not promise zero retention or EU-only processing."],
  es: ["Google puede procesarlo fuera de la UE.", "No prometemos retención cero ni tratamiento exclusivamente en la UE."],
  ca: ["Google ho pot processar fora de la UE.", "No prometem retenció zero ni tractament exclusiu a la UE."],
};
const WP271_SERVICE_TERMS: Copy = {
  en: "Google Cloud service terms, including Vertex AI",
  es: "Condiciones específicas de Google Cloud, incluida Vertex AI",
  ca: "Condicions específiques de Google Cloud, inclosa Vertex AI",
};

// WEB-1907: §3 and §9.
const WP271_PURPOSES: Copy = {
  en: "The AI suggests titles, dates and priorities for your review, and writes the notes of meetings you record; it does not",
  es: "La IA propone títulos, fechas y prioridades para tu revisión, y redacta las notas de las reuniones que grabas; no toma",
  ca: "La IA proposa títols, dates i prioritats perquè els revisis, i redacta les notes de les reunions que enregistres; no pren",
};
const WP271_PERMISSIONS: Copy = {
  en: "notifications for reminders and meeting recordings",
  es: "notificaciones para recordatorios y grabaciones de reuniones",
  ca: "notificacions per recordar i per als enregistraments de reunions",
};

// Each word's last line top in a paragraph, from a Range over its characters.
const wordTops = (locator: ReturnType<Page["locator"]>) =>
  locator.evaluate((element) => {
    const result: number[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const value = node.textContent ?? "";
      for (const match of value.matchAll(/\S+/g)) {
        const range = document.createRange();
        range.setStart(node, match.index!);
        range.setEnd(node, match.index! + match[0].length);
        const rects = range.getClientRects();
        result.push(rects[rects.length - 1].top);
      }
    }
    return result;
  });

const voiceParagraphs = (page: Page) => page.locator(".legal-body section#voice > p");

for (const theme of THEMES) {
  test.describe(`${theme} WP271`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1502: at 390 × 664, summary 02's last line holds two words or more in each language, and its paragraph wraps pretty (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile", "A 390 px phone.");
      await page.setViewportSize({ width: 390, height: 664 });
      for (const language of languages) {
        const url = legalPath("privacy", language);
        await page.goto(url);
        await hydrated(page);
        await fontsReady(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const text = summary02(page).locator("p");
        await expect(text, url).toHaveText(wp271Summary02(language));
        const wrap = await text.evaluate((element) => {
          const style = getComputedStyle(element);
          return `${style.getPropertyValue("text-wrap-style")} ${style.getPropertyValue("text-wrap")}`;
        });
        expect(wrap, `${url}: summary 02's text-wrap`).toContain("pretty");
        const tops = await wordTops(text);
        expect(tops.length, `${url}: summary 02's words`).toBe(wp271Summary02(language).split(" ").length);
        const last = Math.max(...tops);
        expect(tops.filter((top) => Math.abs(top - last) < 2).length, `${url}: words on summary 02's last line`).toBeGreaterThanOrEqual(2);
      }
    });

    test(`WEB-1905: summary 02 ends ‘…with everyone’s words in it.’ and the rest of it is unchanged, in each language (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("privacy", language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const text = summary02(page).locator("p");
        await expect(text, url).toBeVisible();
        await expect(text, `${url}: summary 02`).toHaveText(wp271Summary02(language));
        expect(flat(await text.innerText()).endsWith(WP271_SUMMARY_02_NEW_END[language].slice(1)), url).toBe(true);
      }
    });

    test(`WEB-2001: terms §5 asks to check before saving, sharing or relying on them, and privacy §4 ends with the review sentence that covers saved notes, in each language (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const terms = legalPath("terms", language);
        await page.goto(terms);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator(".legal-body section#ai"), terms).toBeVisible();
        const ai = await sectionText(page, "ai");
        expect(ai, `${terms} #ai`).toContain(WP271_TERMS_CHECK[language]);
        expect(ai, `${terms} #ai`).not.toContain(WP271_TERMS_GONE[language]);

        const privacy = legalPath("privacy", language);
        await page.goto(privacy);
        const paragraphs = voiceParagraphs(page);
        await expect(paragraphs, `${privacy} #voice`).toHaveCount(5);
        const last = flat(await paragraphs.last().innerText());
        expect(last.endsWith(` ${WP271_PRIVACY_REVIEW[language]}`), `${privacy} #voice ends “…${last.slice(-100)}”`).toBe(true);
      }
    });

    test(`WEB-1904: §4's second paragraph lists ‘the things to do’ as the app names them, and the Catalan meeting sentences say «enregistrar» (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("privacy", language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const second = flat(await voiceParagraphs(page).nth(1).innerText());
        expect(second, `${url} #voice ¶2`).toContain(WP271_MEETING_LIST[language]);
        const text = flat(await article(page).innerText());
        for (const words of WP271_TODOS_GONE) expect(text, `${url}: “${words}”`).not.toContain(words);
        if (language !== "ca") continue;
        expect(await sectionText(page, "data"), `${url} #data`).toContain(WP271_CA_MEETING.data);
        expect(second.startsWith(WP271_CA_MEETING.second), `${url} #voice ¶2 begins “${second.slice(0, 90)}…”`).toBe(true);
        expect(flat(await voiceParagraphs(page).last().innerText()), `${url} #voice's last paragraph`).toContain(
          WP271_CA_MEETING.last,
        );
        // Dictation keeps «gravar» / «gravació».
        expect(flat(await voiceParagraphs(page).first().innerText()), `${url} #voice ¶1`).toContain("gravació");
        expect(await sectionText(page, "permissions"), `${url} #permissions`).toContain("micròfon per gravar");
      }
    });

    test(`WEB-1906: §4 says Google returns a meeting's text and notes, ¶4 drops ‘and process it outside the EU’ but §4 keeps both EU sentences, and the provider link is named in each language (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("privacy", language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const paragraphs = voiceParagraphs(page);
        expect(flat(await paragraphs.nth(2).innerText()), `${url} #voice ¶3`).toContain(WP271_GOOGLE_RETURNS[language]);
        const fourth = flat(await paragraphs.nth(3).innerText());
        expect(fourth, `${url} #voice ¶4`).not.toContain(WP271_OUTSIDE_EU_GONE[language]);
        expect(fourth, `${url} #voice ¶4`).toContain(WP271_KEEP_END[language]);
        const voice = await sectionText(page, "voice");
        expect(voice, `${url} #voice`).not.toContain(WP271_OUTSIDE_EU_GONE[language]);
        for (const sentence of WP271_KEPT[language]) expect(voice, `${url} #voice`).toContain(sentence);
        const link = page.locator('.legal-body section#voice a[href="https://cloud.google.com/terms/service-terms"]');
        await expect(link, `${url} #voice: the service terms link`).toBeVisible();
        await expect(link, `${url} #voice: the service terms link`).toHaveAccessibleName(WP271_SERVICE_TERMS[language]);
      }
    });

    test(`WEB-1907: privacy §3 says the AI writes the notes of meetings you record, outside ‘for your review’, and §9 asks for notifications for meeting recordings, in each language (${theme})`, async ({
      page,
    }) => {
      for (const language of languages) {
        const url = legalPath("privacy", language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator(".legal-body section#purposes"), url).toBeVisible();
        expect(await sectionText(page, "purposes"), `${url} #purposes`).toContain(WP271_PURPOSES[language]);
        expect(await sectionText(page, "permissions"), `${url} #permissions`).toContain(WP271_PERMISSIONS[language]);
      }
    });

    test(`WP271: the privacy and terms pages have no axe violations, in each language (${theme})`, async ({ page }) => {
      for (const language of languages)
        for (const document of ["privacy", "terms"] as const) {
          const url = legalPath(document, language);
          await page.goto(url);
          await hydrated(page);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          expect(await axeViolations(page), url).toEqual([]);
        }
    });
  });
}

plain("WEB-1904: src/content/legal/ca.ts says no «gravar una reunió», «que graves», «Mentre graves» or «abans de gravar-la», and neither es.ts nor ca.ts says «tareas pendientes» or «tasques pendents»", () => {
  const read = (file: string) => readFileSync(path.join(ROOT, "src", "content", "legal", file), "utf8");
  const found: string[] = [];
  const ca = read("ca.ts");
  for (const words of WP271_CA_GONE) if (ca.includes(words)) found.push(`ca.ts: «${words}»`);
  for (const file of ["es.ts", "ca.ts"])
    for (const words of WP271_TODOS_GONE) if (read(file).includes(words)) found.push(`${file}: «${words}»`);
  expect(found).toEqual([]);
});

for (const [width, height, doubled] of [
  [320, 800, false],
  [320, 800, true],
  [390, 664, true],
] as const)
  test(`WP271: at ${width} px${doubled ? " with text at 200%" : ""}, the privacy summary cards and §4 reflow inside the screen with no sideways scroll, in each language`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "A phone.");
    await page.setViewportSize({ width, height });
    if (doubled) await doubleTextSize(page);
    for (const language of languages) {
      const url = legalPath("privacy", language);
      await page.goto(url);
      await hydrated(page);
      await fontsReady(page);
      if (doubled) expect(await rootFontSize(page), `${url}: the root font size`).toBe(32);
      expect(await scrollsSideways(page), `${url} at ${width} px`).toBe(false);
      const parts = [
        ...(await page.locator(".legal-summary li").all()),
        ...(await voiceParagraphs(page).all()),
        page.locator(".legal-body section#voice .legal-links"),
      ];
      expect(parts.length, `${url}: three cards, five paragraphs and the links`).toBe(9);
      for (const [index, part] of parts.entries()) {
        const box = await part.boundingBox();
        expect(box, `${url}: part ${index + 1}`).not.toBeNull();
        expect(box!.x, `${url}: part ${index + 1}'s left edge`).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width, `${url}: part ${index + 1}'s right edge`).toBeLessThanOrEqual(width + 0.5);
      }
    }
  });
