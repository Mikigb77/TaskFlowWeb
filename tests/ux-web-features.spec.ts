// Acceptance tests for the features, the FAQ and the closing card (area F) from the UX web
// loop, run 2026-10-18-site: WP17 (plain headings and true cards), WP18 (the closing card
// and the first FAQ answers) WP35 (round 2), WP36 (round 3) and WP19 (the FAQ in the app's
// words). See tests/support/ux-web.ts.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "./support/test";
import {
  axeViolations,
  contrast,
  doubleTextSize,
  expect,
  hexColor,
  homeUrl,
  hydrated,
  type Language,
  ROOT,
  LANGUAGES,
  parseColor,
  rootFontSize,
  scrollsSideways,
  smallestText,
  test,
  THEMES,
} from "./support/ux-web";
import {
  CLOSING,
  FAQ_FIRST,
  FAQ_REST,
  FAQ_TITLE,
  FEATURES,
  TRY_VOICE,
} from "./support/ux-web-copy";
import { ca as siteCaCopy } from "../src/content/site/ca";
import { en as siteEnCopy } from "../src/content/site/en";
import { es as siteEsCopy } from "../src/content/site/es";

const DICTATIONS = { en: /\b10 dictations\b/, es: /\b10 dictados\b/, ca: /\b10 dictats\b/ };

test("WEB-111: the features have one plain heading and five plain card headings, with no eyebrow or intro", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const features = page.locator("#features");
    const h2 = features.getByRole("heading", { level: 2 });
    await expect(h2).toHaveCount(1);
    await expect(h2).toHaveText(FEATURES.title[language]);
    await expect(features.getByRole("heading", { level: 3 })).toHaveText(
      FEATURES.cards.map((card) => card.title[language]),
    );
    await expect(features.locator(".eyebrow")).toHaveCount(0);
    expect(await features.textContent()).not.toMatch(/01 \/|everyday flow/i);
    // Every paragraph belongs to a card: no intro paragraph under the heading.
    const loose = await features
      .locator("p")
      .evaluateAll((paragraphs) => paragraphs.filter((p) => !p.closest("article")).length);
    expect(loose, `${homeUrl(language)}: paragraphs outside the cards`).toBe(0);
  }
});

test("WEB-101, WEB-105, WEB-106, WEB-504: each feature card says what the app does, in the page's language", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const features = page.locator("#features");
    for (const card of FEATURES.cards) {
      const article = features.locator("article", {
        has: page.getByRole("heading", { level: 3, name: card.title[language], exact: true }),
      });
      await expect(article.locator("p"), card.title[language]).toHaveText([card.body[language]]);
    }
  }
});

test("WEB-101, WEB-4: the features never say sign-in is optional, nor use the old labels and dates", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const text = (await page.locator("#features").textContent()) ?? "";
    for (const banned of ["without an account", "Sign in to", "MiB", "Give it a try", "priority", "September", "2026"])
      expect(text.toLowerCase(), `${homeUrl(language)}: “${banned}”`).not.toContain(banned.toLowerCase());
  }
});

test("WEB-4: the voice card's link has the live demo's one label and leads to it", async ({ page }) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const card = page.locator("#features article", {
      has: page.getByRole("heading", { level: 3, name: FEATURES.cards[1].title[language], exact: true }),
    });
    const link = card.getByRole("link");
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAccessibleName(TRY_VOICE[language]);
    expect(await link.getAttribute("href")).toMatch(/#voice$/);
  }
});

test("WEB-111: no text in the features is under 12 px, and the cards' paragraphs are 16 px or more", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await page.evaluate(() => document.fonts.ready);
    const smallest = await smallestText(page, "#features");
    expect(smallest!.size, `${homeUrl(language)}: “${smallest!.text}”`).toBeGreaterThanOrEqual(12);
    const sizes = await page
      .locator("#features article p")
      .evaluateAll((paragraphs) =>
        paragraphs.map((p) => ({ text: p.textContent?.slice(0, 30), size: parseFloat(getComputedStyle(p).fontSize) })),
      );
    expect(sizes.length).toBe(5);
    for (const { text, size } of sizes) expect(size, `${homeUrl(language)}: “${text}…”`).toBeGreaterThanOrEqual(16);
  }
});

test("WEB-3, WEB-4, WEB-104: the closing card says it's coming soon, leads to the live demo and gives WD2's line", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const closing = page.locator("#get-taskflow");
    await expect(closing.getByRole("heading", { level: 2 })).toHaveText(CLOSING.title[language]);
    await expect(closing.locator("p").first()).toHaveText(CLOSING.body[language]);
    const links = closing.getByRole("link");
    await expect(links).toHaveCount(1);
    await expect(links).toHaveAccessibleName(TRY_VOICE[language]);
    expect(await links.getAttribute("href")).toMatch(/#voice$/);
    await expect(closing.getByText(CLOSING.plans[language], { exact: true })).toBeVisible();
    await expect(closing.locator(".launch-note")).toHaveCount(0);
    await expect(closing.locator(".eyebrow")).toHaveCount(0);
  }
});

test("WEB-3: on a phone, every text in the closing card is 16 px or more", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Measured on the phone.");
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await page.evaluate(() => document.fonts.ready);
    const smallest = await smallestText(page, ".closing-card");
    expect(smallest!.size, `${homeUrl(language)}: “${smallest!.text}”`).toBeGreaterThanOrEqual(16);
  }
});

test("WEB-104: with every answer closed, the page says what's free and names TaskFlow Pro", async ({ page }) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await expect(page.locator("#questions details[open]")).toHaveCount(0);
    const visible = await page.locator("body").innerText();
    expect(visible, homeUrl(language)).toMatch(DICTATIONS[language]);
    expect(visible, homeUrl(language)).toContain("TaskFlow Pro");
  }
});

test("WEB-101, WEB-104, WEB-3: the FAQ and the closing card drop the old trial, plan and download wording", async ({
  page,
}) => {
  const banned = [
    "without an account",
    "voice trial",
    "allowance",
    "Find your flow",
    "Get TaskFlow",
    "first testing platform",
    "no paid plans",
  ];
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    for (const section of ["#get-taskflow", "#questions"]) {
      const text = (await page.locator(section).textContent()) ?? "";
      for (const words of banned)
        expect(text.toLowerCase(), `${homeUrl(language)} ${section}: “${words}”`).not.toContain(words.toLowerCase());
      expect(text, `${homeUrl(language)} ${section}: a price`).not.toMatch(/[€$£]\s?\d|\d\s?(€|\$|£|EUR|USD)/);
      expect(text, `${homeUrl(language)} ${section}: an MB total`).not.toMatch(/\d\s?MB\b/);
    }
    await expect(page.locator('[href*="play.google.com"], [src*="play.google.com"]')).toHaveCount(0);
  }
});

test("WEB-503: opening a second answer leaves the first open", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("details[name]")).toHaveCount(0);
  const items = page.locator("#questions details");
  await items.nth(0).locator("summary").click();
  await items.nth(1).locator("summary").click();
  await expect(items.nth(0)).toHaveAttribute("open", "");
  await expect(items.nth(1)).toHaveAttribute("open", "");
});

test("WEB-3, WEB-104, WEB-101: the FAQ opens with the download, pricing and account questions and their answers", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const items = page.locator("#questions details");
    for (const [index, { question, answer }] of FAQ_FIRST.entries()) {
      const item = items.nth(index);
      await expect(item.locator("summary")).toHaveText(question[language]);
      await item.locator("summary").click();
      await expect(item.locator("p")).toHaveText(answer[language]);
    }
  }
});

for (const theme of THEMES) {
  test.describe(theme, () => {
    test.use({ colorScheme: theme });
    test(`WEB-308: keyboard focus on the closing button draws a ring of 3:1 or more on the green card (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "Measured at 1440 × 1000.");
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.keyboard.press("Tab");
      const button = page.locator("#get-taskflow").getByRole("link");
      await button.focus();
      const ring = await button.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          focusVisible: el.matches(":focus-visible"),
          style: style.outlineStyle,
          width: parseFloat(style.outlineWidth),
          color: style.outlineColor,
          card: getComputedStyle(el.closest(".closing-card")!).backgroundColor,
        };
      });
      expect(ring.focusVisible).toBe(true);
      expect(ring.style).not.toBe("none");
      expect(ring.width).toBeGreaterThanOrEqual(2);
      const card = parseColor(ring.card);
      if (theme === "light") expect(card, "the card's background is #214c38").toEqual(hexColor("#214c38"));
      expect(contrast(parseColor(ring.color), card), `ring ${ring.color} on ${ring.card}`).toBeGreaterThanOrEqual(3);
    });
  });
}

// WP35 (round 2): the account answer names the password, the drawn week names no dates, and
// the feature grid leaves no half-empty card.
const PASSWORD = { en: "password", es: "contraseña", ca: "contrasenya" };

test("WEB-708: the account answer says you sign in with Google or with your email, a password and a 6-digit code", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const item = page.locator("#questions details").nth(2);
    await expect(item.locator("summary")).toHaveText(FAQ_FIRST[2].question[language]);
    await item.locator("summary").click();
    const answer = item.locator("p");
    await expect(answer).toBeVisible();
    await expect(answer).toHaveText(FAQ_FIRST[2].answer[language]);
    await expect(answer).toContainText(PASSWORD[language]);
  }
});

const WEEKDAYS = {
  en: ["M", "T", "W", "T", "F", "S", "S"],
  es: ["L", "M", "X", "J", "V", "S", "D"],
  ca: ["dl", "dt", "dc", "dj", "dv", "ds", "dg"],
};

test("WEB-706: the drawn week under ‘This week’ shows seven weekday letters and no dates", async ({ page }) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const week = page.locator("#features .mini-week");
    await expect(week).toHaveCount(1);
    const days = week.locator(".mini-day");
    await expect(days).toHaveCount(7);
    await expect(days, homeUrl(language)).toHaveText(WEEKDAYS[language]);
    expect(await week.textContent(), `${homeUrl(language)}: a date in the drawn week`).not.toMatch(/\d/);
    await expect(days.first()).toHaveClass(/\bselected\b/);
    await expect(week.locator(".selected")).toHaveCount(1);
  }
});

test("WEB-705, WEB-16: no home draws the voice card's microphone", async ({ page }) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await expect(page.locator(".voice-illustration"), homeUrl(language)).toHaveCount(0);
  }
});

// Each card's box, and the space between the bottom of its last child and its bottom edge.
async function cards(page: Page) {
  return page.locator("#features article").evaluateAll((articles) =>
    articles.map((article) => {
      const box = article.getBoundingClientRect();
      const last = article.lastElementChild!.getBoundingClientRect();
      return {
        heading: article.querySelector("h3")?.textContent?.trim() ?? "",
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        height: box.height,
        gap: box.bottom - last.bottom,
      };
    }),
  );
}

for (const theme of THEMES) {
  test.describe(`${theme} grid`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-705, WEB-709: at 1440 px the calendar card spans two rows beside voice over details, meetings then offline run full width below, and no card is a quarter empty (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "Measured at 1440 × 1000.");
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => document.fonts.ready);
      const [calendar, voice, details, meetings, offline] = await cards(page);
      expect([calendar, voice, details, meetings, offline].map((card) => card.heading)).toEqual(
        FEATURES.cards.map((card) => card.title.en),
      );
      // Voice and details sit to the calendar's right, one above the other.
      expect(voice.left, "voice is right of calendar").toBeGreaterThan(calendar.right);
      expect(details.left, "details is right of calendar").toBeGreaterThan(calendar.right);
      expect(Math.abs(voice.left - details.left), "voice and details share a column").toBeLessThan(1);
      expect(details.top, "details is below voice").toBeGreaterThan(voice.bottom);
      // The calendar spans both their rows.
      expect(Math.abs(calendar.top - voice.top), "calendar starts with voice").toBeLessThan(1);
      expect(Math.abs(calendar.bottom - details.bottom), "calendar ends with details").toBeLessThan(1);
      // WD36: meetings spans the full width below them, its note beside its copy.
      expect(meetings.top, "meetings is below the calendar").toBeGreaterThan(calendar.bottom);
      expect(Math.abs(meetings.left - calendar.left), "meetings starts at the grid's left").toBeLessThan(1);
      expect(Math.abs(meetings.right - voice.right), "meetings ends at the grid's right").toBeLessThan(1);
      // Offline spans the full width below meetings.
      expect(offline.top, "offline is below meetings").toBeGreaterThan(meetings.bottom);
      expect(Math.abs(offline.left - calendar.left), "offline starts at the grid's left").toBeLessThan(1);
      expect(Math.abs(offline.right - voice.right), "offline ends at the grid's right").toBeLessThan(1);
      for (const card of [voice, details, meetings, offline])
        expect(card.gap, `${card.heading}: ${card.gap}px empty of ${card.height}px`).toBeLessThanOrEqual(
          card.height * 0.25,
        );
    });
  });
}

test("WEB-705: on a phone the five feature cards are one column in order, none with more than 40 px left empty", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Measured on the phone (390 × 664).");
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await page.evaluate(() => document.fonts.ready);
    const list = await cards(page);
    expect(list.map((card) => card.heading), homeUrl(language)).toEqual(
      FEATURES.cards.map((card) => card.title[language]),
    );
    for (const [index, card] of list.entries()) {
      expect(Math.abs(card.left - list[0].left), `${card.heading}: left edge`).toBeLessThan(1);
      expect(Math.abs(card.right - list[0].right), `${card.heading}: right edge`).toBeLessThan(1);
      if (index > 0) expect(card.top, `${card.heading} is below the card before it`).toBeGreaterThan(list[index - 1].bottom);
      expect(card.gap, `${homeUrl(language)} ${card.heading}: ${card.gap}px empty`).toBeLessThanOrEqual(40);
    }
  }
});

// The brief's render check, measured: at 1440 px, at 1000 px (between the 800 and 1100 px
// blocks), at 720 px (a 1440 px window at 200% zoom) and with the default text size doubled,
// every card is as tall as its content plus at most about a quarter.
test("WEB-705: at desktop widths, zoomed and with doubled text, no feature card is more than a quarter empty", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop layouts.");
  const found: string[] = [];
  for (const { width, text200 } of [
    { width: 1440, text200: false },
    { width: 1000, text200: false },
    { width: 720, text200: false },
    { width: 1440, text200: true },
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    if (text200) await page.addStyleTag({ content: "html { font-size: 32px !important; }" });
    await page.evaluate(() => document.fonts.ready);
    for (const card of await cards(page))
      if (card.gap > card.height * 0.25)
        found.push(`${width} px${text200 ? ", text 200%" : ""}: ${card.heading} is ${Math.round(card.gap)} of ${Math.round(card.height)} px empty`);
  }
  expect(found).toEqual([]);
});

// WP36 (WEB-709): the full-width offline card lays its text out in two columns above 800 px,
// and stacks it as before at 800 px and below.
async function offlineCard(page: Page) {
  return page.locator("#features .feature-offline").evaluate((card) => {
    const rect = (element: Element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width };
    };
    const icon = card.querySelector(".feature-icon")!;
    const heading = card.querySelector("h3")!;
    const paragraph = card.querySelector("p")!;
    const style = getComputedStyle(card);
    // How far right the card's text actually reaches, line by line.
    let textRight = 0;
    for (const element of [heading, paragraph]) {
      const range = document.createRange();
      range.selectNodeContents(element);
      for (const line of Array.from(range.getClientRects())) textRight = Math.max(textRight, line.right);
    }
    return {
      card: rect(card),
      paddingLeft: parseFloat(style.paddingLeft),
      display: style.display,
      scroll: {
        width: card.scrollWidth,
        clientWidth: card.clientWidth,
        height: card.scrollHeight,
        clientHeight: card.clientHeight,
      },
      icon: rect(icon),
      heading: { ...rect(heading), scrollWidth: heading.scrollWidth, clientWidth: heading.clientWidth },
      paragraph: {
        ...rect(paragraph),
        scrollWidth: paragraph.scrollWidth,
        clientWidth: paragraph.clientWidth,
        marginTop: getComputedStyle(paragraph).marginTop,
        maxWidth: getComputedStyle(paragraph).maxWidth,
      },
      textRight,
    };
  });
}

const overlaps = (a: { left: number; right: number; top: number; bottom: number }, b: typeof a) =>
  a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

for (const theme of THEMES) {
  test.describe(`${theme} offline card`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-709: at 1440 px the offline card's paragraph sits right of its heading, and the icon and heading start at the card's padding (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "Measured at 1440 × 1000.");
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await page.evaluate(() => document.fonts.ready);
        const { card, paddingLeft, icon, heading, paragraph } = await offlineCard(page);
        const where = `${homeUrl(language)} (${theme})`;
        expect(paragraph.left - card.left, `${where}: paragraph's left edge from the card's left`).toBeGreaterThanOrEqual(
          card.width * 0.4,
        );
        expect(paragraph.left, `${where}: paragraph is right of the heading`).toBeGreaterThanOrEqual(heading.right);
        expect(paragraph.top, `${where}: paragraph's top is above the heading's bottom`).toBeLessThan(heading.bottom);
        expect(Math.abs(icon.left - (card.left + paddingLeft)), `${where}: icon starts at the left padding`).toBeLessThan(1);
        expect(Math.abs(heading.left - (card.left + paddingLeft)), `${where}: heading starts at the left padding`).toBeLessThan(1);
        // WEB-710 (9c1eaf8) moved the paragraph from the icon's top to the heading's.
        expect(Math.abs(paragraph.top - heading.top), `${where}: paragraph's top lines up with the heading's`).toBeLessThan(2);
      }
    });

    test(`WEB-709: at 1440 px the offline card's text reaches past half its width (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "Measured at 1440 × 1000.");
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await page.evaluate(() => document.fonts.ready);
        const { card, textRight } = await offlineCard(page);
        const blank = (card.right - textRight) / card.width;
        expect(blank, `${homeUrl(language)} (${theme}): ${Math.round(blank * 100)}% of the card's width is blank on the right`).toBeLessThanOrEqual(0.5);
      }
    });
  });
}

test("WEB-709: with doubled text at 1440 px, and at 1000 px wide, no text in the offline card is clipped and its heading and paragraph don't overlap", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop layouts.");
  const found: string[] = [];
  for (const { width, text200 } of [
    { width: 1440, text200: true },
    { width: 1000, text200: false },
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const language of LANGUAGES) {
      await page.goto(homeUrl(language));
      if (text200) await page.addStyleTag({ content: "html { font-size: 32px !important; }" });
      await page.evaluate(() => document.fonts.ready);
      const where = `${homeUrl(language)} at ${width} px${text200 ? ", text 200%" : ""}`;
      const { scroll, heading, paragraph, icon } = await offlineCard(page);
      if (scroll.width > scroll.clientWidth) found.push(`${where}: card scrollWidth ${scroll.width} > ${scroll.clientWidth}`);
      if (scroll.height > scroll.clientHeight) found.push(`${where}: card scrollHeight ${scroll.height} > ${scroll.clientHeight}`);
      if (heading.scrollWidth > heading.clientWidth) found.push(`${where}: heading overflows its column`);
      if (paragraph.scrollWidth > paragraph.clientWidth) found.push(`${where}: paragraph overflows its column`);
      if (overlaps(heading, paragraph)) found.push(`${where}: heading and paragraph overlap`);
      if (overlaps(icon, paragraph)) found.push(`${where}: icon and paragraph overlap`);
    }
  }
  expect(found).toEqual([]);
});

test("WEB-709: on a phone the offline card stacks its icon, heading and paragraph as before", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Measured on the phone (390 × 664).");
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await page.evaluate(() => document.fonts.ready);
    const { display, icon, heading, paragraph } = await offlineCard(page);
    const where = homeUrl(language);
    expect(display, `${where}: the card is display block`).toBe("block");
    expect(heading.top, `${where}: heading is below the icon`).toBeGreaterThanOrEqual(icon.bottom - 0.5);
    expect(paragraph.top, `${where}: paragraph is below the heading`).toBeGreaterThanOrEqual(heading.bottom - 0.5);
    expect(paragraph.marginTop, `${where}: paragraph's top margin`).toBe("10px");
    expect(paragraph.maxWidth, `${where}: paragraph's max-width is 26rem`).toBe("416px");
  }
});

test("WEB-710: on desktop the offline card's paragraph starts level with its heading, in every language", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The two-column layout is desktop only.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const path of ["/", "/es/", "/ca/"]) {
    await page.goto(path);
    const card = page.locator(".feature-offline");
    await card.scrollIntoViewIfNeeded();
    const heading = await card.locator("h3").boundingBox();
    const paragraph = await card.locator("p").first().boundingBox();
    expect(heading, `${path}: heading`).not.toBeNull();
    expect(paragraph, `${path}: paragraph`).not.toBeNull();
    expect(Math.abs(paragraph!.y - heading!.y), `${path}: tops within 2 px`).toBeLessThanOrEqual(2);
  }
});

// WP19: the FAQ in the app's words.
const FAQ_ALL = [...FAQ_FIRST, ...FAQ_REST];

test("WEB-111: the FAQ's heading is ‘Questions’ in the page's language, with no eyebrow, intro or doodle", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const questions = page.locator("#questions");
    const h2 = questions.getByRole("heading", { level: 2 });
    await expect(h2, homeUrl(language)).toHaveCount(1);
    await expect(h2, homeUrl(language)).toHaveText(FAQ_TITLE[language]);
    await expect(questions.locator(".eyebrow, .faq-doodle"), homeUrl(language)).toHaveCount(0);
    // Every paragraph is an answer: none sits outside the items.
    const loose = await questions
      .locator("p")
      .evaluateAll((paragraphs) => paragraphs.filter((p) => !p.closest("details")).length);
    expect(loose, `${homeUrl(language)}: paragraphs outside the answers`).toBe(0);
    const text = (await questions.textContent()) ?? "";
    expect(text, homeUrl(language)).not.toMatch(/04 \/|a few good questions|glad you asked|less guesswork/i);
  }
});

test("WEB-105, WEB-107, WEB-109, WEB-110, WEB-1404: the nine questions come in order, and the voice, repeat, offline, sharing and notes answers are the app's words", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const items = page.locator("#questions details");
    await expect(items.locator("summary"), homeUrl(language)).toHaveText(
      FAQ_ALL.map((item) => item.question[language]),
    );
    for (const [offset, { question, answer }] of FAQ_REST.entries()) {
      const item = items.nth(FAQ_FIRST.length + offset);
      await item.locator("summary").click();
      await expect(item.locator("p"), `${homeUrl(language)}: ${question[language]}`).toHaveText(
        answer[language],
      );
    }
  }
});

test("WEB-105, WEB-107, WEB-109, WEB-110: outside the live demo, no home's text, alt text or labels use words the app doesn't", async ({
  page,
}) => {
  const banned = [
    "voice-to-task",
    "draft",
    "allowance",
    "shared list",
    "share a list",
    "MiB",
    "transcribe",
    "sync",
    "Task or Note",
  ];
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    // Every answer open, so their text counts as visible.
    await page
      .locator("#questions details")
      .evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    const words = await page.locator("main").evaluate((main) => {
      const voice = main.querySelector("#voice");
      const outside = (node: Node) => !voice || !voice.contains(node);
      const found: string[] = [];
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode())
        if (outside(node) && node.textContent?.trim()) found.push(node.textContent);
      for (const element of Array.from(main.querySelectorAll("[alt], [aria-label], [title]")))
        if (outside(element))
          for (const name of ["alt", "aria-label", "title"]) {
            const value = element.getAttribute(name);
            if (value) found.push(value);
          }
      return found.join(" \n ");
    });
    for (const word of banned)
      expect(words.toLowerCase(), `${homeUrl(language)}: “${word}”`).not.toContain(word.toLowerCase());
  }
});

test("WEB-105: opened answers' text is 16 px or more", async ({ page }) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const items = page.locator("#questions details");
    for (let index = 0; index < FAQ_ALL.length; index++) await items.nth(index).locator("summary").click();
    await expect(page.locator("#questions details[open]")).toHaveCount(FAQ_ALL.length);
    const smallest = await smallestText(page, "#questions .faq-list");
    expect(smallest, homeUrl(language)).not.toBeNull();
    expect(smallest!.size, `${homeUrl(language)}: “${smallest!.text}”`).toBeGreaterThanOrEqual(16);
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} FAQ`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-105, WEB-111: axe reports no violations on the three homes with two answers open (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const items = page.locator("#questions details");
        await items.nth(3).locator("summary").click();
        await items.nth(5).locator("summary").click();
        await expect(page.locator("#questions details[open]")).toHaveCount(2);
        expect(await axeViolations(page), homeUrl(language)).toEqual([]);
      }
    });
  });
}

// ---- Run 2026-10-21-changes, round 1: WP53 (WEB-1001, WEB-1003) and WP57 (WEB-1004, WEB-1005) ----
// These checks are about the wording itself, so the plan's exact copy is written here.

type Copy = Record<Language, string>;

// WP53: the fourth question is unchanged; its answer names completing and changing many tasks.
const VOICE_QUESTION: Copy = {
  en: "How do I add tasks by voice?",
  es: "¿Cómo añado tareas hablando?",
  ca: "Com afegeixo tasques parlant?",
};
const VOICE_ANSWER: Copy = {
  en: "Tap Add a task and say what you need to do, in your own words; several things at once is fine. Tap Done, and TaskFlow shows one task for each, with its day and time. Add them all with one tap. You can also ask what you have this week, or move, change, complete or delete tasks by voice, even all of yesterday’s at once. TaskFlow shows the change first, and you can undo it. Understanding what you say needs the internet: your words are sent to Google.",
  es: "Toca Añadir tarea y di lo que tienes que hacer, con tus palabras; puedes decir varias cosas a la vez. Toca Listo y TaskFlow te muestra una tarea por cada cosa, con su día y su hora. Añádelas todas con un toque. También puedes preguntar qué tienes esta semana, o mover, cambiar, completar o eliminar tareas hablando, incluso todas las de ayer a la vez. TaskFlow te enseña el cambio antes y puedes deshacerlo. Para entender lo que dices necesita internet: tus palabras se envían a Google.",
  ca: "Toca Afegeix una tasca i digues el que has de fer, amb les teves paraules; pots dir diverses coses alhora. Toca Fet i TaskFlow et mostra una tasca per cada cosa, amb el dia i l’hora. Afegeix-les totes amb un toc. També pots preguntar què tens aquesta setmana, o moure, canviar, completar o suprimir tasques parlant, fins i tot totes les d’ahir alhora. TaskFlow t’ensenya el canvi abans i el pots desfer. Per entendre el que dius necessita internet: les teves paraules s’envien a Google.",
};
// WP53, WP59, WP60: the calendar card's paragraph, without ‘the first time you add one’ or ‘it asks you once’, and with reminders that come more and more often.
const CALENDAR_TITLE: Copy = {
  en: "Your day on one calendar",
  es: "Tu día en un calendario",
  ca: "El teu dia en un calendari",
};
const CALENDAR_BODY: Copy = {
  en: "See your tasks by day, week or month, beside the events from your phone’s calendars if you like. TaskFlow can remind you of tasks with a date, more and more often as the day gets closer.",
  es: "Mira tus tareas por día, semana o mes, junto a los eventos de los calendarios del teléfono si quieres. TaskFlow puede recordarte las tareas con fecha, cada vez más a menudo según se acerca el día.",
  ca: "Mira les tasques per dia, setmana o mes, al costat dels esdeveniments dels calendaris del telèfon si vols. TaskFlow et pot recordar les tasques amb data, cada cop més sovint a mesura que s’acosta el dia.",
};
// WP57: the voice card's paragraph gains one sentence; the FAQ gains an eighth item.
const VOICE_CARD_TITLE: Copy = {
  en: "Say several things at once",
  es: "Di varias cosas a la vez",
  ca: "Digues diverses coses alhora",
};
const VOICE_CARD_BODY: Copy = {
  en: "TaskFlow makes one task for each thing you say, with its day and time. Check them, then add them all with one tap. In the app, you can also move all of yesterday’s tasks to tomorrow by voice, or complete many at once.",
  es: "TaskFlow crea una tarea por cada cosa que dices, con su día y su hora. Revísalas y añádelas todas con un toque. En la app, también puedes mover con la voz todas las tareas de ayer a mañana, o completar muchas a la vez.",
  ca: "TaskFlow crea una tasca per cada cosa que dius, amb el dia i l’hora. Revisa-les i afegeix-les totes amb un toc. A l’aplicació, també pots moure amb la veu totes les tasques d’ahir a demà, o completar-ne moltes alhora.",
};
const VOICE_CARD_LINK: Copy = {
  en: "Try it with your voice",
  es: "Pruébalo con tu voz",
  ca: "Prova-ho amb la teva veu",
};
const WAYS_IN_QUESTION: Copy = {
  en: "Can I add tasks from my home screen or from WhatsApp?",
  es: "¿Puedo añadir tareas desde la pantalla de inicio o desde WhatsApp?",
  ca: "Puc afegir tasques des de la pantalla d’inici o des de WhatsApp?",
};
const WAYS_IN_ANSWER: Copy = {
  en: "Yes. Use the Dictate a task widget or shortcut, or share a message to TaskFlow from another app, such as WhatsApp.",
  es: "Sí. Usa el widget o el acceso directo Dictar una tarea, o comparte un mensaje con TaskFlow desde otra app, como WhatsApp.",
  ca: "Sí. Fes servir el giny o la drecera Dicta una tasca, o comparteix un missatge amb TaskFlow des d’una altra aplicació, com WhatsApp.",
};
// Wording the round removes, and the app's bulk card, which no home may quote.
const OLD_VOICE_ANSWER = [
  "move, change or delete a task",
  "to be turned into tasks",
  "mover, cambiar o eliminar una tarea",
  "para convertirlas en tareas",
  "moure, canviar o suprimir una tasca",
  "per convertir-les en tasques",
];
// WP59 (WEB-1102): ‘it asks you once’ goes too; reminder plans ask again for tasks two weeks or more away.
const OLD_ASKS_ONCE = ["it asks you once", "te lo pregunta una sola vez", "t’ho pregunta una sola vegada"];
const OLD_CALENDAR = [
  "the first time you add one",
  "la primera vez que añades una",
  "la primera vegada que n’afegeixes una",
  ...OLD_ASKS_ONCE,
];
const BULK_CARD = [/Move \d+ tasks/i, /Mover \d+ tareas/i, /como hechas/i, /Mou \d+ tasques/i];

const VOICE_INDEX = 3; // The fourth question.
const WAYS_IN_INDEX = 8; // The ninth question (WP264 put the repeat question fifth).

// Sentences end at . ? !; words split on spaces (the plan's rule).
const sentences = (text: string) =>
  text
    .split(/(?<=[.?!])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
const words = (text: string) => text.split(/\s+/).filter(Boolean);
const longestSentence = (text: string) => Math.max(...sentences(text).map((sentence) => words(sentence).length));

const featureCard = (page: Page, title: string) =>
  page.locator("#features article", { has: page.getByRole("heading", { level: 3, name: title, exact: true }) });

async function openAnswer(page: Page, index: number) {
  const item = page.locator("#questions details").nth(index);
  await item.locator("summary").click();
  await expect(item).toHaveAttribute("open", "");
  return item;
}

// The visible text of the home with every answer open.
async function homeTextAllOpen(page: Page) {
  await page.locator("#questions details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
  return page.locator("body").innerText();
}

for (const theme of THEMES) {
  test.describe(`${theme} WP53 WP57`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1001: the fourth question is unchanged, and its answer names completing and changing tasks, even all of yesterday’s at once (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const item = page.locator("#questions details").nth(VOICE_INDEX);
        await expect(item.locator("summary"), homeUrl(language)).toHaveText(VOICE_QUESTION[language]);
        await openAnswer(page, VOICE_INDEX);
        const answer = item.locator("p");
        await expect(answer, homeUrl(language)).toBeVisible();
        await expect(answer, homeUrl(language)).toHaveText(VOICE_ANSWER[language]);
      }
    });

    test(`WEB-1003, WEB-1102, WEB-1103: the calendar card's paragraph says TaskFlow can remind you of tasks with a date, more and more often as the day gets closer, with no ‘the first time you add one’ and no ‘it asks you once’ (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(featureCard(page, CALENDAR_TITLE[language]).locator("p"), homeUrl(language)).toHaveText([
          CALENDAR_BODY[language],
        ]);
      }
    });

    test(`WEB-1004: the voice card's paragraph ends with moving all of yesterday’s tasks or completing many, with no quotation marks and its one link to the demo below it (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const voiceCard = featureCard(page, VOICE_CARD_TITLE[language]);
        const paragraph = voiceCard.locator("p");
        await expect(paragraph, homeUrl(language)).toHaveText([VOICE_CARD_BODY[language]]);
        expect(await paragraph.innerText(), `${homeUrl(language)}: quotation marks`).not.toMatch(/[“”«»"]/);
        const link = voiceCard.getByRole("link");
        await expect(link, homeUrl(language)).toHaveCount(1);
        await expect(link, homeUrl(language)).toHaveAccessibleName(VOICE_CARD_LINK[language]);
        expect(await link.getAttribute("href"), homeUrl(language)).toMatch(/#voice$/);
        const text = (await paragraph.boundingBox())!;
        const below = (await link.boundingBox())!;
        expect(below.y, `${homeUrl(language)}: the link is below the paragraph`).toBeGreaterThanOrEqual(
          text.y + text.height - 1,
        );
      }
    });

    test(`WEB-1001, WEB-1005: axe reports no violations on the three homes with the fourth and ninth answers open (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await openAnswer(page, VOICE_INDEX);
        await openAnswer(page, WAYS_IN_INDEX);
        await expect(page.locator("#questions details[open]")).toHaveCount(2);
        expect(await axeViolations(page), `${homeUrl(language)} in ${theme}`).toEqual([]);
      }
    });
  });
}

test("WEB-1001: in the voice answer no sentence runs over 24 words, and the English answer is 88 words or fewer", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const item = await openAnswer(page, VOICE_INDEX);
    const answer = (await item.locator("p").innerText()).trim();
    expect(answer, homeUrl(language)).toBe(VOICE_ANSWER[language]);
    expect(longestSentence(answer), `${homeUrl(language)}: the longest sentence`).toBeLessThanOrEqual(24);
    if (language === "en") expect(words(answer).length, "the English answer's words").toBeLessThanOrEqual(88);
  }
});

test("WEB-1004, WEB-1005: no sentence in the voice card's paragraph or the ninth answer runs over 24 words", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const paragraph = (await featureCard(page, VOICE_CARD_TITLE[language]).locator("p").innerText()).trim();
    expect(longestSentence(paragraph), `${homeUrl(language)}: the voice card`).toBeLessThanOrEqual(24);
    const item = await openAnswer(page, WAYS_IN_INDEX);
    const answer = (await item.locator("p").innerText()).trim();
    expect(answer, homeUrl(language)).toBe(WAYS_IN_ANSWER[language]);
    expect(longestSentence(answer), `${homeUrl(language)}: the ninth answer`).toBeLessThanOrEqual(24);
  }
});

test("WEB-1001, WEB-1003, WEB-1004: with every answer open, no home has the old voice answer, the old reminder clause or the app's bulk-card wording", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const text = await homeTextAllOpen(page);
    await expect(page.locator("#questions details[open]")).toHaveCount(9);
    for (const phrase of [...OLD_VOICE_ANSWER, ...OLD_CALENDAR])
      expect(text, `${homeUrl(language)}: “${phrase}”`).not.toContain(phrase);
    for (const pattern of BULK_CARD) expect(text, `${homeUrl(language)}: ${pattern}`).not.toMatch(pattern);
  }
});

test("WEB-1005, WEB-1404: the FAQ has nine questions, the first eight as before, and the ninth names the home screen and WhatsApp; its answer is 16 px or more", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const summaries = page.locator("#questions details summary");
    await expect(summaries, homeUrl(language)).toHaveCount(9);
    await expect(summaries, homeUrl(language)).toHaveText([
      ...FAQ_ALL.slice(0, 8).map((item) => item.question[language]),
      WAYS_IN_QUESTION[language],
    ]);
    await expect(summaries.nth(VOICE_INDEX), homeUrl(language)).toHaveText(VOICE_QUESTION[language]);
    const item = await openAnswer(page, WAYS_IN_INDEX);
    const answer = item.locator("p");
    await expect(answer, homeUrl(language)).toBeVisible();
    await expect(answer, homeUrl(language)).toHaveText(WAYS_IN_ANSWER[language]);
    const size = await answer.evaluate((p) => parseFloat(getComputedStyle(p).fontSize));
    expect(size, `${homeUrl(language)}: the ninth answer's size`).toBeGreaterThanOrEqual(16);
  }
});

// WP57's layout change: the calendar card's drawing reaches the card's bottom edge.
test("WEB-1004: at 1440, 1000 and 720 px, and at 1440 px with the browser's text doubled, the calendar drawing ends on the card's bottom edge", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop layouts.");
  const found: string[] = [];
  for (const { width, text200 } of [
    { width: 1440, text200: false },
    { width: 1000, text200: false },
    { width: 720, text200: false },
    { width: 1440, text200: true },
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    if (text200) await doubleTextSize(page);
    for (const language of LANGUAGES) {
      await page.goto(homeUrl(language));
      await page.evaluate(() => document.fonts.ready);
      if (text200) expect(await rootFontSize(page), "the root at 200%").toBe(32);
      const edge = await page.locator("#features .feature-calendar").evaluate((article) => {
        const drawing = article.querySelector(".calendar-illustration");
        return drawing ? article.getBoundingClientRect().bottom - drawing.getBoundingClientRect().bottom : null;
      });
      const where = `${homeUrl(language)} at ${width} px${text200 ? ", text 200%" : ""}`;
      if (edge === null) found.push(`${where}: no calendar drawing`);
      else if (Math.abs(edge) > 1) found.push(`${where}: the drawing ends ${Math.round(edge)} px above the card's bottom`);
    }
  }
  expect(found).toEqual([]);
});

// The answers' fit at the narrowest width and with doubled text (the renders open only the first).
for (const [finding, index, name] of [
  ["WEB-1001", VOICE_INDEX, "fourth"],
  ["WEB-1005", WAYS_IN_INDEX, "ninth"],
] as const) {
  test(`${finding}: with the ${name} answer open, /es/ and /ca/ don't scroll sideways at 320 × 800`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    for (const language of ["es", "ca"] as const) {
      await page.goto(homeUrl(language));
      const item = await openAnswer(page, index);
      await expect(item.locator("p")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await scrollsSideways(page), `${homeUrl(language)} at 320 px`).toBe(false);
    }
  });

  test(`${finding}: on the phone with the browser's text doubled and the ${name} answer open, no home scrolls sideways`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "The phone (390 × 664).");
    await doubleTextSize(page);
    for (const language of LANGUAGES) {
      await page.goto(homeUrl(language));
      expect(await rootFontSize(page), `${homeUrl(language)}: the root at 200%`).toBe(32);
      const item = await openAnswer(page, index);
      await expect(item.locator("p")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await scrollsSideways(page), `${homeUrl(language)} at 200% text`).toBe(false);
    }
  });
}

// ---- Run 2026-10-22-changes, round 1: WP59 (WEB-1102) ----
// The calendar card's paragraph is CALENDAR_BODY above, pinned in both themes by
// "WEB-1003, WEB-1102: the calendar card's paragraph says …" and by "each feature card says what
// the app does"; "with every answer open, no home has … the old reminder clause" covers
// OLD_ASKS_ONCE through OLD_CALENDAR. The card layout is pinned by the WEB-705 and WEB-1004 tests.

test("WEB-1102: no file under src/ says the app asks about reminders only once", () => {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(tsx?|jsx?|css|json|mdx?)$/.test(entry.name)) {
        const text = readFileSync(file, "utf8");
        for (const phrase of OLD_ASKS_ONCE)
          if (text.includes(phrase)) found.push(`${path.relative(ROOT, file)}: “${phrase}”`);
      }
    }
  };
  walk(path.join(ROOT, "src"));
  expect(found).toEqual([]);
});

test("WEB-1102, WEB-1103: the calendar card's paragraph ends with reminders that come more and more often as the day gets closer, with no colon, in every language", async ({
  page,
}) => {
  const ENDS: Copy = {
    en: "TaskFlow can remind you of tasks with a date, more and more often as the day gets closer.",
    es: "TaskFlow puede recordarte las tareas con fecha, cada vez más a menudo según se acerca el día.",
    ca: "TaskFlow et pot recordar les tasques amb data, cada cop més sovint a mesura que s’acosta el dia.",
  };
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const paragraph = (await featureCard(page, CALENDAR_TITLE[language]).locator("p").innerText()).trim();
    expect(paragraph.endsWith(ENDS[language]), `${homeUrl(language)}: “${paragraph}”`).toBe(true);
    expect(paragraph, homeUrl(language)).not.toContain(":");
    if (language === "en") expect(words(paragraph).length, "the English paragraph's words").toBe(36);
  }
});

test("WEB-1102: /es/ and /ca/ don't scroll sideways at 320 × 800", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const language of ["es", "ca"] as const) {
    await page.goto(homeUrl(language));
    await featureCard(page, CALENDAR_TITLE[language]).scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    expect(await scrollsSideways(page), `${homeUrl(language)} at 320 px`).toBe(false);
  }
});

test("WEB-1102: on the phone with the browser's text doubled, no home scrolls sideways", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone (390 × 664).");
  await doubleTextSize(page);
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    expect(await rootFontSize(page), `${homeUrl(language)}: the root at 200%`).toBe(32);
    await featureCard(page, CALENDAR_TITLE[language]).scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    expect(await scrollsSideways(page), `${homeUrl(language)} at 200% text`).toBe(false);
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} WP59`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1102: axe reports no violations on the three homes (${theme})`, async ({ page }) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(featureCard(page, CALENDAR_TITLE[language]).locator("p")).toHaveText([CALENDAR_BODY[language]]);
        expect(await axeViolations(page), `${homeUrl(language)} in ${theme}`).toEqual([]);
      }
    });
  });
}

// ---- Run 2026-10-22-changes, plan 2: WP60 (WEB-1103, WEB-1104) ----
// These checks are about the wording itself, so the brief's exact copy is written here.
// WEB-1103's paragraph is CALENDAR_BODY above, pinned in both themes by "WEB-1003, WEB-1102,
// WEB-1103: the calendar card's paragraph says …", by "each feature card says what the app does"
// and, for its ending, its lack of a colon and its 36 English words, by "WEB-1102, WEB-1103: … ends
// with reminders". The card layout stays pinned by the WEB-705 and WEB-1004 tests, and WD2's line by
// "the closing card says it's coming soon …" and tests/ux-web-voice.spec.ts.

const FREE_INDEX = 1; // The second question, ‘Is TaskFlow free?’.
const FREE_QUESTION: Copy = {
  en: "Is TaskFlow free?",
  es: "¿TaskFlow es gratis?",
  ca: "TaskFlow és gratuït?",
};
// WP70 (run 2026-10-28-site): two paragraphs, Free then Pro.
const FREE_ANSWER: Record<Language, string[]> = {
  en: [
    "Yes. You get 10 free dictations a month, and one dictation can hold several tasks. When they’re used up, you keep adding tasks with a short form, with no limit, until they come back the next month. Reminders are free too, even the ones that come more and more often as the day gets closer.",
    "TaskFlow Pro is a monthly subscription that renews until you cancel it in Google Play. It gives you unlimited dictation (with a safety limit of 50 dictations a day) and 500 MB of files a month. It also turns sentences you type into tasks, and lets you ask for reminders in your own words. It makes notes from the meetings you record too, up to 20 hours a month. Its price isn’t set yet.",
  ],
  es: [
    "Sí. Tienes 10 dictados gratis al mes, y en un dictado caben varias tareas. Cuando se acaban, sigues añadiendo tareas con un formulario sencillo, sin límite, hasta que vuelven el mes siguiente. Los recordatorios también son gratis, incluso los que llegan cada vez más a menudo según se acerca el día.",
    "TaskFlow Pro es una suscripción mensual que se renueva hasta que la cancelas en Google Play. Te da dictado ilimitado (con un límite de seguridad de 50 dictados al día) y 500 MB de archivos al mes. Además, convierte en tareas las frases que escribes y te deja pedir los recordatorios con tus palabras. También toma notas de las reuniones que grabas, hasta 20 horas al mes. Su precio aún no está decidido.",
  ],
  ca: [
    "Sí. Tens 10 dictats gratuïts al mes, i en un dictat hi caben diverses tasques. Quan s’acaben, continues afegint tasques amb un formulari senzill, sense límit, fins que tornen el mes següent. Els recordatoris també són gratuïts, fins i tot els que arriben cada cop més sovint a mesura que s’acosta el dia.",
    "TaskFlow Pro és una subscripció mensual que es renova fins que la cancel·les a Google Play. Et dona dictat il·limitat (amb un límit de seguretat de 50 dictats al dia) i 500 MB de fitxers al mes. A més, converteix en tasques les frases que escrius i et deixa demanar els recordatoris amb les teves paraules. També pren notes de les reunions que enregistres, fins a 20 hores al mes. El preu encara no està decidit.",
  ],
};
const FREE_REMINDERS: Copy = {
  en: "Reminders are free too, even the ones that come more and more often as the day gets closer.",
  es: "Los recordatorios también son gratis, incluso los que llegan cada vez más a menudo según se acerca el día.",
  ca: "Els recordatoris també són gratuïts, fins i tot els que arriben cada cop més sovint a mesura que s’acosta el dia.",
};
const PRO_SECOND: Copy = {
  en: "It also turns sentences you type into tasks, and lets you ask for reminders in your own words.",
  es: "Además, convierte en tareas las frases que escribes y te deja pedir los recordatorios con tus palabras.",
  ca: "A més, converteix en tasques les frases que escrius i et deixa demanar els recordatoris amb les teves paraules.",
};
// WD36: Pro's meeting notes, a sentence of their own after PRO_SECOND.
const PRO_MEETINGS: Copy = {
  en: "It makes notes from the meetings you record too, up to 20 hours a month.",
  es: "También toma notas de las reuniones que grabas, hasta 20 horas al mes.",
  ca: "També pren notes de les reunions que enregistres, fins a 20 hores al mes.",
};
const UNLIMITED: Copy = {
  en: "unlimited dictation",
  es: "dictado ilimitado",
  ca: "dictat il·limitat",
};
const OWN_WORDS: Copy = {
  en: "reminders in your own words",
  es: "los recordatorios con tus palabras",
  ca: "els recordatoris amb les teves paraules",
};
const PRICE: Copy = {
  en: "Its price isn’t set yet.",
  es: "Su precio aún no está decidido.",
  ca: "El preu encara no està decidit.",
};
// The Pro sentence was 38, 42 and 44 words; no sentence of the answer may now pass 30, 33 or 34.
const LONGEST_SENTENCE: Record<Language, number> = { en: 30, es: 33, ca: 34 };
// The app's reminder-sheet names, which the site mustn't quote while the app's D1–D7 round runs.
const SHEET_NAMES = [
  "Your way",
  "A tu manera",
  "A la teva manera",
  "Until the deadline",
  "Hasta la fecha límite",
  "Fins al termini",
  "Gentle",
  "Intense",
  "Suave",
  "Intenso",
  "Suau",
  "Intens",
];

for (const theme of THEMES) {
  test.describe(`${theme} WP60`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1104: ‘Is TaskFlow free?’ is still the second question, and its answer says reminders are free and Pro adds reminders in your own words (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        const where = homeUrl(language);
        await page.goto(where);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const item = page.locator("#questions details").nth(FREE_INDEX);
        await expect(item.locator("summary"), where).toHaveText(FREE_QUESTION[language]);
        await openAnswer(page, FREE_INDEX);
        const answer = item.locator("p");
        await expect(answer.first(), where).toBeVisible();
        await expect(answer, where).toHaveText(FREE_ANSWER[language]);
        const text = (await answer.allInnerTexts()).map((paragraph) => paragraph.trim()).join(" ");
        const free = text.indexOf(FREE_REMINDERS[language]);
        const pro = text.indexOf("TaskFlow Pro");
        expect(free, `${where}: the free reminders sentence`).toBeGreaterThan(-1);
        expect(free, `${where}: free reminders come before the first ‘TaskFlow Pro’`).toBeLessThan(pro);
        // WD14's parenthesis directly follows the unlimited clause, and ends the Pro sentence.
        const parenthesis = text.indexOf(`${UNLIMITED[language]} (`);
        expect(parenthesis, `${where}: “${UNLIMITED[language]} (”`).toBeGreaterThan(pro);
        const closes = text.indexOf(")", parenthesis);
        expect(text.slice(closes, closes + 2), `${where}: the Pro sentence ends at the parenthesis`).toBe(").");
        const ownWords = text.indexOf(OWN_WORDS[language]);
        expect(ownWords, `${where}: “${OWN_WORDS[language]}” after the parenthesis`).toBeGreaterThan(closes);
        expect(sentences(text), `${where}: Pro's second sentence`).toContain(PRO_SECOND[language]);
        expect(text.endsWith(PRICE[language]), `${where}: ends with the price sentence`).toBe(true);
      }
    });

    test(`WEB-1104: axe reports no violations on the three homes with the second answer open (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const item = await openAnswer(page, FREE_INDEX);
        await expect(item.locator("p")).toHaveText(FREE_ANSWER[language]);
        await expect(page.locator("#questions details[open]")).toHaveCount(1);
        expect(await axeViolations(page), `${homeUrl(language)} in ${theme}`).toEqual([]);
      }
    });
  });
}

test("WEB-1104: no sentence of the free answer passes the old Pro sentence's limit, and its two new sentences are 24 words or fewer", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    await page.goto(where);
    const item = await openAnswer(page, FREE_INDEX);
    const answer = (await item.locator("p").allInnerTexts()).map((paragraph) => paragraph.trim()).join(" ");
    expect(answer, where).toBe(FREE_ANSWER[language].join(" "));
    expect(longestSentence(answer), `${where}: the longest sentence`).toBeLessThanOrEqual(LONGEST_SENTENCE[language]);
    for (const added of [FREE_REMINDERS[language], PRO_SECOND[language], PRO_MEETINGS[language]]) {
      expect(sentences(answer), `${where}: “${added}” is a sentence of its own`).toContain(added);
      expect(words(added).length, `${where}: “${added}”`).toBeLessThanOrEqual(24);
    }
  }
});

test("WEB-1103, WEB-1104: with every answer open, outside the live demo, no home quotes the app's reminder-sheet names, and WD2's line has no reminders", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    await page.goto(where);
    await page
      .locator("#questions details")
      .evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    await expect(page.locator("#questions details:not([open])")).toHaveCount(0);
    const found = await page.locator("body").evaluate((body) => {
      const voice = body.querySelector("#voice");
      const outside = (node: Node) => !voice || !voice.contains(node);
      const texts: string[] = [];
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        if (parent && /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(parent.tagName)) continue;
        if (outside(node) && node.textContent?.trim()) texts.push(node.textContent);
      }
      for (const element of Array.from(body.querySelectorAll("[alt], [aria-label], [title], [placeholder]")))
        if (outside(element))
          for (const name of ["alt", "aria-label", "title", "placeholder"]) {
            const value = element.getAttribute(name);
            if (value) texts.push(value);
          }
      return texts.join(" \n ");
    });
    for (const name of SHEET_NAMES) expect(found, `${where}: “${name}”`).not.toContain(name);
    await expect(page.locator("#get-taskflow").getByText(CLOSING.plans[language], { exact: true }), where).toBeVisible();
    expect(CLOSING.plans[language], `${where}: WD2's line`).not.toMatch(/remind|recordator/i);
  }
});

test("WEB-1104: with the second answer open, /es/ and /ca/ don't scroll sideways at 320 × 800", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const language of ["es", "ca"] as const) {
    await page.goto(homeUrl(language));
    const item = await openAnswer(page, FREE_INDEX);
    await expect(item.locator("p")).toHaveText(FREE_ANSWER[language]);
    await page.evaluate(() => document.fonts.ready);
    expect(await scrollsSideways(page), `${homeUrl(language)} at 320 px`).toBe(false);
  }
});

test("WEB-1104: on the phone with the browser's text doubled and the second answer open, no home scrolls sideways", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone (390 × 664).");
  await doubleTextSize(page);
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    expect(await rootFontSize(page), `${homeUrl(language)}: the root at 200%`).toBe(32);
    const item = await openAnswer(page, FREE_INDEX);
    await expect(item.locator("p")).toHaveText(FREE_ANSWER[language]);
    await page.evaluate(() => document.fonts.ready);
    expect(await scrollsSideways(page), `${homeUrl(language)} at 200% text`).toBe(false);
  }
});

// ---- Run 2026-10-22-changes, plan 2, round 2: WP61 (WEB-1105) ----
// The calendar card's paragraph is CALENDAR_BODY above, pinned word for word by WP60's tests; its
// layout stays pinned by the WEB-705 and WEB-1004 tests. Here: its last line holds two words or
// more, and the four cards' paragraphs wrap with text-wrap: pretty at the same size as before.

// The words on a paragraph's last line: each word's box measured with a Range, counted when its
// top is within 2 px of the last word's top.
async function lastLineWords(page: Page, title: string) {
  return featureCard(page, title)
    .locator("p")
    .evaluate((paragraph) => {
      const boxes: { word: string; top: number }[] = [];
      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? "";
        for (const match of text.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const rects = [...range.getClientRects()].filter((rect) => rect.width > 0);
          if (rects.length) boxes.push({ word: match[0], top: rects[rects.length - 1].top });
        }
      }
      const last = boxes[boxes.length - 1];
      return boxes.filter((box) => Math.abs(box.top - last.top) <= 2).map((box) => box.word);
    });
}

for (const theme of THEMES) {
  test.describe(`${theme} WP61`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1105: the calendar card's paragraph ends on a line of two words or more, in every language (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await page.evaluate(() => document.fonts.ready);
        const paragraph = featureCard(page, CALENDAR_TITLE[language]).locator("p");
        await expect(paragraph).toHaveText([CALENDAR_BODY[language]]);
        const words = await lastLineWords(page, CALENDAR_TITLE[language]);
        expect(
          words.length,
          `${homeUrl(language)} on ${testInfo.project.name} (${page.viewportSize()?.width} px): last line «${words.join(" ")}»`,
        ).toBeGreaterThanOrEqual(2);
      }
    });
  });
}

// The paragraphs' widths before this round: the calendar card's 24rem from `.feature-card p`, and the
// other cards' own limits, which WP61 doesn't touch (voice 21rem, details 26rem, offline 32rem, or
// 26rem at 800 px and below), and WD36's meetings card, 30rem.
const CARD_TEXT_WIDTH = {
  desktop: ["384px", "336px", "416px", "480px", "512px"],
  mobile: ["384px", "336px", "416px", "480px", "416px"],
};

test("WEB-1105: the five feature cards' paragraphs wrap with text-wrap: pretty, at 16 px and line height 1.7, with their widths unchanged", async ({
  page,
}, testInfo) => {
  const widths = CARD_TEXT_WIDTH[testInfo.project.name as keyof typeof CARD_TEXT_WIDTH];
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await page.evaluate(() => document.fonts.ready);
    const styles = await page.locator("#features article p").evaluateAll((paragraphs) =>
      paragraphs.map((paragraph) => {
        const style = getComputedStyle(paragraph);
        return {
          wrap: style.getPropertyValue("text-wrap-style") || style.getPropertyValue("text-wrap"),
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          maxWidth: style.maxWidth,
        };
      }),
    );
    expect(styles, `${homeUrl(language)}: one paragraph per card`).toHaveLength(5);
    for (const [index, style] of styles.entries()) {
      const where = `${homeUrl(language)} ${FEATURES.cards[index].title[language]}`;
      expect(style.wrap, `${where}: text-wrap`).toContain("pretty");
      expect(style.fontSize, `${where}: font size`).toBe("16px");
      expect(parseFloat(style.lineHeight), `${where}: line height`).toBeCloseTo(16 * 1.7, 1);
      expect(style.maxWidth, `${where}: max-width`).toBe(widths[index]);
    }
  }
});

// ---- Run 2026-10-28-site: WP70 (WEB-1401, WEB-1403) ----
// ‘Is TaskFlow free?’ answers in two paragraphs, Free then Pro, with the Pro sentence split in two;
// the notes answer's example is a gift idea, not a Wi-Fi password. These checks are about the
// wording itself, so the brief's exact copy is written here.

const WP70_FREE: Record<Language, [string, string]> = {
  en: [
    "Yes. You get 10 free dictations a month, and one dictation can hold several tasks. When they’re used up, you keep adding tasks with a short form, with no limit, until they come back the next month. Reminders are free too, even the ones that come more and more often as the day gets closer.",
    "TaskFlow Pro is a monthly subscription that renews until you cancel it in Google Play. It gives you unlimited dictation (with a safety limit of 50 dictations a day) and 500 MB of files a month. It also turns sentences you type into tasks, and lets you ask for reminders in your own words. It makes notes from the meetings you record too, up to 20 hours a month. Its price isn’t set yet.",
  ],
  es: [
    "Sí. Tienes 10 dictados gratis al mes, y en un dictado caben varias tareas. Cuando se acaban, sigues añadiendo tareas con un formulario sencillo, sin límite, hasta que vuelven el mes siguiente. Los recordatorios también son gratis, incluso los que llegan cada vez más a menudo según se acerca el día.",
    "TaskFlow Pro es una suscripción mensual que se renueva hasta que la cancelas en Google Play. Te da dictado ilimitado (con un límite de seguridad de 50 dictados al día) y 500 MB de archivos al mes. Además, convierte en tareas las frases que escribes y te deja pedir los recordatorios con tus palabras. También toma notas de las reuniones que grabas, hasta 20 horas al mes. Su precio aún no está decidido.",
  ],
  ca: [
    "Sí. Tens 10 dictats gratuïts al mes, i en un dictat hi caben diverses tasques. Quan s’acaben, continues afegint tasques amb un formulari senzill, sense límit, fins que tornen el mes següent. Els recordatoris també són gratuïts, fins i tot els que arriben cada cop més sovint a mesura que s’acosta el dia.",
    "TaskFlow Pro és una subscripció mensual que es renova fins que la cancel·les a Google Play. Et dona dictat il·limitat (amb un límit de seguretat de 50 dictats al dia) i 500 MB de fitxers al mes. A més, converteix en tasques les frases que escrius i et deixa demanar els recordatoris amb les teves paraules. També pren notes de les reunions que enregistres, fins a 20 hores al mes. El preu encara no està decidit.",
  ],
};
const WP70_FIRST_START: Copy = { en: "Yes.", es: "Sí.", ca: "Sí." };
const WP70_SECOND_START: Copy = { en: "TaskFlow Pro is", es: "TaskFlow Pro es", ca: "TaskFlow Pro és" };
// Every claim of the one-paragraph answer before WP70, as its words read there; the Free claims
// belong to the first paragraph and the Pro claims to the second.
const WP70_CLAIMS: Record<Language, { free: string[]; pro: string[] }> = {
  en: {
    free: [
      "10 free dictations a month",
      "one dictation can hold several tasks",
      "a short form, with no limit, until they come back the next month",
      "Reminders are free too, even the ones that come more and more often",
    ],
    pro: [
      "monthly subscription that renews until you cancel it in Google Play",
      "unlimited dictation (with a safety limit of 50 dictations a day) and 500 MB of files a month",
      "turns sentences you type into tasks",
      "reminders in your own words",
      "Its price isn’t set yet.",
    ],
  },
  es: {
    free: [
      "10 dictados gratis al mes",
      "en un dictado caben varias tareas",
      "un formulario sencillo, sin límite, hasta que vuelven el mes siguiente",
      "Los recordatorios también son gratis, incluso los que llegan cada vez más a menudo",
    ],
    pro: [
      "suscripción mensual que se renueva hasta que la cancelas en Google Play",
      "dictado ilimitado (con un límite de seguridad de 50 dictados al día) y 500 MB de archivos al mes",
      "convierte en tareas las frases que escribes",
      "los recordatorios con tus palabras",
      "Su precio aún no está decidido.",
    ],
  },
  ca: {
    free: [
      "10 dictats gratuïts al mes",
      "en un dictat hi caben diverses tasques",
      "un formulari senzill, sense límit, fins que tornen el mes següent",
      "Els recordatoris també són gratuïts, fins i tot els que arriben cada cop més sovint",
    ],
    pro: [
      "subscripció mensual que es renova fins que la cancel·les a Google Play",
      "dictat il·limitat (amb un límit de seguretat de 50 dictats al dia) i 500 MB de fitxers al mes",
      "converteix en tasques les frases que escrius",
      "els recordatoris amb les teves paraules",
      "El preu encara no està decidit.",
    ],
  },
};
const WP70_NOTES: Copy = {
  en: "Yes. The Notes tab keeps what you want to remember that isn’t a task, like a gift idea. Tap Add a note, then write or dictate it; add links or a checklist if you like.",
  es: "Sí. La pestaña Notas guarda lo que quieres recordar y no es una tarea, como una idea para un regalo. Toca Añadir nota y escríbela o díctala; si quieres, añade enlaces o una lista de pasos.",
  ca: "Sí. La pestanya Notes desa el que vols recordar i no és una tasca, com una idea per a un regal. Toca Afegeix una nota i escriu-la o dicta-la; si vols, afegeix-hi enllaços o una llista de passos.",
};
// What the notes answer still names: the Notes tab, Add a note, writing or dictating, links and a checklist.
const WP70_NOTES_NAMES: Record<Language, string[]> = {
  en: ["The Notes tab", "Add a note", "write or dictate it", "links", "a checklist"],
  es: ["La pestaña Notas", "Añadir nota", "escríbela o díctala", "enlaces", "una lista de pasos"],
  ca: ["La pestanya Notes", "Afegeix una nota", "escriu-la o dicta-la", "enllaços", "una llista de passos"],
};
const WP70_NOTES_INDEX = 7; // The eighth question, ‘Can I keep notes as well as tasks?’ (WP264 put the repeat question fifth).
const WP70_ACCOUNT_INDEX = 2; // The third question, about the account, which names a password on purpose (WEB-708).
const WP70_WIFI = /wi-?fi/i;
const WP70_PASSWORD = /password|contraseña|contrasenya|clave/i;

// Each open answer's paragraphs, trimmed.
async function answerParagraphs(item: ReturnType<Page["locator"]>) {
  return (await item.locator("p").allInnerTexts()).map((paragraph) => paragraph.trim());
}

for (const theme of THEMES) {
  test.describe(`${theme} WP70`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1401: the second answer is two paragraphs, Free then Pro, word for word, and every other answer is one (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const item = await openAnswer(page, FREE_INDEX);
        const paragraphs = item.locator("p");
        await expect(paragraphs, where).toHaveCount(2);
        await expect(paragraphs.first(), where).toBeVisible();
        await expect(paragraphs.last(), where).toBeVisible();
        await expect(paragraphs, where).toHaveText(WP70_FREE[language]);
        const [first, second] = await answerParagraphs(item);
        expect(first.startsWith(WP70_FIRST_START[language]), `${where}: the first paragraph starts “${WP70_FIRST_START[language]}”`).toBe(true);
        expect(second.startsWith(WP70_SECOND_START[language]), `${where}: the second paragraph starts “${WP70_SECOND_START[language]}”`).toBe(true);
        // Every other answer is one paragraph.
        const items = page.locator("#questions details");
        const count = await items.count();
        expect(count, where).toBe(FAQ_ALL.length);
        for (let index = 0; index < count; index++) {
          if (index === FREE_INDEX) continue;
          await expect(items.nth(index).locator("p"), `${where}: answer ${index + 1}`).toHaveCount(1);
        }
      }
    });

    test(`WEB-1401: the two paragraphs are 12 px apart, and the answer still ends 24 px above the item's line (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await hydrated(page);
        const item = await openAnswer(page, FREE_INDEX);
        await expect(item.locator("p"), where).toHaveCount(2);
        await page.evaluate(() => document.fonts.ready);
        const spacing = await item.evaluate((details) => {
          const [first, second] = Array.from(details.querySelectorAll("p"));
          const px = (element: Element, property: string) => parseFloat(getComputedStyle(element).getPropertyValue(property));
          const firstBox = first.getBoundingClientRect();
          const secondBox = second.getBoundingClientRect();
          const detailsBox = details.getBoundingClientRect();
          return {
            firstPadding: px(first, "padding-bottom"),
            secondPadding: px(second, "padding-bottom"),
            // From the first paragraph's text box to the second's.
            between: secondBox.top - (firstBox.bottom - px(first, "padding-bottom")),
            // From the second paragraph's text box to the item's bottom line.
            after: detailsBox.bottom - px(details, "border-bottom-width") - (secondBox.bottom - px(second, "padding-bottom")),
          };
        });
        expect(spacing.firstPadding, `${where}: the first paragraph's bottom padding`).toBe(12);
        expect(spacing.between, `${where}: the space between the paragraphs`).toBeCloseTo(12, 0);
        expect(spacing.secondPadding, `${where}: the answer's bottom padding`).toBe(24);
        expect(spacing.after, `${where}: the space under the answer`).toBeCloseTo(24, 0);
      }
    });

    test(`WEB-1403: the notes answer's example is a gift idea, and no answer says Wi-Fi or gives a password as an example; axe passes with it open (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const notes = await openAnswer(page, WP70_NOTES_INDEX);
        await expect(notes.locator("p"), where).toHaveText([WP70_NOTES[language]]);
        const [text] = await answerParagraphs(notes);
        for (const name of WP70_NOTES_NAMES[language])
          expect(text, `${where}: the notes answer names “${name}”`).toContain(name);
        expect(text, `${where}: the notes answer has no password`).not.toMatch(WP70_PASSWORD);
        expect(await axeViolations(page), `${where}: the notes answer open`).toEqual([]);
        // Every answer, open: none says Wi-Fi, and only the account answer names a password.
        const answers = await page
          .locator("#questions details")
          .evaluateAll((items) =>
            items.map((item) => Array.from(item.querySelectorAll("p"), (p) => p.textContent ?? "").join(" ")),
          );
        expect(answers, where).toHaveLength(FAQ_ALL.length);
        for (const [index, answer] of answers.entries()) {
          expect(answer, `${where}: answer ${index + 1} says Wi-Fi`).not.toMatch(WP70_WIFI);
          if (index !== WP70_ACCOUNT_INDEX)
            expect(answer, `${where}: answer ${index + 1} names a password`).not.toMatch(WP70_PASSWORD);
        }
      }
    });
  });
}

test("WEB-1401: in the second paragraph no sentence is longer than 20 words", async ({ page }) => {
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    await page.goto(where);
    const item = await openAnswer(page, FREE_INDEX);
    await expect(item.locator("p"), where).toHaveCount(2);
    const [, second] = await answerParagraphs(item);
    for (const sentence of sentences(second))
      expect(words(sentence).length, `${where}: “${sentence}”`).toBeLessThanOrEqual(20);
  }
});

test("WEB-1401: the two paragraphs keep every claim of the one-paragraph answer, the Free claims in the first and the Pro claims in the second", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    await page.goto(where);
    const item = await openAnswer(page, FREE_INDEX);
    await expect(item.locator("p"), where).toHaveCount(2);
    const [first, second] = await answerParagraphs(item);
    for (const claim of WP70_CLAIMS[language].free) expect(first, `${where}: Free`).toContain(claim);
    for (const claim of WP70_CLAIMS[language].pro) expect(second, `${where}: Pro`).toContain(claim);
    expect(second.endsWith(WP70_CLAIMS[language].pro.slice(-1)[0]), `${where}: the price sentence ends the answer`).toBe(true);
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} WP70 axe`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1401: axe reports no violations with the second answer open, on the three homes (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const item = await openAnswer(page, FREE_INDEX);
        await expect(item.locator("p"), where).toHaveCount(2);
        await item.scrollIntoViewIfNeeded();
        expect(await axeViolations(page), `${where}: the second answer open`).toEqual([]);
      }
    });
  });
}

// ---- Run 2026-10-28-site: WP264 (WEB-1404) ----
// WD22: the FAQ says tasks can repeat, as one item right after ‘How do I add tasks by voice?’,
// in review F's words. These checks are about the wording itself, so the brief's exact copy is
// written here. The other eight items are FAQ_ALL's, as WP70 left them.

const WP264_INDEX = 4; // The fifth question.
const WP264_QUESTION: Copy = {
  en: "Can I add something that repeats?",
  es: "¿Puedo añadir algo que se repite?",
  ca: "Puc afegir una cosa que es repeteix?",
};
const WP264_ANSWER: Copy = {
  en: "Yes. Say “every Monday” or “every day at 9” when you add it, or tap More details and choose Repeat. Each time shows on your calendar, and TaskFlow can remind you.",
  es: "Sí. Di «todos los lunes» o «cada día a las 9» al añadirlo, o toca Más detalles y elige Repetir. Cada vez aparece en tu calendario, y TaskFlow puede recordártelo.",
  ca: "Sí. Digues «cada dilluns» o «cada dia a les 9» quan l’afegeixis, o toca Més detalls i tria Repetició. Cada vegada surt al calendari, i TaskFlow t’ho pot recordar.",
};
// Repeating tasks don't get the reminders that come more and more often (REMINDER_PLANS.md).
const WP264_MORE_OFTEN = ["more and more often", "cada vez más a menudo", "cada cop més sovint"];
const WP264_OTHERS = FAQ_ALL.filter((item) => item.question.en !== WP264_QUESTION.en);

// Every line box of the open item's question and answer text lies inside each ancestor that
// hides overflow, and neither ends in an ellipsis. (The open item's plus icon is turned 45°, so
// its corners pass the summary's edge in every item; it's drawn, not text, and nothing clips it.)
async function wp264Clipped(item: ReturnType<Page["locator"]>) {
  return item.evaluate((details) => {
    const found: string[] = [];
    const hides = (value: string) => value === "hidden" || value === "clip";
    for (const element of Array.from(details.querySelectorAll("summary, p"))) {
      if (getComputedStyle(element).textOverflow === "ellipsis" && element.scrollWidth > element.clientWidth + 1)
        found.push(`${element.tagName}: ends in an ellipsis`);
      const lines: DOMRect[] = [];
      for (const node of Array.from(element.childNodes)) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        lines.push(...Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0));
      }
      if (!lines.length) found.push(`${element.tagName}: no text drawn`);
      for (let node = element.parentElement; node && node !== document.documentElement; node = node.parentElement) {
        const style = getComputedStyle(node);
        const x = hides(style.overflowX);
        const y = hides(style.overflowY);
        if (!x && !y) continue;
        const box = node.getBoundingClientRect();
        const left = box.left + node.clientLeft;
        const top = box.top + node.clientTop;
        for (const line of lines) {
          if (x && (line.left < left - 1 || line.right > left + node.clientWidth + 1))
            found.push(`${element.tagName}: a line reaches outside ${node.tagName}.${node.className} sideways`);
          if (y && (line.top < top - 1 || line.bottom > top + node.clientHeight + 1))
            found.push(`${element.tagName}: a line reaches outside ${node.tagName}.${node.className} vertically`);
        }
      }
    }
    return found;
  });
}

for (const theme of THEMES) {
  test.describe(`${theme} WP264`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1404: the FAQ has nine questions, and the fifth, right after the voice question, asks whether something can repeat (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const summaries = page.locator("#questions details summary");
        await expect(summaries, where).toHaveCount(9);
        await expect(summaries.nth(WP264_INDEX - 1), where).toHaveText(VOICE_QUESTION[language]);
        await expect(summaries.nth(WP264_INDEX), where).toHaveText(WP264_QUESTION[language]);
        await expect(summaries.nth(WP264_INDEX), where).toBeVisible();
      }
    });

    test(`WEB-1404: opened, the repeat answer is one paragraph in the brief's words, 16 px or more, with no link and no reminders that come more and more often; axe passes (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const item = await openAnswer(page, WP264_INDEX);
        const paragraphs = item.locator("p");
        await expect(paragraphs, where).toHaveCount(1);
        await expect(paragraphs, where).toBeVisible();
        await expect(paragraphs, where).toHaveText(WP264_ANSWER[language]);
        expect((await paragraphs.innerText()).trim(), where).toBe(WP264_ANSWER[language]);
        const size = await paragraphs.evaluate((p) => parseFloat(getComputedStyle(p).fontSize));
        expect(size, `${where}: the answer's size`).toBeGreaterThanOrEqual(16);
        await expect(item.locator("a"), `${where}: links in the item`).toHaveCount(0);
        const text = ((await item.textContent()) ?? "").toLowerCase();
        for (const phrase of WP264_MORE_OFTEN) expect(text, `${where}: “${phrase}”`).not.toContain(phrase);
        await page.evaluate(() => document.fonts.ready);
        expect(await axeViolations(page), `${where}: the repeat answer open`).toEqual([]);
      }
    });

    test(`WEB-1404: the other eight questions keep their order and their answers, and the home-screen question is ninth (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await hydrated(page);
        const items = page.locator("#questions details");
        await expect(items, where).toHaveCount(9);
        const others = [0, 1, 2, 3, 5, 6, 7, 8];
        for (const [position, index] of others.entries()) {
          const expected = WP264_OTHERS[position];
          const item = items.nth(index);
          await expect(item.locator("summary"), `${where}: question ${index + 1}`).toHaveText(expected.question[language]);
          await item.locator("summary").click();
          await expect(item, where).toHaveAttribute("open", "");
          await expect(item.locator("p"), `${where}: answer ${index + 1}`).toHaveText([expected.answer[language]].flat());
        }
        await expect(items.nth(FREE_INDEX).locator("p"), `${where}: the free answer`).toHaveText(WP70_FREE[language]);
        await expect(items.nth(WP70_NOTES_INDEX).locator("p"), `${where}: the notes answer`).toHaveText([WP70_NOTES[language]]);
        await expect(items.nth(8).locator("summary"), `${where}: the ninth question`).toHaveText(WAYS_IN_QUESTION[language]);
        await expect(items.nth(8).locator("p"), `${where}: the ninth answer`).toHaveText([WAYS_IN_ANSWER[language]]);
      }
    });
  });
}

test("WEB-1404: with the repeat answer open at 320 × 568, no home scrolls sideways or clips the item's text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const language of LANGUAGES) {
    const where = `${homeUrl(language)} at 320 × 568`;
    await page.goto(homeUrl(language));
    await hydrated(page);
    const item = await openAnswer(page, WP264_INDEX);
    await expect(item.locator("p"), where).toHaveText(WP264_ANSWER[language]);
    await page.evaluate(() => document.fonts.ready);
    expect(await scrollsSideways(page), where).toBe(false);
    expect(await wp264Clipped(item), where).toEqual([]);
  }
});

test("WEB-1404: on the phone with the browser's text doubled and the repeat answer open, no home scrolls sideways or clips the item's text", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone (390 × 664), as the audit's mobile-text200.");
  await doubleTextSize(page);
  for (const language of LANGUAGES) {
    const where = `${homeUrl(language)} at 200% text`;
    await page.goto(homeUrl(language));
    await hydrated(page);
    expect(await rootFontSize(page), `${where}: the root`).toBe(32);
    const item = await openAnswer(page, WP264_INDEX);
    await expect(item.locator("p"), where).toHaveText(WP264_ANSWER[language]);
    await page.evaluate(() => document.fonts.ready);
    expect(await scrollsSideways(page), where).toBe(false);
    expect(await wp264Clipped(item), where).toEqual([]);
  }
});

// ---- Run 2026-11-02-changes, round 1: WP269 (WEB-1701, WEB-1702) ----
// The account answer names the app's two buttons, ‘Continue with Google’ and ‘Continue with
// email’, with no ‘sign in’; the voice answer's last sentence says only understanding needs the
// internet, in the offline answer's words. The brief's copy, exact.
const WP269_ACCOUNT_INDEX = 2; // The third question, ‘Do I need an account?’.
const WP269_VOICE_INDEX = 3; // The fourth question, ‘How do I add tasks by voice?’.
const WP269_OFFLINE_INDEX = 5; // The sixth question, ‘Can I use it offline?’.
const WP269_ACCOUNT_QUESTION: Copy = {
  en: "Do I need an account?",
  es: "¿Necesito una cuenta?",
  ca: "Necessito un compte?",
};
const WP269_ACCOUNT: Copy = {
  en: "Yes. The first time, tap Continue with Google; or tap Continue with email, choose a password and type the 6-digit code we email you. Your tasks are kept in your account, so you don’t lose them if you change phones.",
  es: "Sí. La primera vez, toca Continuar con Google; o toca Continuar con mi correo, elige una contraseña y escribe el código de 6 cifras que te enviamos. Tus tareas se guardan en tu cuenta, así no las pierdes si cambias de móvil.",
  ca: "Sí. La primera vegada, toca Continua amb Google; o toca Continua amb el correu, tria una contrasenya i escriu el codi de 6 xifres que t’enviem. Les tasques es desen al teu compte, així no les perds si canvies de mòbil.",
};
const WP269_GOOGLE: Copy = { en: "Continue with Google", es: "Continuar con Google", ca: "Continua amb Google" };
const WP269_EMAIL: Copy = { en: "Continue with email", es: "Continuar con mi correo", ca: "Continua amb el correu" };
const WP269_PASSWORD: Copy = { en: "password", es: "contraseña", ca: "contrasenya" };
const WP269_CODE: Copy = { en: "6-digit code", es: "código de 6 cifras", ca: "codi de 6 xifres" };
const WP269_SIGN_IN: Record<Language, RegExp> = {
  en: /sign in/i,
  es: /inicias sesi[oó]n/i,
  ca: /inicies la sessi[oó]/i,
};
const WP269_VOICE_QUESTION: Copy = {
  en: "How do I add tasks by voice?",
  es: "¿Cómo añado tareas hablando?",
  ca: "Com afegeixo tasques parlant?",
};
// The voice answer as it was before WP269, without its last sentence: it stays word for word.
const WP269_VOICE_KEPT: Copy = {
  en: "Tap Add a task and say what you need to do, in your own words; several things at once is fine. Tap Done, and TaskFlow shows one task for each, with its day and time. Add them all with one tap. You can also ask what you have this week, or move, change, complete or delete tasks by voice, even all of yesterday’s at once. TaskFlow shows the change first, and you can undo it.",
  es: "Toca Añadir tarea y di lo que tienes que hacer, con tus palabras; puedes decir varias cosas a la vez. Toca Listo y TaskFlow te muestra una tarea por cada cosa, con su día y su hora. Añádelas todas con un toque. También puedes preguntar qué tienes esta semana, o mover, cambiar, completar o eliminar tareas hablando, incluso todas las de ayer a la vez. TaskFlow te enseña el cambio antes y puedes deshacerlo.",
  ca: "Toca Afegeix una tasca i digues el que has de fer, amb les teves paraules; pots dir diverses coses alhora. Toca Fet i TaskFlow et mostra una tasca per cada cosa, amb el dia i l’hora. Afegeix-les totes amb un toc. També pots preguntar què tens aquesta setmana, o moure, canviar, completar o suprimir tasques parlant, fins i tot totes les d’ahir alhora. TaskFlow t’ensenya el canvi abans i el pots desfer.",
};
const WP269_VOICE_LAST: Copy = {
  en: "Understanding what you say needs the internet: your words are sent to Google.",
  es: "Para entender lo que dices necesita internet: tus palabras se envían a Google.",
  ca: "Per entendre el que dius necessita internet: les teves paraules s’envien a Google.",
};
const WP269_OLD_START: Record<Language, RegExp> = {
  en: /^It needs the internet/i,
  es: /^Necesita internet/i,
  ca: /^Necessita internet/i,
};
const WP269_UNDERSTANDING: Copy = {
  en: "understanding what you say",
  es: "entender lo que dices",
  ca: "entendre el que dius",
};

for (const theme of THEMES) {
  test.describe(`${theme} WP269`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1701: opened, the account answer is the brief's text, names Continue with Google and Continue with email, has no ‘sign in’, and still names a password (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const item = page.locator("#questions details").nth(WP269_ACCOUNT_INDEX);
        await expect(item.locator("summary"), where).toHaveText(WP269_ACCOUNT_QUESTION[language]);
        await openAnswer(page, WP269_ACCOUNT_INDEX);
        const paragraph = item.locator("p");
        await expect(paragraph, where).toHaveCount(1);
        await expect(paragraph, where).toBeVisible();
        const answer = (await paragraph.innerText()).trim();
        expect(answer, where).toBe(WP269_ACCOUNT[language]);
        expect(answer, `${where}: the Google button`).toContain(WP269_GOOGLE[language]);
        expect(answer, `${where}: the email button`).toContain(WP269_EMAIL[language]);
        expect(answer, `${where}: ‘sign in’`).not.toMatch(WP269_SIGN_IN[language]);
        expect(answer, `${where}: the password`).toContain(WP269_PASSWORD[language]);
      }
    });

    test(`WEB-1701, WEB-708: in the account answer the password and the 6-digit code come only on the email path, after the semicolon (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const item = await openAnswer(page, WP269_ACCOUNT_INDEX);
        await expect(item.locator("p"), where).toBeVisible();
        const answer = (await item.locator("p").innerText()).trim();
        const semicolon = answer.indexOf(";");
        expect(semicolon, `${where}: a semicolon`).toBeGreaterThan(0);
        const before = answer.slice(0, semicolon);
        expect(before, `${where}: before the semicolon`).toContain(WP269_GOOGLE[language]);
        expect(before.toLowerCase(), `${where}: the password before the semicolon`).not.toContain(WP269_PASSWORD[language]);
        expect(before, `${where}: the code before the semicolon`).not.toContain(WP269_CODE[language]);
        const email = answer.indexOf(WP269_EMAIL[language]);
        expect(email, `${where}: the email button comes after the semicolon`).toBeGreaterThan(semicolon);
        expect(answer.indexOf(WP269_PASSWORD[language]), `${where}: the password after the email button`).toBeGreaterThan(email);
        expect(answer.indexOf(WP269_CODE[language]), `${where}: the code after the email button`).toBeGreaterThan(email);
      }
    });

    test(`WEB-1702: opened, the voice answer is today's with only its last sentence replaced by the brief's, no sentence starts ‘It needs the internet’, none runs over 24 words, and the English one is 88 words or fewer (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const item = page.locator("#questions details").nth(WP269_VOICE_INDEX);
        await expect(item.locator("summary"), where).toHaveText(WP269_VOICE_QUESTION[language]);
        await openAnswer(page, WP269_VOICE_INDEX);
        const paragraph = item.locator("p");
        await expect(paragraph, where).toHaveCount(1);
        await expect(paragraph, where).toBeVisible();
        const answer = (await paragraph.innerText()).trim();
        expect(answer, where).toBe(`${WP269_VOICE_KEPT[language]} ${WP269_VOICE_LAST[language]}`);
        const all = sentences(answer);
        expect(all.at(-1), `${where}: the last sentence`).toBe(WP269_VOICE_LAST[language]);
        for (const sentence of all) expect(sentence, `${where}: a sentence`).not.toMatch(WP269_OLD_START[language]);
        expect(longestSentence(answer), `${where}: the longest sentence`).toBeLessThanOrEqual(24);
        if (language === "en") expect(words(answer).length, `${where}: the English answer's words`).toBeLessThanOrEqual(88);
      }
    });

    test(`WEB-1702: with every answer open, the voice answer's last sentence and the offline answer both name understanding what you say (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const items = page.locator("#questions details");
        const count = await items.count();
        for (let index = 0; index < count; index++) await openAnswer(page, index);
        await expect(page.locator("#questions details[open]"), where).toHaveCount(count);
        const voice = (await items.nth(WP269_VOICE_INDEX).locator("p").innerText()).trim();
        const last = sentences(voice).at(-1) ?? "";
        expect(last.toLowerCase(), `${where}: the voice answer's last sentence`).toContain(WP269_UNDERSTANDING[language]);
        const offline = items.nth(WP269_OFFLINE_INDEX);
        await expect(offline.locator("p"), `${where}: the offline answer`).toBeVisible();
        const offlineText = (await offline.locator("p").innerText()).trim().toLowerCase();
        expect(offlineText, `${where}: the offline answer`).toContain(WP269_UNDERSTANDING[language]);
      }
    });

    test(`WEB-1701, WEB-1702: axe reports no violations on the three homes with the third and fourth answers open (${theme})`, async ({
      page,
    }, testInfo) => {
      for (const language of LANGUAGES) {
        const where = `${homeUrl(language)} on ${testInfo.project.name} in ${theme}`;
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await openAnswer(page, WP269_ACCOUNT_INDEX);
        await openAnswer(page, WP269_VOICE_INDEX);
        await expect(page.locator("#questions details[open]"), where).toHaveCount(2);
        await page.evaluate(() => document.fonts.ready);
        expect(await axeViolations(page), where).toEqual([]);
      }
    });
  });
}

test("WEB-1701: with the account answer open, /es/ and /ca/ don't scroll sideways at 320 × 800", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const language of ["es", "ca"] as const) {
    const where = `${homeUrl(language)} at 320 × 800`;
    await page.goto(homeUrl(language));
    await hydrated(page);
    const item = await openAnswer(page, WP269_ACCOUNT_INDEX);
    await expect(item.locator("p"), where).toHaveText(WP269_ACCOUNT[language]);
    await item.locator("p").scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    expect(await scrollsSideways(page), where).toBe(false);
    expect(await wp264Clipped(item), where).toEqual([]);
  }
});

test("WEB-1701, WEB-1702: on desktop with the browser's text doubled, the account and voice answers open whole, with nothing clipped or overlapping", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop (1440 × 1000) at 200% text.");
  await doubleTextSize(page);
  const found: string[] = [];
  for (const language of LANGUAGES) {
    const where = `${homeUrl(language)} at 200% text`;
    await page.goto(homeUrl(language));
    await hydrated(page);
    expect(await rootFontSize(page), `${where}: the root`).toBe(32);
    const account = await openAnswer(page, WP269_ACCOUNT_INDEX);
    const voice = await openAnswer(page, WP269_VOICE_INDEX);
    await expect(account.locator("p"), where).toHaveText(WP269_ACCOUNT[language]);
    await expect(voice.locator("p"), where).toHaveText(`${WP269_VOICE_KEPT[language]} ${WP269_VOICE_LAST[language]}`);
    await page.evaluate(() => document.fonts.ready);
    if (await scrollsSideways(page)) found.push(`${where}: the page scrolls sideways`);
    for (const [name, item] of [
      ["account", account],
      ["voice", voice],
    ] as const) {
      for (const problem of await wp264Clipped(item)) found.push(`${where}, ${name} answer: ${problem}`);
      const summary = (await item.locator("summary").boundingBox())!;
      const paragraph = (await item.locator("p").boundingBox())!;
      if (paragraph.y < summary.y + summary.height - 0.5) found.push(`${where}, ${name} answer: the answer overlaps its question`);
      const box = (await item.boundingBox())!;
      if (paragraph.y + paragraph.height > box.y + box.height + 0.5)
        found.push(`${where}, ${name} answer: the answer runs past its item's bottom`);
    }
    const accountBox = (await account.boundingBox())!;
    const voiceBox = (await voice.boundingBox())!;
    if (accountBox.y + accountBox.height > voiceBox.y + 0.5) found.push(`${where}: the account item overlaps the voice item`);
    const next = (await page.locator("#questions details").nth(WP269_VOICE_INDEX + 1).boundingBox())!;
    if (voiceBox.y + voiceBox.height > next.y + 0.5) found.push(`${where}: the voice item overlaps the next question`);
  }
  expect(found).toEqual([]);
});

// ---- 2026-11-06, WD36: Pro's meeting notes get a card of their own ----
const WD36_FACTS: Record<Language, RegExp[]> = {
  en: [/TaskFlow Pro/, /Record a meeting/, /\bStop\b/, /20 hours/],
  es: [/TaskFlow Pro/, /Grabar una reunión/, /\bParar\b/, /20 horas/],
  ca: [/TaskFlow Pro/, /Enregistra una reunió/, /\bAtura\b/, /20 hores/],
};

test("WD36: the meetings card names Pro, the app's Record a meeting and Stop, and 20 hours a month; its example note is hidden from screen readers", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    await page.goto(where);
    const card = page.locator("#features .feature-meetings");
    await expect(card, where).toHaveCount(1);
    const body = (await card.locator(".feature-card-copy p").innerText()).trim();
    for (const fact of WD36_FACTS[language]) expect(body, `${where}: ${fact}`).toMatch(fact);
    const note = card.locator(".meeting-illustration");
    await expect(note).toHaveAttribute("aria-hidden", "true");
    await expect(note.locator("li")).toHaveCount(2);
    await expect(note.locator("a, button")).toHaveCount(0);
  }
});

test("WD36: the meetings card stacks its note under its copy on a phone and at text 200%, with nothing sideways", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Phone widths.");
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const language of LANGUAGES) {
      for (const text200 of [false, true]) {
        const where = `${homeUrl(language)} at ${width} px${text200 ? ", text 200%" : ""}`;
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Page.setFontSizes", { fontSizes: text200 ? { standard: 32, fixed: 26 } : { standard: 16, fixed: 13 } });
        await page.goto(homeUrl(language));
        await page.evaluate(() => document.fonts.ready);
        const card = page.locator("#features .feature-meetings");
        const copy = await card.locator(".feature-card-copy").boundingBox();
        const note = await card.locator(".meeting-illustration").boundingBox();
        const box = await card.boundingBox();
        expect(note!.y, `${where}: the note is below the copy`).toBeGreaterThanOrEqual(copy!.y + copy!.height - 1);
        expect(note!.x + note!.width, `${where}: the note fits the card`).toBeLessThanOrEqual(box!.x + box!.width + 1);
        expect(await scrollsSideways(page), where).toBe(false);
      }
    }
  }
});

// ---- Run 2026-11-06-pages: WP273 (WEB-2101–WEB-2105, WEB-2002) ----
// The meetings card leads with its payoff, names the app's Create task review truthfully, and
// its example note follows the app's note page: the checklist first, then the note's words.
const WP273_SITE = { en: siteEnCopy, es: siteEsCopy, ca: siteCaCopy };
const WP273_TITLE: Copy = {
  en: "Your meetings become notes",
  es: "Tus reuniones se convierten en notas",
  ca: "Les teves reunions es converteixen en notes",
};
const WP273_BODY: Copy = {
  en: "With TaskFlow Pro, record a meeting and get its notes: a summary, the to-dos, the decisions and the open questions. Tap Record a meeting in Notes, lock your phone if you like, and press Stop. Create task turns the to-dos into a task with a checklist: check it, then add it. Up to 20 hours of meetings a month.",
  es: "Con TaskFlow Pro, graba una reunión y recibe sus notas: un resumen, las cosas por hacer, las decisiones y las preguntas abiertas. Toca Grabar una reunión en Notas, bloquea el móvil si quieres y pulsa Parar. Crear tarea convierte las cosas por hacer en una tarea con su lista de pasos: revísala y añádela. Hasta 20 horas de reuniones al mes.",
  ca: "Amb TaskFlow Pro, enregistra una reunió i rep-⁠ne les notes: un resum, les coses per fer, les decisions i les preguntes obertes. Toca Enregistra una reunió a Notes, bloqueja el mòbil si vols i prem Atura. El botó Crea una tasca converteix les coses per fer en una tasca amb la seva llista de passos: revisa-⁠la i afegeix-⁠la. Fins a 20 hores de reunions al mes.",
};
const WP273_ONE_TAP: Copy = { en: "one tap", es: "un toque", ca: "un toc" };
const WP273_CREATE_TASK: Copy = { en: "Create task", es: "Crear tarea", ca: "Crea una tasca" };
const WP273_NOTES: Copy = { en: "notes", es: "notas", ca: "notes" };
const WP273_RECORD: Copy = { en: "Record a meeting", es: "Grabar una reunión", ca: "Enregistra una reunió" };
const WP273_CHECKLIST: Copy = { en: "Checklist · 0/2", es: "Pasos · 0/2", ca: "Passos · 0/2" };
const WP273_HEADER: Copy = {
  en: "Meeting on Tuesday · 42 min",
  es: "Reunión del martes · 42 min",
  ca: "Reunió del dimarts · 42 min",
};
const WP273_DECISIONS: Copy = { en: "Decisions", es: "Decisiones", ca: "Decisions" };
const WP273_FAQ_MEETINGS: Copy = {
  en: "It makes notes from the meetings you record too, up to 20 hours a month.",
  es: "También toma notas de las reuniones que grabas, hasta 20 horas al mes.",
  ca: "També pren notes de les reunions que enregistres, fins a 20 hores al mes.",
};
const WP273_CALQUES: Partial<Copy> = { es: "hace notas", ca: "fa notes" };

const wp273Card = (page: Page) => page.locator("#features .feature-meetings");

function wp273Count(text: string, needle: string) {
  return text.split(needle).length - 1;
}

// The tops of an element's rendered lines: each word's last box, measured with a Range.
async function wp273LineTops(element: ReturnType<Page["locator"]>) {
  return element.evaluate((node) => {
    const words: { word: string; top: number }[] = [];
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      for (const match of (text.textContent ?? "").matchAll(/\S+/g)) {
        const range = document.createRange();
        range.setStart(text, match.index);
        range.setEnd(text, match.index + match[0].length);
        const rects = [...range.getClientRects()].filter((rect) => rect.width > 0);
        if (rects.length) words.push({ word: match[0], top: rects[rects.length - 1].top });
      }
    }
    return words;
  });
}

test("WEB-2103, WEB-2101, WEB-2102: the meetings card's heading and paragraph read exactly the brief's copy in each language", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    await page.goto(where);
    const card = wp273Card(page);
    await expect(card.locator("h3"), where).toHaveText(WP273_TITLE[language]);
    await expect(card.locator(".feature-card-copy p"), where).toHaveText([WP273_BODY[language]]);
  }
});

test("WEB-2101, WEB-2102: the meetings paragraph has no ‘one tap’, names Create task, and its first sentence says notes before the Record a meeting button", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    await page.goto(where);
    const body = (await wp273Card(page).locator(".feature-card-copy p").innerText()).trim();
    expect(body, `${where}: no ${WP273_ONE_TAP[language]}`).not.toContain(WP273_ONE_TAP[language]);
    expect(body, `${where}: names ${WP273_CREATE_TASK[language]}`).toContain(WP273_CREATE_TASK[language]);
    const firstSentence = body.slice(0, body.indexOf(". ") + 1);
    const notes = firstSentence.indexOf(WP273_NOTES[language]);
    const record = body.indexOf(WP273_RECORD[language]); // case-sensitive: the button's name
    expect(notes, `${where}: the first sentence says ${WP273_NOTES[language]}`).toBeGreaterThan(-1);
    expect(record, `${where}: names ${WP273_RECORD[language]}`).toBeGreaterThan(-1);
    expect(notes, `${where}: ${WP273_NOTES[language]} comes before ${WP273_RECORD[language]}`).toBeLessThan(record);
  }
});

test("WEB-2101: with every answer open, ‘one tap’ appears exactly twice on each home: in the voice card and in the voice answer", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    await page.goto(where);
    const needle = WP273_ONE_TAP[language];
    const text = await homeTextAllOpen(page);
    expect(wp273Count(text, needle), `${where}: «${needle}» on the page`).toBe(2);
    const voiceCard = page.locator("#features article", {
      has: page.getByRole("heading", { level: 3, name: WP273_SITE[language].features.voice.title, exact: true }),
    });
    expect(wp273Count(await voiceCard.locator("p").innerText(), needle), `${where}: in the voice card`).toBe(1);
    const voiceAnswer = page.locator("#questions details").nth(WP269_VOICE_INDEX);
    expect(wp273Count(await voiceAnswer.innerText(), needle), `${where}: in the voice answer`).toBe(1);
  }
});

test("WEB-2103: at 320 px the meetings heading is at most two lines in Spanish and Catalan", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Phone width.");
  await page.setViewportSize({ width: 320, height: 800 });
  for (const language of ["es", "ca"] as Language[]) {
    const where = homeUrl(language);
    await page.goto(where);
    await page.evaluate(() => document.fonts.ready);
    const heading = wp273Card(page).locator("h3");
    await expect(heading).toHaveText(WP273_TITLE[language]);
    const tops = new Set((await wp273LineTops(heading)).map((word) => Math.round(word.top)));
    expect(tops.size, `${where}: lines of the meetings heading`).toBeLessThanOrEqual(2);
  }
});

test("WEB-2002, WEB-2105: the open ‘Is TaskFlow free?’ answer's Pro paragraph holds the meetings sentence, and no home has «hace notas» or «fa notes»", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    await page.goto(where);
    const item = await openAnswer(page, FREE_INDEX);
    await expect(item.locator("summary"), where).toHaveText(FREE_QUESTION[language]);
    const paragraphs = await answerParagraphs(item);
    expect(paragraphs.length, `${where}: paragraphs`).toBeGreaterThanOrEqual(2);
    expect(sentences(paragraphs[1]), `${where}: the Pro paragraph's sentences`).toContain(WP273_FAQ_MEETINGS[language]);
    const calque = WP273_CALQUES[language];
    if (calque) expect(await homeTextAllOpen(page), `${where}: no «${calque}»`).not.toContain(calque);
  }
});

test("WEB-2104: the example note runs title, checklist, the two to-dos, header, summary, Decisions, the decision and Create task, top to bottom", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    const note = WP273_SITE[language].features.meetings.note;
    await page.goto(where);
    await page.evaluate(() => document.fonts.ready);
    const drawing = wp273Card(page).locator(".meeting-illustration");
    await expect(drawing, where).toHaveAttribute("aria-hidden", "true");
    await expect(drawing.locator("li"), where).toHaveCount(2);
    await expect(drawing.locator("a, button"), where).toHaveCount(0);
    await expect(drawing.locator(".meeting-button svg"), where).toHaveCount(0);
    await expect(drawing.locator(".meeting-button"), where).toHaveText(WP273_CREATE_TASK[language]);
    const expected = [
      note.title,
      WP273_CHECKLIST[language],
      ...note.steps,
      WP273_HEADER[language],
      note.summary,
      WP273_DECISIONS[language],
      note.decision,
      WP273_CREATE_TASK[language],
    ];
    // Each visible text run in the drawing, in reading order, with its box.
    const runs = await drawing.evaluate((root) => {
      const found: { text: string; top: number; bottom: number }[] = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = (node.textContent ?? "").trim();
        if (!text) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const box = range.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;
        found.push({ text, top: box.top, bottom: box.bottom });
      }
      return found;
    });
    expect(runs.map((run) => run.text), `${where}: the drawing's text, in order`).toEqual(expected);
    for (let i = 1; i < runs.length; i++)
      expect(runs[i].top, `${where}: «${runs[i].text}» is below «${runs[i - 1].text}»`).toBeGreaterThanOrEqual(
        runs[i - 1].bottom - 1,
      );
  }
});

test("WEB-2104: the thin line divides the checklist from the note's words: on the header line, not above the to-dos", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    await page.goto(where);
    const drawing = wp273Card(page).locator(".meeting-illustration");
    const header = drawing.locator("small");
    await expect(header, where).toHaveText(WP273_HEADER[language]);
    const borders = await drawing.evaluate((root) => {
      const top = (selector: string) => getComputedStyle(root.querySelector(selector)!).borderTopWidth;
      return { list: top("ul"), header: top("small") };
    });
    expect(parseFloat(borders.header), `${where}: the header line has the separator`).toBeGreaterThan(0);
    expect(parseFloat(borders.list), `${where}: the to-dos have no separator`).toBe(0);
  }
});

test("WEB-2104: the note's lines wrap with text-wrap: pretty", async ({ page }) => {
  await page.goto("/");
  const styles = await wp273Card(page)
    .locator(".meeting-line")
    .evaluateAll((lines) =>
      lines.map((line) => {
        const style = getComputedStyle(line) as CSSStyleDeclaration & { textWrapStyle?: string; textWrap?: string };
        return `${style.textWrapStyle ?? ""} ${style.textWrap ?? ""}`;
      }),
    );
  expect(styles.length).toBeGreaterThanOrEqual(1);
  for (const style of styles) expect(style).toContain("pretty");
});

test("WEB-2104: at 320 px the note's summary ends on a line of two words or more, in every language", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Phone width.");
  await page.setViewportSize({ width: 320, height: 800 });
  for (const language of LANGUAGES) {
    const where = homeUrl(language);
    await page.goto(where);
    await page.evaluate(() => document.fonts.ready);
    const summary = wp273Card(page).locator(".meeting-line").first();
    await expect(summary).toHaveText(WP273_SITE[language].features.meetings.note.summary);
    const words = await wp273LineTops(summary);
    const last = words[words.length - 1];
    const lastLine = words.filter((word) => Math.abs(word.top - last.top) <= 2).map((word) => word.word);
    expect(lastLine.length, `${where}: the summary's last line «${lastLine.join(" ")}»`).toBeGreaterThanOrEqual(2);
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} WP273`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-2104: the checklist label's text has 4.5:1 contrast or more on the note (${theme})`, async ({ page }) => {
      for (const language of LANGUAGES) {
        const where = homeUrl(language);
        await page.goto(where);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const label = wp273Card(page).locator(".meeting-illustration strong", { hasText: WP273_CHECKLIST[language] });
        await expect(label, where).toHaveCount(1);
        const colours = await label.evaluate((element) => {
          let background = "rgba(0, 0, 0, 0)";
          for (let node: Element | null = element; node; node = node.parentElement) {
            const value = getComputedStyle(node).backgroundColor;
            if (!/rgba\(.*,\s*0\)$/.test(value) && value !== "transparent") {
              background = value;
              break;
            }
          }
          return { color: getComputedStyle(element).color, background };
        });
        const ratio = contrast(parseColor(colours.color), parseColor(colours.background));
        expect(ratio, `${where}: ${colours.color} on ${colours.background}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    test(`WEB-2101–WEB-2105: axe reports no violations on the three homes (${theme})`, async ({ page }) => {
      for (const language of LANGUAGES) {
        await page.goto(homeUrl(language));
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(wp273Card(page).locator("h3")).toHaveText(WP273_TITLE[language]);
        expect(await axeViolations(page), `${homeUrl(language)} in ${theme}`).toEqual([]);
      }
    });
  });
}
