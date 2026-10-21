// Acceptance tests for the legal pages from the UX web loop, run 2026-10-18-site, that prove
// held changes (src/content/legal/ is the other session's untracked work): WP33's privacy §8.
// This file stays uncommitted with it. Round 1 adds WP24 (the legal pages keep the
// visitor's language) and WP25's checks on the legal pages; round 2 adds WP41 (the back
// link's arrow grows with its label). Batch 4, round 1 adds WP30 (each page names its
// document, readable text, plain labels, link previews), WP31 (privacy and terms say what
// the app and the site do today) and WP32 (the delete page). Batch 5 adds WP47 (suggested
// tasks and limits, not drafts, allowances or transcripts). See tests/support/ux-web.ts.
import { test as plain, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
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
    "Live demo: we don’t keep your recording. The text and the tasks found in it are kept encrypted for up to 24 hours, so trying again doesn’t use another try, and are then deleted automatically. The live demo sends your recording or text to Google only when you tap Done. Nothing from it is saved to an app account.",
  "/es/privacy/":
    "Demo en directo: no guardamos tu grabación. El texto y las tareas encontradas se guardan cifrados hasta 24 horas, para que volver a probar no gaste otro intento, y después se borran automáticamente. La demo en directo envía tu grabación o tu texto a Google solo cuando tocas Listo. Nada de ella se guarda en una cuenta de la app.",
  "/ca/privacy/":
    "Demo en directe: no desem la gravació. El text i les tasques trobades es desen xifrats fins a 24 hores, perquè tornar-ho a provar no gasti un altre intent, i després s’esborren automàticament. La demo en directe envia la gravació o el text a Google només quan toques Fet. Res d’ella es desa en un compte de l’app.",
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

test("WEB-2: each legal page's back link goes to the home in the page's language", async ({ page }) => {
  for (const { language, url } of LEGAL_PAGES) {
    await page.goto(url);
    const back = page.getByRole("main").getByRole("link", { name: ui[language].back, exact: true });
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
    }) => {
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
}) => {
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
  for (const { url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    const links = await frameSizes(page);
    const utility = await page
      .locator("main .legal-utility a")
      .evaluateAll((elements) => elements.map((element) => parseFloat(getComputedStyle(element).fontSize)));
    expect(utility.length, `${url}: the back link and the switch's links`).toBe(4);
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
  { url: "/ca/delete-account/", language: "ca" },
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
  expect(COMPANY.version, "company.json's version: the day WP47 ran").toBe("2026-10-20");
  // The plan's examples for 2026-10-20. The brief asks for Intl's long date; for Catalan, ICU
  // writes «20 d’octubre del 2026» where the plan's example has «de 2026»: either is the long date.
  const examples: Record<Language, RegExp> = {
    en: /^20 October 2026$/,
    es: /^20 de octubre de 2026$/,
    ca: /^20 d’octubre del? 2026$/,
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

test("WEB-204: on the delete pages the language switch comes after the request box and before the summary, in the DOM and on screen, and goes to the delete page in each language; on the other legal pages it stays in the top row, above the h1", async ({
  page,
}) => {
  for (const { language, document, url } of LEGAL_PAGES) {
    await page.goto(url);
    await hydrated(page);
    const pill = switchInArticle(page);
    await expect(pill, url).toHaveCount(1);
    await expect(pill, url).toBeVisible();
    if (document === "delete-account") {
      const order = await pill.evaluate((element) => {
        const box = element.ownerDocument.querySelector("article.legal-page .legal-request")!;
        const summary = element.ownerDocument.querySelector("article.legal-page .legal-summary")!;
        return {
          afterBox: !!(box.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING),
          beforeSummary: !!(summary.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING),
          inTopRow: !!element.closest(".legal-utility:not(.legal-utility--languages)"),
        };
      });
      expect(order, `${url}: where the switch is in the DOM`).toEqual({ afterBox: true, beforeSummary: true, inTopRow: false });
      const [box, at, summary] = [
        (await article(page).locator(".legal-request").boundingBox())!,
        (await pill.boundingBox())!,
        (await article(page).locator(".legal-summary").boundingBox())!,
      ];
      expect(at.y, `${url}: the switch under the request box`).toBeGreaterThanOrEqual(box.y + box.height - 1);
      expect(at.y + at.height, `${url}: the switch above the summary`).toBeLessThanOrEqual(summary.y + 1);
      const targets = await pill
        .getByRole("link")
        .evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).pathname));
      for (const other of languages.filter((other) => other !== language))
        expect(targets, `${url}: a link to the ${other} delete page`).toContain(deletePath(other));
      expect(targets.every((target) => target.endsWith("/delete-account/")), `${url}: ${targets.join(", ")}`).toBe(true);
    } else {
      expect(
        await pill.evaluate((element) => !!element.closest(".legal-utility:not(.legal-utility--languages)")),
        `${url}: the switch in the top row`,
      ).toBe(true);
      const [at, h1] = [(await pill.boundingBox())!, (await page.getByRole("heading", { level: 1 }).boundingBox())!];
      expect(at.y + at.height, `${url}: the switch above the h1`).toBeLessThanOrEqual(h1.y + 1);
    }
  }
});

for (const width of [390, 320] as const) {
  test(`WEB-726: at ${width} px, each legal page's version line is one line, says only ‘In force since’ and the date, and the footer still names the company`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Phone widths.");
    await page.setViewportSize({ width, height: width === 320 ? 568 : 664 });
    for (const { language, url } of LEGAL_PAGES) {
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
    en: "the text of what you said, suggested tasks",
    es: "el texto de lo que dijiste, tareas sugeridas",
    ca: "el text del que has dit, tasques suggerides",
  } as Copy,
  route: {
    en: "The app can use Google’s Gemini API, with Google Cloud’s Vertex AI as a fallback; the website demonstration uses Vertex AI.",
    es: "La app puede usar Gemini API de Google, con Vertex AI de Google Cloud como alternativa; la demo web utiliza Vertex AI.",
    ca: "L’app pot fer servir Gemini API de Google, amb Vertex AI de Google Cloud com a alternativa; la demo web utilitza Vertex AI.",
  } as Copy,
  outsideEu: {
    en: "Google can process it outside the EU",
    es: "Google puede procesarlo fuera de la UE",
    ca: "Google ho pot processar fora de la UE",
  } as Copy,
  // §4's third paragraph, which WD12 keeps as it is.
  third: {
    en: "Google’s contractual treatment depends on the service and account tier. Paid Gemini API terms and the EEA provisions specify that prompts/responses are not used to improve Google products; unpaid services outside those provisions can involve model improvement and human review. Provider safety retention and international processing still apply. See the linked provider terms. We do not promise zero retention or EU-only processing.",
    es: "El tratamiento contractual de Google depende del servicio y nivel de cuenta. Las condiciones de pago de Gemini API y las disposiciones para el EEE excluyen el uso de entradas/respuestas para mejorar productos de Google; los servicios gratuitos fuera de esas disposiciones pueden implicar mejora de modelos y revisión humana. Siguen siendo aplicables la conservación de seguridad y el procesamiento internacional. No prometemos retención cero ni tratamiento exclusivamente en la UE.",
    ca: "El tractament contractual de Google depèn del servei i nivell de compte. Les condicions de pagament de Gemini API i les disposicions per a l’EEE exclouen l’ús d’entrades/respostes per millorar productes de Google; els serveis gratuïts fora d’aquestes disposicions poden implicar millora de models i revisió humana. Continuen aplicant-se retenció de seguretat i processament internacional. No prometem retenció zero ni tractament exclusiu a la UE.",
  } as Copy,
};

test("WEB-729: privacy §2 lists the text of what you said and suggested tasks, and §4 names the Gemini API with Vertex AI as a fallback, its third paragraph unchanged", async ({
  page,
}) => {
  for (const language of languages) {
    const url = legalPath("privacy", language);
    await page.goto(url);
    expect(await sectionText(page, "data"), `${url} #data`).toContain(WP47_PRIVACY.data[language]);
    const voice = await sectionText(page, "voice");
    expect(voice, `${url} #voice: the route`).toContain(WP47_PRIVACY.route[language]);
    expect(voice, `${url} #voice: outside the EU`).toContain(WP47_PRIVACY.outsideEu[language]);
    await expect(page.locator(".legal-body section#voice > p").nth(2), `${url} #voice: the third paragraph`).toHaveText(
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
