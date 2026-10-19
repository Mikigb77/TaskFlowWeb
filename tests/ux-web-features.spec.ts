// Acceptance tests for the features, the FAQ and the closing card (area F) from the UX web
// loop, run 2026-10-18-site: WP17 (plain headings and true cards), WP18 (the closing card
// and the first FAQ answers) WP35 (round 2), WP36 (round 3) and WP19 (the FAQ in the app's
// words). See tests/support/ux-web.ts.
import type { Page } from "@playwright/test";
import {
  axeViolations,
  contrast,
  expect,
  hexColor,
  homeUrl,
  LANGUAGES,
  parseColor,
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

const DICTATIONS = { en: /\b10 dictations\b/, es: /\b10 dictados\b/, ca: /\b10 dictats\b/ };

test("WEB-111: the features have one plain heading and four plain card headings, with no eyebrow or intro", async ({
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
    expect(sizes.length).toBe(4);
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
    test(`WEB-705, WEB-709: at 1440 px the calendar card spans two rows beside voice over details, offline runs full width below, and no card is a quarter empty (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "Measured at 1440 × 1000.");
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => document.fonts.ready);
      const [calendar, voice, details, offline] = await cards(page);
      expect([calendar, voice, details, offline].map((card) => card.heading)).toEqual(
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
      // Offline spans the full width below them.
      expect(offline.top, "offline is below the calendar").toBeGreaterThan(calendar.bottom);
      expect(Math.abs(offline.left - calendar.left), "offline starts at the grid's left").toBeLessThan(1);
      expect(Math.abs(offline.right - voice.right), "offline ends at the grid's right").toBeLessThan(1);
      for (const card of [voice, details, offline])
        expect(card.gap, `${card.heading}: ${card.gap}px empty of ${card.height}px`).toBeLessThanOrEqual(
          card.height * 0.25,
        );
    });
  });
}

test("WEB-705: on a phone the four feature cards are one column in order, none with more than 40 px left empty", async ({
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

test("WEB-105, WEB-107, WEB-109, WEB-110: the seven questions come in order, and the voice, offline, sharing and notes answers are the app's words", async ({
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
