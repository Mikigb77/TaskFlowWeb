// Renders and the measured audit for TaskFlow's UX web loop (/ux-web); see
// TaskFlow/.claude/ux-web/README.md.
//
// Off unless UX_RENDERS=1, so `npm test` only lists one skipped placeholder per project.
// Run from the repo root in WSL, after a build: the Playwright config serves the last
// production build, so an old build means old renders. Build with production's SITE_URL, so
// the metadata the audit reads (canonical, hreflang, og:url) is what production serves.
// Then render everything but performance, and measure performance alone, so the other
// renders don't slow its throttled CPU (about 3.5 + 2 minutes on 16 cores):
//   SITE_URL=https://taskflow.garbar.tech npm run build
//   rm -rf artifacts/ux-web
//   UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts --workers=6 --grep-invert "perf "
//   UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts --workers=1 --grep "perf "
// One page and language, or one demo scenario:
//   UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts -g "privacy es"
//   UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts -g "voice-waiting"
//
// It writes to artifacts/ux-web/, where INDEX.md explains every file:
//   <page>.<language>.<viewport>.<theme>.<fold|full>.png  every public page in each language
//       it exists in: desktop (1440 × 1000) and mobile (Playwright's iPhone 13 in Chromium,
//       390 × 664) in light and dark; the text-size and zoom variants in light; and, when
//       Playwright's WebKit is installed, mobile-webkit first viewports;
//   <state>.en.<viewport>.<theme>.<view|panel>.png  every state of the home page's two demos,
//       with the voice API stubbed by tests/support/ux-voice.ts: it is never called;
//   home-nojs…, home-menu…, privacy-menu…, home-faq…  no JavaScript, the phone menu, the FAQ;
//   AUDIT.md, audit.json, aria/, focus/  the measured audit (tests/support/ux-audit.ts);
//   opengraph-image.png and INDEX.md.
import {
  test as base,
  expect,
  webkit,
  devices,
  type Page,
} from "@playwright/test";
import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditPage,
  auditVariant,
  mergeAudit,
  saveFragment,
  textSizesNow,
} from "./support/ux-audit";
import { measurePerformance, THROTTLING } from "./support/ux-perf";
import {
  scenarios,
  VOICE_PANEL,
  VoiceStub,
  type Project,
} from "./support/ux-voice";

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
    versions: Object.fromEntries(
      LANGUAGES.map((language) => [
        language,
        {
          url: language === "en" ? "/" : `/${language}/`,
          source: [
            language === "en"
              ? "src/app/page.tsx"
              : "src/app/[language]/page.tsx",
            "src/components/HomePage.tsx",
            `src/content/site/${language}.ts`,
          ],
        },
      ]),
    ) as PageSpec["versions"],
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

// The text-size and zoom variants, in light only: the layout doesn't change with the theme.
type Variant = {
  key: string;
  project: Project;
  title: string;
  what: string;
  viewport: string;
  use: Parameters<typeof base.use>[0];
};
const VARIANTS: Variant[] = [
  {
    key: "desktop-text200",
    project: "desktop",
    title: "text200",
    what: "Desktop with the browser's default font size doubled",
    viewport: "1440 × 1000 at 1×",
    use: {},
  },
  {
    key: "mobile-text200",
    project: "mobile",
    title: "text200",
    what: "Mobile with the browser's default font size doubled",
    viewport: "390 × 664 at 3×",
    use: {},
  },
  {
    key: "desktop-zoom200",
    project: "desktop",
    title: "zoom200",
    what: "Desktop at 200% browser zoom",
    viewport: "720 × 500 at 2× (a 1440 × 1000 window at 200%)",
    use: { viewport: { width: 720, height: 500 }, deviceScaleFactor: 2 },
  },
  {
    key: "mobile-w320",
    project: "mobile",
    title: "w320",
    what: "A phone 320 CSS px wide, WCAG's reflow width",
    viewport: "320 × 568 at 2×",
    use: { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2 },
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
  const { list, unread } = scenarios(ROOT);
  const cell = (value: string) => value.replace(/\|/g, "\\|");
  const demoRows = list.flatMap((scenario) =>
    scenario.states.map(
      (state, index) =>
        `| \`${state.key}\` | ${cell(state.what)} | ${index === 0 ? cell(scenario.did) : "″"} | ${index === 0 ? cell(scenario.answered) : "″"} | ${scenario.projects.join(", ")} | ${scenario.themes.join(", ")} |`,
    ),
  );
  const hasWebkit = existsSync(webkit.executablePath());
  const text = [
    "# UX web renders",
    "",
    "Written by `tests/ux-renders.spec.ts` (`UX_RENDERS=1`). A PNG's modified time says when it was rendered; one older than the code it shows is not evidence.",
    "",
    "Start with **`AUDIT.md`**, the measured audit of every page, language, viewport and theme: axe, target sizes, text sizes, contrast, what a screen reader gets, the keyboard path, headings, metadata, overflow and lab performance. Then look at the renders below.",
    "",
    "## Pages",
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
    "## Text size and zoom",
    "",
    "The same pages and file pattern, in light only (the layout doesn't change with the theme), with these viewports. Each has a `fold` and a `full` render; the magenta line sits at that viewport's height. `AUDIT.md` §3 measures them.",
    "",
    "| Viewport | What it is | CSS px |",
    "|---|---|---|",
    ...VARIANTS.map((variant) => `| \`${variant.key}\` | ${variant.what}. | ${variant.viewport} |`),
    "",
    "- **text200** sets the browser's default font size from 16 to 32 px (Chrome's Settings › Appearance › Font size), through the DevTools protocol's `Page.setFontSizes`. Text sized in rem, em or % doubles; text sized in px stays as it was. So these renders show what doesn't scale: where one looks like the 100% render, that text is in px. Phones' own text-size settings work differently (some scale all text), so a phone check is still a device check.",
    "- **zoom200**: a 1440 × 1000 window at 200% zoom has a 720 × 500 CSS px viewport at device scale 2, so the layout reflows as it would in the browser. The fold PNG is 1440 × 1000; the full PNG is at 1 px per CSS px, 720 wide.",
    "- **w320**: 320 × 568 at 2×, the width WCAG 1.4.10 asks content to reflow at (1280 px at 400% zoom), and a small phone.",
    "",
    "## Demo states",
    "",
    "The live voice demo (`src/components/VoiceDemo.tsx`), on `/` in English.",
    "",
    "- **The real voice API is never called.** Every request to `/api/voice/*` is answered by the test, in the shapes the site's server code returns (`src/app/api/voice/`, `src/lib/voice/`): error bodies come from its own `failure()`, and the error list is read from its `new DemoError(…)` calls, so a new or reworded error is rendered on the next run. Requests to any other origin are blocked.",
    "- **Files:** `<state>.en.<desktop|mobile>.<light|dark>.view.png`, the viewport as the visitor sees it at that moment, at device scale; and `….panel.png`, the whole demo card at 1 px per CSS px with the sticky header hidden, including any part taller than the screen.",
    "- **Cloudflare's security check** only runs on taskflow.garbar.tech. A stand-in the size of the real widget (300 × 65 px), labelled “stand-in”, takes its place; the audit skips it.",
    "- **The microphone** is Chromium's fake device, a beep, so recordings are real but say nothing. The microphone errors use Chromium's error names and wording; Safari and Firefox word them differently. The browser's permission prompt is outside the page, so no render shows it.",
    "- **Time** in the recording and waiting states runs on Playwright's fake clock, so the 5 s, 50 s and 54 s states appear without waiting. The page's own request timeout (`AbortSignal.timeout(55_000)` in `VoiceDemo.tsx`) is held by the test and fired, with the browser's `TimeoutError`, once fake time has passed it.",
    "- The developer-testing panel (`?developer=1`) isn't rendered: only the owner sees it.",
    ...(unread.length
      ? [
          `- **Couldn't read every error from the code:** ${unread.join("; ")}. Those errors aren't rendered; update \`serverErrors()\` in \`tests/support/ux-voice.ts\`.`,
        ]
      : []),
    "",
    "| State | What it shows | What the visitor did | What the API answered | Viewports | Themes |",
    "|---|---|---|---|---|---|",
    ...demoRows,
    "",
    "## Other states",
    "",
    "| Files | What |",
    "|---|---|",
    "| `home-nojs.en.<desktop|mobile>.<light|dark>.<fold|full>.png` | The home with JavaScript off. Without its script the page can't follow a dark system setting, so the dark renders show what a dark-mode visitor without JavaScript gets. |",
    "| `home-menu.en.mobile.<light|dark>.fold.png`, `privacy-menu.es.mobile.light.fold.png` | The phone menu open. |",
    "| `home-faq.en.<desktop|mobile>.light.view.png` | The first FAQ answer open. |",
    "",
    "## Safari",
    "",
    hasWebkit
      ? "`<page>.<language>.mobile-webkit.<light|dark>.fold.png`: the first viewport of every page in Playwright's WebKit with the iPhone 13 profile (390 × 664 at 3×). It's Safari's engine, built for Linux, not Safari on an iPhone, so iOS's own scrolling, toolbars and fonts are still a device check."
      : "No WebKit renders: Playwright's WebKit isn't installed in WSL. `npx playwright install webkit` would add them to the next run, once WebKit's system libraries are installed too (on Ubuntu, `sudo npx playwright install-deps webkit`; WSL here runs Kali, where they have to be installed by hand). Safari on a real iPhone stays a device check either way.",
    "",
    "## The audit",
    "",
    "- `AUDIT.md`: what was measured, summarised and deduplicated, with where each item appears. `audit.json`: every row, passes included.",
    "- `aria/<page>.<language>.txt`: Playwright's ARIA snapshot of the page (light theme), the outline a screen reader works from; `….desktop.txt` and `….mobile.txt` when the two differ. `aria/<state>.en.txt`: the demo card in each state. Playwright's snapshot leaves out `<summary>` elements (the menu button and the FAQ questions); `AUDIT.md` lists them from Chromium's tree.",
    "- `focus/<page>.<language>.<viewport>.<theme>.<NN>.png`: the screen with focus on Tab stop NN, for the first 3 stops and every stop with a problem: focus not visible, covered, its ring cut off, or a ring under 3:1. `AUDIT.md` §10 and §14 name each one.",
    `- Performance is lab data, not field data: cold loads on the phone profile, throttled like Lighthouse's mobile preset (${THROTTLING.latencyMs} ms, ${THROTTLING.downloadKbps.toFixed(0)} Kbps, CPU ${THROTTLING.cpu}× slower), against the local server, measured on its own after the other renders (\`--grep "perf "\`), because parallel work slows a throttled CPU.`,
    "- `.audit/`: the raw measurements, merged when each Playwright worker finishes. `npx tsx tests/support/ux-audit.ts` merges them again.",
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

// React has attached: the theme switch is enabled once ThemeProvider's effect has run.
async function hydrated(page: Page) {
  await page
    .waitForFunction(
      () =>
        document.readyState === "complete" &&
        !document.querySelector("button.theme-toggle:disabled"),
      null,
      { timeout: 15_000 },
    )
    .catch(() => {});
}

async function markFold(page: Page) {
  await page.evaluate(() => {
    const fold = window.innerHeight;
    const line = document.createElement("div");
    line.setAttribute("aria-hidden", "true");
    line.setAttribute("data-ux-ignore", "fold line");
    line.style.cssText = `position:absolute;left:0;width:100%;top:${fold - 1}px;height:2px;background:#ff00c8;z-index:2147483647;pointer-events:none;`;
    const label = document.createElement("span");
    label.textContent = `end of the first viewport (${fold}px)`;
    label.style.cssText =
      "position:absolute;right:6px;top:2px;padding:1px 6px;border-radius:0 0 4px 4px;background:#ff00c8;color:#fff;font:600 11px/1.4 system-ui,sans-serif;white-space:nowrap;";
    line.append(label);
    document.body.append(line);
  });
}

async function unmarkFold(page: Page) {
  await page.evaluate(() =>
    document.querySelectorAll("[data-ux-ignore='fold line']").forEach((line) => line.remove()),
  );
}

// The fold and full renders of the page as it stands.
async function renderPage(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
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
  expect.soft(await imagesLoaded(page, true), "broken images").toEqual([]);
  await markFold(page);
  await page.screenshot({
    path: path.join(OUT, `${name}.full.png`),
    fullPage: true,
    animations: "disabled",
    scale: "css",
  });
  await unmarkFold(page);
  await page.evaluate(() => window.scrollTo(0, 0));
}

if (!enabled) {
  base.skip("UX web renders are off: set UX_RENDERS=1 to write them", () => {});
} else {
  // When a worker finishes, merge every saved measurement into AUDIT.md and audit.json.
  const test = base.extend<object, { uxAudit: void }>({
    uxAudit: [
      async ({}, use) => {
        await use();
        await mergeAudit(
          OUT,
          PAGES.map((page) => page.key),
        );
      },
      { scope: "worker", auto: true, timeout: 180_000 },
    ],
  });
  // The voice demo's recording states use Chromium's fake microphone. The flags only matter
  // when a page asks for the microphone. No trace: the audit's hundreds of steps per page
  // would each be recorded; add --trace on to debug a failing render.
  test.use({
    launchOptions: {
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
      ],
    },
    trace: "off",
  });
  if (!process.env.TEST_WORKER_INDEX) writeIndex();
  const SCENARIOS = scenarios(ROOT).list;
  const STATE_ORDER = SCENARIOS.flatMap((scenario) => scenario.states.map((state) => state.key));

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

  // Every page, language, project and theme: the renders, then the audit of the same page.
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
            test.setTimeout(180_000);
            const response = await page.goto(version.url);
            expect
              .soft(response?.status(), `${version.url} answers`)
              .toBe(spec.status ?? 200);
            await expect(page.locator("html")).toHaveAttribute(
              "data-theme",
              theme,
            );
            await hydrated(page);
            const name = `${spec.key}.${language}.${testInfo.project.name}.${theme}`;
            await renderPage(page, name);
            const audit = await auditPage(
              page,
              {
                id: name,
                page: spec.key,
                language,
                viewport: testInfo.project.name,
                theme,
                url: version.url,
                out: OUT,
              },
              {
                scope: null,
                keyboard: true,
                aria: theme === "light" ? `${spec.key}.${language}` : null,
              },
            );
            saveFragment(OUT, "pages", name, audit);
          });
        }
      }
    });
  }

  // Text size and zoom, in light.
  for (const variant of VARIANTS) {
    test.describe(variant.key, () => {
      test.use({ colorScheme: "light", ...variant.use });
      for (const spec of PAGES) {
        for (const language of LANGUAGES) {
          const version = spec.versions[language];
          if (!version) continue;
          test(`render ${spec.key} ${language} ${variant.title}`, async ({
            page,
          }, testInfo) => {
            test.skip(
              testInfo.project.name !== variant.project,
              `${variant.key} is rendered on the ${variant.project} project.`,
            );
            test.setTimeout(120_000);
            await page.goto(version.url);
            await hydrated(page);
            await page.evaluate(() => document.fonts.ready);
            const name = `${spec.key}.${language}.${variant.key}.light`;
            const combo = {
              id: name,
              page: spec.key,
              language,
              viewport: variant.key,
              theme: "light",
              url: version.url,
              variant: variant.title,
            };
            if (variant.title !== "text200") {
              await renderPage(page, name);
              saveFragment(OUT, "variants", name, await auditVariant(page, combo, null));
              return;
            }
            // The browser's font-size setting, through the DevTools protocol. The session stays
            // open: closing it resets the setting.
            const before = await textSizesNow(page, true);
            const cdp = await page.context().newCDPSession(page);
            await cdp.send("Page.setFontSizes", {
              fontSizes: { standard: 32, fixed: 26 },
            });
            const rootSize = () =>
              page.evaluate(() =>
                parseFloat(getComputedStyle(document.documentElement).fontSize),
              );
            // The root grows unless the site fixes it in px; that's a result, not a failure.
            for (let wait = 0; wait < 20 && (await rootSize()) === before.root; wait++)
              await page.waitForTimeout(100);
            await page.evaluate(() => document.fonts.ready);
            const after = await textSizesNow(page, false);
            // Measure while the setting is live, then pin the root at the size it gave: a
            // full-page screenshot resizes the viewport, which resets the setting.
            const audit = await auditVariant(page, combo, { before: before.sizes, after: after.sizes });
            await page.addStyleTag({
              content: `html { font-size: ${after.root}px !important; }`,
            });
            await renderPage(page, name);
            expect(await rootSize(), "the root keeps the doubled size").toBe(after.root);
            saveFragment(OUT, "variants", name, audit);
          });
        }
      }
    });
  }

  // Lab performance: cold loads on the phone profile, throttled (tests/support/ux-perf.ts).
  for (const spec of PAGES) {
    for (const language of LANGUAGES) {
      const version = spec.versions[language];
      if (!version) continue;
      test(`perf ${spec.key} ${language}`, async ({ browser, baseURL }, testInfo) => {
        test.skip(
          testInfo.project.name !== "mobile",
          "Measured once, on the phone profile.",
        );
        test.setTimeout(300_000);
        // How busy the whole machine was while measuring: other work slows a throttled CPU.
        const cpuTime = () =>
          cpus().reduce(
            (sum, cpu) => {
              const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
              return { idle: sum.idle + cpu.times.idle, total: sum.total + total };
            },
            { idle: 0, total: 0 },
          );
        const before = cpuTime();
        // The home page decides first impressions: load it three times and keep the median.
        const runs = [];
        for (let run = 0; run < (spec.key === "home" ? 3 : 1); run++)
          runs.push(await measurePerformance(browser, baseURL!, version.url));
        const after = cpuTime();
        const busy = 1 - (after.idle - before.idle) / Math.max(1, after.total - before.total);
        saveFragment(OUT, "performance", `${spec.key}.${language}`, {
          kind: "performance",
          id: `${spec.key}.${language}`,
          page: spec.key,
          language,
          url: version.url,
          renderedAt: new Date().toISOString(),
          browser: browser.version(),
          busy: Math.round(busy * 100),
          runs,
        });
      });
    }
  }

  // The demos, state by state (tests/support/ux-voice.ts). The voice API is stubbed.
  for (const theme of THEMES) {
    test.describe(`demo ${theme}`, () => {
      test.use({ colorScheme: theme });
      for (const scenario of SCENARIOS.filter((item) => item.themes.includes(theme))) {
        test(`demo home ${scenario.key} ${theme}`, async ({ page, baseURL }, testInfo) => {
          const project = testInfo.project.name as Project;
          test.skip(
            !scenario.projects.includes(project),
            `${scenario.key} is rendered on ${scenario.projects.join(" and ")}.`,
          );
          test.setTimeout(120_000);
          const voice = new VoiceStub();
          await voice.install(page, baseURL!);
          await scenario.setup?.(page, voice);
          const capture = async (state: string) => {
            await page.evaluate(() => document.fonts.ready);
            // The demo moves focus and scroll on every stage; let both settle. Not with the
            // page's requestAnimationFrame: some states run on a paused fake clock.
            await page.waitForTimeout(150);
            const name = `${state}.en.${project}.${theme}`;
            await page.screenshot({
              path: path.join(OUT, `${name}.view.png`),
              animations: "disabled",
            });
            const scroll = await page.evaluate(() => window.scrollY);
            await page.locator(VOICE_PANEL).screenshot({
              path: path.join(OUT, `${name}.panel.png`),
              animations: "disabled",
              scale: "css",
              style: ".site-header, .skip-link { visibility: hidden !important; }",
            });
            await page.evaluate((y) => window.scrollTo(0, y), scroll);
            saveFragment(
              OUT,
              "regions",
              name,
              await auditPage(
                page,
                {
                  id: name,
                  page: "home",
                  language: "en",
                  viewport: project,
                  theme,
                  url: "/",
                  out: OUT,
                  state,
                  stateIndex: STATE_ORDER.indexOf(state),
                },
                {
                  scope: VOICE_PANEL,
                  keyboard: false,
                  aria: theme === "light" ? `${state}.en` : null,
                },
              ),
            );
          };
          await scenario.run({ page, voice, project, capture });
          expect(voice.unexpected, "requests to unstubbed voice API paths").toEqual([]);
        });
      }
    });
  }

  // The home without JavaScript.
  for (const theme of THEMES) {
    test.describe(`no JavaScript ${theme}`, () => {
      test.use({ colorScheme: theme, javaScriptEnabled: false });
      test(`state home nojs ${theme}`, async ({ page }, testInfo) => {
        await page.goto("/");
        await renderPage(page, `home-nojs.en.${testInfo.project.name}.${theme}`);
      });
    });
  }

  // The phone menu open, and an FAQ answer open.
  for (const theme of THEMES) {
    test.describe(`menu ${theme}`, () => {
      test.use({ colorScheme: theme });
      const where = theme === "light" ? [["home", "en", "/"], ["privacy", "es", "/es/privacy/"]] : [["home", "en", "/"]];
      for (const [key, language, url] of where) {
        test(`state ${key} menu ${language} ${theme}`, async ({ page }, testInfo) => {
          test.skip(testInfo.project.name !== "mobile", "The menu is the phone's.");
          await page.goto(url);
          await hydrated(page);
          await page.locator(".header-menu summary").click();
          await page.locator(".header-menu[open] nav").waitFor();
          await page.evaluate(() => document.fonts.ready);
          await page.screenshot({
            path: path.join(OUT, `${key}-menu.${language}.mobile.${theme}.fold.png`),
            animations: "disabled",
          });
        });
      }
    });
  }
  test.describe("faq", () => {
    test.use({ colorScheme: "light" });
    test("state home faq light", async ({ page }, testInfo) => {
      await page.goto("/#questions");
      await hydrated(page);
      await page.locator(".faq-item summary").first().click();
      await page.locator(".faq-item[open]").first().waitFor();
      await page.locator(".faq-item[open]").first().scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.join(OUT, `home-faq.en.${testInfo.project.name}.light.view.png`),
        animations: "disabled",
      });
    });
  });

  // Safari's engine, when Playwright's WebKit is installed.
  for (const theme of THEMES) {
    test(`render webkit ${theme}`, async ({ baseURL }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile", "Rendered once, in its own browser.");
      test.skip(
        !existsSync(webkit.executablePath()),
        "Playwright's WebKit isn't installed: npx playwright install webkit",
      );
      test.setTimeout(300_000);
      let browser;
      try {
        browser = await webkit.launch();
      } catch (error) {
        test.skip(
          true,
          `WebKit can't start here (sudo npx playwright install-deps webkit): ${String(error).split("\n")[0]}`,
        );
        return;
      }
      try {
        const { defaultBrowserType: _browser, ...phone } = devices["iPhone 13"];
        const context = await browser.newContext({
          ...phone,
          baseURL,
          colorScheme: theme,
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        for (const spec of PAGES)
          for (const language of LANGUAGES) {
            const version = spec.versions[language];
            if (!version) continue;
            await page.goto(version.url);
            await hydrated(page);
            await page.evaluate(() => document.fonts.ready);
            expect
              .soft(await imagesLoaded(page, false), `${version.url}: broken images in view`)
              .toEqual([]);
            await page.screenshot({
              path: path.join(OUT, `${spec.key}.${language}.mobile-webkit.${theme}.fold.png`),
              animations: "disabled",
            });
          }
      } finally {
        await browser.close();
      }
    });
  }
}
