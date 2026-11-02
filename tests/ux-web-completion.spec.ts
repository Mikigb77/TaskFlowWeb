// WP52: independent, observable completion acceptance. All network/AI calls are stubbed
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
  axeViolations, contrast, doubleTextSize, expect, homeUrl, parseColor, hydrated, LANGUAGES, ROOT, settle,
  test, THEMES, type Language,
} from "./support/ux-web";

const SITE = { en, es, ca };
test.use({ launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] } });
const OUT = path.join(ROOT, "artifacts", "ux-web", "completion-banner");
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
    // WP69: the focus ring is on the completion circle drawn after the transparent input.
    const style = getComputedStyle(element.nextElementSibling!);
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
  // Insertion above the list and undo may invoke native scroll anchoring. The
  // input must remain usable; explicit product scrolling is forbidden for Space.
  const headerBottom = await page.locator(".site-header").evaluate((element) => element.getBoundingClientRect().bottom);
  expect(after.inputY, "keyboard checkbox is obscured by the sticky header").toBeGreaterThanOrEqual(headerBottom);
  expect(after.inputY + 24, "keyboard checkbox leaves the viewport").toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(after.outline, "keyboard focus indicator").not.toContain("0px");
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
  expect(await feedback.evaluate((element) => ({
    beforeList: element.nextElementSibling?.matches("ul.voice-drafts"),
    afterHeading: element.previousElementSibling?.matches("h3.voice-result-heading"),
    insideCard: !!element.closest(".voice-task-card"),
  }))).toEqual({ beforeList: true, afterHeading: true, insideCard: false });
  const bannerBox = await feedback.boundingBox();
  const listBox = await page.locator(`${VOICE_PANEL} ul.voice-drafts`).boundingBox();
  expect(Math.abs(bannerBox!.x - listBox!.x), "banner aligns with complete task group").toBeLessThanOrEqual(1);
  expect(Math.abs(bannerBox!.width - listBox!.width), "banner spans complete task group").toBeLessThanOrEqual(1);
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
  test.describe(`WP52 ${theme}`, () => {
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
          const input = page.locator(VOICE_PANEL).getByRole("checkbox", { name: SITE[language].voice.completeTask.replace("{title}", draft.title), exact: true });
          await expect(input).not.toBeChecked();
          expect(await input.evaluate((element) => element instanceof HTMLInputElement && element.type === "checkbox")).toBe(true);
          const label = input.locator("..");
          const rect = await label.boundingBox();
          expect(rect!.width, "label activation width").toBeGreaterThanOrEqual(44);
          expect(rect!.height, "label activation height").toBeGreaterThanOrEqual(44);
        }
        // Activate the title area of the label, outside the 24px native input.
        await boxes(page).nth(2).locator("..").locator(".voice-task-title").click();
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
          await expect(page.locator(`${VOICE_PANEL} .voice-task-card .voice-completion`)).toHaveCount(0);
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
  test(`WP52 ${language}: identical new result and close/reopen discard completion`, async ({ page, voice }) => {
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
  test(`WP52 ${state}: feedback never appears without a completed result`, async ({ page, voice }) => {
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

test.describe("WP52 fake-media reset", () => {
  test("record and submit after a completed result discard every local toggle", async ({ page, voice }) => {
    voice.draft = { tasks: COMPLETION_TASKS };
    await generate(page, "en");
    await completeFirst(page);
    await assertFeedback(page, "en");
    await page.locator("#voice .voice-again").click();
    await expect(reward(page)).toHaveCount(0);
    await page.locator("#voice .voice-mode-link").click();
    await page.locator("#voice .voice-record-button").click();
    await expect(page.locator("#voice .voice-record-button.is-recording")).toBeVisible();
    await expect(reward(page)).toHaveCount(0);
    await page.waitForTimeout(2500);
    await page.locator("#voice .voice-record-button.is-recording").click();
    await expect(boxes(page)).toHaveCount(3);
    for (const input of await boxes(page).all()) await expect(input).not.toBeChecked();
    await expect(reward(page)).toHaveCount(0);
    expect(voice.requests.draft).toBe(2);
    expect(voice.unexpected).toEqual([]);
  });
});

// Observe browser scroll APIs without substituting their behavior. Native browser
// anchoring is deliberately not counted as a product scroll call.
async function revealProbe(page: Page, input: Locator) {
  await input.evaluate((element) => {
    const calls: { method: string; behavior?: string; top?: number }[] = [];
    const scrollTo = window.scrollTo, scrollBy = window.scrollBy, scroll = window.scroll;
    const intoView = Element.prototype.scrollIntoView;
    for (const name of ["scrollTo", "scrollBy", "scroll"] as const) {
      const original = window[name];
      window[name] = function (...args: unknown[]) {
        const options = typeof args[0] === "object" ? args[0] as ScrollToOptions : {};
        calls.push({ method: name, behavior: options.behavior, top: options.top });
        return Reflect.apply(original, window, args);
      } as typeof window.scrollTo;
    }
    Element.prototype.scrollIntoView = function (this: Element, ...args: unknown[]) {
      calls.push({ method: "scrollIntoView", behavior: (args[0] as ScrollIntoViewOptions)?.behavior });
      return Reflect.apply(intoView, this, args);
    };
    (window as unknown as { wp52: unknown }).wp52 = {
      element, calls, before: { y: scrollY, input: element.getBoundingClientRect().toJSON() },
      restore: () => { window.scrollTo = scrollTo; window.scrollBy = scrollBy; window.scroll = scroll; Element.prototype.scrollIntoView = intoView; },
    };
  });
}

async function revealEvidence(page: Page, input: Locator, name: string) {
  const result = await input.evaluate((element) => {
    const probe = (window as unknown as { wp52: {
      element: Element; calls: { method: string; behavior?: string; top?: number }[];
      before: unknown; restore: () => void;
    } }).wp52;
    const banner = document.querySelector(".voice-completion");
    return { measuredAt: new Date().toISOString(), sameNode: probe.element === element,
      focused: document.activeElement === element, calls: probe.calls, before: probe.before,
      after: { y: scrollY, input: element.getBoundingClientRect().toJSON(), banner: banner?.getBoundingClientRect().toJSON(),
        headerBottom: document.querySelector(".site-header")!.getBoundingClientRect().bottom } };
  });
  const dir = path.join(OUT, "positions");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${test.info().project.name}.${name}.json`), JSON.stringify(result, null, 2));
  return result;
}

for (const motion of ["reduce", "no-preference"] as const) for (const activation of ["input", "title", "assistive"] as const) {
  test(`WP52 ${motion} ${activation}: final activation below tall notes reveals only for pointer or touch once`, async ({ page, voice }, info) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.emulateMedia({ reducedMotion: motion });
    voice.draft = { tasks: COMPLETION_TASKS };
    await generate(page, "en");
    await boxes(page).nth(0).check();
    await boxes(page).nth(1).check();
    const input = boxes(page).nth(2);
    await input.evaluate((element) => { element.scrollIntoView({ block: "center", behavior: "instant" }); (element as HTMLInputElement).focus({ preventScroll: true }); });
    await page.waitForTimeout(350);
    await revealProbe(page, input);
    if (activation === "assistive") await input.evaluate((element) => (element as HTMLInputElement).click());
    else {
      const target = activation === "title" ? input.locator("..").locator(".voice-task-title") : input;
      if (info.project.name === "mobile") await target.tap(); else await target.click();
    }
    await assertFeedback(page, "en");
    await expect(input).toBeFocused();
    await page.waitForTimeout(1200);
    const observed = await revealEvidence(page, input, `${motion}.${activation}.complete`);
    expect(observed.sameNode).toBe(true);
    expect(observed.focused).toBe(true);
    if (activation === "assistive") expect(observed.calls).toEqual([]);
    else {
      expect(observed.calls).toHaveLength(1);
      expect(observed.calls[0].behavior).toBe("instant");
      expect(observed.after.banner!.top, "banner is unobscured by sticky header").toBeGreaterThanOrEqual(observed.after.headerBottom);
      expect(observed.after.banner!.bottom).toBeLessThanOrEqual(664);
    }
    if (motion === "reduce") expect(await reward(page).evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
    await page.waitForTimeout(1100);
    expect((await revealEvidence(page, input, `${motion}.${activation}.rerender`)).calls).toEqual(observed.calls);
    // Locate/focus without the observer so test positioning does not look like a
    // completion reveal. Undo itself must never issue another scroll command.
    await input.evaluate((element) => {
      (window as unknown as { wp52: { restore: () => void } }).wp52.restore();
      element.scrollIntoView({ block: "center", behavior: "instant" });
      (element as HTMLInputElement).focus({ preventScroll: true });
    });
    await revealProbe(page, input);
    await input.press("Space");
    await expect(reward(page)).toHaveCount(0);
    expect((await revealEvidence(page, input, `${motion}.${activation}.undo`)).calls).toEqual([]);
    expect(voice.unexpected).toEqual([]);
  });
}

test("WP52: pointer completion already visible cancels native motion without displacement", async ({ page, voice }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  voice.draft = { tasks: [TASKS[0]] };
  await generate(page, "en");
  const input = boxes(page).first();
  await input.evaluate((element) => { element.scrollIntoView({ block: "center", behavior: "instant" }); (element as HTMLInputElement).focus({ preventScroll: true }); });
  await page.waitForTimeout(350);
  await revealProbe(page, input);
  await input.evaluate((element) => {
    const original = window.scrollBy;
    const position = () => ({ y: scrollY, input: element.getBoundingClientRect().toJSON() });
    window.scrollBy = function (...args: unknown[]) {
      const before = position();
      const result = Reflect.apply(original, window, args);
      (window as unknown as { wp52Cancellation: unknown }).wp52Cancellation = { before, after: position() };
      return result;
    } as typeof window.scrollBy;
  });
  await input.locator("..").locator(".voice-task-title").click();
  await assertFeedback(page, "en");
  await page.waitForTimeout(350);
  const observed = await revealEvidence(page, input, "visible.complete");
  expect(observed.calls).toEqual([{ method: "scrollBy", behavior: "instant", top: 0 }]);
  const cancellation = await page.evaluate(() => (window as unknown as { wp52Cancellation: { before: { y: number }; after: { y: number } } }).wp52Cancellation);
  writeFileSync(path.join(OUT, "positions", `${test.info().project.name}.visible.cancellation.json`), JSON.stringify({ observed, cancellation }, null, 2));
  expect(Math.abs(cancellation.after.y - cancellation.before.y), "zero-distance cancellation itself displaces viewport").toBeLessThanOrEqual(1);
  expect(Math.abs(observed.after.y - cancellation.after.y), "native focus motion continues after cancellation").toBeLessThanOrEqual(1);
  expect(observed.after.banner!.top).toBeGreaterThanOrEqual(observed.after.headerBottom);
  expect(observed.after.banner!.bottom).toBeLessThanOrEqual(1000);
  expect(observed.sameNode).toBe(true);
  expect(observed.focused).toBe(true);
});

for (const cancel of ["undo", "close"] as const) {
  test(`WP52 rapid ${cancel}: instant reveal does not continue after completion is cleared`, async ({ page, voice }, info) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    voice.draft = { tasks: COMPLETION_TASKS };
    await generate(page, "en");
    await boxes(page).nth(0).check();
    await boxes(page).nth(1).check();
    const input = boxes(page).nth(2);
    await input.evaluate((element) => { element.scrollIntoView({ block: "center", behavior: "instant" }); (element as HTMLInputElement).focus({ preventScroll: true }); });
    await page.waitForTimeout(350);
    await revealProbe(page, input);
    if (info.project.name === "mobile") await input.tap(); else await input.click();
    await expect.poll(() => input.evaluate(() => (window as unknown as { wp52: { calls: unknown[] } }).wp52.calls.length)).toBe(1);
    const started = await revealEvidence(page, input, `rapid-${cancel}.started`);
    expect(started.calls).toHaveLength(1);
    expect(started.calls[0].behavior).toBe("instant");
    if (cancel === "undo") await page.keyboard.press("Space");
    else await page.locator("#voice .voice-topline button").evaluate((button) => (button as HTMLButtonElement).click());
    await expect(reward(page)).toHaveCount(0);
    if (cancel === "close") {
      const intro = page.locator("#voice .voice-intro button");
      await expect(intro).toBeFocused();
      await expect(intro).toBeInViewport();
      // Existing close restores opener focus and may use the page's smooth
      // scroll behavior. Let that established destination settle first.
      await page.waitForTimeout(1000);
      await expect(intro).toBeFocused();
      await expect(intro).toBeInViewport();
    }
    // Wait for layout/scroll anchoring and legitimate close-stage positioning.
    // Continued motion after this point would be a stale completion reveal.
    const sample = () => page.evaluate(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      return { measuredAt: new Date().toISOString(), y: scrollY,
        calls: [...(window as unknown as { wp52: { calls: unknown[] } }).wp52.calls] };
    });
    const cleared = await sample();
    await page.waitForTimeout(900);
    const later = await sample();
    mkdirSync(path.join(OUT, "positions"), { recursive: true });
    writeFileSync(path.join(OUT, "positions", `${info.project.name}.rapid-${cancel}.cleared.json`), JSON.stringify({ started, cleared, later }, null, 2));
    expect(later.calls, "completion must not schedule a later reveal after reset").toEqual(cleared.calls);
    expect(Math.abs(later.y - cleared.y), "stale completion scroll continues after reset").toBeLessThanOrEqual(1);
    if (cancel === "undo") {
      await expect(input).toBeFocused();
      await expect(input).not.toBeChecked();
      expect((await revealEvidence(page, input, "rapid-undo.identity")).sameNode).toBe(true);
    } else await expect(page.locator(VOICE_PANEL)).toHaveAttribute("data-stage", "intro");
    expect(voice.unexpected).toEqual([]);
  });
}

for (const cancel of ["undo", "close"] as const) {
  test(`WP52 before next frame ${cancel}: clearing completion prevents a later reveal`, async ({ page, voice }, info) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    voice.draft = { tasks: COMPLETION_TASKS };
    await generate(page, "en");
    await boxes(page).nth(0).check();
    await boxes(page).nth(1).check();
    const input = boxes(page).nth(2);
    await input.evaluate((element) => { element.scrollIntoView({ block: "center", behavior: "instant" }); (element as HTMLInputElement).focus({ preventScroll: true }); });
    await page.waitForTimeout(350);
    const rect = await input.boundingBox();
    await revealProbe(page, input);
    // Hold the public browser frame boundary while native input events continue.
    // We assert UI/scroll outcomes, not private queues or cancellation calls.
    await page.evaluate(() => {
      const request = window.requestAnimationFrame, cancel = window.cancelAnimationFrame;
      const pending = new Map<number, FrameRequestCallback>();
      let next = -1;
      window.requestAnimationFrame = (callback) => { const id = next--; pending.set(id, callback); return id; };
      window.cancelAnimationFrame = (id) => { if (!pending.delete(id)) cancel(id); };
      (window as unknown as { wp52FrameGate: unknown }).wp52FrameGate = () => {
        window.requestAnimationFrame = request;
        window.cancelAnimationFrame = cancel;
        const callbacks = [...pending.values()];
        pending.clear();
        for (const callback of callbacks) request(callback);
      };
    });
    if (info.project.name === "mobile") await page.touchscreen.tap(rect!.x + 12, rect!.y + 12);
    else await page.mouse.click(rect!.x + 12, rect!.y + 12);
    await expect(input).toBeChecked();
    await expect(reward(page)).toHaveCount(1);
    const started = await revealEvidence(page, input, `before-frame-${cancel}.started`);
    expect(started.calls, "cancellation must occur before a completion reveal has executed").toEqual([]);
    if (cancel === "undo") await page.keyboard.press("Space");
    else await page.locator("#voice .voice-topline button").evaluate((button) => (button as HTMLButtonElement).click());
    await expect(reward(page)).toHaveCount(0);
    await page.evaluate(async () => {
      (window as unknown as { wp52FrameGate: () => void }).wp52FrameGate();
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    const calls = await page.evaluate(() => (window as unknown as { wp52: { calls: unknown[] } }).wp52.calls);
    expect(calls, "clearing completion must not be followed by a stale reveal").toEqual(started.calls);
    if (cancel === "undo") {
      await expect(input).not.toBeChecked();
      await expect(input).toBeFocused();
      expect((await revealEvidence(page, input, "before-frame-undo.cleared")).sameNode).toBe(true);
    } else {
      await expect(page.locator(VOICE_PANEL)).toHaveAttribute("data-stage", "intro");
      await expect(page.locator("#voice .voice-intro button")).toBeFocused();
    }
    writeFileSync(path.join(OUT, "positions", `${info.project.name}.before-frame-${cancel}.result.json`), JSON.stringify({ measuredAt: new Date().toISOString(), started, calls }, null, 2));
    expect(voice.unexpected).toEqual([]);
  });
}

// Reuse the existing audit and stubs; these are generated evidence, never baselines.
// Only run with UX_RENDERS=1, after the same production build as the main suite.
const variants = ["standard", "realistic", "w320", "text200", "spacing"] as const;
test.describe("WP52 completion render", () => {
  test.skip(process.env.UX_RENDERS !== "1", "Set UX_RENDERS=1 for fresh completion evidence.");
  test.setTimeout(120_000);
  test.afterAll(async () => {
    if (process.env.UX_RENDERS !== "1") return;
    await mergeAudit(OUT);
    const rows = readdirSync(OUT).filter((name) => name.endsWith(".evidence.json"))
      .map((name) => JSON.parse(readFileSync(path.join(OUT, name), "utf8")))
      .sort((a, b) => a.id.localeCompare(b.id));
    writeFileSync(path.join(OUT, "INDEX.md"), [
      "# WP52 completion evidence", "", `Merged ${new Date().toISOString()}.`, "",
      "Chromium browser automation; all voice/API calls stubbed. Stress cases finish the final card below long notes; realistic cases use ordinary generated tasks. View captures preserve the post-toggle scroll position. Group captures may reposition the browser after view capture. Root32 audits precede tall locator screenshots. Normal motion settles before capture; reduced motion is measured separately. WEB-801 trial-badge page overflow remains recorded independently of banner/list reflow. Real speech, native screen readers and physical phones remain unverified.", "",
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
      const diagnose = (language === "ca" && theme === "dark" && variant === "realistic" && testInfo.project.name === "mobile") ||
        (language === "en" && theme === "light" && variant === "standard" && testInfo.project.name === "desktop");
      const diagnosticId = `${language}.${testInfo.project.name}-${variant}.${theme}.repeat-${testInfo.repeatEachIndex}`;
      if (diagnose) {
        await revealProbe(page, boxes(page).nth(2));
        await page.evaluate(() => {
          const events: unknown[] = [];
          const fonts = () => Object.fromEntries(["html", "body", ".voice-trial-badge", ".voice-completion", ".voice-task-toggle"].map((selector) => {
            const element = document.querySelector(selector);
            const style = element && getComputedStyle(element);
            return [selector, { size: style?.fontSize, family: style?.fontFamily, rect: element?.getBoundingClientRect().toJSON() }];
          }));
          const diagnostic = { startedAt: new Date().toISOString(), before: fonts(), events, fonts };
          (window as unknown as { wp52Diagnostic: unknown }).wp52Diagnostic = diagnostic;
          for (const name of ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "input", "change", "focusin", "scroll"]) {
            document.addEventListener(name, (event) => {
              const target = event.target as Element;
              events.push({ event: name, time: performance.now(), y: scrollY, detail: (event as MouseEvent).detail,
                pointerType: (event as PointerEvent).pointerType, target: target.tagName + "." + target.className,
                finalInput: target === (window as unknown as { wp52: { element: Element } }).wp52.element });
              if (name === "change" && target === (window as unknown as { wp52: { element: Element } }).wp52.element)
                requestAnimationFrame(() => events.push({ event: "frame after change", time: performance.now(), y: scrollY }));
            }, { capture: true, passive: true });
          }
          const original = window.scrollBy;
          window.scrollBy = function (...args: unknown[]) {
            const input = (window as unknown as { wp52: { element: Element } }).wp52.element;
            events.push({ event: "explicit scrollBy", args, time: performance.now(), y: scrollY,
              activeElement: document.activeElement?.tagName, activeIsFinal: document.activeElement === input,
              input: input.getBoundingClientRect().toJSON(), banner: document.querySelector(".voice-completion")?.getBoundingClientRect().toJSON(),
              rootFont: getComputedStyle(document.documentElement).fontSize, inputFont: getComputedStyle(input).fontSize });
            return Reflect.apply(original, window, args);
          } as typeof window.scrollBy;
        });
      }
      await boxes(page).nth(0).check();
      await boxes(page).nth(1).check();
      await boxes(page).nth(2).locator("..").locator(".voice-task-title").click();
      await page.waitForTimeout(1200);
      await assertFeedback(page, language);
      if (diagnose) {
        const diagnostic = await page.evaluate(() => {
          const value = (window as unknown as { wp52Diagnostic: { startedAt: string; before: unknown; events: unknown[]; fonts: () => unknown } }).wp52Diagnostic;
          return { startedAt: value.startedAt, before: value.before, events: value.events, after: value.fonts(),
            sampledAt: new Date().toISOString(), y: scrollY,
            active: document.activeElement?.outerHTML,
            animation: [...document.querySelector(".voice-completion")!.getAnimations()].map((animation) => ({ playState: animation.playState, currentTime: animation.currentTime })) };
        });
        mkdirSync(path.join(OUT, "positions"), { recursive: true });
        writeFileSync(path.join(OUT, "positions", `${diagnosticId}.diagnostic.json`), JSON.stringify(diagnostic, null, 2));
        await revealEvidence(page, boxes(page).nth(2), `${diagnosticId}.render`);
      }
      await expect(reward(page).locator(".voice-completion-title")).toBeInViewport({ ratio: 0.5 });
      const position = await reward(page).boundingBox();
      const listPosition = await page.locator(`${VOICE_PANEL} .voice-drafts`).boundingBox();
      expect(position!.y + position!.height).toBeLessThanOrEqual(listPosition!.y);
      const animation = await reward(page).evaluate((element) => {
        const style = getComputedStyle(element);
        return { name: style.animationName, iterations: style.animationIterationCount, duration: style.animationDuration, active: element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length };
      });
      if (!normalMotion) expect(animation.name).toBe("none");
      else {
        expect(animation.iterations).not.toContain("infinite");
        expect(animation.active).toBe(0);
      }
      await capture(page, language, theme, variant, animation, testInfo);
      expect(voice.requests).toEqual(requestsBeforeToggle);
      expect(voice.unexpected).toEqual([]);
    });
  }
});

async function capture(page: Page, language: Language, theme: string, variant: string, animation: unknown, info: TestInfo) {
  mkdirSync(OUT, { recursive: true });
  const id = `completion-banner.${language}.${info.project.name}-${variant}.${theme}`;
  const renderedAt = new Date().toISOString();
  const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  const assertTextSize = async () => {
    if (variant !== "text200") return;
    await doubleTextSize(page);
    expect(await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))).toBe(32);
  };
  await assertTextSize();
  const geometry = await page.locator(VOICE_PANEL).evaluate((panel) => {
    const rect = (selector: string) => panel.querySelector(selector)!.getBoundingClientRect().toJSON();
    const completion = rect(".voice-completion"), list = rect(".voice-drafts");
    const badge = rect(".voice-trial-badge");
    return { measuredAt: new Date().toISOString(), rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
      pageOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), badge,
      badgeOverflow: Math.max(0, badge.right - innerWidth), completion, list,
      badgeFontSize: parseFloat(getComputedStyle(panel.querySelector(".voice-trial-badge")!).fontSize),
      columns: getComputedStyle(panel.querySelector(".voice-drafts")!).gridTemplateColumns.split(" ").length,
      offenders: [...panel.querySelectorAll("*")].filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
        .map((element) => `${element.tagName.toLowerCase()}.${[...element.classList].join(".")}`) };
  });
  if (variant === "text200") expect(geometry.rootFontSize).toBe(32);
  expect(geometry.columns, "desktop two-column/mobile single-column task layout").toBe(info.project.name === "desktop" ? 2 : 1);
  for (const [name, rect] of [["completion", geometry.completion], ["list", geometry.list]] as const) {
    expect(rect.left, `${name} left reflow`).toBeGreaterThanOrEqual(0);
    expect(rect.right, `${name} right reflow`).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  const knownBadge = variant === "text200" && info.project.name === "mobile" && language !== "en";
  writeFileSync(path.join(OUT, `${id}.geometry.json`), JSON.stringify(geometry, null, 2));
  if (knownBadge) {
    expect(geometry.badgeFontSize, "badge must actually scale with doubled root text").toBe(28);
    if (geometry.pageOverflow > 0)
      expect(geometry.pageOverflow, "only the historical WEB-801 amount is allowed").toBe(language === "es" ? 32 : 16);
    expect(geometry.offenders.every((selector) => selector === "span.voice-trial-badge"), "new overflow beyond known badge").toBe(true);
  } else expect(geometry.pageOverflow, "page horizontal reflow").toBe(0);
  // A tall locator screenshot can resize/restore the viewport and reset CDP's
  // font override. Measure the actual doubled layout before that operation.
  const audit = await auditPage(page, { id, page: "home", language, viewport: `${info.project.name}-${variant}`, theme, url: homeUrl(language), out: OUT, state: "completion" }, { scope: VOICE_PANEL, keyboard: false, aria: id });
  if (variant === "text200") expect(audit.collected.viewport.rootFontSize, "audit must measure doubled text").toBe(32);
  saveFragment(OUT, "regions", id, audit);
  expect(audit.collected.clipped.filter((text) => text.selector.includes("voice-completion") || text.selector.includes("voice-drafts")), "completion/list text clipping").toEqual([]);
  for (const text of audit.collected.texts.filter((text) => text.selector.includes("voice-completion"))) {
    if (text.contrast?.ratio !== null && text.contrast?.ratio !== undefined)
      expect(text.contrast.ratio, `completion contrast: ${text.selector}`).toBeGreaterThanOrEqual(text.large ? 3 : 4.5);
  }
  await assertTextSize();
  const labels = await boxes(page).evaluateAll((inputs) => inputs.map((input) => {
    const label = (input as HTMLInputElement).labels![0];
    const rect = label.getBoundingClientRect();
    return { title: label.textContent?.trim(), width: rect.width, height: rect.height };
  }));
  await page.evaluate(({ x, y }) => window.scrollTo({ left: x, top: y, behavior: "instant" }), scroll);
  await page.screenshot({ path: path.join(OUT, `${id}.view.png`), scale: "css" });
  await assertTextSize();
  await page.locator(`${VOICE_PANEL} .voice-results`).screenshot({ path: path.join(OUT, `${id}.card.png`), scale: "css" });
  writeFileSync(path.join(OUT, `${id}.evidence.json`), JSON.stringify({ id, renderedAt, language, theme, viewport: page.viewportSize(), rootFontSize: audit.collected.viewport.rootFontSize, motion: ["standard", "realistic"].includes(variant) ? "finite normal" : "reduced", animation, labels, focus: audit.collected.focus, live: audit.collected.live }, null, 2));
  expect(audit.axe.violations, "completion axe violations").toEqual([]);
}

function writeFocusedAudit(evidence: { id: string; renderedAt: string; motion: string; animation: { name: string; active: number }; labels?: { width: number; height: number }[] }[]) {
  const measured = JSON.parse(readFileSync(path.join(OUT, "audit.json"), "utf8"));
  const buildFile = path.join(ROOT, ".next", "BUILD_ID");
  const rows = measured.demos as Awaited<ReturnType<typeof auditPage>>[];
  const details = new Map(evidence.map((row) => [row.id, row]));
  writeFileSync(path.join(OUT, "AUDIT.md"), [
    "# WP52 focused measured audit", "",
    `Generated ${new Date().toISOString()}. ${rows.length} measured completion regions; Chromium ${measured.chromium}; axe ${measured.axe}.`, "",
    `Production build: \`${readFileSync(buildFile, "utf8").trim()}\`, BUILD_ID timestamp ${statSync(buildFile).mtime.toISOString()}. Built with \`SITE_URL=https://taskflow.garbar.tech npm run build\`; exit 0; [command log](logs/frame-repair-build.log).`, "",
    "Scope: live demo result only. Page metadata, global navigation and lab performance are not audited here. All /api/voice/* calls and external requests are stubbed/blocked by VoiceStub. Raw measurements are in audit.json and .audit/; positions/ records input viewport/page-scroll coordinates, DOM identity, focus outline and explicit scroll-call probes before/after activation. Keyboard completion and undo permit natural scroll anchoring while prohibiting explicit product scrolling. Pointer/touch permits one reveal only when needed. WEB-801 trial-badge overflow is preserved in raw page evidence and independently identified; banner/list bounds are asserted. Physical phones, real speech and native screen-reader output are unverified.", "",
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

// ---- Run 2026-10-28-site: WP69 (WEB-1306) ----
// The app's completion circle: a native checkbox named ‘Complete {title}’, drawn as the app's
// round circle, filled with a check only when ticked; WD16 and WD17 unchanged.

const WP69_COMPLETE: Record<Language, string> = { en: "Complete {title}", es: "Completar {title}", ca: "Completa {title}" };
const WP69_GREEN = { light: "rgb(23, 110, 89)", dark: "rgb(158, 213, 179)" };
// The visible circle: the aria-hidden element drawn right after the input.
const circleOf = (input: Locator) => input.locator("xpath=following-sibling::*[1]");
// A colour through a probe in the page's own theme.
const tokenColour = (page: Page, token: string) =>
  page.evaluate((token) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${token})`;
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }, token);
// The circle as drawn: its box, radius, edge, fill, the card behind it, and its check.
const circleLook = (circle: Locator) =>
  circle.evaluate((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    let card: Element | null = element.parentElement;
    let cardFill = "rgba(0, 0, 0, 0)";
    while (card) {
      const fill = getComputedStyle(card).backgroundColor;
      if (fill !== "rgba(0, 0, 0, 0)" && fill !== "transparent") {
        cardFill = fill;
        break;
      }
      card = card.parentElement;
    }
    const svg = element.querySelector("svg");
    return {
      ariaHidden: element.getAttribute("aria-hidden"),
      width: box.width,
      height: box.height,
      x: box.x,
      y: box.y,
      radius: style.borderTopLeftRadius,
      edgeWidth: style.borderTopWidth,
      edgeStyle: style.borderTopStyle,
      edge: style.borderTopColor,
      fill: style.backgroundColor,
      cardFill,
      check: !!svg && svg.checkVisibility({ visibilityProperty: true, opacityProperty: true }),
      checkColour: svg ? getComputedStyle(svg).color : null,
    };
  });

for (const theme of THEMES) {
  test.describe(`WP69 ${theme} completion circle`, () => {
    test.use({ colorScheme: theme });
    for (const language of LANGUAGES) {
      test(`WEB-1306 ${language}: each toggle is a checkbox named ‘Complete {title}’, drawn as a 24 px circle with a 3:1 edge, filled with the check only when ticked; rows stay 44 px; WD17's banner shows above the list; axe finds nothing (${theme})`, async ({
        page,
        voice,
      }) => {
        test.setTimeout(120_000);
        expect(SITE[language].voice.completeTask, `${language}: completeTask`).toBe(WP69_COMPLETE[language]);
        await generate(page, language);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(boxes(page)).toHaveCount(TASKS.length);
        const names = TASKS.map((task) => WP69_COMPLETE[language].replace("{title}", task.title));
        // The accessibility tree, as a screen reader gets it.
        const snapshot = await page.locator(`${VOICE_PANEL} .voice-drafts`).ariaSnapshot();
        for (const name of names) expect(snapshot, `${language}: the ARIA snapshot`).toContain(`checkbox "${name}"`);
        const paper = await tokenColour(page, "--paper");
        for (const [index, name] of names.entries()) {
          const input = page.locator(VOICE_PANEL).getByRole("checkbox", { name, exact: true });
          await expect(input, name).toHaveCount(1);
          await expect(input, name).not.toBeChecked();
          expect(await input.evaluate((element) => element instanceof HTMLInputElement && element.type === "checkbox"), `${name}: a native checkbox`).toBe(true);
          // The title stays the visible label.
          await expect(input.locator(".."), name).toContainText(TASKS[index].title);
          const row = (await input.locator("..").boundingBox())!;
          expect(row.height, `${name}: the row's height`).toBeGreaterThanOrEqual(44);
          const circle = circleOf(input);
          const before = await circleLook(circle);
          const inputBox = (await input.boundingBox())!;
          expect(before.ariaHidden, `${name}: the circle is hidden from assistive tech`).toBe("true");
          expect(before.width, `${name}: the circle's width`).toBeCloseTo(24, 0);
          expect(before.height, `${name}: the circle's height`).toBeCloseTo(24, 0);
          expect(before.radius, `${name}: the circle's radius`).toBe("50%");
          expect(before.edgeWidth, `${name}: the edge's width`).toBe("2px");
          expect(before.edgeStyle, `${name}: the edge's style`).toBe("solid");
          expect(Math.abs(inputBox.x - before.x), `${name}: the input over the circle (x)`).toBeLessThanOrEqual(1);
          expect(Math.abs(inputBox.y - before.y), `${name}: the input over the circle (y)`).toBeLessThanOrEqual(1);
          expect(inputBox.width, `${name}: the input's width`).toBeCloseTo(24, 0);
          expect(inputBox.height, `${name}: the input's height`).toBeCloseTo(24, 0);
          expect(contrast(parseColor(before.edge), parseColor(before.cardFill)), `${name}: the edge (${before.edge}) against the card (${before.cardFill})`).toBeGreaterThanOrEqual(3);
          expect(before.check, `${name}: no check while unticked`).toBe(false);
          expect(before.fill, `${name}: no fill while unticked`).not.toBe(WP69_GREEN[theme]);
          await input.check();
          const after = await circleLook(circle);
          expect(after.fill, `${name}: filled green when ticked`).toBe(WP69_GREEN[theme]);
          expect(after.check, `${name}: the check shows when ticked`).toBe(true);
          expect(after.checkColour, `${name}: the check in --paper`).toBe(paper);
          if (index < names.length - 1) await expect(reward(page), `${name}: no banner before every task is done`).toHaveCount(0);
        }
        // Every task done: WD17's banner, above the list.
        const banner = reward(page);
        await expect(banner).toBeVisible();
        const [top, list] = [(await banner.boundingBox())!, (await page.locator(`${VOICE_PANEL} .voice-drafts`).boundingBox())!];
        expect(top.y + top.height, "the banner ends above the list").toBeLessThanOrEqual(list.y + 1);
        expect(await axeViolations(page), `${language}: axe with every task done`).toEqual([]);
        // Untick one: its circle empties again, and axe on the mixed state.
        const first = page.locator(VOICE_PANEL).getByRole("checkbox", { name: names[0], exact: true });
        await first.uncheck();
        const emptied = await circleLook(circleOf(first));
        expect(emptied.check, "unticked: no check").toBe(false);
        expect(await axeViolations(page), `${language}: axe with one task not done`).toEqual([]);
        expect(voice.unexpected).toEqual([]);
      });
    }
  });
}

test.describe("WP69 completion circle, forced colours", () => {
  test.use({ colorScheme: "light" });
  test("WEB-1306: with forced colours, a ticked circle still differs from an unticked one, and only the ticked one shows the check", async ({
    page,
    voice,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await generate(page, "en");
    expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches), "forced colours on").toBe(true);
    const ticked = boxes(page).nth(0);
    const unticked = boxes(page).nth(1);
    await ticked.check();
    await expect(ticked).toBeChecked();
    await expect(unticked).not.toBeChecked();
    const [on, off] = [await circleLook(circleOf(ticked)), await circleLook(circleOf(unticked))];
    expect(on.check, "the ticked circle shows the check").toBe(true);
    expect(off.check, "the unticked circle shows no check").toBe(false);
    expect(on.fill, "the ticked circle's fill differs").not.toBe(off.fill);
    // As drawn: the two circles' pixels differ.
    const [onImage, offImage] = [await circleOf(ticked).screenshot(), await circleOf(unticked).screenshot()];
    expect(onImage.equals(offImage), "the ticked and unticked circles look different").toBe(false);
    expect(voice.unexpected).toEqual([]);
  });
});
// ---- Run 2026-10-28-site: WP266 (WEB-1612) ----
// A task's level-4 heading is its title alone; the circle's checkbox sits beside it, named
// ‘Complete {title}’, and tapping the title (its label) still ticks it. WD17 unchanged.

for (const theme of THEMES) {
  test.describe(`WP266 ${theme} the task heading`, () => {
    test.use({ colorScheme: theme });
    for (const language of LANGUAGES) {
      test(`WEB-1612 ${language}: each level-4 heading is the task's title alone and the checkbox beside it is ‘Complete {title}’; tapping the title ticks and unticks it; ticking every title shows WD17's banner above the list; rows 44 px, circle 24 px and round, focus ring on the circle, h4 18 px, circle and title where they were; axe finds nothing (${theme})`, async ({
        page,
        voice,
      }) => {
        test.setTimeout(120_000);
        const t = SITE[language].voice;
        expect(t.completeTask, `${language}: completeTask`).toBe(WP69_COMPLETE[language]);
        const prefix = t.completeTask.split("{title}")[0].trim();
        await generate(page, language);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const drafts = page.locator(`${VOICE_PANEL} .voice-drafts`);
        await expect(boxes(page)).toHaveCount(TASKS.length);
        // The accessibility tree, as a screen reader gets it.
        const snapshot = await drafts.ariaSnapshot();
        for (const task of TASKS) {
          expect(snapshot, `${language}: the heading of ${task.title}`).toContain(`heading "${task.title}" [level=4]`);
          expect(snapshot, `${language}: the checkbox of ${task.title}`).toContain(
            `checkbox "${t.completeTask.replace("{title}", task.title)}"`,
          );
        }
        const headingLines = snapshot.split("\n").filter((line) => /heading .*\[level=4\]/.test(line));
        expect(headingLines, `${language}: one level-4 heading per task`).toHaveLength(TASKS.length);
        for (const line of headingLines) expect(line, `${language}: a heading's name`).not.toContain(prefix);
        const headings = drafts.getByRole("heading", { level: 4 });
        await expect(headings).toHaveCount(TASKS.length);
        const green = WP69_GREEN[theme];
        for (const [index, task] of TASKS.entries()) {
          const name = t.completeTask.replace("{title}", task.title);
          const heading = headings.nth(index);
          await expect(heading, name).toHaveAccessibleName(task.title);
          expect(await heading.evaluate((element) => getComputedStyle(element).fontSize), `${name}: the h4's size`).toBe("18px");
          const input = page.locator(VOICE_PANEL).getByRole("checkbox", { name, exact: true });
          await expect(input, name).toHaveCount(1);
          expect(await input.evaluate((element) => !element.closest("h4")), `${name}: the checkbox isn't inside the heading`).toBe(true);
          const row = input.locator("..");
          const title = row.locator(".voice-task-title");
          await expect(title, name).toHaveText(task.title);
          const rowBox = (await row.boundingBox())!;
          expect(rowBox.height, `${name}: the row's height`).toBeGreaterThanOrEqual(44);
          // Where things sit, as before WP266: the circle 10 px down at the row's start, the
          // title 12 px after it from the row's top, the date line 8 px under the row.
          const circle = circleOf(input);
          const circleBox = (await circle.boundingBox())!;
          const titleBox = (await title.boundingBox())!;
          const lineBox = (await row.locator("xpath=following-sibling::*[1]").boundingBox())!;
          expect(await row.locator("xpath=following-sibling::*[1]").getAttribute("class"), `${name}: the date line after the row`).toBe("voice-task-schedule");
          expect(Math.abs(circleBox.x - rowBox.x), `${name}: the circle at the row's start`).toBeLessThanOrEqual(1);
          expect(Math.abs(circleBox.y - rowBox.y - 10), `${name}: the circle 10 px down the row`).toBeLessThanOrEqual(1);
          expect(Math.abs(titleBox.x - (circleBox.x + circleBox.width) - 12), `${name}: the title 12 px after the circle`).toBeLessThanOrEqual(1);
          expect(Math.abs(titleBox.y - rowBox.y), `${name}: the title from the row's top`).toBeLessThanOrEqual(1);
          expect(Math.abs(lineBox.y - (rowBox.y + rowBox.height) - 8), `${name}: the date line 8 px under the row`).toBeLessThanOrEqual(1);
          // The circle: 24 px, round, empty until ticked.
          const before = await circleLook(circle);
          expect(before.width, `${name}: the circle's width`).toBeCloseTo(24, 0);
          expect(before.height, `${name}: the circle's height`).toBeCloseTo(24, 0);
          expect(before.radius, `${name}: the circle's radius`).toBe("50%");
          expect(before.check, `${name}: no check while unticked`).toBe(false);
          expect(before.fill, `${name}: no fill while unticked`).not.toBe(green);
          // Tapping the title ticks it, and tapping it again unticks it.
          await title.click();
          await expect(input, `${name}: ticked by its title`).toBeChecked();
          const ticked = await circleLook(circle);
          expect(ticked.fill, `${name}: filled when ticked`).toBe(green);
          expect(ticked.check, `${name}: the check when ticked`).toBe(true);
          await title.click();
          await expect(input, `${name}: unticked by its title`).not.toBeChecked();
          const unticked = await circleLook(circle);
          expect(unticked.check, `${name}: no check once unticked`).toBe(false);
          expect(unticked.fill, `${name}: no fill once unticked`).not.toBe(green);
        }
        expect(await axeViolations(page), `${language}: axe on the result`).toEqual([]);
        // Keyboard focus: the ring shows on the circle.
        const inputs = boxes(page);
        await inputs.nth(0).focus();
        await page.keyboard.press("Tab");
        await page.keyboard.press("Shift+Tab");
        for (const index of [0, 1]) {
          if (index === 1) await page.keyboard.press("Tab");
          const input = inputs.nth(index);
          await expect(input, `${language}: checkbox ${index + 1} has keyboard focus`).toBeFocused();
          const ring = await input.evaluate((element) => {
            const style = getComputedStyle(element.nextElementSibling!);
            return { visible: element.matches(":focus-visible"), width: style.outlineWidth, style: style.outlineStyle };
          });
          expect(ring.visible, `${language}: checkbox ${index + 1} :focus-visible`).toBe(true);
          expect(ring.style, `${language}: checkbox ${index + 1}'s ring`).not.toBe("none");
          expect(ring.width, `${language}: checkbox ${index + 1}'s ring width`).not.toBe("0px");
        }
        // Every task ticked by its title: WD17's banner, above the list.
        for (const [index, task] of TASKS.entries()) {
          await expect(reward(page), `${task.title}: no banner yet`).toHaveCount(0);
          await page.locator(VOICE_PANEL).locator(".voice-task-card").nth(index).locator(".voice-task-title").click();
          await expect(inputs.nth(index), `${task.title}: ticked`).toBeChecked();
        }
        const banner = reward(page);
        await expect(banner).toBeVisible();
        await expect(banner).toContainText(t.completionTitle);
        const [top, list] = [(await banner.boundingBox())!, (await drafts.boundingBox())!];
        expect(top.y + top.height, "the banner ends above the list").toBeLessThanOrEqual(list.y + 1);
        expect(await axeViolations(page), `${language}: axe with every task done`).toEqual([]);
        expect(voice.unexpected).toEqual([]);
      });
    }
  });
}

test("WEB-1612: WD17's banner title is still ‘All clear. Take a breath.’", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Reads the copy: once is enough.");
  expect(SITE.en.voice.completionTitle).toBe("All clear. Take a breath.");
});
