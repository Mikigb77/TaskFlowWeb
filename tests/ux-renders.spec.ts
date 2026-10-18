// Renders for TaskFlow's UX web loop (/ux-web); see TaskFlow/.claude/ux-web/README.md.
//
// Off unless UX_RENDERS=1, so `npm test` only lists one skipped placeholder per project.
// Run from the repo root in WSL, after `npm run build`: the Playwright config serves the
// last production build, so an old build means old renders.
//   UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts
//   UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts -g "privacy es"
//
// For every public page, in each language it exists in, on both projects (desktop
// 1440 × 1000; mobile, Playwright's iPhone 13 in Chromium, 390 × 664) and in light and
// dark, it writes to artifacts/ux-web/:
//   <page>.<language>.<project>.<theme>.fold.png  the first viewport, at device scale;
//   <page>.<language>.<project>.<theme>.full.png  the whole page at 1 px per CSS px, with
//                                                 a magenta line where the first viewport ends;
// plus opengraph-image.png (the link preview) and INDEX.md.
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const enabled = process.env.UX_RENDERS === "1";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "artifacts", "ux-web");

type Language = "en" | "es" | "ca";
type Theme = "light" | "dark";
// source: the route file first, then the files that hold the page's own content. The
// coverage test fails when a page file under src/app is listed nowhere, so a new page
// can't be left out of the review.
type Version = { url: string; source: string[] };
type PageSpec = {
  key: string;
  versions: Partial<Record<Language, Version>>;
  status?: number;
};

const LANGUAGES: Language[] = ["en", "es", "ca"];
const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  es: "Spanish",
  ca: "Catalan",
};
const THEMES: Theme[] = ["light", "dark"];
const LEGAL = ["privacy", "terms", "legal", "delete-account"];
const PAGES: PageSpec[] = [
  {
    key: "home",
    versions: { en: { url: "/", source: ["src/app/page.tsx"] } },
  },
  ...LEGAL.map((document) => ({
    key: document,
    versions: Object.fromEntries(
      LANGUAGES.map((language) => [
        language,
        {
          url: `${language === "en" ? "" : `/${language}`}/${document}/`,
          source: [
            language === "en"
              ? `src/app/${document}/page.tsx`
              : "src/app/[language]/[document]/page.tsx",
            "src/components/LegalPage.tsx",
            `src/content/legal/${language}.ts`,
          ],
        },
      ]),
    ) as PageSpec["versions"],
  })),
  {
    key: "not-found",
    versions: {
      en: {
        url: "/ux-renders-missing-page/",
        source: ["src/app/not-found.tsx"],
      },
    },
    status: 404,
  },
];

function pageFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Next.js never routes "_private" folders.
      if (!entry.name.startsWith("_")) found.push(...pageFiles(full));
    } else if (/^(page|not-found)\.(tsx|ts|jsx|js|mdx)$/.test(entry.name)) {
      found.push(path.relative(ROOT, full).split(path.sep).join("/"));
    }
  }
  return found;
}

function writeIndex() {
  const rows = PAGES.flatMap((page) =>
    LANGUAGES.flatMap((language) => {
      const version = page.versions[language];
      return version
        ? [
            `| ${page.key} | ${language} | \`${version.url}\` | ${version.source.map((file) => `\`${file}\``).join(", ")} |`,
          ]
        : [];
    }),
  );
  const missing = PAGES.flatMap((page) => {
    const absent = LANGUAGES.filter((language) => !page.versions[language]);
    return absent.length
      ? [
          `- **${page.key}** has no ${absent.map((language) => LANGUAGE_NAMES[language]).join(" or ")} version.`,
        ]
      : [];
  });
  const text = [
    "# UX web renders",
    "",
    "Written by `tests/ux-renders.spec.ts` (`UX_RENDERS=1`). A PNG's modified time says when it was rendered; one older than the code it shows is not evidence.",
    "",
    "- **Files:** `<page>.<language>.<desktop|mobile>.<light|dark>.<fold|full>.png`, plus `opengraph-image.png`, the link preview named by the home page's `og:image`.",
    "- **desktop:** Chromium, 1440 × 1000 at 1×. **mobile:** Playwright's iPhone 13 profile in Chromium, 390 × 664 at 3×, with touch.",
    "- **light / dark:** the visitor's system setting, with no stored choice, as on a first visit.",
    "- **fold:** the first viewport, at device scale (mobile PNGs are 1170 × 1992).",
    "- **full:** the whole page at 1 px per CSS px. A magenta line marks where the first viewport ends: y = 1000 on desktop, y = 664 on mobile. The image height divided by that is the number of screenfuls. Image viewers shrink tall PNGs, so read a part at full size with `TaskFlow/.claude/ux-web/crop.mjs`.",
    "- Every page also shows `src/app/layout.tsx`, `src/components/Header.tsx` and `src/components/Footer.tsx`; the styles are in `src/styles/`.",
    "",
    "| Page | Language | URL | Source |",
    "|---|---|---|---|",
    ...rows,
    "",
    ...(missing.length
      ? ["## Languages the site doesn't have", "", ...missing, ""]
      : []),
  ].join("\n");
  mkdirSync(OUT, { recursive: true });
  const temporary = path.join(OUT, `.INDEX.${process.pid}.md`);
  writeFileSync(temporary, text);
  renameSync(temporary, path.join(OUT, "INDEX.md"));
}

async function imagesLoaded(page: Page, wholePage: boolean) {
  await page.waitForFunction(
    (wholePage) =>
      Array.from(document.images)
        .filter(
          (image) =>
            image.checkVisibility() &&
            (wholePage || image.getBoundingClientRect().top < innerHeight),
        )
        .every((image) => image.complete),
    wholePage,
    { timeout: 20_000 },
  );
  return page.evaluate(() =>
    Array.from(document.images)
      .filter(
        (image) =>
          image.checkVisibility() && image.complete && !image.naturalWidth,
      )
      .map((image) => image.currentSrc || image.src),
  );
}

async function markFold(page: Page) {
  await page.evaluate(() => {
    const fold = window.innerHeight;
    const line = document.createElement("div");
    line.setAttribute("aria-hidden", "true");
    line.style.cssText = `position:absolute;left:0;width:100%;top:${fold - 1}px;height:2px;background:#ff00c8;z-index:2147483647;pointer-events:none;`;
    const label = document.createElement("span");
    label.textContent = `end of the first viewport (${fold}px)`;
    label.style.cssText =
      "position:absolute;right:6px;top:2px;padding:1px 6px;border-radius:0 0 4px 4px;background:#ff00c8;color:#fff;font:600 11px/1.4 system-ui,sans-serif;white-space:nowrap;";
    line.append(label);
    document.body.append(line);
  });
}

if (!enabled) {
  test.skip("UX web renders are off: set UX_RENDERS=1 to write them", () => {});
} else {
  if (!process.env.TEST_WORKER_INDEX) writeIndex();

  test("render coverage: every public page under src/app has renders", async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Checked once.");
    const covered = new Set(
      PAGES.flatMap((page) =>
        Object.values(page.versions).flatMap((version) => version!.source),
      ),
    );
    expect(
      pageFiles(path.join(ROOT, "src", "app")).filter(
        (file) => !covered.has(file),
      ),
      "Page files with no renders: add them to PAGES in tests/ux-renders.spec.ts",
    ).toEqual([]);
  });

  test("render opengraph-image", async ({ page, baseURL }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop",
      "One link preview is enough.",
    );
    await page.goto("/");
    const content = await page
      .locator('meta[property="og:image"]')
      .first()
      .getAttribute("content");
    test.skip(!content, "The home page has no og:image.");
    // metadataBase may name another host; fetch the same path from the server under test.
    const image = new URL(content!);
    const response = await page.request.get(
      new URL(image.pathname + image.search, baseURL).href,
    );
    expect(response.status()).toBe(200);
    mkdirSync(OUT, { recursive: true });
    writeFileSync(path.join(OUT, "opengraph-image.png"), await response.body());
  });

  for (const theme of THEMES) {
    test.describe(theme, () => {
      test.use({ colorScheme: theme });
      for (const spec of PAGES) {
        for (const language of LANGUAGES) {
          const version = spec.versions[language];
          if (!version) continue;
          test(`render ${spec.key} ${language} ${theme}`, async ({
            page,
          }, testInfo) => {
            test.setTimeout(120_000);
            const response = await page.goto(version.url);
            expect
              .soft(response?.status(), `${version.url} answers`)
              .toBe(spec.status ?? 200);
            await expect(page.locator("html")).toHaveAttribute(
              "data-theme",
              theme,
            );
            await page.evaluate(() => document.fonts.ready);
            const name = `${spec.key}.${language}.${testInfo.project.name}.${theme}`;
            expect
              .soft(await imagesLoaded(page, false), "broken images in view")
              .toEqual([]);
            await page.screenshot({
              path: path.join(OUT, `${name}.fold.png`),
              animations: "disabled",
            });
            // Lazy images below the fold would be blank in the full-page shot.
            await page.evaluate(() =>
              document
                .querySelectorAll<HTMLImageElement>('img[loading="lazy"]')
                .forEach((image) => (image.loading = "eager")),
            );
            expect
              .soft(await imagesLoaded(page, true), "broken images")
              .toEqual([]);
            await markFold(page);
            await page.screenshot({
              path: path.join(OUT, `${name}.full.png`),
              fullPage: true,
              animations: "disabled",
              scale: "css",
            });
          });
        }
      }
    });
  }
}
