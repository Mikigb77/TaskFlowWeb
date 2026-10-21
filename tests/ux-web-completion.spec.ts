// WP51: independent, observable completion acceptance. All network/AI calls are stubbed
// by ux-web's automatic VoiceStub fixture; no backend or browser storage is modified.
import type { Locator, Page, TestInfo } from "@playwright/test";
import { appendFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ca } from "../src/content/site/ca";
import { en } from "../src/content/site/en";
import { es } from "../src/content/site/es";
import { COMPLETION_TASKS, TASKS, TYPED, VOICE_PANEL } from "./support/ux-voice";
import { auditPage, mergeAudit, saveFragment } from "./support/ux-audit";
import {
  doubleTextSize, expect, homeUrl, hydrated, LANGUAGES, ROOT, settle,
  test, THEMES, type Language,
} from "./support/ux-web";

const SITE = { en, es, ca };
const OUT = path.join(ROOT, "artifacts", "ux-web", "completion");
const reward = (page: Page) => page.locator(`${VOICE_PANEL} .voice-completion`);
const boxes = (page: Page) => page.locator(VOICE_PANEL).getByRole("checkbox");

async function open(page: Page, language: Language) {
  await page.goto(`${homeUrl(language)}#voice`);
  await hydrated(page);
  await expect(reward(page)).toHaveCount(0);
  await page.locator("#voice .voice-intro button").click();
  await expect(page.locator(VOICE_PANEL)).toHaveAttribute("data-stage", "capture");
  await expect(reward(page)).toHaveCount(0);
  await page.locator("#voice .voice-mode-link").click();
  await page.locator("#voice textarea").fill(TYPED);
}

async function send(page: Page) {
  await expect(page.locator("#voice .voice-submit")).toBeEnabled();
  await page.locator("#voice .voice-submit").click();
}

async function generate(page: Page, language: Language) {
  await open(page, language);
  await send(page);
  await expect(page.locator(VOICE_PANEL)).toHaveAttribute("data-stage", "review");
}

async function unchangedInput(page: Page, input: Locator) {
  // Establish the user's position before the toggle, without giving the product a
  // reason to scroll. Space exercises the native keyboard action and focus ring.
  await input.evaluate((element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
    (element as HTMLInputElement).focus({ preventScroll: true });
  });
  await page.waitForTimeout(350); // finish the preceding stage/click positioning before measuring this action
  await input.evaluate((element) => {
    const calls: string[] = [];
    const scrollTo = window.scrollTo;
    const scrollBy = window.scrollBy;
    const scroll = window.scroll;
    const intoView = Element.prototype.scrollIntoView;
    window.scrollTo = function (...args: unknown[]) { calls.push("window.scrollTo"); return Reflect.apply(scrollTo, window, args); } as typeof window.scrollTo;
    window.scrollBy = function (...args: unknown[]) { calls.push("window.scrollBy"); return Reflect.apply(scrollBy, window, args); } as typeof window.scrollBy;
    window.scroll = function (...args: unknown[]) { calls.push("window.scroll"); return Reflect.apply(scroll, window, args); } as typeof window.scroll;
    Element.prototype.scrollIntoView = function (this: Element, ...args: unknown[]) { calls.push("Element.scrollIntoView"); return Reflect.apply(intoView, this, args); };
    (window as unknown as { wp51Probe: unknown }).wp51Probe = {
      element, calls,
      restore: () => { window.scrollTo = scrollTo; window.scrollBy = scrollBy; window.scroll = scroll; Element.prototype.scrollIntoView = intoView; },
    };
  });
  const position = () => input.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { scrollX, scrollY, inputX: rect.x, inputY: rect.y, checked: (element as HTMLInputElement).checked, outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}` };
  });
  const before = await position();
  await input.press("Space");
  await expect(input).toBeFocused();
  await page.waitForTimeout(350); // finite reveal finishes; detect deferred focus/scroll
  const after = await position();
  const probe = await input.evaluate((element) => {
    const probe = (window as unknown as { wp51Probe: { element: Element; calls: string[]; restore: () => void } }).wp51Probe;
    probe.restore();
    return { sameNode: probe.element === element, calls: probe.calls };
  });
  const info = test.info();
  const dir = path.join(OUT, "positions");
  mkdirSync(dir, { recursive: true });
  appendFileSync(path.join(dir, `${info.project.name}.${info.title.replace(/[^a-z0-9]+/gi, "-")}.ndjson`),
    JSON.stringify({ measuredAt: new Date().toISOString(), before, after, ...probe }) + "\n");
  expect(probe.sameNode, "toggle replaces the focused input node").toBe(true);
  expect(probe.calls, "toggle explicitly scrolls the page").toEqual([]);
  expect(Math.abs(after.inputX - before.inputX), "toggle moves the focused checkbox horizontally").toBeLessThanOrEqual(1);
  expect(Math.abs(after.scrollX - before.scrollX), "toggle changes horizontal scroll").toBeLessThanOrEqual(1);
  // Completing inserts feedback below this input, so neither viewport position nor
  // page scroll should change. Undo may naturally collapse earlier content/grid
  // rows; record its geometry without requiring reserved blank product space.
  if (!before.checked) {
    expect(Math.abs(after.inputY - before.inputY), "completion insertion moves the focused checkbox vertically").toBeLessThanOrEqual(1);
    expect(Math.abs(after.scrollY - before.scrollY), "checking forces page scroll").toBeLessThanOrEqual(1);
  }
}

async function watchStatus(page: Page) {
  await page.locator(`${VOICE_PANEL} [role=status]`).evaluate((element) => {
    const target = window as unknown as { completionChanges: string[]; completionObserver: MutationObserver };
    target.completionChanges = [];
    target.completionObserver = new MutationObserver(() => target.completionChanges.push(element.textContent ?? ""));
    target.completionObserver.observe(element, { subtree: true, childList: true, characterData: true });
  });
}

async function statusChanges(page: Page) {
  return page.evaluate(() => (window as unknown as { completionChanges: string[] }).completionChanges);
}

async function assertFeedback(page: Page, language: Language) {
  const feedback = reward(page);
  await expect(feedback).toHaveCount(1);
  await expect(feedback).toBeVisible();
  const t = SITE[language].voice;
  await expect(feedback).toContainText(t.completionTitle);
  await expect(feedback).toContainText(t.completionBody);
  await expect(page.locator("html")).toHaveAttribute("lang", language);
  const status = page.locator(`${VOICE_PANEL} [role=status]`);
  await expect(status).toHaveCount(1);
  await expect(status).toHaveAttribute("aria-atomic", "true");
  await expect(status).toHaveText(`${t.completionTitle} ${t.completionBody}`);
  expect((await status.getAttribute("aria-live")) ?? "polite").toBe("polite"); // role=status is implicitly polite
  expect(await feedback.evaluate((element) => !!element.closest('[aria-live]:not([aria-live="off"]), [role=status], [role=alert], [role=log]')),
    "visual feedback must not announce a second copy").toBe(false);
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function completeFirst(page: Page) {
  await boxes(page).nth(2).check();
  await boxes(page).nth(1).check();
  await expect(reward(page)).toHaveCount(0);
  await unchangedInput(page, boxes(page).nth(0));
}

for (const theme of THEMES) {
  test.describe(`WP51 ${theme}`, () => {
    test.use({ colorScheme: theme });
    for (const language of LANGUAGES) {
      test(`${language}: nonempty completion preserves every task, details, focus and local quota for any final task`, async ({ page, voice }) => {
        voice.draft = { tasks: COMPLETION_TASKS };
        await generate(page, language);
        await expect(boxes(page)).toHaveCount(3);
        const details = page.locator(`${VOICE_PANEL} .voice-task-schedule, ${VOICE_PANEL} .voice-task-notes, ${VOICE_PANEL} .voice-question`);
        const beforeDetails = await details.allTextContents();
        const requests = { ...voice.requests };
        const remaining = voice.remaining;
        const quota = await page.locator("#voice .voice-topline .voice-trial-badge").textContent();
        const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
        for (const draft of COMPLETION_TASKS) {
          const input = page.locator(VOICE_PANEL).getByRole("checkbox", { name: draft.title, exact: true });
          await expect(input).not.toBeChecked();
          expect(await input.evaluate((element) => element instanceof HTMLInputElement && element.type === "checkbox")).toBe(true);
          const label = input.locator("..");
          const rect = await label.boundingBox();
          expect(rect!.width, "label activation width").toBeGreaterThanOrEqual(44);
          expect(rect!.height, "label activation height").toBeGreaterThanOrEqual(44);
        }
        // Activate the title area of the label, outside the 24px native input.
        await boxes(page).nth(2).locator("..").locator("span").click();
        await expect(boxes(page).nth(2)).toBeChecked();
        await expect(reward(page)).toHaveCount(0);
        await boxes(page).nth(1).check();
        await expect(reward(page)).toHaveCount(0);
        await watchStatus(page);
        await unchangedInput(page, boxes(page).nth(0));
        await assertFeedback(page, language);
        expect(await statusChanges(page)).toEqual([`${SITE[language].voice.completionTitle} ${SITE[language].voice.completionBody}`]);
        await page.waitForTimeout(1100); // status clock re-renders must not announce again
        expect(await statusChanges(page)).toHaveLength(1);
        for (const finalIndex of [1, 2, 0]) {
          await unchangedInput(page, boxes(page).nth(finalIndex));
          await expect(reward(page)).toHaveCount(0);
          await unchangedInput(page, boxes(page).nth(finalIndex));
          await assertFeedback(page, language);
          await expect(page.locator(`${VOICE_PANEL} .voice-task-card`).nth(finalIndex).locator(".voice-completion")).toBeVisible();
        }
        expect(await details.allTextContents()).toEqual(beforeDetails);
        await expect(boxes(page)).toHaveCount(3);
        for (const input of await boxes(page).all()) await expect(input).toBeChecked();
        expect(voice.requests, "completion must not call status or draft").toEqual(requests);
        expect(voice.remaining).toBe(remaining);
        expect(await page.locator("#voice .voice-topline .voice-trial-badge").textContent()).toBe(quota);
        expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual(storage);
        expect(voice.unexpected).toEqual([]);
      });
    }
  });
}

for (const language of LANGUAGES) {
  test(`WP51 ${language}: identical new result and close/reopen discard completion`, async ({ page, voice }) => {
    voice.draft = { tasks: COMPLETION_TASKS };
    await generate(page, language);
    await completeFirst(page);
    await assertFeedback(page, language);
    await page.locator("#voice .voice-again").click();
    await expect(reward(page)).toHaveCount(0);
    await send(page); // the API returns the same titles and details, as a repeated thought can
    await expect(boxes(page)).toHaveCount(3);
    for (const input of await boxes(page).all()) await expect(input).not.toBeChecked();
    await expect(reward(page)).toHaveCount(0);
    await completeFirst(page);
    await page.locator("#voice .voice-topline button").click();
    await expect(reward(page)).toHaveCount(0);
    await expect(page.locator(VOICE_PANEL)).toHaveAttribute("data-stage", "intro");
    await page.locator("#voice .voice-intro button").click();
    await expect(page.locator(VOICE_PANEL)).toHaveAttribute("data-stage", "capture");
    await page.locator("#voice .voice-mode-link").click();
    await page.locator("#voice textarea").fill(TYPED);
    await send(page);
    await expect(boxes(page)).toHaveCount(3);
    for (const input of await boxes(page).all()) await expect(input).not.toBeChecked();
    await expect(reward(page)).toHaveCount(0);
    expect(voice.requests.draft).toBe(3);
    expect(voice.unexpected).toEqual([]);
  });
}

for (const state of ["empty", "loading", "error", "connecting"] as const) {
  test(`WP51 ${state}: feedback never appears without a completed result`, async ({ page, voice }) => {
    if (state === "connecting") {
      voice.status = "hang";
      await page.goto("/#voice");
      await hydrated(page);
      await page.locator("#voice .voice-intro button").click();
      await expect(page.locator(VOICE_PANEL)).toHaveAttribute("data-stage", "connecting");
    } else {
      voice.draft = state === "empty" ? { tasks: [] } : state === "loading" ? "hang" : "offline";
      await open(page, "en");
      await send(page);
      if (state === "empty") await expect(page.locator(VOICE_PANEL)).toHaveAttribute("data-stage", "review");
      else if (state === "loading") await expect(page.locator("#voice .voice-processing")).toBeVisible();
      else await expect(page.locator(`${VOICE_PANEL} [role=alert]`)).toBeVisible();
    }
    await expect(reward(page)).toHaveCount(0);
    await expect(boxes(page)).toHaveCount(0);
    expect(voice.unexpected).toEqual([]);
  });
}

// Reuse the existing audit and stubs; these are generated evidence, never baselines.
// Only run with UX_RENDERS=1, after the same production build as the main suite.
const variants = ["standard", "realistic", "w320", "text200", "spacing"] as const;
test.describe("WP51 completion render", () => {
  test.skip(process.env.UX_RENDERS !== "1", "Set UX_RENDERS=1 for fresh completion evidence.");
  test.setTimeout(120_000);
  test.afterAll(async () => {
    if (process.env.UX_RENDERS !== "1") return;
    await mergeAudit(OUT);
    const rows = readdirSync(OUT).filter((name) => name.endsWith(".evidence.json"))
      .map((name) => JSON.parse(readFileSync(path.join(OUT, name), "utf8")))
      .sort((a, b) => a.id.localeCompare(b.id));
    writeFileSync(path.join(OUT, "INDEX.md"), [
      "# WP51 completion evidence", "", `Merged ${new Date().toISOString()}.`, "",
      "Chromium browser automation; all voice/API calls stubbed. Stress cases finish the first card with long notes; realistic cases use ordinary generated tasks. View captures preserve the post-toggle scroll position. Card captures may reposition the browser after view capture. Normal motion settles before capture; reduced motion is measured separately. Real speech, native screen readers and physical phones remain unverified.", "",
      "| Evidence | Captured UTC | Theme / language / viewport | Motion |", "|---|---|---|---|",
      ...rows.map((row) => `| [${row.id}.view.png](${row.id}.view.png), [card](${row.id}.card.png) | ${row.renderedAt} | ${row.theme} / ${row.language} / ${row.viewport.width} × ${row.viewport.height} | ${row.motion} |`), "",
    ].join("\n"));
    writeFocusedAudit(rows);
  });
  for (const theme of THEMES) for (const language of LANGUAGES) for (const variant of variants) {
    test(`${language} ${theme} ${variant}`, async ({ page, voice }, testInfo) => {
      if (variant === "w320") test.skip(testInfo.project.name !== "mobile", "320px is a phone reflow case.");
      const normalMotion = variant === "standard" || variant === "realistic";
      await page.emulateMedia({ colorScheme: theme, reducedMotion: normalMotion ? "no-preference" : "reduce" });
      if (variant === "w320") await page.setViewportSize({ width: 320, height: 568 });
      if (variant === "text200") await doubleTextSize(page);
      voice.draft = { tasks: variant === "realistic" ? TASKS : COMPLETION_TASKS };
      await generate(page, language);
      await settle(page);
      if (variant === "spacing") await page.addStyleTag({ content: "#voice * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } #voice p { margin-bottom: 2em !important; }" });
      const requestsBeforeToggle = { ...voice.requests };
      await completeFirst(page);
      await assertFeedback(page, language);
      await expect(reward(page).locator(".voice-completion-title")).toBeInViewport({ ratio: 0.5 });
      const position = await reward(page).boundingBox();
      const inputPosition = await boxes(page).first().boundingBox();
      const notesPosition = await page.locator(`${VOICE_PANEL} .voice-task-notes`).first().boundingBox();
      expect(position!.y).toBeGreaterThanOrEqual(inputPosition!.y + inputPosition!.height);
      expect(position!.y + position!.height).toBeLessThanOrEqual(notesPosition!.y);
      const animation = await reward(page).evaluate((element) => {
        const style = getComputedStyle(element);
        return { name: style.animationName, iterations: style.animationIterationCount, duration: style.animationDuration, active: element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length };
      });
      if (!normalMotion) expect(animation.name).toBe("none");
      else {
        expect(animation.iterations).not.toContain("infinite");
        expect(animation.active).toBe(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "page horizontal reflow").toBe(true);
      await capture(page, language, theme, variant, animation, testInfo);
      expect(voice.requests).toEqual(requestsBeforeToggle);
      expect(voice.unexpected).toEqual([]);
    });
  }
});

async function capture(page: Page, language: Language, theme: string, variant: string, animation: unknown, info: TestInfo) {
  mkdirSync(OUT, { recursive: true });
  const id = `completion.${language}.${info.project.name}-${variant}.${theme}`;
  const renderedAt = new Date().toISOString();
  const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  const assertTextSize = async () => {
    if (variant !== "text200") return;
    await doubleTextSize(page);
    expect(await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))).toBe(32);
  };
  await assertTextSize();
  // A tall locator screenshot can resize/restore the viewport and reset CDP's
  // font override. Measure the actual doubled layout before that operation.
  const audit = await auditPage(page, { id, page: "home", language, viewport: `${info.project.name}-${variant}`, theme, url: homeUrl(language), out: OUT, state: "completion" }, { scope: VOICE_PANEL, keyboard: false, aria: id });
  if (variant === "text200") expect(audit.collected.viewport.rootFontSize, "audit must measure doubled text").toBe(32);
  saveFragment(OUT, "regions", id, audit);
  await assertTextSize();
  const labels = await boxes(page).evaluateAll((inputs) => inputs.map((input) => {
    const label = (input as HTMLInputElement).labels![0];
    const rect = label.getBoundingClientRect();
    return { title: label.textContent?.trim(), width: rect.width, height: rect.height };
  }));
  await page.evaluate(({ x, y }) => window.scrollTo({ left: x, top: y, behavior: "instant" }), scroll);
  await page.screenshot({ path: path.join(OUT, `${id}.view.png`), scale: "css" });
  await assertTextSize();
  await page.locator(`${VOICE_PANEL} .voice-task-card`).first().screenshot({ path: path.join(OUT, `${id}.card.png`), scale: "css" });
  writeFileSync(path.join(OUT, `${id}.evidence.json`), JSON.stringify({ id, renderedAt, language, theme, viewport: page.viewportSize(), rootFontSize: audit.collected.viewport.rootFontSize, motion: ["standard", "realistic"].includes(variant) ? "finite normal" : "reduced", animation, labels, focus: audit.collected.focus, live: audit.collected.live }, null, 2));
  expect(audit.axe.violations, "completion axe violations").toEqual([]);
}

function writeFocusedAudit(evidence: { id: string; renderedAt: string; motion: string; animation: { name: string; active: number }; labels?: { width: number; height: number }[] }[]) {
  const measured = JSON.parse(readFileSync(path.join(OUT, "audit.json"), "utf8"));
  const buildFile = path.join(ROOT, ".next", "BUILD_ID");
  const rows = measured.demos as Awaited<ReturnType<typeof auditPage>>[];
  const details = new Map(evidence.map((row) => [row.id, row]));
  writeFileSync(path.join(OUT, "AUDIT.md"), [
    "# WP51 focused measured audit", "",
    `Generated ${new Date().toISOString()}. ${rows.length} measured completion regions; Chromium ${measured.chromium}; axe ${measured.axe}.`, "",
    `Production build: \`${readFileSync(buildFile, "utf8").trim()}\`, BUILD_ID timestamp ${statSync(buildFile).mtime.toISOString()}. Built with \`SITE_URL=https://taskflow.garbar.tech npm run build\`; exit 0; [command log](logs/build.log).`, "",
    "Scope: live demo result only. Page metadata, global navigation and lab performance are not audited here. All /api/voice/* calls and external requests are stubbed/blocked by VoiceStub. Raw measurements are in audit.json and .audit/; positions/ records input viewport/page-scroll coordinates, DOM identity, focus outline and explicit scroll-call probes before/after Space. Completion insertion preserves input/page position. Undo can naturally collapse earlier content or grid rows, or invoke native scroll anchoring; its deltas are recorded without a reserved-space requirement. Normal-motion stage positioning is settled before measuring. Physical phones, real speech and native screen-reader output are unverified.", "",
    "| Region / captured UTC | Axe violations / incomplete | Checkbox label min W × H | Root / reward fonts | Reward text contrast minimum | Overflow / clipped text | Motion / active animations | Live status count / mode | Focus |",
    "|---|---|---|---|---|---|---|---|---|",
    ...rows.map((row) => {
      const item = details.get(row.id);
      const labels = item?.labels ?? [];
      const rewardText = row.collected.texts.filter((text) => text.selector.includes("voice-completion"));
      const ratios = rewardText.flatMap((text) => text.contrast?.ratio === null || text.contrast?.ratio === undefined ? [] : [text.contrast.ratio]);
      const live = row.collected.live;
      return `| ${row.id}<br>${row.renderedAt} | ${row.axe.violations.length} / ${row.axe.incomplete.length} | ${labels.length ? `${Math.min(...labels.map((label) => label.width)).toFixed(1)} × ${Math.min(...labels.map((label) => label.height)).toFixed(1)}` : "pending label capture"} | ${row.collected.viewport.rootFontSize}px / ${rewardText.map((text) => text.size + "px").join(", ")} | ${ratios.length ? Math.min(...ratios).toFixed(2) + ":1" : "unmeasured"} | ${row.collected.overflow.overflow}px / ${row.collected.clipped.length} | ${item?.motion ?? "pending"} / ${item?.animation.active ?? "?"} | ${live.length} / ${live.map((region) => region.live).join(", ")} | ${row.collected.focus} |`;
    }), "",
    "Native checkbox surfaces measure 24 × 24 CSS px. The measured title labels are the larger clickable activation targets; behavior tests activate their title text and verify keyboard focus. The collector's focus selector prints the input's empty textContent; this is not its accessible name. Named getByRole assertions independently verify task-title accessible labels. Axe cannot prove a real screen reader announces once; DOM status mutation tests cover only browser markup and updates.", "",
  ].join("\n"));
}
