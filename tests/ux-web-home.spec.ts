// Acceptance tests for the home (area H) from the UX web loop, run 2026-10-18-site:
// WP14 (the walkthrough, the appearance section, the slogan bar and a fake microphone go;
// the live demo moves under the hero), WP16 (the hero) and WP33 (the header and main half of
// WEB-6; the held half is in ux-web-frame, ux-web-voice and ux-web-legal). See
// tests/support/ux-web.ts.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  axeViolations,
  expect,
  homeUrl,
  LANGUAGES,
  ROOT,
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
