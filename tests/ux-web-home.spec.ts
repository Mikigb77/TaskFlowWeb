// Acceptance tests for the home (area H) from the UX web loop, run 2026-10-18-site:
// WP14 (the walkthrough, the appearance section, the slogan bar and a fake microphone go;
// the live demo moves under the hero), WP16 (the hero) and WP33 (the header and main half of
// WEB-6; the held half is in ux-web-frame, ux-web-voice and ux-web-legal). See
// tests/support/ux-web.ts.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import {
  axeViolations,
  doubleTextSize,
  expect,
  hexColor,
  homeUrl,
  LANGUAGES,
  parseColor,
  ROOT,
  rootFontSize,
  scrollsSideways,
  settle,
  test,
  THEMES,
} from "./support/ux-web";
import { HERO, TRY_VOICE, WHAT_IT_DOES } from "./support/ux-web-copy";

// Every image URL, decoded, so /_next/image?url=%2Fimages%2F… reads as /images/….
const decoded = (url: string) => decodeURIComponent(url);

for (const theme of THEMES) {
  test.describe(`${theme}`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-6, WEB-17, WEB-11, WEB-16: the walkthrough, the appearance section, the slogan bar and the drawn microphone are gone (${theme})`, async ({
      page,
      isMobile,
    }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      for (const gone of ["#demo", "#appearance", ".promise-bar", ".task-demo", ".voice-illustration"])
        await expect(page.locator(gone), gone).toHaveCount(0);
      await expect(page.getByRole("button", { name: /mood/i })).toHaveCount(0);
      // One theme control and nothing else about looks: the header's switch on desktop; on
      // phones, the menu's Appearance row (WP20).
      const looks = /\b(dark|light|mode|theme|appearance|mood)\b/i;
      const themeControls = page
        .getByRole("button", { name: looks })
        .or(page.getByRole("switch", { name: looks }))
        .or(page.getByRole("radio", { name: looks }))
        .or(page.getByRole("checkbox", { name: looks }));
      if (isMobile) {
        await expect(themeControls).toHaveCount(0);
        await page.locator(".header-menu summary").click();
        await expect(
          page.getByRole("group", { name: "Appearance" }).getByRole("button"),
        ).toHaveCount(2);
        await expect(themeControls).toHaveCount(2);
        return;
      }
      await expect(themeControls).toHaveCount(1);
      await expect(
        page.getByRole("button", {
          name: theme === "light" ? "Switch to dark mode" : "Switch to light mode",
          exact: true,
        }),
      ).toHaveCount(1);
    });

    test(`WEB-19, WEB-311: the visible hero image is the app's Calendar in the page's language, upright and unobstructed (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await settle(page);
        const image = page.locator(".hero-phone img").filter({ visible: true });
        await expect(image).toHaveCount(1);
        expect(await image.getAttribute("alt")).toContain(HERO.altWord[language]);
        const source = await image.evaluate((img: HTMLImageElement) => img.currentSrc || img.src);
        expect(decoded(source)).toContain(`hero-calendar-${language}-${theme}`);
        await expect
          .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
          .toBe(true);
        const box = (await image.boundingBox())!;
        if (testInfo.project.name === "mobile") expect(box.width).toBeGreaterThanOrEqual(272);
        // No rotation on the image or anything that holds it.
        const rotations = await image.evaluate((img) => {
          const found: string[] = [];
          for (let el: Element | null = img; el && !el.matches(".hero"); el = el.parentElement) {
            const style = getComputedStyle(el);
            if (style.rotate && style.rotate !== "none" && style.rotate !== "0deg")
              found.push(`${el.className}: rotate ${style.rotate}`);
            if (style.transform !== "none") {
              const m = new DOMMatrix(style.transform);
              if (Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6)
                found.push(`${el.className}: ${style.transform}`);
            }
          }
          return found;
        });
        expect(rotations, `${language}: rotated`).toEqual([]);
        // No floating card over the phone's screen.
        const overlaps = await page.evaluate(() => {
          const screen = document.querySelector(".hero-phone .phone-screen")!.getBoundingClientRect();
          return Array.from(document.querySelectorAll(".floating-note"))
            .filter((note) => note.checkVisibility())
            .map((note) => note.getBoundingClientRect())
            .filter(
              (b) =>
                Math.min(b.right, screen.right) - Math.max(b.left, screen.left) > 0 &&
                Math.min(b.bottom, screen.bottom) - Math.max(b.top, screen.top) > 0,
            ).length;
        });
        expect(overlaps, `${language}: a floating note covers the phone's screen`).toBe(0);
      }
    });

    test(`WEB-311: the home downloads only the visible theme's hero image (${theme})`, async ({
      page,
    }) => {
      const images: string[] = [];
      const other = theme === "light" ? "-dark" : "-light";
      page.on("request", (request) => {
        if (request.resourceType() === "image") images.push(decoded(request.url()));
      });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await settle(page);
      expect(images.filter((url) => url.includes(`hero-calendar-en-${theme}`))).toHaveLength(1);
      expect(images.filter((url) => url.includes(other))).toEqual([]);
      expect(images.filter((url) => url.includes("/images/agenda-"))).toEqual([]);
    });

    test(`WEB-1, WEB-3: the H1, the subheadline, the main button and the status line fit the first viewport in every language (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await settle(page);
        const hero = page.locator(".hero");
        const status = hero.getByText(HERO.status[language], { exact: true });
        await expect(status).toHaveText(HERO.status[language]);
        for (const [what, locator] of [
          ["h1", page.getByRole("heading", { level: 1 })],
          ["subheadline", hero.getByText(HERO.description[language], { exact: true })],
          ["button", hero.getByRole("link", { name: TRY_VOICE[language], exact: true })],
          ["status line", status],
        ] as const)
          await expect(locator, `${language}: ${what}`).toBeInViewport({ ratio: 1 });
      }
    });

    test(`WEB-6, WEB-19, WEB-707, WEB-705, WEB-706: axe reports no violations on the three homes (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await settle(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(await axeViolations(page), `${homeUrl(language)} in ${theme}`).toEqual([]);
      }
    });
  });
}

// WEB-5 (run 2026-10-21-changes, WP56): the hero images were rendered from the app again after
// it dropped the "· 0 completed" count and the "Any time" line under untimed tasks. What the
// new images show is a render check (home.*.fold.png, opengraph-image*.png); this keeps the
// files from going back to the 2026-10-19 render that showed those rows. A later re-render
// from the app (WEB-114, WD13) passes, as long as it keeps the app's 390-point, 2x size.
const STALE_HERO_SHA256: Record<string, string> = {
  "en-light": "e47331559943fba13266ecffee9595e85ed6835dfb871f57b3bc86feea9b9923",
  "en-dark": "45e5ba072b0ad1ee3fcf5c354ea0688246085b57595f51ac9e67e6da6b7ffe0b",
  "es-light": "3b6cfca584af7d289ecc7ef67189d3285bc8a326076dc11c84912d989fa70579",
  "es-dark": "8b597c7b9ea8b4325fb330172bae2b5d7ea04d2c28ea1e291f0244508a4acee0",
  "ca-light": "3d88e7e864c613aa4854cee4771b3798089988a67e800a3ee20cb0e963356c35",
  "ca-dark": "60706f15605948c6e20316c24063ae3304cafc554b3f86f41a4ca8f14e6c394c",
};

test("WEB-5: every hero image is a 780 × 1688 app render, not the 2026-10-19 one that showed rows the app removed", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a file check: once is enough");
  for (const language of LANGUAGES)
    for (const theme of THEMES) {
      const name = `${language}-${theme}`;
      const bytes = readFileSync(path.join(ROOT, "public", "images", `hero-calendar-${name}.png`));
      expect(bytes.subarray(1, 4).toString("latin1"), `${name}: a PNG`).toBe("PNG");
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], `${name}: size`).toEqual([780, 1688]);
      const sha = createHash("sha256").update(bytes).digest("hex");
      expect(sha, `${name}: still the 2026-10-19 render`).not.toBe(STALE_HERO_SHA256[name]);
    }
});

// The footer and /privacy/ half of this check proves a held change (WP33, Footer.tsx): it
// lives in tests/ux-web-frame.spec.ts, so this committed file depends on no held work.
test("WEB-6: no link in the header, the phone menu or the main content of a home leads to the removed walkthrough (#demo)", async ({
  page,
}) => {
  const found: string[] = [];
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    const links = await page
      .locator("header a[href], main a[href]")
      .evaluateAll((anchors) =>
        anchors
          .map((a) => `${a.textContent?.trim()} → ${a.getAttribute("href")}`)
          .filter((link) => link.endsWith("#demo")),
      );
    found.push(...links.map((link) => `${url}: ${link}`));
  }
  expect(found, "links to #demo").toEqual([]);
});

test("WEB-10: the live demo comes right after the hero, before the features", async ({ page }) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const order = await page.evaluate(() => {
      const hero = document.querySelector(".hero");
      const voice = document.querySelector("#voice");
      const features = document.querySelector("#features");
      // A display: contents wrapper (the demo's lang="en", WP34) draws no box: look through it.
      let next = hero?.nextElementSibling ?? null;
      while (next && getComputedStyle(next).display === "contents") next = next.firstElementChild;
      return {
        afterHero: next?.id ?? null,
        voiceBeforeFeatures:
          !!voice && !!features &&
          !!(voice.compareDocumentPosition(features) & Node.DOCUMENT_POSITION_FOLLOWING),
      };
    });
    expect(order, homeUrl(language)).toEqual({ afterHero: "voice", voiceBeforeFeatures: true });
  }
});

test("WEB-10: on a phone the live demo starts within about two screens, in every language", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Measured on the phone (390 × 664).");
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await settle(page);
    const top = await page
      .locator("#voice")
      .evaluate((voice) => voice.getBoundingClientRect().top + window.scrollY);
    expect(top, `${homeUrl(language)}: #voice starts at y = ${top}`).toBeLessThan(1400);
  }
});

test("WEB-6, WEB-17: the home asks for none of the removed images", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (request) => urls.push(decoded(request.url())));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(urls.filter((url) => /\/images\/(tasks|calendar)-/.test(url))).toEqual([]);
  for (const file of [
    "public/images/tasks-light.png",
    "public/images/tasks-dark.png",
    "src/components/TaskDemo.tsx",
  ])
    expect(existsSync(path.join(ROOT, file)), `${file} still exists`).toBe(false);
});

test("WEB-114: the features name no fixed month or year", async ({ page }) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const text = await page.locator("#features").textContent();
    expect(text, homeUrl(language)).not.toMatch(/September|2026/);
  }
});

test("WEB-6: no server message of the live demo promises the walkthrough", async () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      return statSync(full).isDirectory() ? files(full) : [full];
    });
  const naming = files(path.join(ROOT, "src", "lib", "voice")).filter((file) =>
    /walkthrough/i.test(readFileSync(file, "utf8")),
  );
  expect(naming.map((file) => path.relative(ROOT, file))).toEqual([]);
});

test("WEB-1, WEB-19: the hero says what TaskFlow is, for Android, with no mood lines or labelled divs", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const hero = page.locator(".hero");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(HERO.title[language]);
    await expect(h1).toContainText(HERO.calendarWord[language]);
    await expect(hero).toContainText("Android™");
    expect(await hero.textContent()).not.toMatch(/a little|un poco|una mica|make room/i);
    await expect(hero.locator("div[aria-label]")).toHaveCount(0);
  }
});

test("WEB-19: the hero heading's accessible name keeps every space", async ({ page }) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await expect(page.locator(".hero").getByRole("heading", { level: 1 })).toHaveAccessibleName(
      HERO.title[language],
    );
  }
});

test("WEB-4: the hero's buttons lead to the live demo and to the features, and nothing links to Google Play", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const links = page.locator(".hero").getByRole("link");
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAccessibleName(TRY_VOICE[language]);
    expect(await links.nth(0).getAttribute("href")).toMatch(/#voice$/);
    await expect(links.nth(1)).toHaveAccessibleName(WHAT_IT_DOES[language]);
    expect(await links.nth(1).getAttribute("href")).toMatch(/#features$/);
    await expect(page.locator('[href*="play.google.com"], [src*="play.google.com"]')).toHaveCount(0);
  }
  await page.goto("/es/");
  await page.locator(".hero").getByRole("link", { name: TRY_VOICE.es }).click();
  await expect(page).toHaveURL(/\/es\/#voice$/);
});

test("WEB-6, WEB-1: no home scrolls sideways at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await settle(page);
    expect(await scrollsSideways(page), `${homeUrl(language)} at 320 px`).toBe(false);
  }
});

// Run 2026-10-28-site: WP67 (WEB-1201, WEB-1203, WEB-1204, WEB-1205). The hero's copy column
// starts at the top instead of being centred against the art, so its button and status line sit
// above a laptop's fold; on phones the hero's, the closing card's and the demo's plans
// paragraphs are left-aligned; the H1's accent is no longer underlined like a link; the phone
// hero button is 58 px tall, 12 px under its neighbour when they stack. Positions are read
// by class (the plan names them), so WP68's rewording of the hero never breaks these.
// axe at 390 × 664 and 1440 × 1000, light and dark, on the three homes: the existing
// "WEB-6, WEB-19, WEB-707, WEB-705, WEB-706: axe reports no violations on the three homes"
// above runs on both projects (desktop 1440 × 1000, mobile 390 × 664) in both themes.

type Box = { top: number; bottom: number; left: number; right: number };

async function box(page: Page, selector: string): Promise<Box> {
  const found = await page.locator(selector).first().evaluate((element) => {
    const { top, bottom, left, right } = element.getBoundingClientRect();
    return { top, bottom, left, right };
  });
  return found;
}

// The line boxes of each element `selector` matches, from Range.getClientRects(): for each
// line, where its text starts and ends; and where the element's content box starts and is
// centred. Rects on one line are merged.
async function lines(page: Page, selector: string) {
  return page.evaluate((selector) => {
    return Array.from(document.querySelectorAll<HTMLElement>(selector))
      .filter((element) => element.checkVisibility())
      .map((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const rects = Array.from(range.getClientRects())
          .filter((rect) => rect.width > 0.5 && rect.height > 0.5)
          .sort((a, b) => a.top - b.top || a.left - b.left);
        const merged: { mid: number; start: number; end: number }[] = [];
        for (const rect of rects) {
          const mid = rect.top + rect.height / 2;
          const line = merged.find((line) => Math.abs(line.mid - mid) < rect.height / 2);
          if (line) {
            line.start = Math.min(line.start, rect.left);
            line.end = Math.max(line.end, rect.right);
          } else merged.push({ mid, start: rect.left, end: rect.right });
        }
        const style = getComputedStyle(element);
        const outer = element.getBoundingClientRect();
        const contentLeft =
          outer.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
        const contentRight =
          outer.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
        return {
          text: (element.textContent ?? "").trim().slice(0, 40),
          contentLeft,
          contentCentre: (contentLeft + contentRight) / 2,
          lines: merged.map(({ start, end }) => ({ start, end })),
        };
      });
  }, selector);
}

// mobile-text200: the browser's default font size from 16 to 32 px. The setting stays on the
// page across navigations, so it's set once and each page waits for its root to reach 32 px.
async function textSizeDoubled(page: Page) {
  await expect.poll(() => rootFontSize(page), { message: "the root font size doubles" }).toBe(32);
  await page.evaluate(() => document.fonts.ready);
}

const FILLED = ".hero-buttons .button";
const STATUS = ".hero-status";

test.describe("WP67 on a laptop", () => {
  test.use({ colorScheme: "light" });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "laptop window sizes: the desktop project");
  });

  for (const [width, height] of [
    [1366, 640],
    [1536, 730],
  ] as const)
    test(`WEB-1201: at ${width} × ${height} the hero's button and its status line end inside the first viewport, in every language`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await settle(page);
        for (const selector of [FILLED, STATUS]) {
          const { top, bottom } = await box(page, selector);
          expect(top, `${homeUrl(language)}: ${selector}'s top`).toBeGreaterThanOrEqual(0);
          expect(bottom, `${homeUrl(language)}: ${selector}'s bottom at ${width} × ${height}`).toBeLessThanOrEqual(height);
        }
      }
    });
});

for (const theme of THEMES) {
  test.describe(`WP67 at 1440 × 1000 (${theme})`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1201: at 1440 × 1000 the H1 starts at most 210 px down and the hero phone is whole in the first viewport (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "1440 × 1000 is the desktop project");
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await settle(page);
        const h1 = await box(page, ".hero h1");
        expect(h1.top, `${homeUrl(language)}: the H1's top`).toBeLessThanOrEqual(210);
        const phone = await box(page, ".hero-phone");
        expect(phone.top, `${homeUrl(language)}: .hero-phone's top`).toBeGreaterThanOrEqual(0);
        expect(phone.bottom, `${homeUrl(language)}: .hero-phone's bottom`).toBeLessThanOrEqual(1000);
        await expect(page.locator(".hero-phone"), homeUrl(language)).toBeInViewport({ ratio: 1 });
      }
    });

    test(`WEB-1203: at 1440 × 1000 the closing card's heading and paragraphs stay centred (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "1440 × 1000 is the desktop project");
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await settle(page);
        const card = (await lines(page, ".closing-card"))[0];
        for (const element of await lines(page, ".closing-card > h2, .closing-card > p")) {
          expect(element.lines.length, `${homeUrl(language)}: "${element.text}" has text`).toBeGreaterThan(0);
          for (const [index, line] of element.lines.entries()) {
            const centre = (line.start + line.end) / 2;
            expect(
              Math.abs(centre - card.contentCentre),
              `${homeUrl(language)}: line ${index + 1} of "${element.text}" is centred in the card`,
            ).toBeLessThanOrEqual(4);
          }
        }
      }
    });
  });
}

test.describe("WP67 at 200% zoom", () => {
  // desktop-zoom200: a 1440 × 1000 window at 200% zoom, as tests/ux-renders.spec.ts renders it.
  test.use({ colorScheme: "light", viewport: { width: 720, height: 500 }, deviceScaleFactor: 2 });

  test("WEB-1201: at 200% zoom (720 × 500) the hero's button ends above the fold on / and starts above it on /es/ and /ca/", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "a desktop window zoomed: the desktop project");
    for (const language of LANGUAGES) {
      await page.goto(homeUrl(language));
      await settle(page);
      const button = await box(page, FILLED);
      if (language === "en")
        expect(button.bottom, "/: the button's bottom at 720 × 500").toBeLessThan(500);
      else expect(button.top, `${homeUrl(language)}: the button's top at 720 × 500`).toBeLessThan(500);
    }
  });
});

test.describe("WP67 on phones", () => {
  test.use({ colorScheme: "light" });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "phone widths: the mobile project");
  });

  const PHONES = [
    { name: "390 × 664", width: 390, height: 664, text200: false },
    { name: "320 × 568", width: 320, height: 568, text200: false },
    { name: "mobile-text200 (390 × 664)", width: 390, height: 664, text200: true },
  ];

  for (const phone of PHONES)
    test(`WEB-1203: at ${phone.name} every line of the hero's, the closing card's and the demo's plans paragraphs starts at the same x, and the H1, the button and the status line start at the copy column's edge`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: phone.width, height: phone.height });
      if (phone.text200) await doubleTextSize(page);
      for (const language of LANGUAGES) {
        const url = homeUrl(language);
        await page.goto(url);
        await settle(page);
        if (phone.text200) await textSizeDoubled(page);
        for (const selector of [".hero-description", ".closing-card > p", ".closing-plans", ".voice-plans"]) {
          const elements = await lines(page, selector);
          expect(elements.length, `${url}: ${selector} is shown`).toBeGreaterThan(0);
          for (const element of elements) {
            expect(element.lines.length, `${url}: ${selector} has text`).toBeGreaterThan(0);
            for (const [index, line] of element.lines.entries())
              expect(
                Math.abs(line.start - element.contentLeft),
                `${url}: line ${index + 1} of ${selector} ("${element.text}") starts at its left edge`,
              ).toBeLessThanOrEqual(1);
          }
        }
        const column = (await lines(page, ".hero-copy"))[0].contentLeft;
        const h1 = (await lines(page, ".hero h1"))[0];
        for (const [index, line] of h1.lines.entries())
          expect(Math.abs(line.start - column), `${url}: line ${index + 1} of the H1 starts at the copy column's edge`).toBeLessThanOrEqual(1);
        expect(Math.abs((await box(page, FILLED)).left - column), `${url}: the filled button starts at the copy column's edge`).toBeLessThanOrEqual(1);
        const status = (await lines(page, STATUS))[0];
        for (const [index, line] of status.lines.entries())
          expect(Math.abs(line.start - column), `${url}: line ${index + 1} of the status line starts at the copy column's edge`).toBeLessThanOrEqual(1);
      }
    });

  test("WEB-1205: on phones the hero's filled button is at least 56 px tall and at least 8 px above ‘What it does’ when they stack; on /es/ at 390 × 664 the status line ends in the first viewport", async ({
    page,
  }) => {
    let stacked = 0;
    for (const { width, height } of [
      { width: 390, height: 664 },
      { width: 320, height: 568 },
    ]) {
      await page.setViewportSize({ width, height });
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} at ${width} × ${height}`;
        await page.goto(homeUrl(language));
        await settle(page);
        const button = await box(page, FILLED);
        expect(button.bottom - button.top, `${where}: the filled button's height`).toBeGreaterThanOrEqual(56);
        const link = await box(page, ".hero-buttons .text-link");
        if (link.top >= button.bottom - 1) {
          stacked++;
          expect(link.top - button.bottom, `${where}: the gap above ‘What it does’`).toBeGreaterThanOrEqual(8);
        }
        if (language === "es" && width === 390)
          expect((await box(page, STATUS)).bottom, `${where}: the status line's bottom`).toBeLessThanOrEqual(height);
      }
    }
    // The brief measured the two stacked at 320 px in every language: the gap check ran.
    expect(stacked, "the button and ‘What it does’ stacked somewhere").toBeGreaterThan(0);
  });
});

for (const theme of THEMES) {
  test.describe(`WP67 the H1's accent (${theme})`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1204: the H1's accent isn't underlined and keeps the green of --green, at every width (${theme})`, async ({
      page,
    }, testInfo) => {
      const sizes =
        testInfo.project.name === "desktop"
          ? [
              { width: 1440, height: 1000 },
              { width: 1366, height: 640 },
              { width: 720, height: 500 },
            ]
          : [
              { width: 390, height: 664 },
              { width: 320, height: 568 },
            ];
      for (const size of sizes) {
        await page.setViewportSize(size);
        for (const language of LANGUAGES) {
          const where = `${homeUrl(language)} at ${size.width} px`;
          await page.goto(homeUrl(language));
          await settle(page);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          const accent = await page.locator(".hero h1 .hero-accent").evaluate((span) => {
            const style = getComputedStyle(span);
            const probe = document.createElement("span");
            probe.style.color = style.getPropertyValue("--green").trim();
            span.after(probe);
            const green = getComputedStyle(probe).color;
            probe.remove();
            return { line: style.textDecorationLine, color: style.color, green };
          });
          expect(accent.line, `${where}: text-decoration-line`).toBe("none");
          expect(parseColor(accent.color), `${where}: the accent's colour is --green`).toEqual(parseColor(accent.green));
          expect(parseColor(accent.green), `${where}: --green is the theme's green`).toEqual(
            hexColor(theme === "light" ? "#176e59" : "#9ed5b3"),
          );
        }
      }
    });
  });
}

test("WEB-1204: on /es/ at 390 and 320 px «tu calendario.» stays on one line", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "phone widths: the mobile project");
  for (const { width, height } of [
    { width: 390, height: 664 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/es/");
    await settle(page);
    const count = await page.locator(".hero h1 .hero-accent").evaluate((span) => span.getClientRects().length);
    expect(count, `/es/ at ${width} px: the accent's line boxes`).toBe(1);
  }
});
