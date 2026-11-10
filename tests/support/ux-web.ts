// Shared helpers for the UX web loop's acceptance tests (tests/ux-web-*.spec.ts).
//
// Every test gets the guard below automatically: /api/voice/* is answered by the renders'
// VoiceStub, in the shapes the site's server returns, and any request to another origin
// is blocked, so no test ever reaches the real voice API or an outside service.
import { test as base, expect, type Page } from "./test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VoiceStub } from "./ux-voice";

export type Language = "en" | "es" | "ca";
export type Theme = "light" | "dark";
export const LANGUAGES: Language[] = ["en", "es", "ca"];
export const THEMES: Theme[] = ["light", "dark"];
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const homeUrl = (language: Language) => (language === "en" ? "/" : `/${language}/`);
// A page the site has in each language: /privacy/, /es/privacy/, /ca/privacy/.
export const pageUrl = (language: Language, page: string) => `${homeUrl(language)}${page}/`;

// Resolves once React has hydrated the frame: the theme controls stay disabled until then.
export async function hydrated(page: Page) {
  await page.waitForFunction(
    () =>
      document.readyState === "complete" &&
      document.querySelectorAll("button.theme-toggle").length > 0 &&
      !document.querySelector("button.theme-toggle:disabled"),
    null,
    { timeout: 15_000 },
  );
}

// Collects React's hydration errors (console errors and uncaught page errors) from now on.
export function watchHydration(page: Page) {
  const errors: string[] = [];
  const hydration = /hydrat|did not match|server rendered|#418|#423|#425/i;
  page.on("console", (message) => {
    if (message.type() === "error" && hydration.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => {
    if (hydration.test(error.message)) errors.push(error.message);
  });
  return errors;
}

export const test = base.extend<{ voice: VoiceStub }>({
  voice: [
    async ({ page, baseURL }, use) => {
      const voice = new VoiceStub();
      await voice.install(page, baseURL!);
      await use(voice);
    },
    { auto: true },
  ],
});
export { expect };

// axe with the suite's tags; the result lists each rule with the nodes it failed on.
export async function axeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations.map(({ id, nodes }) => ({
    id,
    failures: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
  }));
}

// Waits until the fonts and every displayed image have loaded, so positions are final.
// Images below the fold load lazily, when scrolled near; they're asked for now instead.
export async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await loadLazyImages(page);
  await page.waitForFunction(() =>
    Array.from(document.images)
      .filter((image) => image.checkVisibility())
      .every((image) => image.complete && image.naturalWidth > 0),
  );
}

// Turns every lazy image eager, so a check that doesn't scroll can wait for all of them.
export async function loadLazyImages(page: Page) {
  await page.evaluate(() =>
    document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((image) => {
      image.loading = "eager";
    }),
  );
}

export async function scrollsSideways(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

// The smallest computed font size, in px, of the visible text inside the selector.
export async function smallestText(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const root = document.querySelector(selector);
    if (!root) throw new Error(`No element matches ${selector}`);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const sizes: { text: string; size: number }[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim();
      const parent = node.parentElement;
      if (!text || !parent || !parent.checkVisibility()) continue;
      sizes.push({ text, size: parseFloat(getComputedStyle(parent).fontSize) });
    }
    sizes.sort((a, b) => a.size - b.size);
    return sizes[0] ?? null;
  }, selector);
}

// Visible text under `px` CSS px on the page, outside the elements `skip` matches. Text
// inside aria-hidden counts: people still see it (as AUDIT §6 counts it).
export async function textUnder(page: Page, px: number, skip: string[] = []) {
  return page.evaluate(
    ({ px, skip }) => {
      const found: { text: string; size: number; element: string }[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent?.trim();
        const parent = node.parentElement;
        if (!text || !parent || !parent.checkVisibility()) continue;
        if (parent.closest("script, style, noscript, template")) continue;
        if (skip.some((selector) => parent.closest(selector))) continue;
        const { width, height } = parent.getBoundingClientRect();
        if (width <= 1 || height <= 1) continue; // Visually hidden (screen-reader only).
        const size = parseFloat(getComputedStyle(parent).fontSize);
        if (size < px)
          found.push({ text: text.slice(0, 60), size, element: `${parent.tagName.toLowerCase()}.${[...parent.classList].join(".")}` });
      }
      return found;
    },
    { px, skip },
  );
}

// text200: the browser's default font size from 16 to 32 px (Chrome's Settings › Appearance
// › Font size), as the renders set it. Text sized in rem doubles; text in px doesn't.
export async function doubleTextSize(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Page.setFontSizes", { fontSizes: { standard: 32, fixed: 26 } });
}
export const rootFontSize = (page: Page) =>
  page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));

type RGBA = [number, number, number, number];
export function parseColor(value: string): RGBA {
  const match = /rgba?\(([^)]+)\)/.exec(value);
  if (!match) throw new Error(`Unreadable colour: ${value}`);
  const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [parts[0], parts[1], parts[2], parts[3] ?? 1];
}
export function hexColor(hex: string): RGBA {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
}
function luminance([r, g, b]: RGBA) {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
// WCAG contrast of a colour (blended onto the background if translucent) on a background.
export function contrast(foreground: RGBA, background: RGBA) {
  const a = foreground[3];
  const blended: RGBA = [
    foreground[0] * a + background[0] * (1 - a),
    foreground[1] * a + background[1] * (1 - a),
    foreground[2] * a + background[2] * (1 - a),
    1,
  ];
  const [hi, lo] = [luminance(blended), luminance(background)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
