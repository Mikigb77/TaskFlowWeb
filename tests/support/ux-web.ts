// Shared helpers for the UX web loop's acceptance tests (tests/ux-web-*.spec.ts).
//
// Every test gets the guard below automatically: /api/voice/* is answered by the renders'
// VoiceStub, in the shapes the site's server returns, and any request to another origin
// is blocked, so no test ever reaches the real voice API or an outside service.
import { test as base, expect, type Page } from "@playwright/test";
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
export async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    Array.from(document.images)
      .filter((image) => image.checkVisibility())
      .every((image) => image.complete && image.naturalWidth > 0),
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
