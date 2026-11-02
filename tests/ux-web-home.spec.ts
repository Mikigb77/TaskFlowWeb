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
import { CLOSING, HERO, TRY_VOICE, WHAT_IT_DOES } from "./support/ux-web-copy";

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
          ["free line", hero.getByText(HERO.free[language], { exact: true })],
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

// Run 2026-10-28-site: WP68 (WEB-1202, WEB-1206, WEB-1207). The hero's paragraph opens with
// what TaskFlow is; Spanish and Catalan say «Próximamente» / «Properament» instead of «Muy
// pronto» / «Molt aviat»; the app's example has no full stop inside the guillemets. Copy checks
// assert the plan's exact copy. The demo's hand-over is held by ux-web-voice.spec.ts's WEB-7
// test, which asserts the brief's strings.
const WP68 = {
  description: {
    en: "An app for Android™ phones: tap one button and say what you need to do, even several things at once. TaskFlow puts each one on its day and can remind you beforehand.",
    es: "Una app para móviles Android™: toca un botón y di lo que tienes que hacer, aunque sean varias cosas a la vez. TaskFlow pone cada una en su día y puede avisarte antes.",
    ca: "Una aplicació per a mòbils Android™: toca un botó i digues el que has de fer, encara que siguin diverses coses alhora. TaskFlow posa cadascuna al seu dia i et pot avisar abans.",
  },
  lead: {
    en: ["An app for Android™ phones:", "app"],
    es: ["Una app para móviles Android™:", "app"],
    ca: ["Una aplicació per a mòbils Android™:", "aplicació"],
  },
  soon: {
    es: {
      meta: "Apunta lo que tienes que hacer y TaskFlow lo pone en tu calendario. Di varias cosas a la vez. Para móviles Android, próximamente en Google Play.",
      menu: "Próximamente en Android",
      status: "Próximamente en Google Play. Todavía no se puede descargar.",
      closing: "Próximamente en Android.",
    },
    ca: {
      meta: "Apunta el que has de fer i TaskFlow ho posa al teu calendari. Digues diverses coses alhora. Per a mòbils Android, properament a Google Play.",
      menu: "Properament a Android",
      status: "Properament a Google Play. Encara no es pot descarregar.",
      closing: "Properament a Android.",
    },
  },
  quote: {
    en: "“Tomorrow, call the dentist and buy bread.”",
    es: "«Mañana, llamar al dentista y comprar pan»",
    ca: "«Demà, trucar al dentista i comprar pa»",
  },
} as const;

// Every file under a folder of this website.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? sourceFiles(full) : [full];
  });
}

for (const theme of THEMES) {
  test.describe(`WP68 (${theme})`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1202: the hero's paragraph opens with what TaskFlow is, in every language (${theme})`, async ({
      page,
      isMobile,
    }) => {
      for (const language of LANGUAGES) {
        const url = homeUrl(language);
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const description = page.locator(".hero .hero-description");
        await expect(description, url).toBeVisible();
        await expect(description, url).toHaveText(WP68.description[language]);
        const [lead, app] = WP68.lead[language];
        expect((await description.textContent())!.startsWith(lead), `${url} starts “${lead}”`).toBe(true);
        if (!isMobile) continue;
        // On a 390 × 664 phone, the word for ‘app’ and ‘Android’ sit on the paragraph's first line.
        await settle(page);
        const lines = await description.evaluate(
          (element, words) => {
            const text = element.firstChild as Text;
            const top = (start: number, end: number) => {
              const range = document.createRange();
              range.setStart(text, start);
              range.setEnd(text, end);
              return range.getClientRects()[0];
            };
            const first = top(0, 1);
            return words.map((word) => {
              const start = text.data.indexOf(word);
              const rect = top(start, start + word.length);
              return { word, sameLine: Math.abs(rect.top - first.top) < first.height / 2 };
            });
          },
          [app, "Android"],
        );
        for (const { word, sameLine } of lines) expect(sameLine, `${url}: “${word}” on the first line`).toBe(true);
      }
    });

    test(`WEB-1202, WEB-1206, WEB-1207: axe finds nothing on the three homes (${theme})`, async ({ page }) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await settle(page);
        expect(await axeViolations(page), `${homeUrl(language)} (${theme})`).toEqual([]);
      }
    });
  });
}

test("WEB-1206: no file under src/ promises «Muy pronto» or «Molt aviat»", async () => {
  const promises: string[] = [];
  for (const file of sourceFiles(path.join(ROOT, "src"))) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/muy pronto|molt aviat/gi))
      promises.push(`${path.relative(ROOT, file)}:${text.slice(0, match.index).split("\n").length}: ${match[0]}`);
  }
  expect(promises).toEqual([]);
});

test("WEB-1206: on /es/ and /ca/ the status, the closing title, the phone menu and the link preview say «Próximamente» / «Properament»", async ({
  page,
  isMobile,
}) => {
  for (const language of ["es", "ca"] as const) {
    const url = homeUrl(language);
    const soon = WP68.soon[language];
    await page.goto(url);
    await expect(page.locator(".hero .hero-status"), url).toHaveText(soon.status);
    await expect(page.locator(".hero .hero-status"), url).toBeVisible();
    const closing = page.locator(".closing-card").getByRole("heading", { level: 2 });
    await expect(closing, url).toHaveText(soon.closing);
    const metas = await page.evaluate(() =>
      Object.fromEntries(
        ["description", "og:description", "twitter:description"].map((name) => [
          name,
          Array.from(document.querySelectorAll(`meta[name="${name}"], meta[property="${name}"]`)).map((meta) =>
            meta.getAttribute("content"),
          ),
        ]),
      ),
    );
    for (const [name, values] of Object.entries(metas)) expect(values, `${url} ${name}`).toEqual([soon.meta]);
    // The phone menu's last row; the menu only opens on phones.
    const rows = page.locator(".header-menu-panel nav a");
    await expect(rows.last(), url).toHaveText(soon.menu);
    if (isMobile) {
      await page.locator(".header-menu summary").click();
      await expect(rows.last(), url).toBeVisible();
      await expect(rows.last(), url).toHaveAccessibleName(soon.menu);
    }
  }
});

test("WEB-1206: at 320 × 568 the closing title wraps between words only, and nothing scrolls sideways", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const language of ["es", "ca"] as const) {
    const url = homeUrl(language);
    await page.goto(url);
    await settle(page);
    const title = page.locator(".closing-card").getByRole("heading", { level: 2 });
    await expect(title, url).toHaveText(WP68.soon[language].closing);
    await title.scrollIntoViewIfNeeded();
    const words = await title.evaluate((heading) => {
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const result: { word: string; lines: number }[] = [];
      for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
        for (const match of node.data.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index!);
          range.setEnd(node, match.index! + match[0].length);
          const tops = new Set(Array.from(range.getClientRects()).map((rect) => Math.round(rect.top)));
          result.push({ word: match[0], lines: tops.size });
        }
      }
      return { result, overflows: heading.scrollWidth > heading.clientWidth };
    });
    expect(words.result.map(({ word }) => word).join(" "), url).toBe(WP68.soon[language].closing);
    for (const { word, lines } of words.result) expect(lines, `${url}: “${word}” on one line`).toBe(1);
    expect(words.overflows, `${url}: the title overflows its box`).toBe(false);
    expect(await scrollsSideways(page), `${url} at 320 px`).toBe(false);
  }
});

test("WEB-1207: the app's example has no full stop inside the guillemets, in the hero and the demo; English is unchanged", async ({
  page,
}) => {
  const content = path.join(ROOT, "src", "content", "site");
  for (const file of sourceFiles(content))
    expect(readFileSync(file, "utf8").includes(".»"), `${path.relative(ROOT, file)} holds “.»”`).toBe(false);
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await expect(page.locator(".hero .floating-note p"), `${url}: the hero's quote card`).toHaveText(
      WP68.quote[language],
    );
    await expect(
      page.locator("#voice .voice-example").getByText(WP68.quote[language], { exact: true }),
      `${url}: the demo's example`,
    ).toBeVisible();
  }
});

// Run 2026-10-28-site: WP262 (WEB-1209). WD23: the hero says what's free, in WD2's words (the
// first sentence of `closing.plans`), in its own paragraph right under the status line, in
// the status line's size and colour, inside the first phone screen. Pro and prices stay out of
// the hero. The first-viewport check is the "WEB-1, WEB-3: … fit the first viewport" test
// above, which lists the free line after the status line, on both projects in both themes;
// WP67's laptop and phone checks above still run unchanged; axe on the three homes, light and
// dark, is the "WEB-6, WEB-19, WEB-707, WEB-705, WEB-706" test above.
const FREE = ".hero-free";

for (const theme of THEMES) {
  test.describe(`WP262 (${theme})`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1209: right after the hero's status line comes one free line, in WD2's exact words, wholly in the first viewport (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        const url = homeUrl(language);
        await page.goto(url);
        await settle(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator(FREE), `${url}: one free line on the page`).toHaveCount(1);
        const hero = page.locator("section.hero");
        const free = hero.locator(`p${FREE}`);
        await expect(free, url).toHaveText(HERO.free[language], { useInnerText: true });
        await expect(free, url).toBeInViewport({ ratio: 1 });
        // WD2's free half: the first sentence of the closing card's line, word for word.
        expect(CLOSING.plans[language].startsWith(`${HERO.free[language]} `), `${url}: the first sentence of CLOSING.plans`).toBe(true);
        const next = await hero.locator(`p${STATUS}`).evaluate((status) => {
          const sibling = status.nextElementSibling;
          return sibling ? `${sibling.tagName.toLowerCase()}.${[...sibling.classList].join(".")}` : null;
        });
        expect(next, `${url}: the element right after p.hero-status`).toBe("p.hero-free");
      }
    });

    test(`WEB-1209: the free line has the status line's font size, line height and colour, sits at most 8 px under it, and holds no link, icon or bold text (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        const url = homeUrl(language);
        await page.goto(url);
        await settle(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const measured = await page.evaluate(
          ([statusSelector, freeSelector]) => {
            const status = document.querySelector<HTMLElement>(`.hero ${statusSelector}`)!;
            const free = document.querySelector<HTMLElement>(`.hero ${freeSelector}`)!;
            const look = (element: HTMLElement) => {
              const style = getComputedStyle(element);
              return {
                fontSize: style.fontSize,
                lineHeight: style.lineHeight,
                color: style.color,
                fontWeight: Number(style.fontWeight),
              };
            };
            const heavy = Array.from(free.querySelectorAll("*")).filter(
              (element) => Number(getComputedStyle(element).fontWeight) >= 600,
            ).length;
            return {
              status: look(status),
              free: look(free),
              gap: free.getBoundingClientRect().top - status.getBoundingClientRect().bottom,
              children: Array.from(free.querySelectorAll("*")).map((element) => element.tagName.toLowerCase()),
              heavy,
            };
          },
          [STATUS, FREE],
        );
        expect(measured.free.fontSize, `${url}: font size`).toBe(measured.status.fontSize);
        expect(measured.free.lineHeight, `${url}: line height`).toBe(measured.status.lineHeight);
        expect(parseColor(measured.free.color), `${url}: colour`).toEqual(parseColor(measured.status.color));
        expect(measured.free.fontWeight, `${url}: font weight`).toBe(measured.status.fontWeight);
        expect(measured.free.fontWeight, `${url}: not bold`).toBeLessThan(600);
        expect(measured.gap, `${url}: the gap under the status line`).toBeGreaterThanOrEqual(0);
        expect(measured.gap, `${url}: the gap under the status line`).toBeLessThanOrEqual(8);
        // Plain text: no link, icon, image, bold or any other element inside it.
        expect(measured.children, `${url}: elements inside the free line`).toEqual([]);
        expect(measured.heavy, `${url}: bold elements inside the free line`).toBe(0);
      }
    });

    test(`WEB-1209: in the hero's accessibility tree the free line comes right after the status line and before the quote card (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        const url = homeUrl(language);
        await page.goto(url);
        const rows = (await page.locator("section.hero").ariaSnapshot()).split("\n");
        const row = (text: string) => rows.findIndex((line) => line.includes(text));
        const status = row(HERO.status[language].slice(0, 24));
        const free = row(HERO.free[language].slice(0, 24));
        const quote = row(HERO.altWord[language]);
        expect(status, `${url}: the status line is in the snapshot\n${rows.join("\n")}`).toBeGreaterThanOrEqual(0);
        expect(free, `${url}: the free line right after the status line\n${rows.join("\n")}`).toBe(status + 1);
        expect(quote, `${url}: the quote card after the free line\n${rows.join("\n")}`).toBeGreaterThan(free);
        expect(rows[free], `${url}: the free line is a paragraph`).toMatch(/^\s*- paragraph\b/);
      }
    });
  });
}

test("WEB-1209: the hero names no Pro and no price; the closing card's and the demo's plans lines still read WD2's whole line", async ({
  page,
}) => {
  const price = /[€$£¥]|\b(EUR|USD|GBP)\b|\beuros?\b|\bdollars?\b|\bd[oó]lars?\b/i;
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    const hero = await page.locator("section.hero").evaluate((section) => ({
      text: (section as HTMLElement).innerText + "\n" + (section.textContent ?? ""),
      labels: Array.from(section.querySelectorAll("[alt], [aria-label], [title]"))
        .flatMap((element) => ["alt", "aria-label", "title"].map((name) => element.getAttribute(name) ?? ""))
        .join("\n"),
    }));
    for (const [what, text] of Object.entries(hero)) {
      expect(text, `${url}: the hero's ${what} name Pro`).not.toMatch(/\bPro\b/);
      expect(text, `${url}: the hero's ${what} name a price`).not.toMatch(price);
    }
    await expect(page.locator(".closing-plans"), `${url}: the closing card's plans line`).toHaveText(CLOSING.plans[language]);
    await expect(page.locator("#voice .voice-plans"), `${url}: the demo's plans line`).toHaveText(CLOSING.plans[language]);
  }
});

test.describe("WP262 on phones", () => {
  test.use({ colorScheme: "light" });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "phone widths: the mobile project");
  });

  for (const phone of [
    { name: "390 × 664", width: 390, height: 664, text200: false },
    { name: "320 × 568", width: 320, height: 568, text200: false },
    { name: "mobile-text200 (390 × 664)", width: 390, height: 664, text200: true },
  ])
    test(`WEB-1209: at ${phone.name} every line of the free line starts at the status line's left edge, and nothing scrolls sideways or clips`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: phone.width, height: phone.height });
      if (phone.text200) await doubleTextSize(page);
      for (const language of LANGUAGES) {
        const url = homeUrl(language);
        await page.goto(url);
        await settle(page);
        if (phone.text200) await textSizeDoubled(page);
        const status = (await lines(page, `.hero ${STATUS}`))[0];
        const free = (await lines(page, `.hero ${FREE}`))[0];
        expect(free, `${url}: the free line is shown`).toBeDefined();
        expect(free.lines.length, `${url}: the free line has text`).toBeGreaterThan(0);
        const edge = status.lines[0].start;
        for (const [index, line] of free.lines.entries()) {
          expect(Math.abs(line.start - edge), `${url}: line ${index + 1} of the free line starts at the status line's left edge`).toBeLessThanOrEqual(1);
          expect(line.end, `${url}: line ${index + 1} of the free line ends inside the screen`).toBeLessThanOrEqual(phone.width);
        }
        // Its own box holds its text, and no box around it that hides overflow cuts it off.
        const clipped = await page.locator(`.hero ${FREE}`).evaluate((element) => {
          const clips: string[] = [];
          if (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)
            clips.push("p.hero-free overflows itself");
          const own = element.getBoundingClientRect();
          for (let node = element.parentElement; node && node !== document.documentElement; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (style.overflowX === "visible" && style.overflowY === "visible") continue;
            const box = node.getBoundingClientRect();
            if (own.left < box.left - 1 || own.right > box.right + 1 || own.top < box.top - 1 || own.bottom > box.bottom + 1)
              clips.push(`${node.tagName.toLowerCase()}.${[...node.classList].join(".")}`);
          }
          return clips;
        });
        expect(clipped, `${url}: the free line or a box around it clips its text`).toEqual([]);
        expect(await scrollsSideways(page), `${url} at ${phone.name}: scrolls sideways`).toBe(false);
      }
    });
});
